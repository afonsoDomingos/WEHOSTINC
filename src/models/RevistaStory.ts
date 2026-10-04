import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevistaStory extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
    bio?: string;
  };
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views: number;
  readingTime?: number;
  highlightText?: string; // texto com destaque azul no título
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
}

const RevistaStorySchema = new Schema<IRevistaStory>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    author: {
      name: { type: String, required: true, default: 'WEHOSTHERE' },
      email: { type: String },
      avatar: { type: String },
      bio: { type: String },
    },
    category: {
      type: String,
      required: true,
      enum: ['codigo', 'startups', 'design', 'carreira', 'ia', 'tutoriais', 'noticias'],
      default: 'codigo',
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    readingTime: { type: Number },
    highlightText: { type: String }, // parte do título que fica com fundo azul
    publishedAt: { type: Date },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calcular readingTime antes de guardar
RevistaStorySchema.pre('save', function (next) {
  if (this.content) {
    const words = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(words / 200); // ~200 palavras/min
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Índices para performance
RevistaStorySchema.index({ slug: 1 });
RevistaStorySchema.index({ status: 1, publishedAt: -1 });
RevistaStorySchema.index({ category: 1 });
RevistaStorySchema.index({ featured: 1 });

const RevistaStory: Model<IRevistaStory> =
  mongoose.models.RevistaStory ||
  mongoose.model<IRevistaStory>('RevistaStory', RevistaStorySchema);

export default RevistaStory;
