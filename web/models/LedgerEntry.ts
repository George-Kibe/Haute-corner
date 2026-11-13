import { model, models, Schema, type Model, type Types } from 'mongoose';

export const LEDGER_TYPES = [
  'payment_received',
  'seller_credit',
  'commission',
  'payout',
  'payout_reversed',
  'refund',
  'provider_fee',
  'adjustment',
] as const;
export const LEDGER_ACCOUNTS = ['seller_balance', 'platform_commission', 'held_funds', 'buyer_refunds'] as const;

// One movement of money. Entries are never changed or removed; a correction is
// a new entry. Only lib/ledger.ts writes them.
export type LedgerEntryAttributes = {
  type: (typeof LEDGER_TYPES)[number];
  amount: number;
  direction: 'credit' | 'debit';
  account: (typeof LEDGER_ACCOUNTS)[number];
  sellerId?: Types.ObjectId;
  purchaseId?: Types.ObjectId;
  orderId?: Types.ObjectId;
  payoutId?: Types.ObjectId;
  provider?: 'daraja' | 'paystack' | 'simulated';
  providerRef?: string;
  idempotencyKey: string;
  note?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
};

const ledgerEntrySchema = new Schema<LedgerEntryAttributes>(
  {
    type: { type: String, enum: LEDGER_TYPES, required: true },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    direction: { type: String, enum: ['credit', 'debit'], required: true },
    account: { type: String, enum: LEDGER_ACCOUNTS, required: true },
    sellerId: Schema.Types.ObjectId,
    purchaseId: Schema.Types.ObjectId,
    orderId: Schema.Types.ObjectId,
    payoutId: Schema.Types.ObjectId,
    provider: String,
    providerRef: String,
    idempotencyKey: { type: String, required: true },
    note: String,
    createdBy: Schema.Types.ObjectId,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ledgerEntrySchema.index({ idempotencyKey: 1 }, { unique: true });
ledgerEntrySchema.index({ sellerId: 1, _id: -1 });
ledgerEntrySchema.index({ orderId: 1 });
ledgerEntrySchema.index({ purchaseId: 1 });
ledgerEntrySchema.index({ providerRef: 1 }, { sparse: true });

// The ledger is append-only. Any attempt to change or remove an entry through
// Mongoose fails.
const refuse = () => {
  throw new Error('Ledger entries cannot be changed or deleted');
};
for (const operation of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
] as const) {
  ledgerEntrySchema.pre(operation, refuse);
}
ledgerEntrySchema.pre('save', function () {
  if (!this.isNew) refuse();
});

export const LedgerEntry =
  (models.LedgerEntry as Model<LedgerEntryAttributes>) || model<LedgerEntryAttributes>('LedgerEntry', ledgerEntrySchema);
