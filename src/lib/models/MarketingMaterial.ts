import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarketingMaterial extends Document {
  title: string;
  description: string;
  type: 'banner' | 'social_media' | 'email_template' | 'landing_page' | 'video' | 'text_ad';
  content: string;
  imageUrl?: string;
  imageUrlDark?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'email' | 'website' | 'whatsapp';
  category: string;
  isActive: boolean;
  language: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const MarketingMaterialSchema = new Schema<IMarketingMaterial>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['banner', 'social_media', 'email_template', 'landing_page', 'video', 'text_ad'], required: true },
  content: { type: String, required: true },
  imageUrl: String,
  imageUrlDark: String,
  dimensions: {
    width: Number,
    height: Number,
  },
  platform: { type: String, enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'email', 'website', 'whatsapp'] },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  language: { type: String, default: 'pt' },
  createdBy: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const MarketingMaterialModel: Model<IMarketingMaterial> = mongoose.models.MarketingMaterial || mongoose.model<IMarketingMaterial>('MarketingMaterial', MarketingMaterialSchema);
export default MarketingMaterialModel;
