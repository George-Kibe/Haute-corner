import { model, models, Schema, type Model, type Types } from 'mongoose';
import type { Contact } from '@/models/Purchase';
import type { Address } from '@/models/User';

export const ORDER_STATUSES = [
  'awaiting_payment',
  'paid',
  'confirmed',
  'dispatched',
  'delivered',
  'completed',
  'disputed',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// What was bought, copied at purchase so later edits to the listing change nothing.
export type OrderItem = {
  productId: Types.ObjectId;
  title: string;
  image: string;
  option?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderAttributes = {
  ref: string;
  purchaseId: Types.ObjectId;
  buyerId?: Types.ObjectId;
  sellerId: Types.ObjectId;
  sellerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
  contact: Contact;
  deliveryAddress: Address;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: Date; by?: Types.ObjectId; note?: string }[];
  deliveredAt?: Date;
  autoCompleteAt?: Date;
  completedAt?: Date;
  payoutId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const money = { type: Number, required: true, min: 0, validate: Number.isInteger };

const orderSchema = new Schema<OrderAttributes>(
  {
    ref: { type: String, required: true },
    purchaseId: { type: Schema.Types.ObjectId, required: true },
    buyerId: Schema.Types.ObjectId,
    sellerId: { type: Schema.Types.ObjectId, required: true },
    sellerName: { type: String, required: true },
    items: {
      type: [
        {
          _id: false,
          productId: { type: Schema.Types.ObjectId, required: true },
          title: { type: String, required: true },
          image: { type: String, required: true },
          option: String,
          unitPrice: money,
          quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
          lineTotal: money,
        },
      ],
      validate: (items: OrderItem[]) => items.length > 0,
    },
    subtotal: money,
    deliveryFee: money,
    total: money,
    commissionRate: { type: Number, required: true, min: 0, max: 1 },
    commissionAmount: money,
    sellerAmount: money,
    contact: { _id: false, type: { name: { type: String, required: true }, phone: { type: String, required: true } }, required: true },
    deliveryAddress: {
      _id: false,
      type: { line1: { type: String, required: true }, area: String, city: { type: String, required: true }, notes: String },
      required: true,
    },
    status: { type: String, enum: ORDER_STATUSES, required: true, default: 'awaiting_payment' },
    statusHistory: {
      type: [{ _id: false, status: { type: String, required: true }, at: { type: Date, required: true }, by: Schema.Types.ObjectId, note: String }],
      default: [],
    },
    deliveredAt: Date,
    autoCompleteAt: Date,
    completedAt: Date,
    payoutId: Schema.Types.ObjectId,
  },
  { timestamps: true },
);

orderSchema.index({ ref: 1 }, { unique: true });
orderSchema.index({ buyerId: 1, _id: -1 });
orderSchema.index({ sellerId: 1, status: 1, _id: -1 });
orderSchema.index({ status: 1, _id: -1 });
orderSchema.index({ status: 1, autoCompleteAt: 1 });
orderSchema.index({ purchaseId: 1 });

export const Order = (models.Order as Model<OrderAttributes>) || model<OrderAttributes>('Order', orderSchema);
