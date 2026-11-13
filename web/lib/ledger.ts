import type { ClientSession, Types } from 'mongoose';
import { LedgerEntry, type LedgerEntryAttributes } from '@/models/LedgerEntry';
import type { OrderAttributes } from '@/models/Order';
import type { PurchaseAttributes } from '@/models/Purchase';

// The only code that writes ledger entries. Entries are append-only, and each
// has an idempotency key, so recording the same event twice fails rather than
// counting money twice. Write entries in the same transaction as the status
// change they belong to.

type NewEntry = Omit<LedgerEntryAttributes, 'createdAt'>;

async function append(entries: NewEntry[], session: ClientSession) {
  if (entries.length === 0) return;
  await LedgerEntry.insertMany(entries, { session, ordered: true });
}

// A confirmed payment, recorded as held money for each seller order it covers.
export async function recordPayment(
  purchase: PurchaseAttributes & { _id: Types.ObjectId },
  orders: (OrderAttributes & { _id: Types.ObjectId })[],
  session: ClientSession,
) {
  await append(
    orders.map((order) => ({
      type: 'payment_received' as const,
      amount: order.total,
      direction: 'credit' as const,
      account: 'held_funds' as const,
      sellerId: order.sellerId,
      purchaseId: purchase._id,
      orderId: order._id,
      provider: purchase.payment.provider,
      providerRef: purchase.payment.providerRef,
      idempotencyKey: `payment:${order._id}`,
    })),
    session,
  );
}

// The balance of one account: credits less debits.
export async function accountBalance(account: LedgerEntryAttributes['account'], filter: Partial<Record<'sellerId' | 'purchaseId' | 'orderId', Types.ObjectId>> = {}) {
  const [result] = await LedgerEntry.aggregate<{ balance: number }>([
    { $match: { account, ...filter } },
    { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }] } } } },
  ]);
  return result?.balance ?? 0;
}
