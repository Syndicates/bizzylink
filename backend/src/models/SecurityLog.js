/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file SecurityLog.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');

// Security Log Schema - tracks security-related events
const SecurityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'EMAIL_CHANGE',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
      'UNAUTHORIZED_ACCESS',
      'UNAUTHORIZED_ADMIN_ACCESS',
      'SUSPICIOUS_ACTIVITY',
      'IP_BLOCKED',
      'MINECRAFT_LINK',
      'MINECRAFT_UNLINK',
      'TOKEN_REFRESH',
      'ENABLE_2FA',
      'DISABLE_2FA',
      'VERIFY_2FA',
      'RANK_CHANGE'
    ]
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  path: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Admin Action Log Schema - tracks admin actions
const AdminActionLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
SecurityLogSchema.index({ user: 1, action: 1, createdAt: -1 });
SecurityLogSchema.index({ action: 1, createdAt: -1 });
SecurityLogSchema.index({ ip: 1, createdAt: -1 });

AdminActionLogSchema.index({ user: 1, createdAt: -1 });
AdminActionLogSchema.index({ action: 1, resource: 1, createdAt: -1 });

// Create and export models
const SecurityLog = mongoose.model('SecurityLog', SecurityLogSchema);
const AdminActionLog = mongoose.model('AdminActionLog', AdminActionLogSchema);

module.exports = {
  SecurityLog,
  AdminActionLog
};