import mongoose, { Schema, Document } from 'mongoose';

export interface IRentalRequest extends Document {
  id: string;
  systemId: string;
  systemName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  billingCycle: string;
  amount: number;
  paymentMethod: string;
  proofUrl?: string;
  proofName?: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

const RentalRequestSchema = new Schema<IRentalRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    systemId: { type: String, required: true },
    systemName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    billingCycle: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    proofUrl: { type: String },
    proofName: { type: String },
    status: { type: String, default: 'pending' },
    createdAt: { type: String, required: true },
    approvedAt: { type: String },
    rejectedAt: { type: String },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.RentalRequest || mongoose.model<IRentalRequest>('RentalRequest', RentalRequestSchema);
