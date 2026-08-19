import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesNotification extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  orderNumber: string;
  type: 'new_sale' | 'subscription_renewal' | 'upgrade' | 'refund' | 'payment_failed';
  status: 'unread' | 'read' | 'archived';
  title: string;
  message: string;
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata: {
    customerName?: string;
    customerEmail?: string;
    paymentMethod?: string;
    planName?: string;
    renewalDate?: Date;
    failureReason?: string;
  };
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  sentAt: {
    email?: Date;
    push?: Date;
    sms?: Date;
  };
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalesNotificationSchema = new Schema<ISalesNotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: String, required: true, index: true },
  orderNumber: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['new_sale', 'subscription_renewal', 'upgrade', 'refund', 'payment_failed'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'MZN' },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  metadata: {
    customerName: String,
    customerEmail: String,
    paymentMethod: String,
    planName: String,
    renewalDate: Date,
    failureReason: String
  },
  channels: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  sentAt: {
    email: Date,
    push: Date,
    sms: Date
  },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Índices compostos para buscas eficientes
SalesNotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
SalesNotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.SalesNotification || mongoose.model<ISalesNotification>('SalesNotification', SalesNotificationSchema);
