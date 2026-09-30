import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  userEmail?: string;
  userName?: string;
  role: 'super_admin' | 'admin' | 'user';
  isAdmin: boolean;
  userAgent?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  createdAt: Date;
  lastActiveAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userId: { type: String, index: true },
  userEmail: { type: String, index: true, lowercase: true, trim: true },
  userName: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'user'], default: 'user', index: true },
  isAdmin: { type: Boolean, default: false, index: true },
  userAgent: { type: String },
  deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'], default: 'mobile' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

const PushSubscriptionModel: Model<IPushSubscription> = 
  mongoose.models.PushSubscription || 
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscriptionModel;
