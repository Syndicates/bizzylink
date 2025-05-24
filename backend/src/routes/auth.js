/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file auth.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const { SecurityLog } = require('../models/SecurityLog');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const LuckPermsSync = require('../services/LuckPermsSync');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * @route   POST /api/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  // Validation rules
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], async (req, res, next) => {
  // Debug log incoming registration attempt (hide password)
  console.log('\x1b[36m[📝 Register Debug]\x1b[0m Registration attempt:', {
    username: req.body.username,
    email: req.body.email,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('\x1b[33m[⚠️ Register Debug]\x1b[0m Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, email, password } = req.body;
    
    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return next(new ErrorResponse('Username already exists', 400));
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return next(new ErrorResponse('Email already exists', 400));
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password,
      webRank: 'user', // Default rank
      titles: [
        {
          id: 'default',
          name: 'Adventurer',
          description: 'The default title for all players',
          rarity: 'common',
          textColor: 'text-white',
          unlocked: true,
          category: 'default'
        }
      ],
      activeTitle: 'default'
    });
    
    // Log IP address
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    user.knownIPs.push({
      ip: clientIP,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    });
    
    await user.save();
    
    // Create security log
    await SecurityLog.create({
      user: user._id,
      action: 'LOGIN',
      ip: clientIP,
      userAgent: req.headers['user-agent'],
      details: {
        registrationEvent: true
      }
    });
    
    // Generate token
    const token = user.getSignedToken();
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        rank: user.webRank,
        isAdmin: user.isAdmin()
      }
    });
  } catch (error) {
    console.error('\x1b[31m[❌ Register Debug]\x1b[0m Registration error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/login
 * @desc    Login user and return token
 * @access  Public
 */
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      // Log failed login
      await SecurityLog.create({
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          username,
          reason: 'user_not_found'
        }
      });
      
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      // Log locked account attempt
      await SecurityLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          reason: 'account_locked',
          unlockTime: user.lockUntil
        }
      });
      
      return next(new ErrorResponse('Account is temporarily locked due to too many failed login attempts', 403, {
        lockExpires: user.lockUntil
      }));
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      
      // Log failed login
      await SecurityLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          attempts: user.loginAttempts,
          locked: user.loginAttempts >= 5
        }
      });
      
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Reset login attempts
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    
    // Save IP address for security tracking
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Check if IP already exists in knownIPs
    const existingIP = user.knownIPs.find(entry => entry.ip === clientIP);
    
    if (existingIP) {
      // Update lastSeen time
      existingIP.lastSeen = Date.now();
    } else {
      // Add new IP to known list
      user.knownIPs.push({
        ip: clientIP,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
      
      // If this is a new IP and the user has 2FA enabled, require verification
      if (user.twoFactorEnabled) {
        // Log login attempt requiring 2FA
        await SecurityLog.create({
          user: user._id,
          action: 'LOGIN',
          ip: clientIP,
          userAgent: req.headers['user-agent'],
          details: {
            requiresTwoFactor: true,
            reason: 'new_ip'
          }
        });
        
        await user.save();
        
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Login from new IP requires 2FA verification'
        });
      }
    }
    
    await user.save();
    
    // Sync player rank if they have a linked Minecraft account
    if (user.minecraftUUID) {
      // Run in background to avoid delaying login
      LuckPermsSync.syncPlayerRank(user.minecraftUUID).catch(err => {
        console.error('Error syncing player rank during login:', err);
      });
    }
    
    // Generate token
    const token = user.getSignedToken();
    
    // Log successful login
    await SecurityLog.create({
      user: user._id,
      action: 'LOGIN',
      ip: clientIP,
      userAgent: req.headers['user-agent']
    });

    // Set JWT as HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: 'lax', // 'lax' for local dev, 'none' for cross-site with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      path: '/',
    });

    // Return token and user info
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.webRank,
        minecraftUsername: user.minecraftUsername,
        titles: user.titles,
        activeTitle: user.activeTitle,
        isAdmin: user.isAdmin(),
        isLinked: user.hasLinkedAccount()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/logout
 * @desc    Logout user (client-side only)
 * @access  Public
 */
router.post('/logout', protect, async (req, res, next) => {
  try {
    // This is mostly a client-side operation, but we can log it
    
    // Log logout
    await SecurityLog.create({
      user: req.user._id,
      action: 'LOGOUT',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Return success
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.minecraftUUID) {
      LuckPermsSync.syncPlayerRank(user.minecraftUUID).catch(err => {
        console.error('Error syncing player rank during profile fetch:', err);
      });
    }
    console.log('[DEBUG] Returning /api/me user:', user);
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.webRank,
        minecraftUsername: user.minecraftUsername,
        minecraftUUID: user.minecraftUUID,
        titles: user.titles,
        activeTitle: user.activeTitle,
        isAdmin: user.isAdmin(),
        isLinked: user.hasLinkedAccount(),
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/setup
 * @desc    Setup 2FA for user
 * @access  Private
 */
router.post('/2fa/setup', protect, async (req, res, next) => {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BizzyLink:${req.user.username}`
    });
    
    // Save secret to user
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();
    
    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    // Log 2FA setup
    await SecurityLog.create({
      user: req.user._id,
      action: 'ENABLE_2FA',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        setup: true
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify 2FA token and enable 2FA
 * @access  Private
 */
router.post('/2fa/verify', protect, [
  body('token').isNumeric().isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { token } = req.body;
    
    // Get user with 2FA secret
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    
    if (!user.twoFactorSecret) {
      return next(new ErrorResponse('2FA not setup', 400));
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      // Log failed verification
      await SecurityLog.create({
        user: user._id,
        action: 'VERIFY_2FA',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          success: false
        }
      });
      
      return next(new ErrorResponse('Invalid verification code', 400));
    }
    
    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();
    
    // Log successful verification
    await SecurityLog.create({
      user: user._id,
      action: 'VERIFY_2FA',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        success: true
      }
    });
    
    res.status(200).json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;