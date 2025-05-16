const mongoose = require('mongoose');

// Define schema for forum posts
const ForumPostSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  editDate: {
    type: Date,
    default: null
  },
  isOriginalPost: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Create indexes for performance
ForumPostSchema.index({ threadId: 1, createdAt: 1 });
ForumPostSchema.index({ authorId: 1 });
ForumPostSchema.index({ threadId: 1, isOriginalPost: 1 });

const ForumPost = mongoose.model('ForumPost', ForumPostSchema);

module.exports = ForumPost;