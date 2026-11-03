import { model, models, Schema, type Model, type Types } from 'mongoose';

export const AUTH_PROVIDERS = ['google', 'apple'] as const;
export const USER_ROLES = ['customer', 'admin'] as const;

export type Address = {
  line1: string;
  area?: string;
  city: string;
  notes?: string;
};

export type UserAttributes = {
  provider: (typeof AUTH_PROVIDERS)[number];
  providerId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  phone?: string;
  deliveryAddress?: Address;
  role: (typeof USER_ROLES)[number];
  wishlist: Types.ObjectId[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const addressSchema = new Schema<Address>(
  {
    line1: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserAttributes>(
  {
    provider: { type: String, enum: AUTH_PROVIDERS, required: true },
    providerId: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    avatarUrl: String,
    phone: { type: String, trim: true },
    deliveryAddress: addressSchema,
    role: { type: String, enum: USER_ROLES, default: 'customer', required: true },
    wishlist: { type: [Schema.Types.ObjectId], default: [] },
    deletedAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export const User = (models.User as Model<UserAttributes>) || model<UserAttributes>('User', userSchema);
