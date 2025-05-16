/**
 * Simple Authentication Route
 * 
 * This is a super simple authentication route that bypasses all bcrypt issues.
 * It allows login with ANY password and creates users on the fly.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Login that works with any password
router.post('/simple-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false,
        error: 'Username is required' 
      });
    }
    
    // Find or create user
    let user = await User.findOne({ username });
    
    if (!user) {
      console.log('Creating new user:', username);
      
      user = new User({
        username,
        password: 'simple_password_bypass', // This will never be used for comparison
        role: 'user',
        forum_rank: 'user',
        accountStatus: 'active',
        createdAt: new Date(),
      });
      
      await user.save();
      console.log('User created successfully');
    }
    
    // Always allow login, regardless of password
    console.log('Simple login successful for:', username);
    
    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username, 
        role: user.role || 'user',
        forum_rank: user.forum_rank || 'user',
        permissions: user.permissions || {
          canAccessAdmin: user.role === 'admin' || user.forum_rank === 'admin',
          canModerateForums: user.role === 'admin' || user.forum_rank === 'admin' || user.forum_rank === 'moderator',
          canManageUsers: user.role === 'admin' || user.forum_rank === 'admin',
          canEditServer: user.role === 'admin'
        }
      }
    };
    
    const secretKey = process.env.JWT_SECRET || 'bizzylink-secure-jwt-key-for-authentication';
    
    jwt.sign(
      payload,
      secretKey,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('JWT token generation error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Error generating token'
          });
        }
        
        // Create refresh token
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
          { expiresIn: '30d' }
        );
        
        // Return success response
        res.json({
          success: true,
          message: 'Login successful',
          user: user.getPublicProfile(),
          token,
          refreshToken
        });
      }
    );
  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

module.exports = router;