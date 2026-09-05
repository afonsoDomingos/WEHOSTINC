import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  paymentId?: string;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  processed: boolean;
  errorMessage?: string;
  failureReason?: string;
  failureCode?: string;
  createdAt: string;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId:       { type: String, required: true },
  eventType:     { type: String, required: true },
  paymentId:     { type: String },
  reference:     { type: String },
  status:        { type: String },
  amount:        { type: Number },
  currency:      { type: String },
  clientName:    { type: String },
  clientEmail:   { type: String },
  serviceName:   { type: String },
  processed:     { type: Boolean, default: false },
  errorMessage:  { type: String },
  failureReason: { type: String },
  failureCode:   { type: String },
  createdAt:     { type: String, default: () => new Date().toISOString() },
}, { timestamps: false, versionKey: false });

WebhookEventSchema.index({ reference: 1 });
WebhookEventSchema.index({ clientEmail: 1 });
WebhookEventSchema.index({ eventType: 1 });
WebhookEventSchema.index({ createdAt: -1 });

const WebhookEventModel: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEventModel;
