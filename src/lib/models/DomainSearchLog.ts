import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDomainSearchLog extends Document {
  id: string;
  domain: string;
  extension: string;
  isAvailable: boolean;
  searchCount: number;
  timestamp: string;
}

const DomainSearchLogSchema = new Schema<IDomainSearchLog>({
  id: { type: String, required: true, unique: true },
  domain: { type: String, required: true, lowercase: true, trim: true },
  extension: { type: String, required: true },
  isAvailable: { type: Boolean, required: true },
  searchCount: { type: Number, default: 1 },
  timestamp: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const DomainSearchLogModel: Model<IDomainSearchLog> = 
  mongoose.models.DomainSearchLog || 
  mongoose.model<IDomainSearchLog>('DomainSearchLog', DomainSearchLogSchema);

export default DomainSearchLogModel;
