const express = require('express');
const router = express.Router();
const InviteCode = require('../models/InviteCode');
const SiteSetting = require('../models/SiteSetting');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const crypto = require('crypto');

// Helper: generate a secure random code
function generateInviteCode(length = 10) {
  return crypto.randomBytes(length).toString('base64url');
}

// ADMIN: Toggle BETA invite mode
router.post('/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be boolean' });
    await SiteSetting.findOneAndUpdate(
      { key: 'beta_invite_mode' },
      { value: enabled },
      { upsert: true, new: true }
    );
    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ADMIN: Generate a new invite code
router.post('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    const { expiresAt } = req.body;
    const code = generateInviteCode(8);
    const invite = await InviteCode.create({
      code,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// ADMIN: List all invite codes
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const invites = await InviteCode.find().populate('createdBy usedBy', 'username');
    res.json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// ADMIN: Revoke an invite code
router.post('/:code/revoke', protect, authorize('admin'), async (req, res) => {
  try {
    const invite = await InviteCode.findOneAndUpdate(
      { code: req.params.code },
      { revoked: true },
      { new: true }
    );
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

// PUBLIC: Check if BETA invite mode is enabled
router.get('/mode', async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ key: 'beta_invite_mode' });
    res.json({ enabled: !!(setting && setting.value) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUBLIC: Validate invite code
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    const invite = await InviteCode.findOne({ code, used: false, revoked: false, $or: [ { expiresAt: null }, { expiresAt: { $gt: new Date() } } ] });
    if (!invite) return res.status(404).json({ valid: false, error: 'Invalid or expired code' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate code' });
  }
});

// PUBLIC: Consume invite code (called during registration)
router.post('/consume', async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'Code and userId required' });
    const invite = await InviteCode.findOne({ code, used: false, revoked: false, $or: [ { expiresAt: null }, { expiresAt: { $gt: new Date() } } ] });
    if (!invite) return res.status(404).json({ error: 'Invalid or expired code' });
    invite.used = true;
    invite.usedBy = userId;
    invite.usedAt = new Date();
    await invite.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to consume code' });
  }
});

module.exports = router; 