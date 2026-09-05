import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedback extends Document {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  type: 'platform' | 'service' | 'course' | 'support' | 'suggestion' | 'bug' | 'general';
  rating: number; // 1 a 5
  category: string;
  comment: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

const FeedbackSchema = new Schema<IFeedback>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  type: {
    type: String,
    enum: ['platform', 'service', 'course', 'support', 'suggestion', 'bug', 'general'],
    default: 'general'
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, default: 'suggestion' },
  comment: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

const FeedbackModel: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default FeedbackModel;
