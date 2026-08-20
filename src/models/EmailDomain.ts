import mongoose, { Schema, Document, Model } from 'mongoose';
import { EmailDomain as EmailDomainInterface, DomainStatus } from '../lib/emailProviders/types';

export interface EmailDomainDocument extends Omit<EmailDomainInterface, 'id'>, Document {
  // _id is inherited from Document
}

const EmailDomainSchema = new Schema<EmailDomainDocument>({
  // id is handled by MongoDB _id
  domainName: { type: String, required: true, unique: true },
  customerId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['active', 'pending_dns', 'provisioning', 'provisioning_failed', 'suspended', 'cancelled'],
    default: 'provisioning'
  },
  provider: { type: String, required: true, default: 'migadu' },
  providerDomainId: { type: String },
  canSend: { type: Boolean, default: false },
  canReceive: { type: Boolean, default: false },
  activatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  dnsRecords: [{
    type: { type: String, enum: ['MX', 'SPF', 'DKIM', 'DMARC', 'TXT', 'CNAME', 'A'] },
    name: { type: String },
    value: { type: String },
    priority: { type: Number },
    ttl: { type: Number },
    status: { type: String, enum: ['correct', 'incorrect', 'pending', 'missing'], default: 'pending' }
  }],
  diagnostics: {
    mx: {
      status: { type: String, enum: ['correct', 'incorrect', 'pending', 'missing'], default: 'pending' },
      message: { type: String }
    },
    spf: {
      status: { type: String, enum: ['correct', 'incorrect', 'pending', 'missing'], default: 'pending' },
      message: { type: String }
    },
    dkim: {
      status: { type: String, enum: ['correct', 'incorrect', 'pending', 'missing'], default: 'pending' },
      message: { type: String }
    },
    dmarc: {
      status: { type: String, enum: ['correct', 'incorrect', 'pending', 'missing'], default: 'pending' },
      message: { type: String }
    },
    overall: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
    checkedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
EmailDomainSchema.index({ domainName: 1 });
EmailDomainSchema.index({ customerId: 1 });
EmailDomainSchema.index({ status: 1 });
EmailDomainSchema.index({ provider: 1 });

// Update the updatedAt timestamp before saving
EmailDomainSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EmailDomain: Model<EmailDomainDocument> = 
  mongoose.models.EmailDomain || mongoose.model<EmailDomainDocument>('EmailDomain', EmailDomainSchema);
