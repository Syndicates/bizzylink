/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file following.js
 * @description Following system endpoints
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

// Get following list for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'username displayName avatar bio')
      .select('following');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, following: user.following || [] });
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch following list' });
  }
});

// Follow a user
router.post('/follow', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Current user not found' });
    }
    if (currentUser.following && currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      return res.json({ success: true, message: 'Already following this user' });
    }
    if (!currentUser.following) currentUser.following = [];
    currentUser.following.push(targetUser._id);
    if (!targetUser.followers) targetUser.followers = [];
    targetUser.followers.push(currentUser._id);
    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);
    res.json({ success: true, message: `Now following ${username}` });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ success: false, error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.post('/unfollow', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Current user not found' });
    }
    if (!currentUser.following || !currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      return res.json({ success: true, message: 'Not following this user' });
    }
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    }
    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);
    res.json({ success: true, message: `No longer following ${username}` });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ success: false, error: 'Failed to unfollow user' });
  }
});

// Get followers list for the authenticated user
router.get('/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username displayName avatar bio')
      .select('followers');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, followers: user.followers || [] });
  } catch (error) {
    console.error('Error fetching followers list:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch followers list' });
  }
});

module.exports = router; 