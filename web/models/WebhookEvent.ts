import { model, models, Schema, type Model } from 'mongoose';

// A callback or webhook from a payment provider, kept so a repeat delivery is
// recognised and ignored. No card or personal details are stored.
export type WebhookEventAttributes = {
  provider: 'daraja' | 'paystack';
  eventId: string;
  type: string;
  receivedAt: Date;
  processedAt?: Date;
  error?: string;
};

const webhookEventSchema = new Schema<WebhookEventAttributes>({
  provider: { type: String, required: true },
  eventId: { type: String, required: true },
  type: { type: String, required: true },
  receivedAt: { type: Date, required: true },
  processedAt: Date,
  error: String,
});

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const WebhookEvent =
  (models.WebhookEvent as Model<WebhookEventAttributes>) || model<WebhookEventAttributes>('WebhookEvent', webhookEventSchema);
