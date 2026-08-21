import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailAlias extends Document {
  domain: string;
  alias: string;
  destination: string;
  type: 'alias' | 'forwarding';
  status: 'active' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

const EmailAliasSchema = new Schema<IEmailAlias>({
  domain: { type: String, required: true, index: true },
  alias: { type: String, required: true },
  destination: { type: String, required: true },
  type: { type: String, enum: ['alias', 'forwarding'], default: 'alias' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index
EmailAliasSchema.index({ domain: 1, alias: 1, destination: 1 }, { unique: true });

export const EmailAlias = mongoose.models.EmailAlias || 
  mongoose.model<IEmailAlias>('EmailAlias', EmailAliasSchema);
