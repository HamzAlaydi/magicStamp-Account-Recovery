import mongoose, { InferSchemaType } from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    username: { type: String, required: true, index: true },
    role: { type: String, enum: ['admin', 'support'], required: true, index: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ agentId: 1, revokedAt: 1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema>;

export const SessionModel =
  mongoose.models.Session || mongoose.model('Session', sessionSchema);

