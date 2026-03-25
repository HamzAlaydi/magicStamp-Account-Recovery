import mongoose, { InferSchemaType } from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], required: true, default: 'admin' },
  },
  { timestamps: true }
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;

export const AdminModel =
  mongoose.models.Admin || mongoose.model('Admin', adminSchema);

