import mongoose, { Schema, Model } from 'mongoose';

export interface ICourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentModuleId?: string;
  currentLessonId?: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

const CourseProgressSchema = new Schema<ICourseProgress>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  completedLessons: { type: [String], default: [] },
  currentModuleId: { type: String },
  currentLessonId: { type: String },
  completedAt: { type: String },
  lastAccessedAt: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true
});

// Índice composto para userId + courseId
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseProgress: Model<ICourseProgress> = 
  mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
