const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'update_user',
      'ban_user',
      'unban_user',
      'delete_user',
      'reset_password',
      'forum_lock',
      'forum_unlock',
      'forum_pin',
      'forum_unpin',
      'delete_thread',
      'delete_post'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema); 