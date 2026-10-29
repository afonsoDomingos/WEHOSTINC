import mongoose, { Schema, Document } from 'mongoose';

export interface IInstallment {
  number: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAt?: string;
}

export interface ICashvibeLoan extends Document {
  id: string; // ex: CV-2026-0001
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientDocumentNumber?: string;
  principalAmount: number; // Capital concedido
  interestRate: number; // Taxa % (ex: 20%)
  interestAmount: number; // Valor do juro em MZN
  totalAmount: number; // Capital + Juros
  totalPaid: number; // Total pago até ao momento
  totalRemaining: number; // Saldo residual devedor
  durationValue: number; // Duração (ex: 30)
  durationUnit: 'days' | 'weeks' | 'months';
  installmentsCount: number;
  disbursementDate: string; // YYYY-MM-DD
  firstDueDate: string; // YYYY-MM-DD
  finalDueDate: string; // YYYY-MM-DD
  lateFeeDaily: number; // Taxa de mora diária em MZN
  status: 'pending' | 'approved' | 'active' | 'paid' | 'overdue' | 'defaulted' | 'cancelled';
  purpose?: string;
  collateral?: string;
  contractSigned: boolean;
  installments: IInstallment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new Schema<IInstallment>(
  {
    number: { type: Number, required: true },
    dueDate: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
    paidAt: { type: String },
  },
  { _id: false }
);

const CashvibeLoanSchema = new Schema<ICashvibeLoan>(
  {
    id: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    clientDocumentNumber: { type: String, default: '' },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    interestAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    totalRemaining: { type: Number, required: true },
    durationValue: { type: Number, required: true, default: 1 },
    durationUnit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'months',
    },
    installmentsCount: { type: Number, required: true, default: 1 },
    disbursementDate: { type: String, required: true },
    firstDueDate: { type: String, required: true },
    finalDueDate: { type: String, required: true },
    lateFeeDaily: { type: Number, default: 50 }, // Ex: 50 MT/dia de atraso
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'paid', 'overdue', 'defaulted', 'cancelled'],
      default: 'active',
      index: true,
    },
    purpose: { type: String, default: 'Capital de Giro / Negócio' },
    collateral: { type: String, default: '' },
    contractSigned: { type: Boolean, default: true },
    installments: [InstallmentSchema],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CashvibeLoanSchema.index({ status: 1 });
CashvibeLoanSchema.index({ finalDueDate: 1 });

export default mongoose.models.CashvibeLoan || mongoose.model<ICashvibeLoan>('CashvibeLoan', CashvibeLoanSchema);
