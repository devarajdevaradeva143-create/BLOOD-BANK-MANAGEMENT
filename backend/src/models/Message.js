import mongoose from 'mongoose';

// District Admin -> SuperAdmin messages.
// fromRole: DistrictAdmin (SuperAdmin replies stay on same doc via reply field).
const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, trim: true },
    fromId: { type: String, trim: true },
    fromName: { type: String, trim: true },
    fromRole: { type: String, required: true, enum: ['DistrictAdmin', 'SuperAdmin'] },
    fromDistrictId: { type: String, trim: true, lowercase: true, default: '' },
    toRole: { type: String, required: true, default: 'SuperAdmin' },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    reply: { type: String, trim: true, default: '' },
    repliedBy: { type: String, trim: true, default: '' },
    repliedAt: { type: Date },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
    },
  },
  { timestamps: true }
);

messageSchema.index({ fromDistrictId: 1, status: 1, createdAt: -1 });
messageSchema.index({ fromId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
