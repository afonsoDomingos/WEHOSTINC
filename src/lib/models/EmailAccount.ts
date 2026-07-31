import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailAccount extends Document {
  id: string;
  email: string;
  domain?: string;
  status: 'active' | 'pending' | 'suspended';
  quotaGB?: number;
  usedGB?: number;
  storage?: number;
  userEmail?: string;
  createdAt?: string;
}

const EmailAccountSchema = new Schema<IEmailAccount>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  domain: { type: String, lowercase: true, trim: true },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'pending' },
  quotaGB: { type: Number, default: 5 },
  usedGB: { type: Number, default: 0 },
  storage: { type: Number, default: 5 },
  userEmail: { type: String, lowercase: true, trim: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const EmailAccountModel: Model<IEmailAccount> = mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);
export default EmailAccountModel;
