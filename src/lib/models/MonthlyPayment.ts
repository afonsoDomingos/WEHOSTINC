import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyPayment extends Document {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  year: number;
  month: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  installments?: {
    total: number;
    paid: number;
    installmentAmount: number;
  };
  isManualClient?: boolean;
  source?: 'webhook' | 'manual';
  createdAt: string;
}

const MonthlyPaymentSchema = new Schema<IMonthlyPayment>(
  {
    id: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, required: true, default: 0 },
    status: { 
      type: String, 
      enum: ['paid', 'partial', 'pending', 'overdue'],
      default: 'pending'
    },
    paymentDate: { type: String },
    paymentMethod: { type: String },
    notes: { type: String },
    installments: {
      total: { type: Number },
      paid: { type: Number },
      installmentAmount: { type: Number }
    },
    isManualClient: { type: Boolean, default: false },
    source: { type: String, enum: ['webhook', 'manual'], default: 'manual' },
    createdAt: { type: String, required: true }
  },
  { timestamps: true }
);

// Indexes para consultas eficientes
MonthlyPaymentSchema.index({ clientId: 1, year: 1, month: 1 });
MonthlyPaymentSchema.index({ year: 1, month: 1 });
MonthlyPaymentSchema.index({ status: 1 });

export default mongoose.models.MonthlyPayment || mongoose.model<IMonthlyPayment>('MonthlyPayment', MonthlyPaymentSchema);
