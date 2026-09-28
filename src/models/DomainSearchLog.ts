import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDomainSearchLog extends Document {
  domain: string;           // full domain e.g. "minhavida.co.mz"
  sld: string;              // second-level domain e.g. "minhavida"
  extension: string;        // e.g. ".co.mz"
  isAvailable: boolean;
  searchCount: number;      // how many times this exact domain was searched
  ip: string;               // visitor IP
  userAgent: string;        // visitor browser / device
  userId?: string;          // if the visitor was logged in
  userEmail?: string;       // if the visitor was logged in or entered in checkout
  userName?: string;        // customer name from checkout
  userPhone?: string;       // customer phone / M-Pesa from checkout
  hasCheckoutAttempt?: boolean; // if customer proceeded to checkout with this domain
  checkoutStatus?: 'pending' | 'completed' | 'failed' | 'abandoned' | 'bank_transfer_pending';
  checkoutOrderId?: string;
  firstSearchedAt: Date;
  lastSearchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DomainSearchLogSchema = new Schema<IDomainSearchLog>(
  {
    domain: { type: String, required: true, index: true },
    sld: { type: String, required: true },
    extension: { type: String, required: true },
    isAvailable: { type: Boolean, required: true },
    searchCount: { type: Number, default: 1 },
    ip: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    userId: { type: String, index: true },
    userEmail: { type: String, index: true },
    userName: { type: String },
    userPhone: { type: String },
    hasCheckoutAttempt: { type: Boolean, default: false, index: true },
    checkoutStatus: { type: String, enum: ['pending', 'completed', 'failed', 'abandoned', 'bank_transfer_pending'] },
    checkoutOrderId: { type: String },
    firstSearchedAt: { type: Date, default: Date.now },
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for admin queries
DomainSearchLogSchema.index({ lastSearchedAt: -1 });
DomainSearchLogSchema.index({ isAvailable: 1 });
DomainSearchLogSchema.index({ searchCount: -1 });
DomainSearchLogSchema.index({ extension: 1 });

export const DomainSearchLog: Model<IDomainSearchLog> =
  mongoose.models.DomainSearchLog ||
  mongoose.model<IDomainSearchLog>('DomainSearchLog', DomainSearchLogSchema);
