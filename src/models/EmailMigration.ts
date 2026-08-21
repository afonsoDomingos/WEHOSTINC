import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailMigration extends Document {
  domain: string;
  sourceHost: string;
  sourcePort: number;
  sourceSecure: boolean;
  sourceEmail: string;
  targetEmail: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalFolders: number;
  currentFolder?: string;
  totalMessages: number;
  migratedMessages: number;
  failedMessages: number;
  errorMessage?: string;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailMigrationSchema = new Schema<IEmailMigration>({
  domain: { type: String, required: true, index: true },
  sourceHost: { type: String, required: true },
  sourcePort: { type: Number, default: 993 },
  sourceSecure: { type: Boolean, default: true },
  sourceEmail: { type: String, required: true },
  targetEmail: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'completed', 'failed'], 
    default: 'pending' 
  },
  totalFolders: { type: Number, default: 0 },
  currentFolder: { type: String },
  totalMessages: { type: Number, default: 0 },
  migratedMessages: { type: Number, default: 0 },
  failedMessages: { type: Number, default: 0 },
  errorMessage: { type: String },
  logs: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const EmailMigration = mongoose.models.EmailMigration || 
  mongoose.model<IEmailMigration>('EmailMigration', EmailMigrationSchema);
