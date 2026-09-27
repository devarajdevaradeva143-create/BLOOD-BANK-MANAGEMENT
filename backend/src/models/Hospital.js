import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true, trim: true, minlength: 2 },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hospitalId: { type: String, trim: true },
    hospitalType: {
      type: String,
      enum: ['Government', 'Private', 'Trust', 'Other'],
      default: 'Private',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits'],
    },
    emergencyContact: { type: String, trim: true },
    // District display name (e.g. 'Chennai'); districtId is the lowercase
    // slug matching the frontend districts list (e.g. 'chennai').
    district: { type: String, trim: true },
    districtId: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, required: true, trim: true, minlength: 5 },
    pincode: { type: String, trim: true },
    website: { type: String, trim: true },
    officerName: { type: String, trim: true },
    officerDesignation: { type: String, trim: true },
    officerContact: { type: String, trim: true },
    // Small profile logo (data URL, resized client-side). Optional.
    logo: { type: String, default: '' },
    // bcrypt(password + pepper). select:false — never leak hashes.
    passwordHash: { type: String, required: true, select: false },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalSchema.index({ districtId: 1 });

export default (
  mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema)
);
