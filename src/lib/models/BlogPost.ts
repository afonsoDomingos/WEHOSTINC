import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  author: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['news', 'tutorial', 'announcement', 'update', 'feature'],
    default: 'news'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Índices para performance
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ publishedAt: -1 });
BlogPostSchema.index({ featured: 1, status: 1 });
BlogPostSchema.index({ tags: 1 });

// Middleware para definir publishedAt ao publicar
BlogPostSchema.pre('save', async function(next) {
  // Definir publishedAt ao publicar
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

export default mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
