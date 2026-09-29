import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISiteQuoteLead extends Document {
  projectName: string;
  projectType: string;
  basePrice: number;
  domain?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  channel: 'whatsapp_quote' | 'checkout_started' | 'checkout_completed';
  status: 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';
  ip: string;
  userAgent: string;
  notes?: string;
  followUpSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SiteQuoteLeadSchema = new Schema<ISiteQuoteLead>(
  {
    projectName: { type: String, required: true, index: true },
    projectType: { type: String, required: true, index: true },
    basePrice: { type: Number, required: true },
    domain: { type: String, index: true },
    userName: { type: String },
    userEmail: { type: String, index: true },
    userPhone: { type: String },
    channel: {
      type: String,
      enum: ['whatsapp_quote', 'checkout_started', 'checkout_completed'],
      default: 'whatsapp_quote',
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'negotiating', 'closed', 'lost'],
      default: 'new',
      index: true,
    },
    ip: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    notes: { type: String },
    followUpSentAt: { type: Date },
  },
  { timestamps: true }
);

SiteQuoteLeadSchema.index({ createdAt: -1 });
SiteQuoteLeadSchema.index({ basePrice: -1 });

export const SiteQuoteLead: Model<ISiteQuoteLead> =
  mongoose.models.SiteQuoteLead ||
  mongoose.model<ISiteQuoteLead>('SiteQuoteLead', SiteQuoteLeadSchema);
