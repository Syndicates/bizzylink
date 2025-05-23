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
const eventEmitter = require('../eventEmitter');
const Notification = require('../backend/src/models/Notification');

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

const getRelationshipState = async (currentUser, targetUser) => {
  // Defensive: fetch latest from DB
  const freshCurrent = await User.findById(currentUser._id);
  const freshTarget = await User.findById(targetUser._id);
  const isFollowing = freshCurrent.following && freshCurrent.following.some(id => id.toString() === freshTarget._id.toString());
  const isFollower = freshTarget.following && freshTarget.following.some(id => id.toString() === freshCurrent._id.toString());
  return {
    status: isFollowing ? 'following' : 'not_following',
    following: isFollowing,
    follower: isFollower
  };
};

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
      // Already following, return current state
      const relationship = await getRelationshipState(currentUser, targetUser);
      return res.json({
        success: true,
        message: 'Already following this user',
        ...relationship
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
    
    // Create persistent notification for follow
    try {
      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'FOLLOW',
        message: `${currentUser.username} started following you`,
        createdAt: new Date()
      });
      console.log('[FOLLOW] Created notification:', notification);
      // Emit notification for follow
      if (eventEmitter && typeof eventEmitter.emit === 'function') {
        eventEmitter.emit('notification', {
          type: 'follow',
          sender: { _id: currentUser._id, username: currentUser.username },
          recipient: { _id: targetUser._id, username: targetUser.username },
          message: `${currentUser.username} started following you` 
        });
        // Emit SSE userEvent for real-time notification
        const ssePayload = {
          userId: targetUser._id.toString(),
          event: 'notification',
          data: {
            type: 'notification',
            subtype: 'FOLLOW',
            sender: { _id: currentUser._id, username: currentUser.username },
            message: `${currentUser.username} started following you`,
            createdAt: new Date()
          }
        };
        console.log('[SSE][FOLLOW] Emitting userEvent for follow:', ssePayload);
        eventEmitter.emit('userEvent', ssePayload);
      }
    } catch (err) {
      console.error('[FOLLOW] Error creating notification:', err);
    }
    
    // Return current relationship state
    const relationship = await getRelationshipState(currentUser, targetUser);
    res.json({
      success: true,
      message: `Now following ${username}`,
      ...relationship
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
      // Not following, return current state
      const relationship = await getRelationshipState(currentUser, targetUser);
      return res.json({
        success: true,
        message: 'Not following this user',
        ...relationship
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
    
    // Create persistent notification for unfollow
    await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: 'UNFOLLOW',
      message: `${currentUser.username} unfollowed you`,
      createdAt: new Date()
    });
    // Emit notification for unfollow
    if (eventEmitter && typeof eventEmitter.emit === 'function') {
      eventEmitter.emit('notification', {
        type: 'unfollow',
        sender: { _id: currentUser._id, username: currentUser.username },
        recipient: { _id: targetUser._id, username: targetUser.username },
        message: `${currentUser.username} unfollowed you` 
      });
      // Emit SSE userEvent for real-time notification
      eventEmitter.emit('userEvent', {
        userId: targetUser._id.toString(),
        event: 'notification',
        data: {
          subtype: 'UNFOLLOW',
          sender: { _id: currentUser._id, username: currentUser.username },
          message: `${currentUser.username} unfollowed you`,
          createdAt: new Date()
        }
      });
    }
    
    // Return current relationship state
    const relationship = await getRelationshipState(currentUser, targetUser);
    res.json({
      success: true,
      message: `No longer following ${username}`,
      ...relationship
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