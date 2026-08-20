import mongoose, { Schema, Document, Model } from 'mongoose';
import { EmailMailbox as EmailMailboxInterface, MailboxStatus } from '../lib/emailProviders/types';

export interface EmailMailboxDocument extends Omit<EmailMailboxInterface, 'id'>, Document {
  _id: string;
}

const EmailMailboxSchema = new Schema<EmailMailboxDocument>({
  // id is handled by MongoDB _id
  domainId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  localPart: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  provider: { type: String, required: true, default: 'migadu' },
  providerMailboxId: { type: String },
  maySend: { type: Boolean, default: true },
  mayReceive: { type: Boolean, default: true },
  mayAccessImap: { type: Boolean, default: true },
  mayAccessPop3: { type: Boolean, default: false },
  passwordMethod: { type: String, enum: ['generated', 'invitation'] },
  passwordRecoveryEmail: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  storageUsed: { type: Number, default: 0 },
  storageLimit: { type: Number }
}, {
  timestamps: true
});

// Indexes for better query performance
EmailMailboxSchema.index({ domainId: 1 });
EmailMailboxSchema.index({ customerId: 1 });
EmailMailboxSchema.index({ email: 1 });
EmailMailboxSchema.index({ status: 1 });
EmailMailboxSchema.index({ provider: 1 });

// Compound index for domain + localPart uniqueness
EmailMailboxSchema.index({ domainId: 1, localPart: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
EmailMailboxSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EmailMailbox: Model<EmailMailboxDocument> = 
  mongoose.models.EmailMailbox || mongoose.model<EmailMailboxDocument>('EmailMailbox', EmailMailboxSchema);
