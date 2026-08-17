import mongoose from 'mongoose';

const NewsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  source: {
    type: String,
    enum: ['footer', 'registration', 'admin'],
    default: 'footer'
  }
}, {
  timestamps: true
});

// Índices para performance
NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ status: 1 });
NewsletterSchema.index({ subscribedAt: -1 });

export default mongoose.models.Newsletter || mongoose.model('Newsletter', NewsletterSchema);
