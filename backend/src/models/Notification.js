import mongoose from 'mongoose';

// District-scoped notifications for DistrictAdmin/SuperAdmin dashboards.
// Auto-creation from domain events is OUT OF SCOPE — this is just the
// model + list/read APIs with empty-friendly behavior.
const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true, trim: true },
    districtId: { type: String, trim: true, lowercase: true, default: '', index: true },
    type: {
      type: String,
      required: true,
      enum: ['request', 'donation', 'stock', 'testing', 'expiry', 'message', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ districtId: 1, read: 1, createdAt: -1 });

export default (
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
);
