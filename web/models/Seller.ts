import { model, models, Schema, type Model, type Types } from 'mongoose';

export const SELLER_STATUSES = ['applied', 'approved', 'rejected', 'suspended'] as const;

export type SellerAttributes = {
  userId: Types.ObjectId;
  status: (typeof SELLER_STATUSES)[number];
  businessName: string;
  phone: string;
  payoutMpesaNumber: string;
  payoutNumberChangedAt?: Date;
  deliveryFee: number;
  deliveryAreas: string;
  returnsNote?: string;
  documents: { kind: string; publicId: string }[];
  review?: { by: Types.ObjectId; at: Date; reason?: string };
  createdAt: Date;
  updatedAt: Date;
};

const sellerSchema = new Schema<SellerAttributes>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: SELLER_STATUSES, default: 'applied', required: true },
    businessName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    payoutMpesaNumber: { type: String, required: true, trim: true },
    payoutNumberChangedAt: Date,
    deliveryFee: { type: Number, required: true, min: 0, validate: Number.isInteger },
    deliveryAreas: { type: String, required: true, trim: true },
    returnsNote: { type: String, trim: true },
    documents: {
      type: [{ _id: false, kind: { type: String, required: true }, publicId: { type: String, required: true } }],
      default: [],
    },
    review: {
      _id: false,
      type: { by: Schema.Types.ObjectId, at: Date, reason: String },
    },
  },
  { timestamps: true },
);

sellerSchema.index({ userId: 1 }, { unique: true });
sellerSchema.index({ status: 1, _id: -1 });

export const Seller = (models.Seller as Model<SellerAttributes>) || model<SellerAttributes>('Seller', sellerSchema);
