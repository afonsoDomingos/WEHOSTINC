import mongoose from 'mongoose';

const SystemForRentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
  setupFee: { type: Number, default: 0 },
  features: [{ type: String }],
  demoUrl: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  developerEmail: { type: String },
  developerName: { type: String },
  rejectionReason: { type: String },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
}, { collection: 'systems_for_rent' });

const SystemForRentModel = mongoose.models.SystemForRent || mongoose.model('SystemForRent', SystemForRentSchema);

export default SystemForRentModel;
