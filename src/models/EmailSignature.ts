import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSignature extends Document {
  email: string;
  signatureHtml: string;
  isEnabled: boolean;
  fullName?: string;
  jobTitle?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSignatureSchema = new Schema<IEmailSignature>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  signatureHtml: { type: String, default: '' },
  isEnabled: { type: Boolean, default: true },
  fullName: { type: String },
  jobTitle: { type: String },
  companyName: { type: String },
  phone: { type: String },
  website: { type: String },
  logoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const EmailSignature = mongoose.models.EmailSignature || 
  mongoose.model<IEmailSignature>('EmailSignature', EmailSignatureSchema);
