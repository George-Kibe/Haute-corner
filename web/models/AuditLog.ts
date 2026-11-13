import { model, models, Schema, type Model, type Types } from 'mongoose';

// Who did what, and why, for every admin action.
export type AuditLogAttributes = {
  actorId: Types.ObjectId;
  action: string; // For example 'seller.approve' or 'product.remove'
  targetType: 'seller' | 'product' | 'report';
  targetId: Types.ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const auditLogSchema = new Schema<AuditLogAttributes>(
  {
    actorId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, trim: true },
  },
  { timestamps: true },
);

auditLogSchema.index({ targetType: 1, targetId: 1, _id: -1 });

export const AuditLog =
  (models.AuditLog as Model<AuditLogAttributes>) || model<AuditLogAttributes>('AuditLog', auditLogSchema);
