import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISite extends Document {
  id: string;
  name?: string;
  domain: string;
  status: 'active' | 'pending' | 'suspended';
  plan?: string;
  userEmail?: string;
  ssl?: boolean;
  phpVersion?: string;
  storageUsed?: number;
  storage?: number;
  bandwidth?: number;
  createdAt?: string;
}

const SiteSchema = new Schema<ISite>({
  id: { type: String, required: true, unique: true },
  name: { type: String },
  domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'pending' },
  plan: { type: String },
  userEmail: { type: String, lowercase: true, trim: true },
  ssl: { type: Boolean, default: false },
  phpVersion: { type: String },
  storageUsed: { type: Number, default: 0 },
  storage: { type: Number, default: 10 },
  bandwidth: { type: Number, default: 100 },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const SiteModel: Model<ISite> = mongoose.models.Site || mongoose.model<ISite>('Site', SiteSchema);
export default SiteModel;
