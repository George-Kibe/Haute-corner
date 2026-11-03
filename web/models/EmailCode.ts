import { model, models, Schema, type Model } from 'mongoose';

export const CODE_PURPOSES = ['signup', 'reset'] as const;
export type CodePurpose = (typeof CODE_PURPOSES)[number];

// A one-time code emailed to confirm an address or reset a password. Only an
// HMAC of the code is stored. A sign-up keeps the name and password hash here
// until the address is confirmed, so no account exists before then.
export type EmailCodeAttributes = {
  email: string;
  purpose: CodePurpose;
  codeHash: string;
  codeExpiresAt: Date;
  attempts: number;
  sentAt: Date;
  name?: string;
  passwordHash?: string;
  // When the whole record is removed, so a sign-up can be resent for a while.
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const emailCodeSchema = new Schema<EmailCodeAttributes>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: CODE_PURPOSES, required: true },
    codeHash: { type: String, required: true },
    codeExpiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    sentAt: { type: Date, required: true },
    name: String,
    passwordHash: String,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

emailCodeSchema.index({ email: 1, purpose: 1 }, { unique: true });
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailCode =
  (models.EmailCode as Model<EmailCodeAttributes>) || model<EmailCodeAttributes>('EmailCode', emailCodeSchema);
