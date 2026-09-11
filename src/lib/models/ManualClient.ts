import mongoose, { Schema, Document } from 'mongoose';

export interface IManualClient extends Document {
  id: string;
  name: string;
  email: string;
  plan: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

const ManualClientSchema = new Schema<IManualClient>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    plan: { type: String, default: 'Personalizado' },
    phone: { type: String },
    address: { type: String },
    createdAt: { type: String, required: true }
  },
  { timestamps: true }
);

// Indexes para consultas eficientes
ManualClientSchema.index({ email: 1 });
ManualClientSchema.index({ plan: 1 });

export default mongoose.models.ManualClient || mongoose.model<IManualClient>('ManualClient', ManualClientSchema);
