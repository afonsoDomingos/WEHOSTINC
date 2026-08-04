import mongoose from 'mongoose';

export interface IPartner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const PartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  logoUrl: { type: String, required: true },
  websiteUrl: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { collection: 'partners' });

const PartnerModel = mongoose.models.Partner || mongoose.model('Partner', PartnerSchema);

export default PartnerModel;
