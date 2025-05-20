/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file profile.js
 * @description User profile endpoint (GET/PUT)
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Map webRank to role for frontend compatibility
    const userObj = user.toObject();
    userObj.role = user.webRank;
    // Ensure lastLogin, email, createdAt are present
    if (!userObj.lastLogin) userObj.lastLogin = user.lastLogin || null;
    if (!userObj.email) userObj.email = user.email || null;
    if (!userObj.createdAt) userObj.createdAt = user.createdAt || null;
    res.json({ success: true, data: userObj });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update user profile
router.put('/', protect, async (req, res) => {
  try {
    const { avatar, settings } = req.body;
    const updateFields = {};
    if (avatar) updateFields.avatar = avatar;
    if (settings) updateFields.settings = settings;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router; 