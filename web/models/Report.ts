import { model, models, Schema, type Model, type Types } from 'mongoose';

export const REPORT_REASONS = ['counterfeit', 'prohibited', 'misleading', 'offensive', 'scam', 'other'] as const;
export const REPORT_STATUSES = ['open', 'dismissed', 'actioned'] as const;

// A shopper's report that a listing looks wrong. One open report per person
// and product.
export type ReportAttributes = {
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reason: (typeof REPORT_REASONS)[number];
  details?: string;
  status: (typeof REPORT_STATUSES)[number];
  review?: { by: Types.ObjectId; at: Date; note?: string };
  createdAt: Date;
  updatedAt: Date;
};

const reportSchema = new Schema<ReportAttributes>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    sellerId: { type: Schema.Types.ObjectId, required: true },
    reporterId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true },
    status: { type: String, enum: REPORT_STATUSES, default: 'open', required: true },
    review: { _id: false, type: { by: Schema.Types.ObjectId, at: Date, note: String } },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, _id: -1 });
reportSchema.index({ productId: 1, status: 1 });
reportSchema.index(
  { productId: 1, reporterId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);

export const Report = (models.Report as Model<ReportAttributes>) || model<ReportAttributes>('Report', reportSchema);
