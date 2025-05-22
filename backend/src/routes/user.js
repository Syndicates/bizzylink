/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file user.js
 * @description 
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
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { 
      avatar, 
      settings, 
      wallpaperId
    } = req.body;
    
    const updateFields = {};
    
    // Only update fields that were provided
    if (avatar) updateFields.avatar = avatar;
    if (settings) updateFields.settings = settings;
    if (wallpaperId !== undefined) updateFields.wallpaperId = wallpaperId;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user privacy settings
router.put('/settings/privacy', protect, async (req, res) => {
  try {
    const { 
      showBalance,
      showReputation,
      showVouches,
      profileVisibility,
      allowFriendRequests,
      allowFollowers
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }
    
    // Initialize privacy object if it doesn't exist
    if (!user.settings.privacy) {
      user.settings.privacy = {};
    }
    
    // Update only the fields that were provided
    if (showBalance !== undefined) user.settings.privacy.showBalance = showBalance;
    if (showReputation !== undefined) user.settings.privacy.showReputation = showReputation;
    if (showVouches !== undefined) user.settings.privacy.showVouches = showVouches;
    if (profileVisibility !== undefined) user.settings.privacy.profileVisibility = profileVisibility;
    if (allowFriendRequests !== undefined) user.settings.privacy.allowFriendRequests = allowFriendRequests;
    if (allowFollowers !== undefined) user.settings.privacy.allowFollowers = allowFollowers;
    
    await user.save();
    
    res.json({
      message: 'Privacy settings updated successfully',
      settings: user.settings
    });
  } catch (err) {
    console.error('Error updating privacy settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user notification settings
router.put('/settings/notifications', protect, async (req, res) => {
  try {
    const { 
      friendRequests,
      newFollowers,
      friendActivity,
      inGame,
      reputation,
      vouches,
      donations
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initialize settings object if it doesn't exist
    if (!user.settings) {
      user.settings = {};
    }
    
    // Initialize notifications object if it doesn't exist
    if (!user.settings.notifications) {
      user.settings.notifications = {};
    }
    
    // Update only the fields that were provided
    if (friendRequests !== undefined) user.settings.notifications.friendRequests = friendRequests;
    if (newFollowers !== undefined) user.settings.notifications.newFollowers = newFollowers;
    if (friendActivity !== undefined) user.settings.notifications.friendActivity = friendActivity;
    if (inGame !== undefined) user.settings.notifications.inGame = inGame;
    if (reputation !== undefined) user.settings.notifications.reputation = reputation;
    if (vouches !== undefined) user.settings.notifications.vouches = vouches;
    if (donations !== undefined) user.settings.notifications.donations = donations;
    
    await user.save();
    
    res.json({
      message: 'Notification settings updated successfully',
      settings: user.settings
    });
  } catch (err) {
    console.error('Error updating notification settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's balance and transaction history
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('balance transactions')
      .populate('transactions.from', 'username avatar')
      .populate('transactions.to', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = user.transactions.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    res.json({
      balance: user.balance,
      transactions: sortedTransactions
    });
  } catch (err) {
    console.error('Error fetching balance and transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reputation history
router.get('/reputation', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('reputation reputationFrom')
      .populate('reputationFrom.user', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Sort reputation entries by date (newest first)
    const sortedReputation = user.reputationFrom.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    res.json({
      reputation: user.reputation,
      history: sortedReputation
    });
  } catch (err) {
    console.error('Error fetching reputation history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's vouches history
router.get('/vouches', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('vouches vouchesFrom')
      .populate('vouchesFrom.user', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Sort vouches by date (newest first)
    const sortedVouches = user.vouchesFrom.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    res.json({
      vouches: user.vouches,
      history: sortedVouches
    });
  } catch (err) {
    console.error('Error fetching vouches history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by username (for profile/forum sync)
router.get('/by-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Error finding user by username:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users for @mentions
router.get('/search', async (req, res) => {
  try {
    const { username, linked = 'true', limit = 5 } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: 'Username search term is required' });
    }
    
    // Build query - case insensitive search that starts with the search term
    // Search for either username OR mcUsername that starts with the search term
    const query = { 
      $or: [
        { username: { $regex: `^${username}`, $options: 'i' } },
        { mcUsername: { $regex: `^${username}`, $options: 'i' } }
      ]
    };
    
    // Only include users with Minecraft accounts linked if requested
    if (linked === 'true') {
      query.mcUsername = { $exists: true, $ne: null };
    }
    
    // Find users that match the query
    const users = await User.find(query)
      .select('username mcUsername avatar webRank')
      .limit(parseInt(limit))
      .lean();
    
    return res.status(200).json({ 
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        mcUsername: user.mcUsername,
        avatar: user.avatar,
        webRank: user.webRank || 'user'
      })) 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;