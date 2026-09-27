import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['DistrictAdmin', 'SuperAdmin'] },
    designation: { type: String, trim: true },
    // DistrictAdmin district — indha district request mattum dhaan indha admin-ku theriyum.
    // Empty-na all districts (SuperAdmin madhiri).
    districtId: { type: String, trim: true, lowercase: true, default: '' },
    pinHash: { type: String, required: true },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
