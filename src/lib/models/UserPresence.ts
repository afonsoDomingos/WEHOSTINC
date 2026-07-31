import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPresence extends Document {
  userEmail: string;
  userName: string;
  lastSeen: string;
  currentPage: string;
  sessionId: string;
  isOnline: boolean;
}

const UserPresenceSchema = new Schema<IUserPresence>({
  userEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  userName: { type: String, default: '' },
  lastSeen: { type: String, default: () => new Date().toISOString() },
  currentPage: { type: String, default: '/' },
  sessionId: { type: String, default: '' },
  isOnline: { type: Boolean, default: true },
}, { timestamps: false, versionKey: false });

UserPresenceSchema.index({ lastSeen: -1 });

const UserPresenceModel: Model<IUserPresence> =
  mongoose.models.UserPresence ||
  mongoose.model<IUserPresence>('UserPresence', UserPresenceSchema);

export default UserPresenceModel;
