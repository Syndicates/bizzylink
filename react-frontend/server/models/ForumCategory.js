/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumCategory.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

// Define schema for forum categories
const ForumCategorySchema = new mongoose.Schema({
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
    unique: true,
    lowercase: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  stats: {
    topics: {
      type: Number,
      default: 0
    },
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
      date: Date
    }
  }
}, { timestamps: true });

// Create indexes for performance
ForumCategorySchema.index({ slug: 1 });
ForumCategorySchema.index({ order: 1 });

const ForumCategory = mongoose.model('ForumCategory', ForumCategorySchema);

module.exports = ForumCategory;