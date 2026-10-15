import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  diffSummary?: string;
  executionSeconds?: number;
}

export interface IAiSite extends Document {
  id: string;
  userEmail: string;
  userName?: string;
  title: string;
  slug: string;
  htmlContent: string;
  promptHistory: IPromptMessage[];
  status: 'draft' | 'published';
  customDomain?: string;
  views?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const PromptMessageSchema = new Schema<IPromptMessage>({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  diffSummary: { type: String },
  executionSeconds: { type: Number },
}, { _id: false });

const AiSiteSchema = new Schema<IAiSite>({
  id: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  userName: { type: String },
  title: { type: String, required: true, default: 'Meu Site Incrível' },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  htmlContent: { type: String, required: true },
  promptHistory: { type: [PromptMessageSchema], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  customDomain: { type: String, lowercase: true, trim: true },
  views: { type: Number, default: 0 },
  publishedAt: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const AiSiteModel: Model<IAiSite> = mongoose.models.AiSite || mongoose.model<IAiSite>('AiSite', AiSiteSchema);
export default AiSiteModel;
