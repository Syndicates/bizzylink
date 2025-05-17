/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file following.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

/**
 * Get following list for the authenticated user
 * GET /api/following
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('following', 'username displayName avatar bio')
      .select('following');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      following: user.following || []
    });
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following list'
    });
  }
});

/**
 * Follow a user
 * POST /api/following/follow
 */
router.post('/follow', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    // Find the target user
    const targetUser = await User.findOne({ username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Current user not found'
      });
    }
    
    // Check if already following
    if (currentUser.following && currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      return res.json({
        success: true,
        message: 'Already following this user'
      });
    }
    
    // Add targetUser to following list
    if (!currentUser.following) {
      currentUser.following = [];
    }
    currentUser.following.push(targetUser._id);
    
    // Add currentUser to followers list of targetUser
    if (!targetUser.followers) {
      targetUser.followers = [];
    }
    targetUser.followers.push(currentUser._id);
    
    // Save both users
    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);
    
    res.json({
      success: true,
      message: `Now following ${username}`
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

/**
 * Unfollow a user
 * POST /api/following/unfollow
 */
router.post('/unfollow', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    // Find the target user
    const targetUser = await User.findOne({ username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'Current user not found'
      });
    }
    
    // Check if not following
    if (!currentUser.following || !currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      return res.json({
        success: true,
        message: 'Not following this user'
      });
    }
    
    // Remove targetUser from following list
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
    
    // Remove currentUser from followers list of targetUser
    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    }
    
    // Save both users
    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);
    
    res.json({
      success: true,
      message: `No longer following ${username}`
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
});

/**
 * Get followers list for the authenticated user
 * GET /api/following/followers
 */
router.get('/followers', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'username displayName avatar bio')
      .select('followers');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      followers: user.followers || []
    });
  } catch (error) {
    console.error('Error fetching followers list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch followers list'
    });
  }
});

module.exports = router; 