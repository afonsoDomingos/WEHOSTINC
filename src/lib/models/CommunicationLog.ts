import mongoose from 'mongoose';

const CommunicationLogSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  templateId: {
    type: String,
    default: null
  },
  templateName: {
    type: String,
    default: null
  },
  channel: {
    type: String,
    enum: ['email', 'whatsapp', 'sms'],
    default: 'email'
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending', 'retrying'],
    default: 'pending'
  },
  isAutomatic: {
    type: Boolean,
    default: false
  },
  eventType: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  error: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  nextRetryAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices para performance
CommunicationLogSchema.index({ recipientEmail: 1 });
CommunicationLogSchema.index({ status: 1 });
CommunicationLogSchema.index({ sentAt: -1 });
CommunicationLogSchema.index({ nextRetryAt: 1 });
CommunicationLogSchema.index({ eventType: 1 });

export default mongoose.models.CommunicationLog || mongoose.model('CommunicationLog', CommunicationLogSchema);
