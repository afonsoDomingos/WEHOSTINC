import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketMessage {
  id: string;
  sender: 'client' | 'admin';
  content: string;
  timestamp: string;
  senderName?: string;
}

export interface ITicket extends Document {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  messages: ITicketMessage[];
  createdAt: string;
  updatedAt: string;
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  id: { type: String, required: true },
  sender: { type: String, enum: ['client', 'admin'], required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  senderName: { type: String },
}, { _id: false });

const TicketSchema = new Schema<ITicket>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true },
  category: { type: String, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'answered', 'closed'], default: 'open' },
  messages: { type: [TicketMessageSchema], default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

const TicketModel: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
export default TicketModel;
