import { model, models, Schema, type Model, type Types } from 'mongoose';

// A signed-in device. Only hashes of refresh tokens are stored, never the tokens.
export type SessionAttributes = {
  userId: Types.ObjectId;
  tokenHash: string;
  previousTokenHash?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const sessionSchema = new Schema<SessionAttributes>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    previousTokenHash: String,
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
  },
  { timestamps: true },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ previousTokenHash: 1 }, { sparse: true });
sessionSchema.index({ userId: 1 });
// MongoDB removes each session once its expiry passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
  (models.Session as Model<SessionAttributes>) || model<SessionAttributes>('Session', sessionSchema);
