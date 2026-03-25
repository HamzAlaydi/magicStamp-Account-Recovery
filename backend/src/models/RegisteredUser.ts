import mongoose, { InferSchemaType } from 'mongoose';

const registeredUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    firstLoginAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export type RegisteredUserDoc = InferSchemaType<typeof registeredUserSchema>;

export const RegisteredUserModel =
  mongoose.models.RegisteredUser || mongoose.model('RegisteredUser', registeredUserSchema);

