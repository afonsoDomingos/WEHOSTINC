import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommission extends Document {
  affiliateId: string;
  userId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  statusHistory: Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }>;
  referredCustomerEmail: string;
  referredCustomerName?: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

const CommissionSchema = new Schema<ICommission>({
  affiliateId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  orderId: { type: String, required: true, unique: true },
  orderAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' },
  statusHistory: [{
    status: String,
    changedAt: String,
    changedBy: String,
    note: String,
  }],
  referredCustomerEmail: { type: String, required: true },
  referredCustomerName: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  approvedAt: String,
  paidAt: String,
}, { timestamps: false, versionKey: false });

const CommissionModel: Model<ICommission> = mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);
export default CommissionModel;
