import mongoose, { Schema, Model } from 'mongoose';

export interface IModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objective: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const ModuleSchema = new Schema<IModule>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  objective: { type: String, required: true },
  order: { type: Number, required: true },
  active: { type: Boolean, required: true, default: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, {
  timestamps: true
});

// Índice composto para courseId + order
ModuleSchema.index({ courseId: 1, order: 1 });

export const ModuleModel: Model<IModule> = 
  mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
