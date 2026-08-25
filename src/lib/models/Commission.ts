import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommission extends Document {
  affiliateId: string;
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
  referredCustomerId?: string; // ID do cliente que fez a compra (para rastreamento)
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  validatedAt?: string; // Timestamp da última validação de consistência
  isConsistent?: boolean; // Flag para indicar se os dados são consistentes
}

const CommissionSchema = new Schema<ICommission>({
  affiliateId: { type: String, required: true, index: true },
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
  referredCustomerId: String, // Adicionado para melhor rastreamento
  createdAt: { type: String, default: () => new Date().toISOString() },
  approvedAt: String,
  paidAt: String,
  validatedAt: String,
  isConsistent: { type: Boolean, default: true },
}, { timestamps: false, versionKey: false });

// Adicionar índices compostos para melhor performance
CommissionSchema.index({ affiliateId: 1, status: 1 });
CommissionSchema.index({ orderId: 1 }, { unique: true });
CommissionSchema.index({ createdAt: -1 });

const CommissionModel: Model<ICommission> = mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);
export default CommissionModel;
