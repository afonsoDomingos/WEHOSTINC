import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuditLog as AuditLogInterface } from '../lib/emailProviders/types';

export interface EmailAuditLogDocument extends Omit<AuditLogInterface, 'id'>, Document {
  // _id is inherited from Document
}

const EmailAuditLogSchema = new Schema<EmailAuditLogDocument>({
  // id is handled by MongoDB _id
  customerId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  resourceType: { 
    type: String, 
    enum: ['domain', 'mailbox', 'alias', 'forwarding', 'identity'],
    required: true 
  },
  resourceId: { type: String, required: true },
  provider: { type: String, required: true, default: 'migadu' },
  status: { type: String, enum: ['success', 'failed'], required: true },
  details: { type: Schema.Types.Mixed },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
EmailAuditLogSchema.index({ customerId: 1 });
EmailAuditLogSchema.index({ resourceType: 1 });
EmailAuditLogSchema.index({ resourceId: 1 });
EmailAuditLogSchema.index({ status: 1 });
EmailAuditLogSchema.index({ createdAt: 1 });
EmailAuditLogSchema.index({ provider: 1 });

// Compound index for efficient queries
EmailAuditLogSchema.index({ customerId: 1, resourceType: 1, createdAt: -1 });
EmailAuditLogSchema.index({ resourceId: 1, createdAt: -1 });

// Update the createdAt timestamp before saving
EmailAuditLogSchema.pre('save', function(next) {
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

export const EmailAuditLog: Model<EmailAuditLogDocument> = 
  mongoose.models.EmailAuditLog || mongoose.model<EmailAuditLogDocument>('EmailAuditLog', EmailAuditLogSchema);
