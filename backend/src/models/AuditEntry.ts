import mongoose, { InferSchemaType } from 'mongoose';

const auditEntrySchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    agentUsername: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ['search', 'view_user', 'verify_user', 'reveal_phone', 'login'],
      required: true,
      index: true,
    },
    target: { type: String },
    details: { type: String },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

auditEntrySchema.index({ timestamp: -1 });

export type AuditEntryDoc = InferSchemaType<typeof auditEntrySchema>;

export const AuditEntryModel =
  mongoose.models.AuditEntry || mongoose.model('AuditEntry', auditEntrySchema);

