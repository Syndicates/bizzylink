/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file LinkCode.js
 * @description Link code schema for Minecraft linking
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

const LinkCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  expires: { type: Date, required: true },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.models.LinkCode || mongoose.model('LinkCode', LinkCodeSchema); 