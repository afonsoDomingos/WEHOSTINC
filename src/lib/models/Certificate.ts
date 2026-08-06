import mongoose, { Schema, Model } from 'mongoose';

export interface ICertificate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
  verificationUrl: string;
  createdAt: string;
}

const CertificateSchema = new Schema<ICertificate>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  courseId: { type: String, required: true, index: true },
  courseTitle: { type: String, required: true },
  completionDate: { type: String, required: true },
  certificateNumber: { type: String, required: true, unique: true },
  verificationUrl: { type: String, required: true },
  createdAt: { type: String, required: true }
}, {
  timestamps: true
});

// Índice composto para userId + courseId
CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate: Model<ICertificate> = 
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
