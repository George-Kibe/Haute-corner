import { model, models, Schema, type Model, type Types } from 'mongoose';

export const IDENTITY_PROVIDERS = ['google', 'apple'] as const;
export const USER_ROLES = ['customer', 'admin'] as const;
export const WISHLIST_LIMIT = 200;

export type Address = {
  line1: string;
  area?: string;
  city: string;
  notes?: string;
};

// A Google or Apple account linked to this user.
export type Identity = {
  provider: (typeof IDENTITY_PROVIDERS)[number];
  providerId: string;
};

export type UserAttributes = {
  // Always verified: by Google or Apple, or by a code sent to it.
  email?: string;
  // Present once the user has set a password for email sign-in.
  passwordHash?: string;
  identities: Identity[];
  name?: string;
  avatarUrl?: string;
  phone?: string;
  deliveryAddress?: Address;
  role: (typeof USER_ROLES)[number];
  // Product IDs, newest first.
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

const identitySchema = new Schema<Identity>(
  {
    provider: { type: String, enum: IDENTITY_PROVIDERS, required: true },
    providerId: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserAttributes>(
  {
    email: { type: String, trim: true, lowercase: true },
    passwordHash: String,
    identities: { type: [identitySchema], default: [] },
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

// One account per Google or Apple account, and one per email address.
userSchema.index(
  { 'identities.provider': 1, 'identities.providerId': 1 },
  { unique: true, partialFilterExpression: { 'identities.providerId': { $exists: true } } },
);
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });

export const User = (models.User as Model<UserAttributes>) || model<UserAttributes>('User', userSchema);
