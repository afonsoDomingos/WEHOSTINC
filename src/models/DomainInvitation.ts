import mongoose, { Schema, Document, Model } from 'mongoose';

export interface DomainInvitationDocument extends Document {
  domainName: string;
  invitedEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdBy: string;
  expiresAt: Date;
  mailboxes: string[];
  acceptedByEmail?: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DomainInvitationSchema = new Schema<DomainInvitationDocument>({
  domainName: { type: String, required: true },
  invitedEmail: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending'
  },
  createdBy: { type: String, default: 'admin@wehosthere.com' },
  expiresAt: { type: Date, required: true },
  mailboxes: [{ type: String }],
  acceptedByEmail: { type: String, lowercase: true, trim: true },
  acceptedAt: { type: Date }
}, {
  timestamps: true
});

DomainInvitationSchema.index({ domainName: 1, status: 1 });

export const DomainInvitation: Model<DomainInvitationDocument> =
  mongoose.models.DomainInvitation || mongoose.model<DomainInvitationDocument>('DomainInvitation', DomainInvitationSchema);
