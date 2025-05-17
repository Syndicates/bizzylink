/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file userRoutes.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const config = require('../config');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already in use' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      forum_rank: 'member', // Default forum rank
      role: 'user'
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      config.server.jwtSecret,
      { expiresIn: config.server.jwtExpiration }
    );

    // Return token and user info (without password)
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({
      token,
      user: userResponse,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if account is banned
    if (user.banned) {
      return res.status(403).json({ 
        message: 'Your account has been banned', 
        reason: user.banReason || 'No reason provided' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update last login time
    user.lastLogin = new Date();
    
    // Add login history entry
    user.loginHistory.push({
      date: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Keep only last 10 login entries
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      config.server.jwtSecret,
      { expiresIn: config.server.jwtExpiration }
    );

    // Return token and user info (without password)
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, profilePicture } = req.body;
    
    // Fields that can be updated
    const updateFields = {};
    if (email) updateFields.email = email;
    if (profilePicture) updateFields.profilePicture = profilePicture;
    
    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/admin/users', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Get users with pagination
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.status(200).json({
      users,
      totalUsers,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set user forum rank (admin only)
router.put('/admin/users/:userId/forum-rank', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { forum_rank } = req.body;
    
    // Validate forum rank
    if (!['member', 'moderator', 'admin'].includes(forum_rank)) {
      return res.status(400).json({ message: 'Invalid forum rank' });
    }
    
    // Find and update user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update forum rank
    user.forum_rank = forum_rank;
    
    // Update role for backward compatibility
    if (forum_rank === 'admin') {
      user.role = 'admin';
    } else if (forum_rank === 'moderator') {
      user.role = 'moderator';
    } else {
      user.role = 'user';
    }
    
    await user.save();
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        forum_rank: user.forum_rank,
        role: user.role
      },
      message: `User forum rank updated to ${forum_rank}`
    });
  } catch (error) {
    console.error('Error updating user forum rank:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ban user (admin only)
router.put('/admin/users/:userId/ban', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned, reason } = req.body;
    
    // Find and update user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update ban status
    user.banned = banned === true;
    user.banReason = reason || null;
    
    await user.save();
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        banned: user.banned,
        banReason: user.banReason
      },
      message: user.banned ? 'User banned successfully' : 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/admin/users/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Minecraft account linking endpoints will be in a separate file

module.exports = router;