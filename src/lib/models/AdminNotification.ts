import mongoose from 'mongoose';

const AdminNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user_signup', 'order_new', 'order_updated', 'order_approved', 'order_rejected', 'order_cancelled', 'payment_success', 'payment_failed', 'payment_pending', 'support_ticket', 'system', 'blog_post'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  userName: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices para performance
AdminNotificationSchema.index({ createdAt: -1 });
AdminNotificationSchema.index({ read: 1 });
AdminNotificationSchema.index({ type: 1 });

export default mongoose.models.AdminNotification || mongoose.model('AdminNotification', AdminNotificationSchema);
