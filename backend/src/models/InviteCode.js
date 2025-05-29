const mongoose = require('mongoose');

const InviteCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  used: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedAt: { type: Date },
  expiresAt: { type: Date }, // Optional: can be null for no expiry
  revoked: { type: Boolean, default: false }
});

module.exports = mongoose.model('InviteCode', InviteCodeSchema); 