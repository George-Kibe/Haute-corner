import { randomBytes } from 'node:crypto';
import mongoose, { type ClientSession, type Types } from 'mongoose';
import type { z } from 'zod';
import { darajaConfigured, stkPush, stkQuery, type StkStatus } from '@/lib/daraja';
import { ApiError } from '@/lib/http';
import { recordPayment } from '@/lib/ledger';
import { initializeTransaction, paystackConfigured, toSubunits, verifyTransaction } from '@/lib/paystack';
import { priceCart } from '@/lib/pricing';
import { newRef } from '@/lib/refs';
import { RESERVATION_MINUTES } from '@/lib/settings';
import { site } from '@/lib/site';
import { Order, type OrderAttributes } from '@/models/Order';
import { Product } from '@/models/Product';
import { Purchase, type PurchaseAttributes } from '@/models/Purchase';
import type { UserAttributes } from '@/models/User';
import type { checkoutBody } from '@/schemas/checkout';

type StoredPurchase = PurchaseAttributes & { _id: Types.ObjectId };
type StoredOrder = OrderAttributes & { _id: Types.ObjectId };
type StoredUser = UserAttributes & { _id: Types.ObjectId };
type Provider = PurchaseAttributes['payment']['provider'];
type PaymentChoice = z.output<typeof checkoutBody>['payment'];

const conflict = (message: string, details?: Record<string, string>) => new ApiError(409, 'conflict', message, details);
const isDuplicateKey = (error: unknown) => (error as { code?: number }).code === 11000;

// Wait this long between asking a provider about the same payment.
const CHECK_INTERVAL_MS = 10_000;

// ---- Simulated payments ------------------------------------------------
// Lets the whole checkout be tried on a phone before Daraja and Paystack keys
// exist. Only ever on a development or test database, never on Vercel
// production. An M-Pesa number ending in 0000 is declined; anything else pays
// a few seconds after the prompt.

const SIMULATED_DELAY_MS = 4000;

export function simulatedPaymentsAllowed() {
  const database = mongoose.connection.db?.databaseName ?? '';
  return (
    process.env.PAYMENTS_SIMULATED === 'true' &&
    process.env.VERCEL_ENV !== 'production' &&
    (database.endsWith('_dev') || database.endsWith('_test'))
  );
}

function providerFor(method: PaymentChoice['method']): Provider {
  if (method === 'mpesa' && darajaConfigured()) return 'daraja';
  if (method === 'card' && paystackConfigured()) return 'paystack';
  if (simulatedPaymentsAllowed()) return 'simulated';
  throw new ApiError(503, 'service_unavailable', method === 'mpesa' ? 'M-Pesa payments are not available right now' : 'Card payments are not available right now');
}

// ---- Creating a purchase -----------------------------------------------

function snapshotOrders(priced: Awaited<ReturnType<typeof priceCart>>, purchaseId: Types.ObjectId, buyerId: Types.ObjectId, body: z.output<typeof checkoutBody>) {
  const now = new Date();
  return priced.orders.map((order) => ({
    ref: newRef(),
    purchaseId,
    buyerId,
    sellerId: order.seller._id,
    sellerName: order.seller.businessName,
    items: order.lines.map((line) => ({
      productId: line.product._id,
      title: line.product.title,
      image: line.product.media.find((item) => item.kind === 'image')!.publicId,
      option: line.option,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    commissionRate: order.commissionRate,
    commissionAmount: order.commissionAmount,
    sellerAmount: order.sellerAmount,
    contact: body.contact,
    deliveryAddress: body.deliveryAddress,
    status: 'awaiting_payment' as const,
    statusHistory: [{ status: 'awaiting_payment' as const, at: now }],
  }));
}

// Takes stock for every item, or none: a shortfall undoes the whole transaction.
async function reserveStock(orders: { items: { productId: Types.ObjectId; quantity: number; title: string }[] }[], session: ClientSession) {
  for (const order of orders) {
    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.productId, status: 'active', stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session },
      );
      if (result.modifiedCount === 0) {
        throw conflict('Some items sold out while you were checking out', { [String(item.productId)]: `${item.title} sold out` });
      }
    }
  }
}

// Takes stock for one order if all of it is there, undoing any partial take.
async function tryReserveOrder(order: StoredOrder, session: ClientSession) {
  const taken: StoredOrder['items'] = [];
  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.productId, status: 'active', stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session },
    );
    if (result.modifiedCount === 0) {
      for (const done of taken) await Product.updateOne({ _id: done.productId }, { $inc: { stock: done.quantity } }, { session });
      return false;
    }
    taken.push(item);
  }
  return true;
}

async function returnStock(orders: StoredOrder[], session: ClientSession) {
  for (const order of orders) {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } }, { session });
    }
  }
}

// Creates the purchase and one order per seller, reserving stock, with all
// prices from the server. The same idempotency key returns the first purchase.
export async function createPurchase(buyer: StoredUser, body: z.output<typeof checkoutBody>, idempotencyKey: string) {
  const existing = await Purchase.findOne({ buyerId: buyer._id, idempotencyKey }).lean();
  if (existing) return { purchase: existing, created: false };

  // Free stock held by abandoned checkouts before taking more.
  await expireReservations({ limit: 20 });

  const priced = await priceCart(body.items);
  const provider = providerFor(body.payment.method);

  for (let attempt = 0; ; attempt++) {
    const purchaseId = new mongoose.Types.ObjectId();
    const orders = snapshotOrders(priced, purchaseId, buyer._id, body);
    try {
      await mongoose.connection.transaction(async (session) => {
        await reserveStock(orders, session);
        const createdOrders = await Order.insertMany(orders, { session });
        await Purchase.create(
          [
            {
              _id: purchaseId,
              ref: newRef(),
              buyerId: buyer._id,
              idempotencyKey,
              orderIds: createdOrders.map((order) => order._id),
              total: priced.total,
              contact: body.contact,
              deliveryAddress: body.deliveryAddress,
              payment: {
                method: body.payment.method,
                status: 'pending',
                provider,
                phone: body.payment.method === 'mpesa' ? body.payment.phone : undefined,
                attempts: 0,
              },
              reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60_000),
            },
          ],
          { session },
        );
      });
      return { purchase: (await Purchase.findById(purchaseId).lean())!, created: true };
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      // The same checkout arrived twice at once: return the one that won.
      const winner = await Purchase.findOne({ buyerId: buyer._id, idempotencyKey }).lean();
      if (winner) return { purchase: winner, created: false };
      // Otherwise a reference collided, which is rare. Try new ones once more.
      if (attempt >= 1) throw error;
    }
  }
}

// ---- Starting payment ----------------------------------------------------

// Sends the M-Pesa prompt or opens a card payment. A provider failure is kept
// on the purchase, so the app can show it and offer to try again.
export async function startPayment(purchase: StoredPurchase, buyer: StoredUser, change?: PaymentChoice) {
  if (!['pending', 'failed'].includes(purchase.payment.status)) throw conflict('This purchase is not waiting for payment');
  if (purchase.reservedUntil <= new Date()) throw conflict('This checkout has expired. Start a new one from your cart');

  const method = change?.method ?? purchase.payment.method;
  const phone = change?.method === 'mpesa' ? change.phone : purchase.payment.phone;
  if (method === 'mpesa' && !phone) throw new ApiError(400, 'validation_failed', 'Enter the M-Pesa number to pay from', { 'payment.phone': 'Required' });
  const provider = change ? providerFor(method) : purchase.payment.provider;
  const attempts = purchase.payment.attempts + 1;

  const started: Partial<PurchaseAttributes['payment']> = { method, provider, phone: method === 'mpesa' ? phone : undefined, attempts };
  try {
    if (provider === 'simulated') {
      started.providerRef = `sim-${method}-${Date.now()}-${randomBytes(4).toString('hex')}`;
      if (method === 'card') started.authorizationUrl = `${site.url}/pay/return?ref=${purchase.ref}`;
    } else if (method === 'mpesa') {
      started.providerRef = (await stkPush({ amount: purchase.total, phone: phone!, reference: purchase.ref })).checkoutRequestId;
    } else {
      const reference = `${purchase.ref}-${attempts}`;
      const { authorizationUrl } = await initializeTransaction({
        amount: purchase.total,
        // Paystack needs an email for its receipt.
        email: buyer.email ?? site.noReplyEmail,
        reference,
        purchaseRef: purchase.ref,
      });
      started.providerRef = reference;
      started.authorizationUrl = authorizationUrl;
    }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status < 500) throw error;
    await Purchase.updateOne(
      { _id: purchase._id, 'payment.status': { $in: ['pending', 'failed'] } },
      { $set: { 'payment.status': 'failed', 'payment.failureReason': error.message, 'payment.attempts': attempts }, $unset: { 'payment.providerRef': 1, 'payment.authorizationUrl': 1 } },
    );
    return (await Purchase.findById(purchase._id).lean())!;
  }

  const set = Object.fromEntries(Object.entries(started).map(([key, value]) => [`payment.${key}`, value]));
  const updated = await Purchase.findOneAndUpdate(
    { _id: purchase._id, 'payment.status': { $in: ['pending', 'failed'] } },
    {
      $set: { ...set, 'payment.status': 'pending', 'payment.lastCheckedAt': new Date() },
      $unset: { 'payment.failureReason': 1, ...(method === 'mpesa' && { 'payment.authorizationUrl': 1 }), ...(method === 'card' && { 'payment.phone': 1 }) },
    },
    { returnDocument: 'after' },
  ).lean();
  if (!updated) throw conflict('This purchase changed. Refresh and try again');
  return updated;
}

// ---- Confirming the outcome ----------------------------------------------

// Marks a purchase paid, its orders paid, and records the money in the ledger,
// all in one transaction. Only ever called after the provider has confirmed
// the payment. A repeat for an already-paid purchase changes nothing.
export async function confirmPayment(purchaseId: Types.ObjectId, providerRef: string, receipt?: string) {
  await mongoose.connection.transaction(async (session) => {
    const before = await Purchase.findOneAndUpdate(
      { _id: purchaseId, 'payment.providerRef': providerRef, 'payment.status': { $in: ['pending', 'failed', 'expired'] } },
      {
        $set: { 'payment.status': 'paid', 'payment.paidAt': new Date(), ...(receipt && { 'payment.receipt': receipt }) },
        $unset: { 'payment.failureReason': 1 },
      },
      { session, returnDocument: 'before' },
    ).lean();
    if (!before) return;

    const now = new Date();
    const orders = await Order.find({ purchaseId }).session(session).lean();
    if (before.payment.status === 'expired') {
      // Paid after the hold ended, so its stock was returned. Take it again if
      // it is still there; otherwise the order is cancelled for a refund.
      for (const order of orders.filter((item) => item.status === 'cancelled')) {
        const reserved = await tryReserveOrder(order, session);
        await Order.updateOne(
          { _id: order._id },
          reserved
            ? { $set: { status: 'paid' }, $push: { statusHistory: { status: 'paid', at: now, note: 'Paid after the hold ended' } } }
            : { $push: { statusHistory: { status: 'cancelled', at: now, note: 'Paid after the hold ended, but it had sold out. Refund due' } } },
          { session },
        );
      }
    } else {
      await Order.updateMany(
        { purchaseId, status: 'awaiting_payment' },
        { $set: { status: 'paid' }, $push: { statusHistory: { status: 'paid', at: now } } },
        { session },
      );
    }
    await recordPayment({ ...before, payment: { ...before.payment, providerRef } }, orders, session);
  });
}

async function failPayment(purchaseId: Types.ObjectId, providerRef: string, reason: string) {
  await Purchase.updateOne(
    { _id: purchaseId, 'payment.providerRef': providerRef, 'payment.status': 'pending' },
    { $set: { 'payment.status': 'failed', 'payment.failureReason': reason } },
  );
}

async function providerStatus(purchase: StoredPurchase): Promise<StkStatus> {
  const { provider, providerRef, method, phone } = purchase.payment;
  if (provider === 'simulated') {
    const started = Number(providerRef!.split('-')[2]);
    if (method === 'mpesa' && phone?.endsWith('0000')) return { state: 'failed', reason: 'The payment was cancelled on the phone' };
    return Date.now() - started >= SIMULATED_DELAY_MS || method === 'card' ? { state: 'paid' } : { state: 'pending' };
  }
  if (provider === 'daraja') return stkQuery(providerRef!);
  const status = await verifyTransaction(providerRef!);
  if (status.state !== 'paid') return status;
  // The amount and currency must match what was asked for.
  if (status.amount !== toSubunits(purchase.total) || status.currency !== 'KES') {
    console.error('Paystack amount mismatch', { ref: purchase.ref, amount: status.amount, currency: status.currency });
    return { state: 'failed', reason: 'The amount paid did not match. Contact support with your reference' };
  }
  return { state: 'paid' };
}

// Asks the provider about a pending payment and applies the answer. Callers
// that have just heard from the provider pass force, to skip the wait.
export async function refreshPayment(purchase: StoredPurchase, { force = false, receipt }: { force?: boolean; receipt?: string } = {}) {
  const { status, providerRef, lastCheckedAt } = purchase.payment;
  if (status !== 'pending' || !providerRef) return purchase;
  if (!force && lastCheckedAt && Date.now() - lastCheckedAt.getTime() < CHECK_INTERVAL_MS) return purchase;

  await Purchase.updateOne({ _id: purchase._id }, { $set: { 'payment.lastCheckedAt': new Date() } });
  let result: StkStatus;
  try {
    result = await providerStatus(purchase);
  } catch (error) {
    // The provider being unreachable is not a failed payment. Ask again later.
    if (error instanceof ApiError && error.status >= 500) return purchase;
    throw error;
  }
  if (result.state === 'paid') await confirmPayment(purchase._id, providerRef, receipt);
  if (result.state === 'failed') await failPayment(purchase._id, providerRef, result.reason);
  return (await Purchase.findById(purchase._id).lean())!;
}

// ---- Expiry ----------------------------------------------------------------

// Returns stock from checkouts not paid in time. A pending payment is checked
// with its provider first, so a late but real payment is not lost.
export async function expireReservations({ limit = 100, now = new Date() }: { limit?: number; now?: Date } = {}) {
  const due = await Purchase.find({ 'payment.status': { $in: ['pending', 'failed'] }, reservedUntil: { $lt: now } })
    .sort({ 'payment.status': 1, reservedUntil: 1 })
    .limit(limit)
    .lean();

  let expired = 0;
  for (const candidate of due) {
    const purchase = await refreshPayment(candidate, { force: true });
    if (purchase.payment.status === 'paid') continue;
    await mongoose.connection.transaction(async (session) => {
      const updated = await Purchase.updateOne(
        { _id: purchase._id, 'payment.status': { $in: ['pending', 'failed'] }, reservedUntil: { $lt: now } },
        { $set: { 'payment.status': 'expired' }, $unset: { 'payment.authorizationUrl': 1 } },
        { session },
      );
      if (updated.modifiedCount === 0) return;
      const orders = await Order.find({ purchaseId: purchase._id, status: 'awaiting_payment' }).session(session).lean();
      await Order.updateMany(
        { _id: { $in: orders.map((order) => order._id) } },
        { $set: { status: 'cancelled' }, $push: { statusHistory: { status: 'cancelled', at: now, note: 'Not paid in time' } } },
        { session },
      );
      await returnStock(orders, session);
      expired++;
    });
  }
  return expired;
}

// Pending payments whose callback may never come, oldest first.
export async function reconcilePayments({ limit = 50 }: { limit?: number } = {}) {
  const pending = await Purchase.find({
    'payment.status': 'pending',
    'payment.providerRef': { $exists: true },
    updatedAt: { $lt: new Date(Date.now() - 60_000) },
  })
    .sort({ reservedUntil: 1 })
    .limit(limit)
    .lean();
  let settled = 0;
  for (const purchase of pending) {
    const after = await refreshPayment(purchase, { force: true });
    if (after.payment.status !== 'pending') settled++;
  }
  return { checked: pending.length, settled };
}
