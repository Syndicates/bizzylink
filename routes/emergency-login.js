/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file emergency-login.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * EMERGENCY LOGIN ROUTE
 * FOR DEVELOPMENT USE ONLY - REMOVE BEFORE PRODUCTION
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Emergency login route - always succeeds with any password
router.post('/emergency-login', async (req, res) => {
  try {
    const { username } = req.body;
    console.log('⚠️ EMERGENCY LOGIN REQUESTED FOR:', username);
    
    if (!username) {
      return res.status(400).json({ 
        success: false,
        error: 'Username is required'
      });
    }
    
    // Find user or create temporary one
    let user = await User.findOne({ username });
    
    // Create user if not exists
    if (!user) {
      console.log('Creating temporary user for emergency login:', username);
      user = new User({
        username,
        password: 'emergency_login_bypass',
        role: 'user',
        forum_rank: 'user',
        accountStatus: 'active',
        createdAt: new Date()
      });
      await user.save();
    }
    
    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role || 'user',
        forum_rank: user.forum_rank || 'user'
      }
    };
    
    // Get JWT secret
    const secretKey = process.env.JWT_SECRET || 'Q7v!pZ2rT9@xL6$wB1^sF4&nM8*eC3zY5hJ0!kR8@wV2^';
    
    // Sign token
    jwt.sign(
      payload,
      secretKey,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Error generating token:', err);
          return res.status(500).json({ success: false, error: 'Token generation failed' });
        }
        
        console.log('✅ Emergency login successful for:', username);
        res.json({
          success: true,
          message: 'Emergency login successful',
          user: {
            id: user._id,
            username: user.username,
            role: user.role || 'user'
          },
          token
        });
      }
    );
  } catch (error) {
    console.error('Emergency login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
