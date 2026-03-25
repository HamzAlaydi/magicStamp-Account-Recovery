import mongoose, { InferSchemaType } from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    isFirstTime: { type: Boolean, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 }, { unique: true });

export type OtpDoc = InferSchemaType<typeof otpSchema>;

export const OtpModel =
  mongoose.models.Otp || mongoose.model('Otp', otpSchema);

