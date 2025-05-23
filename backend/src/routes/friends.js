/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file friends.js
 * @description Friends system endpoints
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
const FriendRequest = require('../models/FriendRequest');
const eventEmitter = require('../eventEmitter');

// Get all friends for the current user
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username displayName avatar bio')
      .select('friends');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, friends: user.friends || [] });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch friends' });
  }
});

// Send a friend request
router.post('/request', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    const recipient = await User.findOne({ username });
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const sender = await User.findById(req.user._id);
    if (!sender) {
      return res.status(404).json({ success: false, error: 'Sender not found' });
    }
    if (sender.friends && sender.friends.includes(recipient._id)) {
      return res.status(400).json({ success: false, error: 'You are already friends with this user' });
    }
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: sender._id, to: recipient._id },
        { from: recipient._id, to: sender._id }
      ]
    });
    if (existingRequest) {
      if (existingRequest.from.toString() === sender._id.toString()) {
        return res.status(400).json({ success: false, error: 'Friend request already sent' });
      } else {
        return res.status(400).json({ success: false, error: 'This user has already sent you a friend request' });
      }
    }
    const friendRequest = new FriendRequest({
      from: sender._id,
      to: recipient._id,
      status: 'pending',
      createdAt: new Date()
    });
    await friendRequest.save();
    // Emit notification to both sender and recipient
    eventEmitter.emit('notification', {
      type: 'friend_request',
      sender: { _id: sender._id, username: sender.username },
      recipient: { _id: recipient._id, username: recipient.username },
      message: `${sender.username} sent you a friend request` 
    });
    res.json({ success: true, message: `Friend request sent to ${username}` });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ success: false, error: 'Failed to send friend request' });
  }
});

// Accept a friend request
router.post('/accept', protect, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ success: false, error: 'Friend request not found' });
    }
    if (friendRequest.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to accept this request' });
    }
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request already ${friendRequest.status}` });
    }
    friendRequest.status = 'accepted';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
    const sender = await User.findById(friendRequest.from);
    const recipient = await User.findById(friendRequest.to);
    if (!sender || !recipient) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (!sender.friends) sender.friends = [];
    if (!sender.friends.includes(recipient._id)) sender.friends.push(recipient._id);
    if (!recipient.friends) recipient.friends = [];
    if (!recipient.friends.includes(sender._id)) recipient.friends.push(sender._id);
    await Promise.all([sender.save(), recipient.save()]);
    // Emit notification to both sender and recipient
    eventEmitter.emit('notification', {
      type: 'friend_accept',
      sender: { _id: recipient._id, username: recipient.username }, // recipient accepted
      recipient: { _id: sender._id, username: sender.username },
      message: `${recipient.username} accepted your friend request`
    });
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ success: false, error: 'Failed to accept friend request' });
  }
});

// Reject a friend request
router.post('/reject', protect, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID is required' });
    }
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ success: false, error: 'Friend request not found' });
    }
    if (friendRequest.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to reject this request' });
    }
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request already ${friendRequest.status}` });
    }
    friendRequest.status = 'rejected';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
    // Emit notification to both sender and recipient
    eventEmitter.emit('notification', {
      type: 'friend_decline',
      sender: { _id: req.user._id, username: req.user.username },
      recipient: { _id: friendRequest.from, username: undefined }, // username can be filled if needed
      message: `${req.user.username} declined your friend request`
    });
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ success: false, error: 'Failed to reject friend request' });
  }
});

// Get all pending friend requests
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user._id,
      status: 'pending'
    }).populate('from', 'username displayName avatar');
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch friend requests' });
  }
});

// Remove a friend
router.post('/remove', protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ success: false, error: 'Friend ID is required' });
    }
    const user = await User.findById(req.user._id);
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (!user.friends || !user.friends.includes(friendId)) {
      return res.status(400).json({ success: false, error: 'Not friends with this user' });
    }
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    if (friend.friends) {
      friend.friends = friend.friends.filter(id => id.toString() !== req.user._id.toString());
    }
    await Promise.all([user.save(), friend.save()]);
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ success: false, error: 'Failed to remove friend' });
  }
});

// Relationship status between current user and another user
router.get('/relationship', protect, async (req, res) => {
  try {
    const { username, mcUsername } = req.query;
    if (!username && !mcUsername) {
      return res.status(400).json({ success: false, error: 'Username or MC Username is required' });
    }
    // Find the target user by username or minecraftUsername
    const targetUser = await User.findOne({
      $or: [
        { username: username },
        { minecraftUsername: mcUsername },
        { mcUsername: mcUsername } // for compatibility
      ]
    });
    if (!targetUser) {
      return res.json({ status: 'not_friends', following: false, followsYou: false });
    }
    // Check if the current user is friends with or following the target user
    const isFriend = req.user.friends && req.user.friends.some(id => id.toString() === targetUser._id.toString());
    const isFollowing = req.user.following && req.user.following.some(id => id.toString() === targetUser._id.toString());
    // Check if the target user follows the current user
    const followsYou = targetUser.following && targetUser.following.some(id => id.toString() === req.user._id.toString());
    return res.json({
      status: isFriend ? 'friends' : 'not_friends',
      following: isFollowing,
      followsYou
    });
  } catch (error) {
    console.error('Error checking relationship status:', error);
    res.status(500).json({ success: false, error: 'Failed to check relationship status' });
  }
});

module.exports = router; 