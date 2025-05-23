/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file WallPost.js
 * @description Wall post model for user profiles
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

const WallPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      // Content is not required for reposts
      return !this.isRepost;
    },
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Repost functionality (Twitter-style)
  reposts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  repostCount: {
    type: Number,
    default: 0
  },
  // View tracking
  views: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now },
    ipAddress: String // Track anonymous views too
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  // For reposted content - reference to original post
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WallPost'
  },
  isRepost: {
    type: Boolean,
    default: false
  },
  // Repost message (optional message when reposting)
  repostMessage: {
    type: String,
    maxlength: 200
  },
  // Optional image attachment
  image: {
    type: String
  },
  // Custom type for system-generated posts (achievements, etc.)
  type: {
    type: String,
    enum: ['user', 'system', 'achievement', 'friend', 'game'],
    default: 'user'
  },
  // For system-generated posts, additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Comments array
  comments: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true, maxlength: 300 },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

// Pre-save hook to handle repost content
WallPostSchema.pre('save', function(next) {
  // For reposts, ensure content is at least an empty string if not provided
  if (this.isRepost && (this.content === undefined || this.content === null)) {
    this.content = '';
  }
  next();
});

// Index for faster queries
WallPostSchema.index({ author: 1, recipient: 1, createdAt: -1 });
WallPostSchema.index({ recipient: 1, createdAt: -1 });
WallPostSchema.index({ originalPost: 1 }); // For finding reposts of a post
WallPostSchema.index({ isRepost: 1, createdAt: -1 }); // For filtering reposts
WallPostSchema.index({ viewCount: -1 }); // For trending posts
WallPostSchema.index({ repostCount: -1 }); // For popular posts

module.exports = mongoose.model('WallPost', WallPostSchema); 