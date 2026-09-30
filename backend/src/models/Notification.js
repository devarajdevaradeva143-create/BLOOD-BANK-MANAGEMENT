import mongoose from 'mongoose';

// Multi-audience notifications: district admins (audience 'district' + districtId),
// donors (audience 'donor' + recipientId = Donor._id), hospitals (audience
// 'hospital' + recipientId = Hospital._id). Domain events auto-create docs via
// services/notifications.service.js (best-effort — failures never break requests).
const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true, trim: true },
    audience: {
      type: String,
      enum: ['district', 'donor', 'hospital'],
      default: 'district',
      index: true,
    },
    recipientId: { type: String, default: '', trim: true, index: true },
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
notificationSchema.index({ audience: 1, recipientId: 1, read: 1, createdAt: -1 });

export default (
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
);
