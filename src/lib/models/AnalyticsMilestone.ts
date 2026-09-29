import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsMilestone extends Document {
  key: 'page_views' | 'unique_visitors';
  lastMilestone: number;
  step: number;
  lastNotifiedAt: Date;
  history: Array<{
    milestone: number;
    reachedAt: Date;
    notifiedTo: string;
  }>;
}

const AnalyticsMilestoneSchema = new Schema<IAnalyticsMilestone>({
  key: { type: String, required: true, unique: true },
  lastMilestone: { type: Number, required: true },
  step: { type: Number, required: true },
  lastNotifiedAt: { type: Date, default: Date.now },
  history: [{
    milestone: { type: Number },
    reachedAt: { type: Date, default: Date.now },
    notifiedTo: { type: String }
  }]
}, { timestamps: true });

const AnalyticsMilestoneModel: Model<IAnalyticsMilestone> =
  mongoose.models.AnalyticsMilestone ||
  mongoose.model<IAnalyticsMilestone>('AnalyticsMilestone', AnalyticsMilestoneSchema);

export default AnalyticsMilestoneModel;
