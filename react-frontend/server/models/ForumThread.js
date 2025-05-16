const mongoose = require('mongoose');

// Define schema for forum threads
const ForumThreadSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumTopic',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  notifyInGame: {
    type: Boolean,
    default: false
  },
  notifiedAt: {
    type: Date,
    default: null
  },
  notificationCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  stats: {
    views: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    },
    lastReply: {
      author: String,
      date: Date,
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumPost'
      }
    }
  }
}, { timestamps: true });

// Create indexes for performance
ForumThreadSchema.index({ topicId: 1 });
ForumThreadSchema.index({ authorId: 1 });
ForumThreadSchema.index({ pinned: 1, createdAt: -1 });
ForumThreadSchema.index({ slug: 1 });

const ForumThread = mongoose.model('ForumThread', ForumThreadSchema);

module.exports = ForumThread;