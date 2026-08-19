import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  serviceId?: string;
  serviceName: string;
  serviceType: 'hosting' | 'domain' | 'email' | 'ssl' | 'other';
  price: number;
  quantity: number;
}

export interface IAbandonedCart extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  items: ICartItem[];
  totalAmount: number;
  currency: string;
  status: 'active' | 'recovered' | 'expired';
  lastActivity: Date;
  recoveryEmailsSent: number;
  lastRecoveryEmailSent?: Date;
  recoveryAttempts: number;
  recoveredAt?: Date;
  recoveredOrderId?: string;
  metadata?: {
    source: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  serviceId: { type: String },
  serviceName: { type: String, required: true },
  serviceType: { 
    type: String, 
    enum: ['hosting', 'domain', 'email', 'ssl', 'other'],
    required: true 
  },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 }
});

const AbandonedCartSchema = new Schema<IAbandonedCart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: [CartItemSchema],
    totalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'MZN' },
    status: { 
      type: String, 
      enum: ['active', 'recovered', 'expired'],
      default: 'active'
    },
    lastActivity: { type: Date, default: Date.now },
    recoveryEmailsSent: { type: Number, default: 0 },
    lastRecoveryEmailSent: { type: Date },
    recoveryAttempts: { type: Number, default: 0 },
    recoveredAt: { type: Date },
    recoveredOrderId: { type: String },
    metadata: {
      source: { type: String },
      utmSource: { type: String },
      utmMedium: { type: String },
      utmCampaign: { type: String },
      referrer: { type: String }
    }
  },
  {
    timestamps: true
  }
);

// Índice para busca rápida por usuário
AbandonedCartSchema.index({ userId: 1 });

// Índice para busca por status
AbandonedCartSchema.index({ status: 1 });

// Índice para última atividade (para identificar carrinhos abandonados)
AbandonedCartSchema.index({ lastActivity: 1 });

// Índice composto para carrinhos ativos antigos
AbandonedCartSchema.index({ status: 1, lastActivity: 1 });

export default mongoose.models.AbandonedCart || mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema);
