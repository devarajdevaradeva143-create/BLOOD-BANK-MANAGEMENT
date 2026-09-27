import mongoose from 'mongoose';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donationSchema = new mongoose.Schema(
  {
    donationId: { type: String, required: true, unique: true, trim: true },
    donorName: { type: String, required: true, trim: true, minlength: 3 },
    bloodGroup: { type: String, required: true, enum: BLOOD_GROUPS },
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'],
    },
    contactVerified: { type: Boolean, default: false },
    districtId: { type: String, required: true, trim: true, lowercase: true },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    address: { type: String, trim: true },
    availableDate: { type: Date, required: true },
    preferredTime: { type: String, trim: true },
    hospitalId: { type: String, trim: true },
    campId: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

donationSchema.index({ districtId: 1, bloodGroup: 1, status: 1 });
donationSchema.index({ mobile: 1, createdAt: -1 });

export default mongoose.models.Donation || mongoose.model('Donation', donationSchema);
