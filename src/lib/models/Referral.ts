import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferral extends Document {
  referrerEmail: string;
  referrerName: string;
  referralCode: string;
  referredEmail?: string;
  referredName?: string;
  status: 'active' | 'inactive';
  totalReferrals: number;
  totalCommissions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema: Schema = new Schema({
  referrerEmail: { type: String, required: true, unique: true },
  referrerName: { type: String, required: true },
  referralCode: { type: String, required: true, unique: true },
  referredEmail: { type: String },
  referredName: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  totalReferrals: { type: Number, default: 0 },
  totalCommissions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ referrerEmail: 1 });

const ReferralModel: Model<IReferral> = mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);

export default ReferralModel;
