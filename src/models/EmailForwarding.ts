import mongoose, { Schema, Document, Model } from 'mongoose';
import { EmailForwarding as EmailForwardingInterface } from '../lib/emailProviders/types';

export interface EmailForwardingDocument extends Omit<EmailForwardingInterface, 'id'>, Document {
  _id: string;
}

const EmailForwardingSchema = new Schema<EmailForwardingDocument>({
  // id is handled by MongoDB _id
  domainId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  localPart: { type: String, required: true },
  destination: { type: String, required: true },
  provider: { type: String, required: true, default: 'migadu' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
EmailForwardingSchema.index({ domainId: 1 });
EmailForwardingSchema.index({ customerId: 1 });
EmailForwardingSchema.index({ localPart: 1 });
EmailForwardingSchema.index({ provider: 1 });

// Compound index for domain + localPart uniqueness
EmailForwardingSchema.index({ domainId: 1, localPart: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
EmailForwardingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EmailForwarding: Model<EmailForwardingDocument> = 
  mongoose.models.EmailForwarding || mongoose.model<EmailForwardingDocument>('EmailForwarding', EmailForwardingSchema);
