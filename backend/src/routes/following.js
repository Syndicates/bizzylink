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
const Notification = require('../models/Notification');
const eventEmitter = require('../eventEmitter');

// Helper to get the relationship state between two users
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
  console.log('[FOLLOW][DEBUG] /follow endpoint called by user:', req.user.id, 'body:', req.body);
  try {
    const { username } = req.body;
    if (!username) {
      console.log('[FOLLOW][DEBUG] No username provided');
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      console.log('[FOLLOW][DEBUG] Target user not found:', username);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      console.log('[FOLLOW][DEBUG] Current user not found:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Current user not found'
      });
    }
    // Check if already following
    if (currentUser.following && currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      console.log('[FOLLOW][DEBUG] Already following:', targetUser.username);
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
      console.log('[FOLLOW][DEBUG] Created notification:', notification);
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
        console.log('[SSE][FOLLOW][DEBUG] Emitting userEvent for follow:', ssePayload);
        eventEmitter.emit('userEvent', ssePayload);
      } else {
        console.log('[FOLLOW][DEBUG] eventEmitter not available or not a function');
      }
    } catch (err) {
      console.error('[FOLLOW][DEBUG] Error creating notification:', err);
    }
    // Return current relationship state
    const relationship = await getRelationshipState(currentUser, targetUser);
    res.json({
      success: true,
      message: `Now following ${username}`,
      ...relationship
    });
  } catch (error) {
    console.error('[FOLLOW][DEBUG] Error following user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

// Unfollow a user
router.post('/unfollow', protect, async (req, res) => {
  console.log('[UNFOLLOW][DEBUG] /unfollow endpoint called by user:', req.user.id, 'body:', req.body);
  try {
    const { username } = req.body;
    if (!username) {
      console.log('[UNFOLLOW][DEBUG] No username provided');
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      console.log('[UNFOLLOW][DEBUG] Target user not found:', username);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      console.log('[UNFOLLOW][DEBUG] Current user not found:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Current user not found'
      });
    }
    // Check if not following
    if (!currentUser.following || !currentUser.following.some(id => id.toString() === targetUser._id.toString())) {
      console.log('[UNFOLLOW][DEBUG] Not following:', targetUser.username);
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
    // --- DO NOT create or emit a notification for unfollow ---
    // --- Retract the previous FOLLOW notification ---
    try {
      const deleted = await Notification.findOneAndDelete({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'FOLLOW'
      }, { sort: { createdAt: -1 } });
      if (deleted) {
        console.log('[UNFOLLOW][DEBUG] Retracted FOLLOW notification:', deleted._id);
      } else {
        console.log('[UNFOLLOW][DEBUG] No FOLLOW notification found to retract.');
      }
    } catch (err) {
      console.error('[UNFOLLOW][DEBUG] Error retracting FOLLOW notification:', err);
    }
    // Return current relationship state
    const relationship = await getRelationshipState(currentUser, targetUser);
    res.json({
      success: true,
      message: `No longer following ${username}`,
      ...relationship
    });
  } catch (error) {
    console.error('[UNFOLLOW][DEBUG] Error unfollowing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
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