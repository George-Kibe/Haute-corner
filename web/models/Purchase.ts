import { model, models, Schema, type Model, type Types } from 'mongoose';
import type { Address } from '@/models/User';

export const PAYMENT_METHODS = ['mpesa', 'card'] as const;
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired'] as const;
export const PAYMENT_PROVIDERS = ['daraja', 'paystack', 'simulated'] as const;

export type Contact = { name: string; phone: string };

export type PurchaseAttributes = {
  ref: string;
  buyerId?: Types.ObjectId; // Cleared when the account is deleted
  idempotencyKey: string;
  orderIds: Types.ObjectId[];
  total: number;
  contact: Contact;
  deliveryAddress: Address;
  payment: {
    method: (typeof PAYMENT_METHODS)[number];
    status: (typeof PAYMENT_STATUSES)[number];
    provider: (typeof PAYMENT_PROVIDERS)[number];
    phone?: string; // The M-Pesa number asked to pay
    providerRef?: string; // CheckoutRequestID, or the Paystack reference
    authorizationUrl?: string; // Paystack's hosted page
    attempts: number;
    receipt?: string; // M-Pesa receipt number
    failureReason?: string;
    lastCheckedAt?: Date;
    paidAt?: Date;
  };
  reservedUntil: Date;
  createdAt: Date;
  updatedAt: Date;
};

const purchaseSchema = new Schema<PurchaseAttributes>(
  {
    ref: { type: String, required: true },
    buyerId: Schema.Types.ObjectId,
    idempotencyKey: { type: String, required: true },
    orderIds: { type: [Schema.Types.ObjectId], default: [] },
    total: { type: Number, required: true, min: 1, validate: Number.isInteger },
    contact: { _id: false, type: { name: { type: String, required: true }, phone: { type: String, required: true } }, required: true },
    deliveryAddress: {
      _id: false,
      type: { line1: { type: String, required: true }, area: String, city: { type: String, required: true }, notes: String },
      required: true,
    },
    payment: {
      _id: false,
      type: {
        method: { type: String, enum: PAYMENT_METHODS, required: true },
        status: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'pending' },
        provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
        phone: String,
        providerRef: String,
        authorizationUrl: String,
        attempts: { type: Number, default: 0 },
        receipt: String,
        failureReason: String,
        lastCheckedAt: Date,
        paidAt: Date,
      },
      required: true,
    },
    reservedUntil: { type: Date, required: true },
  },
  { timestamps: true },
);

purchaseSchema.index({ ref: 1 }, { unique: true });
purchaseSchema.index({ buyerId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { buyerId: { $exists: true } } });
purchaseSchema.index({ 'payment.providerRef': 1 }, { sparse: true });
purchaseSchema.index({ 'payment.status': 1, reservedUntil: 1 });
purchaseSchema.index({ buyerId: 1, _id: -1 });

export const Purchase = (models.Purchase as Model<PurchaseAttributes>) || model<PurchaseAttributes>('Purchase', purchaseSchema);
