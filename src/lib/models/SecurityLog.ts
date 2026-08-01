import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISecurityLog extends Document {
  id: string;
  email: string;
  type: 'failed_login' | 'account_locked' | 'suspended_attempt';
  message: string;
  ipAddress?: string;
  country?: string;
  createdAt: string;
}

const SecurityLogSchema = new Schema<ISecurityLog>({
  id: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  country: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const SecurityLogModel: Model<ISecurityLog> = mongoose.models.SecurityLog || mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
export default SecurityLogModel;
