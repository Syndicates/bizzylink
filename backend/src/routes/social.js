/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file social.js
 * @description Social stats API endpoints
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * Get social stats for a user
 * GET /api/social/stats/:username
 */
router.get('/stats/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .populate('friends', 'username displayName avatar bio')
      .populate('followers', 'username displayName avatar bio')
      .populate('following', 'username displayName avatar bio');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.json({
      friendsCount: user.friends ? user.friends.length : 0,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      friends: user.friends || [],
      followers: user.followers || [],
      following: user.following || []
    });
  } catch (error) {
    console.error('Error fetching social stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social stats'
    });
  }
});

/**
 * Get friends for a user by username
 * GET /api/social/friends/:username
 */
router.get('/friends/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate('friends', 'username displayName avatar bio');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, friends: user.friends || [] });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch friends' });
  }
});

module.exports = router; 