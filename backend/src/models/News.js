/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file News.js
 * @description News article model for BizzyNation
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  body: { type: String, required: true },
  bannerImage: { type: String }, // URL or path
  bannerType: { type: String, enum: ['head', 'custom', 'skin'], default: 'head' },
  bannerHeadUsername: { type: String }, // For MC head skin
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  comments: [commentSchema]
});

module.exports = mongoose.model('News', newsSchema); 