const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

/**
 * Get all friends for the current user
 * GET /api/friends
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the current user and populate friends
    const user = await User.findById(userId)
      .populate('friends', 'username displayName avatar bio')
      .select('friends');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      friends: user.friends || []
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friends'
    });
  }
});

/**
 * Send a friend request
 * POST /api/friends/request
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }
    
    // Find the user to send request to
    const recipient = await User.findOne({ username });
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if users are already friends
    const sender = await User.findById(req.user.id);
    
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found'
      });
    }
    
    if (sender.friends && sender.friends.includes(recipient._id)) {
      return res.status(400).json({
        success: false,
        error: 'You are already friends with this user'
      });
    }
    
    // Check if there's an existing friend request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: sender._id, recipient: recipient._id },
        { sender: recipient._id, recipient: sender._id }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.sender.toString() === sender._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Friend request already sent'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'This user has already sent you a friend request'
        });
      }
    }
    
    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: sender._id,
      recipient: recipient._id,
      status: 'pending',
      createdAt: new Date()
    });
    
    await friendRequest.save();
    
    res.json({
      success: true,
      message: `Friend request sent to ${username}`
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request'
    });
  }
});

/**
 * Accept a friend request
 * POST /api/friends/accept
 */
router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }
    
    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    // Verify this user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept this request'
      });
    }
    
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Request already ${friendRequest.status}`
      });
    }
    
    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
    
    // Update both users' friends lists
    const sender = await User.findById(friendRequest.sender);
    const recipient = await User.findById(friendRequest.recipient);
    
    if (!sender || !recipient) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Add to sender's friends list
    if (!sender.friends) {
      sender.friends = [];
    }
    if (!sender.friends.includes(recipient._id)) {
      sender.friends.push(recipient._id);
    }
    
    // Add to recipient's friends list
    if (!recipient.friends) {
      recipient.friends = [];
    }
    if (!recipient.friends.includes(sender._id)) {
      recipient.friends.push(sender._id);
    }
    
    await Promise.all([sender.save(), recipient.save()]);
    
    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept friend request'
    });
  }
});

/**
 * Reject a friend request
 * POST /api/friends/reject
 */
router.post('/reject', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }
    
    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    // Verify this user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reject this request'
      });
    }
    
    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Request already ${friendRequest.status}`
      });
    }
    
    // Update request status
    friendRequest.status = 'rejected';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();
    
    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject friend request'
    });
  }
});

/**
 * Get all pending friend requests
 * GET /api/friends/requests
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all pending requests where user is recipient
    const requests = await FriendRequest.find({
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'username displayName avatar');
    
    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch friend requests'
    });
  }
});

/**
 * Remove a friend
 * POST /api/friends/remove
 */
router.post('/remove', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({
        success: false,
        error: 'Friend ID is required'
      });
    }
    
    // Find both users
    const user = await User.findById(req.user.id);
    const friend = await User.findById(friendId);
    
    if (!user || !friend) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if they are friends
    if (!user.friends || !user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        error: 'Not friends with this user'
      });
    }
    
    // Remove from both friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    
    if (friend.friends) {
      friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);
    }
    
    await Promise.all([user.save(), friend.save()]);
    
    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend'
    });
  }
});

module.exports = router; 