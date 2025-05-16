const mongoose = require('mongoose');

// Define schema for forum topics
const ForumTopicSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumCategory',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '/minecraft-assets/grass_block.svg'
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  stats: {
    threads: {
      type: Number,
      default: 0
    },
    posts: {
      type: Number,
      default: 0
    },
    lastPost: {
      title: String,
      author: String,
      date: Date,
      threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumThread'
      }
    }
  }
}, { timestamps: true });

// Create compound index to ensure unique slugs within a category
ForumTopicSchema.index({ categoryId: 1, slug: 1 }, { unique: true });
ForumTopicSchema.index({ categoryId: 1, order: 1 });

const ForumTopic = mongoose.model('ForumTopic', ForumTopicSchema);

module.exports = ForumTopic;