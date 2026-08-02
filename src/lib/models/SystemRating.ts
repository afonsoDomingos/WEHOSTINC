import mongoose from 'mongoose';

const SystemRatingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  systemId: { type: String, required: true },
  systemName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: String, required: true }
}, { collection: 'system_ratings' });

const SystemRatingModel = mongoose.models.SystemRating || mongoose.model('SystemRating', SystemRatingSchema);

export default SystemRatingModel;
