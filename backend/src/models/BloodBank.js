import mongoose from 'mongoose';

const bloodBankSchema = new mongoose.Schema(
  {
    bankId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2 },
    district: { type: String, trim: true },
    districtId: { type: String, trim: true, lowercase: true, default: '' },
    contact: { type: String, trim: true },
    address: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

bloodBankSchema.index({ districtId: 1 });

export default (
  mongoose.models.BloodBank || mongoose.model('BloodBank', bloodBankSchema)
);
