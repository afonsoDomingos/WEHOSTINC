import mongoose, { Schema, Document } from 'mongoose';

export interface ICashvibePayment extends Document {
  id: string; // ex: REC-CV-2026-0001
  loanId: string;
  clientId: string;
  clientName: string;
  installmentNumber?: number;
  amount: number; // Valor amortizado nesta transação
  principalPaid: number;
  interestPaid: number;
  lateFeePaid: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'mpesa' | 'emola' | 'bank_transfer' | 'cash';
  transactionReference?: string; // Código M-Pesa / Talão
  receiptNumber: string;
  receivedBy: string; // Operador / Administrador
  notes?: string;
  createdAt: Date;
}

const CashvibePaymentSchema = new Schema<ICashvibePayment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    loanId: { type: String, required: true, index: true },
    clientId: { type: String, required: true, index: true },
    clientName: { type: String, required: true },
    installmentNumber: { type: Number },
    amount: { type: Number, required: true },
    principalPaid: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    lateFeePaid: { type: Number, default: 0 },
    paymentDate: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'emola', 'bank_transfer', 'cash'],
      default: 'mpesa',
    },
    transactionReference: { type: String, default: '' },
    receiptNumber: { type: String, required: true, unique: true },
    receivedBy: { type: String, default: 'Admin' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CashvibePaymentSchema.index({ loanId: 1, paymentDate: -1 });

export default mongoose.models.CashvibePayment || mongoose.model<ICashvibePayment>('CashvibePayment', CashvibePaymentSchema);
