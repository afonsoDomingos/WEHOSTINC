import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsVisit extends Document {
  id: string;
  page: string;
  ip: string;
  userAgent: string;
  country: string;
  referrer: string;
  userEmail?: string;
  sessionId: string;
  timestamp: string;
}

const AnalyticsVisitSchema = new Schema<IAnalyticsVisit>({
  id: { type: String, required: true, unique: true },
  page: { type: String, required: true },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: '' },
  country: { type: String, default: 'MZ' },
  referrer: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  sessionId: { type: String, default: '' },
  timestamp: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

// Index para queries rápidas
AnalyticsVisitSchema.index({ timestamp: -1 });
AnalyticsVisitSchema.index({ page: 1 });
AnalyticsVisitSchema.index({ sessionId: 1 });

const AnalyticsVisitModel: Model<IAnalyticsVisit> =
  mongoose.models.AnalyticsVisit ||
  mongoose.model<IAnalyticsVisit>('AnalyticsVisit', AnalyticsVisitSchema);

export default AnalyticsVisitModel;
