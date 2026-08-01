import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  plan: 'none' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  role: 'admin' | 'user';
  dueDate?: number;
  avatar?: string;
  createdAt: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  plan: { type: String, enum: ['none', 'basic', 'pro', 'enterprise'], default: 'none' },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  dueDate: { type: Number, default: 29 },
  avatar: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
