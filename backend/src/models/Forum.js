/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Forum.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

// Forum Category Schema
const ForumCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  slug: { 
    type: String, 
    required: [true, 'Category slug is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  icon: { 
    type: String,
    default: '/minecraft-assets/grass_block.svg'
  },
  order: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  requiresAuth: { 
    type: Boolean, 
    default: false 
  },
  requiredRank: { 
    type: String,
    enum: ['user', 'helper', 'moderator', 'admin', 'owner', 'developer', 'content_creator', 'tiktok_sub', 'donor', null],
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Forum Topic Schema
const ForumTopicSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Topic name is required'],
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  slug: { 
    type: String, 
    required: [true, 'Topic slug is required'],
    trim: true,
    lowercase: true
  },
  icon: { 
    type: String,
    default: '/minecraft-assets/grass_block.svg'
  },
  order: { 
    type: Number, 
    default: 0 
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ForumCategory', 
    required: [true, 'Category is required']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Forum Thread Schema
const ForumThreadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Thread title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: { 
    type: String, 
    required: [true, 'Thread slug is required'],
    trim: true,
    lowercase: true
  },
  topic: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ForumTopic', 
    required: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumCategory',
    required: false
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Author is required']
  },
  content: { 
    type: String, 
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 10 characters']
  },
  isPinned: { 
    type: Boolean, 
    default: false 
  },
  isLocked: { 
    type: Boolean, 
    default: false 
  },
  pinned: { // for legacy/compatibility
    type: Boolean,
    default: false
  },
  locked: { // for legacy/compatibility
    type: Boolean,
    default: false
  },
  views: { 
    type: Number, 
    default: 0 
  },
  tags: [String],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastPost: {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date }
  },
  firstPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: false
  },
  replyCount: {
    type: Number,
    default: 0
  }
});

// Forum Post Schema
const ForumPostSchema = new mongoose.Schema({
  thread: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ForumThread', 
    required: [true, 'Thread is required']
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Author is required']
  },
  content: { 
    type: String, 
    required: [true, 'Content is required'],
    minlength: [1, 'Content is required']
  },
  isOriginalPost: { 
    type: Boolean, 
    default: false 
  },
  thanks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: { 
    type: Boolean, 
    default: false 
  },
  editedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  editDate: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add indexes for performance
ForumCategorySchema.index({ slug: 1 }, { unique: true });
ForumTopicSchema.index({ category: 1, slug: 1 }, { unique: true });
ForumThreadSchema.index({ topic: 1, createdAt: -1 });
ForumPostSchema.index({ thread: 1, createdAt: 1 });
ForumPostSchema.index({ author: 1 });

// Generate a URL-friendly slug from a string
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
    .replace(/\-\-+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start of text
    .replace(/-+$/, '');          // Trim - from end of text
}

// Middleware to automatically generate slug before saving
ForumCategorySchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
  next();
});

ForumTopicSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
  next();
});

ForumThreadSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }
  // Update timestamps
  this.updatedAt = Date.now();
  next();
});

ForumPostSchema.pre('save', function(next) {
  // Update timestamps if content modified
  if (this.isModified('content')) {
    this.updatedAt = Date.now();
    
    // Mark as edited if not a new post and content changed
    if (!this.isNew && this.isModified('content')) {
      this.edited = true;
      this.editDate = Date.now();
    }
  }
  
  next();
});

// Update thread's lastPost when a post is saved
ForumPostSchema.post('save', async function() {
  try {
    // Find thread and update lastPost
    await mongoose.model('ForumThread').findByIdAndUpdate(
      this.thread,
      {
        lastPost: {
          author: this.author,
          date: this.createdAt
        },
        updatedAt: Date.now()
      }
    );
  } catch (error) {
    console.error('Error updating thread lastPost:', error);
  }
});

// Create and export models
const ForumCategory = mongoose.model('ForumCategory', ForumCategorySchema, 'categories');
const ForumTopic = mongoose.model('ForumTopic', ForumTopicSchema);
const ForumThread = mongoose.model('ForumThread', ForumThreadSchema, 'threads');
const ForumPost = mongoose.model('ForumPost', ForumPostSchema, 'posts');

module.exports = {
  ForumCategory,
  ForumTopic,
  ForumThread,
  ForumPost,
  generateSlug
};