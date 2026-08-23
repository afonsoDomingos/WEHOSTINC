import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliateClick extends Document {
  affiliateId: string;
  affiliateCode: string;
  clickedAt: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  convertedToSale: boolean;
  conversionOrderId?: string;
  conversionDate?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const AffiliateClickSchema = new Schema<IAffiliateClick>({
  affiliateId: { type: String, required: true, index: true },
  affiliateCode: { type: String, required: true },
  clickedAt: { type: String, required: true, index: true },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  convertedToSale: { type: Boolean, default: false },
  conversionOrderId: String,
  conversionDate: String,
  landingPage: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
}, { timestamps: false, versionKey: false });

// Create index for efficient queries
AffiliateClickSchema.index({ affiliateId: 1, clickedAt: -1 });
AffiliateClickSchema.index({ affiliateCode: 1, clickedAt: -1 });

const AffiliateClickModel: Model<IAffiliateClick> = mongoose.models.AffiliateClick || mongoose.model<IAffiliateClick>('AffiliateClick', AffiliateClickSchema);
export default AffiliateClickModel;
