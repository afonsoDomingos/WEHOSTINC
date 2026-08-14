import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemAccess extends Document {
  id: string;
  systemId: string;
  systemName: string;
  clientEmail: string;
  clientName: string;
  credentials: {
    username?: string;
    password?: string;
    url?: string;
    apiKey?: string;
    notes?: string;
  };
  status: string;
  startDate: string;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

const SystemAccessSchema = new Schema<ISystemAccess>(
  {
    id: { type: String, required: true, unique: true, index: true },
    systemId: { type: String, required: true },
    systemName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientName: { type: String, required: true },
    credentials: {
      username: { type: String },
      password: { type: String },
      url: { type: String },
      apiKey: { type: String },
      notes: { type: String },
    },
    status: { type: String, default: 'active' },
    startDate: { type: String, required: true },
    expiresAt: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.SystemAccess || mongoose.model<ISystemAccess>('SystemAccess', SystemAccessSchema);
