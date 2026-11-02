import { model, models, Schema, type Model, type Types } from 'mongoose';

export const PRODUCT_TYPES = ['shoes', 'clothing'] as const;
export const AUDIENCES = ['men', 'women', 'children', 'unisex'] as const;
export const PRODUCT_STATUSES = ['active', 'archived', 'removed', 'hidden'] as const;

export type Media = {
  kind: 'image' | 'video';
  publicId: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type ProductAttributes = {
  sellerId: Types.ObjectId;
  title: string;
  description: string;
  type: (typeof PRODUCT_TYPES)[number];
  audience: (typeof AUDIENCES)[number];
  price: number;
  media: Media[];
  options: string[];
  stock: number;
  status: (typeof PRODUCT_STATUSES)[number];
  removedReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const mediaSchema = new Schema<Media>(
  {
    kind: { type: String, enum: ['image', 'video'], required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
    durationSeconds: Number,
  },
  { _id: false },
);

const productSchema = new Schema<ProductAttributes>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: PRODUCT_TYPES, required: true },
    audience: { type: String, enum: AUDIENCES, required: true },
    price: { type: Number, required: true, min: 1, validate: Number.isInteger },
    media: {
      type: [mediaSchema],
      validate: (media: Media[]) => media.some((item) => item.kind === 'image'),
    },
    options: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active', required: true },
    removedReason: String,
  },
  { timestamps: true },
);

productSchema.index({ status: 1, _id: -1 });
productSchema.index({ status: 1, type: 1, _id: -1 });
productSchema.index({ status: 1, audience: 1, _id: -1 });
productSchema.index({ status: 1, type: 1, audience: 1, _id: -1 });
productSchema.index({ sellerId: 1, status: 1, _id: -1 });
productSchema.index({ title: 'text', description: 'text' });

export const Product = (models.Product as Model<ProductAttributes>) || model<ProductAttributes>('Product', productSchema);
