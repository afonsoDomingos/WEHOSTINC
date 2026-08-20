import mongoose, { Schema, Document, Model } from 'mongoose';
import { EmailAlias as EmailAliasInterface } from '../lib/emailProviders/types';

export interface EmailAliasDocument extends Omit<EmailAliasInterface, 'id'>, Document {
  // _id is inherited from Document
}

const EmailAliasSchema = new Schema<EmailAliasDocument>({
  // id is handled by MongoDB _id
  domainId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  alias: { type: String, required: true },
  destination: { type: String, required: true },
  provider: { type: String, required: true, default: 'migadu' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
EmailAliasSchema.index({ domainId: 1 });
EmailAliasSchema.index({ customerId: 1 });
EmailAliasSchema.index({ alias: 1 });
EmailAliasSchema.index({ provider: 1 });

// Compound index for domain + alias uniqueness
EmailAliasSchema.index({ domainId: 1, alias: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
EmailAliasSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EmailAlias: Model<EmailAliasDocument> = 
  mongoose.models.EmailAlias || mongoose.model<EmailAliasDocument>('EmailAlias', EmailAliasSchema);
