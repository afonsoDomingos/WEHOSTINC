import mongoose, { Schema, Document, Model } from 'mongoose';

export interface InvoiceItem {
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  issuedAt: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  dueDate?: string;
  paidAt?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  paymentSource: 'webhook' | 'manual';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const InvoiceItemSchema = new Schema<InvoiceItem>({
  service: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    id: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String },
    issuedAt: { type: String, required: true },
    servicePeriodStart: { type: String },
    servicePeriodEnd: { type: String },
    dueDate: { type: String },
    paidAt: { type: String },
    status: { 
      type: String, 
      enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
      default: 'draft'
    },
    paymentMethod: { type: String },
    paymentSource: { type: String, enum: ['webhook', 'manual'], default: 'manual' },
    items: { type: [InvoiceItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'MZN' },
    notes: { type: String },
    createdBy: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { timestamps: false, versionKey: false }
);

// Indexes para consultas eficientes
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ customerEmail: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ issuedAt: 1 });
InvoiceSchema.index({ createdAt: -1 });

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
