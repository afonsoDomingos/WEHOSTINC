import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevistaDownload extends Document {
  ip?: string;
  userAgent?: string;
  referrer?: string;
  edition?: string;
  downloadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RevistaDownloadSchema = new Schema<IRevistaDownload>(
  {
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    referrer: { type: String, trim: true },
    edition: { type: String, default: 'Edição 01' },
    downloadedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

RevistaDownloadSchema.index({ downloadedAt: -1 });

const RevistaDownload: Model<IRevistaDownload> =
  mongoose.models.RevistaDownload ||
  mongoose.model<IRevistaDownload>('RevistaDownload', RevistaDownloadSchema);

export default RevistaDownload;
