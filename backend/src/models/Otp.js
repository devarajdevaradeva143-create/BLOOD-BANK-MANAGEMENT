import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    purpose: { type: String, required: true, enum: ['donor', 'request', 'reset', 'donation'] },
    targetHash: { type: String, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, expires: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ targetHash: 1, purpose: 1 });

export default mongoose.models.Otp || mongoose.model('Otp', otpSchema);
