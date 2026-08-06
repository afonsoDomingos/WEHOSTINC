import mongoose, { Schema, Model } from 'mongoose';

export interface ICourse {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  outcome: string;
  thumbnail?: string;
  accessType: 'free' | 'paid' | 'preview';
  price?: number;
  currency?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const CourseSchema = new Schema<ICourse>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  duration: { type: String, required: true },
  outcome: { type: String, required: true },
  thumbnail: { type: String },
  accessType: { type: String, required: true, enum: ['free', 'paid', 'preview'] },
  price: { type: Number },
  currency: { type: String, default: 'MZN' },
  order: { type: Number, required: true },
  active: { type: Boolean, required: true, default: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true
});

export const CourseModel: Model<ICourse> = 
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
