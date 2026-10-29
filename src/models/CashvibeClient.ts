import mongoose, { Schema, Document } from 'mongoose';

export interface ICashvibeClient extends Document {
  id: string;
  name: string;
  documentType: 'BI' | 'Passaporte' | 'DIRE' | 'NUIT';
  documentNumber: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address: {
    province: string;
    city: string;
    neighborhood: string;
    street?: string;
  };
  occupation: string;
  workplace?: string;
  monthlyIncome: number;
  guarantor?: {
    name: string;
    phone: string;
    relationship: string;
    documentNumber?: string;
  };
  collateralDescription?: string;
  biPhotoUrl?: string;
  collateralPhotoUrl?: string;
  status: 'active' | 'blacklisted' | 'inactive';
  rating: 'A' | 'B' | 'C' | 'D';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CashvibeClientSchema = new Schema<ICashvibeClient>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    documentType: { 
      type: String, 
      enum: ['BI', 'Passaporte', 'DIRE', 'NUIT'], 
      default: 'BI' 
    },
    documentNumber: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    secondaryPhone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      province: { type: String, default: 'Maputo' },
      city: { type: String, default: 'Maputo' },
      neighborhood: { type: String, default: '' },
      street: { type: String, default: '' },
    },
    occupation: { type: String, default: '' },
    workplace: { type: String, default: '' },
    monthlyIncome: { type: Number, default: 0 },
    guarantor: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
      documentNumber: { type: String, default: '' },
    },
    collateralDescription: { type: String, default: '' },
    biPhotoUrl: { type: String, default: '' },
    collateralPhotoUrl: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['active', 'blacklisted', 'inactive'], 
      default: 'active' 
    },
    rating: { 
      type: String, 
      enum: ['A', 'B', 'C', 'D'], 
      default: 'A' 
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CashvibeClientSchema.index({ phone: 1 });
CashvibeClientSchema.index({ documentNumber: 1 });
CashvibeClientSchema.index({ name: 'text' });

export default mongoose.models.CashvibeClient || mongoose.model<ICashvibeClient>('CashvibeClient', CashvibeClientSchema);
