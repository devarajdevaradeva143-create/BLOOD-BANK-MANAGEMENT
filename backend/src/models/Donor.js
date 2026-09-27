import mongoose from 'mongoose';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema(
  {
    donorId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    dob: { type: Date },
    age: { type: Number, min: 0, max: 120 },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Transgender'],
    },
    bloodGroup: { type: String, enum: BLOOD_GROUPS },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'],
    },
    mobileVerified: { type: Boolean, default: false },
    email: { type: String, lowercase: true, trim: true },
    // bcrypt(password + pepper). Absent for legacy donors created before auth.
    passwordHash: { type: String, select: false },
    district: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true, match: [/^\d{6}$/, 'Invalid pincode'] },
    address: { type: String, trim: true, minlength: 10 },
    eligibility: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    consents: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['Registered', 'Deferred', 'Donated'],
      default: 'Registered',
    },
  },
  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1, district: 1 });

export default mongoose.models.Donor || mongoose.model('Donor', donorSchema);
