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
    required: true,
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

// Index for faster queries
WallPostSchema.index({ author: 1, recipient: 1, createdAt: -1 });
WallPostSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('WallPost', WallPostSchema); 