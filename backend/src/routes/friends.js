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
        { sender: sender._id, recipient: recipient._id },
        { sender: recipient._id, recipient: sender._id }
      ]
    });
    if (existingRequest) {
      if (existingRequest.sender.toString() === sender._id.toString()) {
        return res.status(400).json({ success: false, error: 'Friend request already sent' });
      } else {
        return res.status(400).json({ success: false, error: 'This user has already sent you a friend request' });
      }
    }
    const friendRequest = new FriendRequest({
      sender: sender._id,
      recipient: recipient._id,
      status: 'pending',
      createdAt: new Date()
    });
    await friendRequest.save();
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
    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to accept this request' });
    }
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request already ${friendRequest.status}` });
    }
    friendRequest.status = 'accepted';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
    const sender = await User.findById(friendRequest.sender);
    const recipient = await User.findById(friendRequest.recipient);
    if (!sender || !recipient) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (!sender.friends) sender.friends = [];
    if (!sender.friends.includes(recipient._id)) sender.friends.push(recipient._id);
    if (!recipient.friends) recipient.friends = [];
    if (!recipient.friends.includes(sender._id)) recipient.friends.push(sender._id);
    await Promise.all([sender.save(), recipient.save()]);
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
    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to reject this request' });
    }
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Request already ${friendRequest.status}` });
    }
    friendRequest.status = 'rejected';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
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
      recipient: req.user._id,
      status: 'pending'
    }).populate('sender', 'username displayName avatar');
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

module.exports = router; 