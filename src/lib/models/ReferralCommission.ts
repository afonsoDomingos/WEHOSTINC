import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferralCommission extends Document {
  referrerEmail: string;
  referrerName: string;
  referredEmail: string;
  referredName: string;
  systemId?: string;
  systemName?: string;
  amount: number;
  percentage: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: Date;
  createdAt: Date;
}

const ReferralCommissionSchema: Schema = new Schema({
  referrerEmail: { type: String, required: true },
  referrerName: { type: String, required: true },
  referredEmail: { type: String, required: true },
  referredName: { type: String, required: true },
  systemId: { type: String },
  systemName: { type: String },
  amount: { type: Number, required: true },
  percentage: { type: Number, required: true, default: 30 },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
  paymentDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

ReferralCommissionSchema.index({ referrerEmail: 1 });
ReferralCommissionSchema.index({ referredEmail: 1 });
ReferralCommissionSchema.index({ status: 1 });

const ReferralCommissionModel: Model<IReferralCommission> = mongoose.models.ReferralCommission || mongoose.model<IReferralCommission>('ReferralCommission', ReferralCommissionSchema);

export default ReferralCommissionModel;
