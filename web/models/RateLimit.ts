import { model, models, Schema, type Model } from 'mongoose';

// A request counter for one key in one time window. The _id combines the
// bucket, a hash of the key and the window start.
export type RateLimitAttributes = {
  _id: string;
  count: number;
  expiresAt: Date;
};

const rateLimitSchema = new Schema<RateLimitAttributes>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  (models.RateLimit as Model<RateLimitAttributes>) || model<RateLimitAttributes>('RateLimit', rateLimitSchema);
