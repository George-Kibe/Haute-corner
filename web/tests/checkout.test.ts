import { createHmac } from 'node:crypto';
import type { Types } from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as quote } from '@/app/api/v1/checkout/quote/route';
import { POST as checkout } from '@/app/api/v1/checkout/route';
import { GET as getOrder } from '@/app/api/v1/orders/[ref]/route';
import { GET as listOrders } from '@/app/api/v1/orders/route';
import { POST as payAgain } from '@/app/api/v1/purchases/[ref]/pay/route';
import { GET as getPurchase } from '@/app/api/v1/purchases/[ref]/route';
import { POST as darajaCallback } from '@/app/api/v1/webhooks/daraja/stk/route';
import { POST as paystackWebhook } from '@/app/api/v1/webhooks/paystack/route';
import { DELETE as deleteMe } from '@/app/api/v1/me/route';
import { resetDarajaToken } from '@/lib/daraja';
import { accountBalance } from '@/lib/ledger';
import { expireReservations, reconcilePayments } from '@/lib/payments';
import { LedgerEntry } from '@/models/LedgerEntry';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Purchase } from '@/models/Purchase';
import { WebhookEvent } from '@/models/WebhookEvent';
import { createProduct, createSeller, createUser, noParams, params, request, resetDatabase } from './helpers';

const PAYSTACK_KEY = 'sk_test_example';
const CALLBACK_TOKEN = 'callback-token-123';

beforeAll(() => {
  Object.assign(process.env, {
    DARAJA_CONSUMER_KEY: 'key',
    DARAJA_CONSUMER_SECRET: 'secret',
    DARAJA_SHORTCODE: '174379',
    DARAJA_PASSKEY: 'passkey',
    DARAJA_CALLBACK_TOKEN: CALLBACK_TOKEN,
    PAYSTACK_SECRET_KEY: PAYSTACK_KEY,
  });
});
afterAll(() => {
  for (const name of ['DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET', 'DARAJA_SHORTCODE', 'DARAJA_PASSKEY', 'DARAJA_CALLBACK_TOKEN', 'PAYSTACK_SECRET_KEY']) {
    delete process.env[name];
  }
});
afterEach(() => vi.unstubAllGlobals());

// ---- Fake Daraja and Paystack ------------------------------------------------

type ProviderState = {
  stkResult: string | null; // null: still waiting for the customer
  paystackStatus: string;
  paystackAmount?: number;
  stkPushes: unknown[];
  paystackInits: Record<string, unknown>[];
};
let providers: ProviderState;
let nextCheckout = 0;

function fakeProviders() {
  providers = { stkResult: null, paystackStatus: 'ongoing', stkPushes: [], paystackInits: [] };
  resetDarajaToken();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      if (url.pathname === '/oauth/v1/generate') return Response.json({ access_token: 'daraja-token', expires_in: '3599' });
      if (url.pathname === '/mpesa/stkpush/v1/processrequest') {
        providers.stkPushes.push(body);
        return Response.json({ ResponseCode: '0', CheckoutRequestID: `ws_CO_${++nextCheckout}`, MerchantRequestID: 'm1' });
      }
      if (url.pathname === '/mpesa/stkpushquery/v1/query') {
        if (providers.stkResult === null) {
          return Response.json({ errorCode: '500.001.1001', errorMessage: 'The transaction is being processed' }, { status: 500 });
        }
        return Response.json({ ResponseCode: '0', ResultCode: providers.stkResult, ResultDesc: 'Done' });
      }
      if (url.pathname === '/transaction/initialize') {
        providers.paystackInits.push(body);
        return Response.json({ status: true, data: { authorization_url: `https://checkout.paystack.com/${body.reference}`, reference: body.reference } });
      }
      if (url.pathname.startsWith('/transaction/verify/')) {
        const reference = decodeURIComponent(url.pathname.split('/').pop()!);
        const purchase = await Purchase.findOne({ 'payment.providerRef': reference }).lean();
        return Response.json({
          status: true,
          data: { status: providers.paystackStatus, amount: providers.paystackAmount ?? (purchase?.total ?? 0) * 100, currency: 'KES', reference },
        });
      }
      return Response.json({}, { status: 404 });
    }),
  );
}

// ---- Shared setup ----------------------------------------------------------

let buyer: { token: string; userId: Types.ObjectId };
let soles: Awaited<ReturnType<typeof createSeller>>;
let threads: Awaited<ReturnType<typeof createSeller>>;
let boots: Awaited<ReturnType<typeof createProduct>>;
let scarf: Awaited<ReturnType<typeof createProduct>>;

beforeEach(async () => {
  await resetDatabase();
  fakeProviders();
  const { user, token } = await createUser({ email: 'buyer@example.com' });
  buyer = { token, userId: user._id };
  soles = await createSeller({ businessName: 'Nairobi Soles', deliveryFee: 250 });
  threads = await createSeller({ businessName: 'Kilimani Threads', deliveryFee: 300 });
  boots = await createProduct(soles._id, { title: 'Boots', price: 4800, stock: 3, options: ['39', '40'] });
  scarf = await createProduct(threads._id, { title: 'Scarf', price: 1200, stock: 5, options: [] });
});

const json = async (response: Response) => ({ status: response.status, body: await response.json().catch(() => null) });

const cart = () => [
  { productId: String(boots._id), option: '40', quantity: 2 },
  { productId: String(scarf._id), quantity: 1 },
];

const checkoutBody = (overrides: Record<string, unknown> = {}) => ({
  items: cart(),
  contact: { name: 'Asha Otieno', phone: '0712 345 678' },
  deliveryAddress: { line1: 'Ngong Road', area: 'Kilimani', city: 'Nairobi' },
  payment: { method: 'mpesa', phone: '0712 345 678' },
  ...overrides,
});

function postCheckout(body: unknown, key: string | null = 'key-0001', token = buyer.token) {
  const req = request('POST', '/api/v1/checkout', { token, body });
  if (key) req.headers.set('Idempotency-Key', key);
  return checkout(req, noParams);
}

const fetchPurchase = (ref: string, token = buyer.token) => getPurchase(request('GET', `/api/v1/purchases/${ref}`, { token }), params({ ref }));

const stkCallback = (checkoutRequestId: string, resultCode: number, token = CALLBACK_TOKEN) =>
  darajaCallback(
    request('POST', `/api/v1/webhooks/daraja/stk?token=${token}`, {
      body: {
        Body: {
          stkCallback: {
            MerchantRequestID: 'm1',
            CheckoutRequestID: checkoutRequestId,
            ResultCode: resultCode,
            ResultDesc: 'Done',
            CallbackMetadata: { Item: [{ Name: 'Amount', Value: 1 }, { Name: 'MpesaReceiptNumber', Value: 'QK12ABC34D' }] },
          },
        },
      },
    }),
    noParams,
  );

function paystackEvent(payload: unknown, key = PAYSTACK_KEY) {
  const raw = JSON.stringify(payload);
  const req = request('POST', '/api/v1/webhooks/paystack', { body: raw });
  req.headers.set('x-paystack-signature', createHmac('sha512', key).update(raw).digest('hex'));
  return paystackWebhook(req, noParams);
}

async function ledgerMatchesPayments() {
  const paid = await Purchase.find({ 'payment.status': 'paid' }).lean();
  const expected = paid.reduce((sum, purchase) => sum + purchase.total, 0);
  return { expected, held: await accountBalance('held_funds') };
}

// ---- Tests ---------------------------------------------------------------------

describe('POST /checkout/quote', () => {
  const postQuote = (body: unknown) => quote(request('POST', '/api/v1/checkout/quote', { token: buyer.token, body }), noParams);

  it('prices each seller’s items as one order with that seller’s delivery fee', async () => {
    const { status, body } = await json(await postQuote({ items: cart() }));

    expect(status).toBe(200);
    expect(body.data).toMatchObject({ subtotal: 10800, deliveryTotal: 550, total: 11350 });
    expect(body.data.orders).toMatchObject([
      { seller: { name: 'Nairobi Soles' }, subtotal: 9600, deliveryFee: 250, total: 9850, items: [{ option: '40', unitPrice: 4800, quantity: 2, lineTotal: 9600 }] },
      { seller: { name: 'Kilimani Threads' }, subtotal: 1200, deliveryFee: 300, total: 1500 },
    ]);
  });

  it('refuses prices, totals or any other field from the app', async () => {
    const withPrice = [{ ...cart()[0], unitPrice: 1 }];

    expect((await postQuote({ items: withPrice })).status).toBe(400);
    expect((await postQuote({ items: cart(), total: 1 })).status).toBe(400);
  });

  it('merges repeated lines and reports stock, sizes and unavailable products per line', async () => {
    const hidden = await createProduct(soles._id, { status: 'hidden' });

    const merged = await json(await postQuote({ items: [{ productId: String(scarf._id), quantity: 3 }, { productId: String(scarf._id), quantity: 3 }] }));
    expect(merged.status).toBe(409);
    expect(merged.body.error.details).toEqual({ 'items.0': 'Only 5 left', 'items.1': 'Only 5 left' });

    const size = await json(await postQuote({ items: [{ productId: String(boots._id), option: '45', quantity: 1 }] }));
    expect(size.status).toBe(400);

    const gone = await json(await postQuote({ items: [{ productId: String(hidden._id), option: '39', quantity: 1 }] }));
    expect(gone.status).toBe(409);
    expect(gone.body.error.details['items.0']).toBe('This product is no longer available');
  });

  it('needs a signed-in user', async () => {
    expect((await quote(request('POST', '/api/v1/checkout/quote', { body: { items: cart() } }), noParams)).status).toBe(401);
  });
});

describe('POST /checkout', () => {
  it('creates one order per seller, reserves stock and sends the M-Pesa prompt for the server’s total', async () => {
    const { status, body } = await json(await postCheckout(checkoutBody()));

    expect(status).toBe(201);
    expect(body.data).toMatchObject({ total: 11350, payment: { method: 'mpesa', status: 'pending', phone: '+254712345678' } });
    expect(body.data.orders.map((order: { status: string; total: number }) => [order.status, order.total])).toEqual([
      ['awaiting_payment', 9850],
      ['awaiting_payment', 1500],
    ]);
    expect(providers.stkPushes).toMatchObject([{ Amount: 11350, PhoneNumber: '254712345678', PartyB: '174379', AccountReference: body.data.ref }]);
    expect((await Product.findById(boots._id).lean())!.stock).toBe(1);
    expect((await Product.findById(scarf._id).lean())!.stock).toBe(4);
    const order = await Order.findOne({ sellerId: soles._id }).lean();
    expect(order).toMatchObject({ commissionRate: 0, commissionAmount: 0, sellerAmount: 9850, sellerName: 'Nairobi Soles' });
    expect(order!.items[0]).toMatchObject({ title: 'Boots', unitPrice: 4800, option: '40', image: 'samples/shoe' });
  });

  it('refuses a price, fee or total sent by the app', async () => {
    const tampered = checkoutBody({ items: [{ ...cart()[0], price: 1 }] });

    expect((await postCheckout(tampered)).status).toBe(400);
    expect((await postCheckout(checkoutBody({ total: 1 }))).status).toBe(400);
    expect(await Purchase.countDocuments()).toBe(0);
  });

  it('returns the first purchase for a repeated Idempotency-Key, creating and charging nothing new', async () => {
    const first = await json(await postCheckout(checkoutBody(), 'same-key-1'));
    const again = await json(await postCheckout(checkoutBody(), 'same-key-1'));

    expect(again.status).toBe(200);
    expect(again.body.data.ref).toBe(first.body.data.ref);
    expect(await Purchase.countDocuments()).toBe(1);
    expect(await Order.countDocuments()).toBe(2);
    expect(providers.stkPushes).toHaveLength(1);
    expect((await Product.findById(boots._id).lean())!.stock).toBe(1);
  });

  it('needs an Idempotency-Key', async () => {
    expect((await postCheckout(checkoutBody(), null)).status).toBe(400);
  });

  it('reserves nothing if any item has run out', async () => {
    await Product.updateOne({ _id: scarf._id }, { $set: { stock: 0 } });

    const { status } = await json(await postCheckout(checkoutBody()));

    expect(status).toBe(409);
    expect((await Product.findById(boots._id).lean())!.stock).toBe(3);
    expect(await Purchase.countDocuments()).toBe(0);
  });

  it('sells the last unit only once when two people check out together', async () => {
    await Product.updateOne({ _id: scarf._id }, { $set: { stock: 1 } });
    const other = await createUser();
    const body = checkoutBody({ items: [{ productId: String(scarf._id), quantity: 1 }] });

    const results = await Promise.all([postCheckout(body, 'race-key-a'), postCheckout(body, 'race-key-b', other.token)]);

    expect(results.map((response) => response.status).sort()).toEqual([201, 409]);
    expect((await Product.findById(scarf._id).lean())!.stock).toBe(0);
  });

  it('starts a Paystack card payment for the server’s total in cents', async () => {
    const { status, body } = await json(await postCheckout(checkoutBody({ payment: { method: 'card' } })));

    expect(status).toBe(201);
    expect(body.data.payment.authorizationUrl).toBe(`https://checkout.paystack.com/${body.data.ref}-1`);
    expect(providers.paystackInits).toMatchObject([{ amount: 1135000, currency: 'KES', email: 'buyer@example.com', channels: ['card'] }]);
  });
});

describe('confirming M-Pesa payments', () => {
  async function pendingMpesa() {
    const { body } = await json(await postCheckout(checkoutBody()));
    const purchase = (await Purchase.findOne({ ref: body.data.ref }).lean())!;
    return { ref: body.data.ref as string, checkoutRequestId: purchase.payment.providerRef! };
  }

  it('marks the purchase and orders paid only after a status query confirms the callback, and records the money once', async () => {
    const { ref, checkoutRequestId } = await pendingMpesa();
    providers.stkResult = '0';

    const response = await stkCallback(checkoutRequestId, 0);

    expect(await response.json()).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
    const { body } = await json(await fetchPurchase(ref));
    expect(body.data.payment).toMatchObject({ status: 'paid', receipt: 'QK12ABC34D' });
    expect(body.data.orders.map((order: { status: string }) => order.status)).toEqual(['paid', 'paid']);
    expect(await ledgerMatchesPayments()).toEqual({ expected: 11350, held: 11350 });
    expect(await LedgerEntry.countDocuments()).toBe(2);
  });

  it('ignores a callback that claims success when Safaricom says otherwise', async () => {
    const { ref, checkoutRequestId } = await pendingMpesa();
    providers.stkResult = '1032';

    await stkCallback(checkoutRequestId, 0);

    const { body } = await json(await fetchPurchase(ref));
    expect(body.data.payment).toMatchObject({ status: 'failed', failureReason: 'The payment was cancelled on the phone' });
    expect(await LedgerEntry.countDocuments()).toBe(0);
  });

  it('ignores a duplicate callback', async () => {
    const { checkoutRequestId } = await pendingMpesa();
    providers.stkResult = '0';

    await stkCallback(checkoutRequestId, 0);
    await stkCallback(checkoutRequestId, 0);

    expect(await WebhookEvent.countDocuments()).toBe(1);
    expect(await LedgerEntry.countDocuments()).toBe(2);
    expect(await ledgerMatchesPayments()).toEqual({ expected: 11350, held: 11350 });
  });

  it('refuses a callback without the secret token', async () => {
    const { checkoutRequestId } = await pendingMpesa();
    providers.stkResult = '0';

    expect((await stkCallback(checkoutRequestId, 0, 'wrong-token-12345')).status).toBe(401);
    expect(await Purchase.countDocuments({ 'payment.status': 'paid' })).toBe(0);
  });

  it('settles a payment whose callback never came, when the app checks', async () => {
    const { ref } = await pendingMpesa();
    await Purchase.updateOne({ ref }, { $unset: { 'payment.lastCheckedAt': 1 } });
    providers.stkResult = '0';

    const { body } = await json(await fetchPurchase(ref));

    expect(body.data.payment.status).toBe('paid');
  });

  it('settles pending payments in the reconciliation job', async () => {
    const { ref } = await pendingMpesa();
    await Purchase.collection.updateOne({ ref }, { $set: { updatedAt: new Date(Date.now() - 5 * 60_000) } });
    providers.stkResult = '0';

    expect(await reconcilePayments()).toEqual({ checked: 1, settled: 1 });
    expect((await Purchase.findOne({ ref }).lean())!.payment.status).toBe('paid');
  });

  it('lets the buyer try again after a failure, with a new prompt', async () => {
    const { ref, checkoutRequestId } = await pendingMpesa();
    providers.stkResult = '2001';
    await stkCallback(checkoutRequestId, 2001);

    const retry = await json(
      await payAgain(request('POST', `/api/v1/purchases/${ref}/pay`, { token: buyer.token, body: { payment: { method: 'mpesa', phone: '0799 000 111' } } }), params({ ref })),
    );

    expect(retry.body.data.payment).toMatchObject({ status: 'pending', phone: '+254799000111', failureReason: null });
    expect(providers.stkPushes).toHaveLength(2);
  });
});

describe('confirming card payments', () => {
  async function pendingCard() {
    const { body } = await json(await postCheckout(checkoutBody({ payment: { method: 'card' } })));
    return { ref: body.data.ref as string, reference: `${body.data.ref}-1` };
  }

  it('confirms a signed charge.success after verifying the amount, once only', async () => {
    const { ref, reference } = await pendingCard();
    providers.paystackStatus = 'success';
    const event = { event: 'charge.success', data: { id: 991, reference } };

    expect((await paystackEvent(event)).status).toBe(200);
    expect((await paystackEvent(event)).status).toBe(200);

    expect((await Purchase.findOne({ ref }).lean())!.payment.status).toBe('paid');
    expect(await WebhookEvent.countDocuments()).toBe(1);
    expect(await ledgerMatchesPayments()).toEqual({ expected: 11350, held: 11350 });
  });

  it('refuses an unsigned or wrongly signed webhook', async () => {
    const { reference } = await pendingCard();
    providers.paystackStatus = 'success';

    expect((await paystackEvent({ event: 'charge.success', data: { id: 1, reference } }, 'sk_wrong')).status).toBe(401);
    expect(await Purchase.countDocuments({ 'payment.status': 'paid' })).toBe(0);
  });

  it('does not confirm a payment for the wrong amount', async () => {
    const { ref, reference } = await pendingCard();
    providers.paystackStatus = 'success';
    providers.paystackAmount = 100;

    await paystackEvent({ event: 'charge.success', data: { id: 2, reference } });

    expect((await Purchase.findOne({ ref }).lean())!.payment.status).toBe('failed');
    expect(await LedgerEntry.countDocuments()).toBe(0);
  });
});

describe('reservations', () => {
  it('returns stock and cancels the orders when payment does not arrive in time', async () => {
    const { body } = await json(await postCheckout(checkoutBody()));
    await Purchase.updateOne({ ref: body.data.ref }, { $set: { reservedUntil: new Date(Date.now() - 1000) } });

    expect(await expireReservations()).toBe(1);

    expect((await Purchase.findOne({ ref: body.data.ref }).lean())!.payment.status).toBe('expired');
    expect((await Product.findById(boots._id).lean())!.stock).toBe(3);
    expect((await Product.findById(scarf._id).lean())!.stock).toBe(5);
    expect(await Order.countDocuments({ status: 'cancelled' })).toBe(2);
    expect(await expireReservations()).toBe(0);
  });

  it('keeps a payment that completed just before expiry instead of expiring it', async () => {
    const { body } = await json(await postCheckout(checkoutBody()));
    await Purchase.updateOne({ ref: body.data.ref }, { $set: { reservedUntil: new Date(Date.now() - 1000) } });
    providers.stkResult = '0';

    expect(await expireReservations()).toBe(0);

    expect((await Purchase.findOne({ ref: body.data.ref }).lean())!.payment.status).toBe('paid');
    expect((await Product.findById(boots._id).lean())!.stock).toBe(1);
  });
});

describe('who can see what', () => {
  it('hides other people’s purchases and orders', async () => {
    const { body } = await json(await postCheckout(checkoutBody()));
    const order = (await Order.findOne().lean())!;
    const other = await createUser();

    expect((await fetchPurchase(body.data.ref, other.token)).status).toBe(404);
    expect((await getOrder(request('GET', `/api/v1/orders/${order.ref}`, { token: other.token }), params({ ref: order.ref }))).status).toBe(404);
    const theirs = await json(await listOrders(request('GET', '/api/v1/orders', { token: other.token }), noParams));
    expect(theirs.body.data).toEqual([]);
  });

  it('lists the buyer’s paid orders, newest first, without commission details', async () => {
    const { body } = await json(await postCheckout(checkoutBody()));
    providers.stkResult = '0';
    await Purchase.updateOne({ ref: body.data.ref }, { $unset: { 'payment.lastCheckedAt': 1 } });
    await fetchPurchase(body.data.ref);

    const { body: list } = await json(await listOrders(request('GET', '/api/v1/orders', { token: buyer.token }), noParams));

    expect(list.data.map((order: { seller: { name: string } }) => order.seller.name)).toEqual(['Kilimani Threads', 'Nairobi Soles']);
    expect(JSON.stringify(list)).not.toMatch(/commission|sellerAmount/);
  });
});

describe('the ledger', () => {
  it('cannot be changed or deleted', async () => {
    await LedgerEntry.create({ type: 'adjustment', amount: 5, direction: 'credit', account: 'held_funds', idempotencyKey: 'test:1' });

    await expect(LedgerEntry.updateOne({}, { $set: { amount: 1 } })).rejects.toThrow('cannot be changed');
    await expect(LedgerEntry.deleteMany({})).rejects.toThrow('cannot be changed');
    await expect(LedgerEntry.create({ type: 'adjustment', amount: 5, direction: 'credit', account: 'held_funds', idempotencyKey: 'test:1' })).rejects.toMatchObject({ code: 11000 });
  });
});

describe('deleting an account with orders', () => {
  it('is refused while an order is in progress, and removes personal details from past orders', async () => {
    const { body } = await json(await postCheckout(checkoutBody()));
    providers.stkResult = '0';
    await Purchase.updateOne({ ref: body.data.ref }, { $unset: { 'payment.lastCheckedAt': 1 } });
    await fetchPurchase(body.data.ref);
    const remove = () => deleteMe(request('DELETE', '/api/v1/me', { token: buyer.token }), noParams);

    expect((await remove()).status).toBe(409);

    await Order.updateMany({}, { $set: { status: 'completed' } });
    expect((await remove()).status).toBe(204);
    const order = (await Order.findOne().lean())!;
    expect(order.buyerId).toBeUndefined();
    expect(order.contact).toEqual({ name: 'Deleted account', phone: 'Removed' });
    expect(order.total).toBe(9850);
  });
});
