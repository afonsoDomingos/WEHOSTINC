import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  amount: number;
  paymentMethod: 'mpesa' | 'emola' | 'card' | 'bank_transfer';
  kivoraPaymentId?: string; // ID do pagamento na Kivora (pay_xxxxx) para reconciliação
  reference?: string; // Referência da transação/checkout (REF_xxxxx)
  proofUrl?: string;
  proofName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'suspended';
  cartRecoverySent?: boolean;
  createdAt: string;
}

const OrderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true, lowercase: true, trim: true },
  clientPhone: { type: String, default: '' },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['mpesa', 'emola', 'card', 'bank_transfer'], default: 'bank_transfer' },
  kivoraPaymentId: { type: String }, // ID do pagamento na Kivora para reconciliação
  reference: { type: String }, // Referência da transação/checkout (REF_xxxxx)
  proofUrl: { type: String },
  proofName: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled', 'suspended'], default: 'pending' },
  cartRecoverySent: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const OrderModel: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default OrderModel;
