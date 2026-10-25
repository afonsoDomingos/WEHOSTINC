import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevistaComment extends Document {
  storySlug: string;
  storyId?: mongoose.Types.ObjectId;
  author: {
    name: string;
    email: string;
    avatar?: string;
    userId?: string;
    isAuthor?: boolean;
    isAdmin?: boolean;
  };
  content: string;
  parentId?: string | null;
  status: 'approved' | 'pending' | 'spam' | 'rejected';
  likes: number;
  likedBy?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RevistaCommentSchema = new Schema<IRevistaComment>(
  {
    storySlug: { type: String, required: true, index: true, trim: true, lowercase: true },
    storyId: { type: Schema.Types.ObjectId, ref: 'RevistaStory' },
    author: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      email: { type: String, required: true, trim: true, lowercase: true },
      avatar: { type: String },
      userId: { type: String },
      isAuthor: { type: Boolean, default: false },
      isAdmin: { type: Boolean, default: false },
    },
    content: { type: String, required: true, trim: true, maxlength: 2500 },
    parentId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ['approved', 'pending', 'spam', 'rejected'],
      default: 'approved',
      index: true,
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

RevistaCommentSchema.index({ storySlug: 1, status: 1, createdAt: -1 });

const RevistaComment: Model<IRevistaComment> =
  mongoose.models.RevistaComment ||
  mongoose.model<IRevistaComment>('RevistaComment', RevistaCommentSchema);

export default RevistaComment;
