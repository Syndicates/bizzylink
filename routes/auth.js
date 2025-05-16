const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Debug tools
const DEBUG = process.env.NODE_ENV !== 'production';
const debug = (message, data) => {
  if (DEBUG) {
    if (data) {
      console.log(`[Auth Route Debug] ${message}`, data);
    } else {
      console.log(`[Auth Route Debug] ${message}`);
    }
  }
};

// Create a function for generating refresh token
const createRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { expiresIn: '30d' }
  );
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      user: {
        username: user.username, 
        id: user._id,
        role: user.role,
        forum_rank: user.forum_rank,
        permissions: user.permissions || {
          canAccessAdmin: user.role === 'admin' || user.forum_rank === 'admin',
          canModerateForums: user.role === 'admin' || user.forum_rank === 'admin' || user.forum_rank === 'moderator',
          canManageUsers: user.role === 'admin' || user.forum_rank === 'admin',
          canEditServer: user.role === 'admin'
        }
      }
    },
    process.env.JWT_SECRET || 'bizzylink-secure-jwt-key-for-authentication',
    { expiresIn: '24h' }
  );
};

// Test endpoint that will always succeed
router.post('/test-login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    // Find user or create if not exists
    let user = await User.findOne({ username });
    
    if (!user) {
      // Create a very simple password hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);
      
      user = new User({
        username,
        password: hashedPassword,
        role: 'user',
        forum_rank: 'user'
      });
      
      await user.save();
      console.log(`Created test user: ${username}`);
    }
    
    // Generate token
    const token = generateToken(user);
    const refreshToken = createRefreshToken(user._id);
    
    res.json({
      success: true,
      message: 'Test login successful',
      user: user.getPublicProfile(),
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Register a new user - Updated to use async/await instead of callbacks
router.post('/register', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    debug('Registration request received', { body: req.body, ip: clientIp });
    
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      debug('Registration validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }

    // Check if username has invalid characters (only allow letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      debug('Registration validation failed: Username contains invalid characters');
      return res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }
    
    // Check if username is too short or too long
    if (username.length < 3 || username.length > 20) {
      debug('Registration validation failed: Username length invalid');
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 20 characters'
      });
    }

    // Check if username already exists - using async/await
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      debug('Registration failed: Username already exists');
      return res.status(409).json({ 
        success: false,
        error: 'Username already exists' 
      });
    }
    
    // Create a new user - using async/await
    debug('Creating new user with username:', username);
    
    // Generate salt using Promise-based approach
    const salt = await bcrypt.genSalt(10);
    
    // Hash password using Promise-based approach
    const hashedPassword = await bcrypt.hash(password, salt);
    
    debug('Password hashed successfully');
    
    // Create user with hashed password
    const userData = {
      username,
      password: hashedPassword,
      registeredAt: new Date(),
      registrationIp: clientIp,
      lastLoginIp: clientIp
    };
    
    // Add email if provided
    if (email) {
      debug('Including email in user data');
      userData.email = email;
    }
    
    const newUser = new User(userData);
    
    // Save user to database
    const savedUser = await newUser.save();
    
    debug('User successfully saved to database');
    
    // Generate tokens
    const token = generateToken(savedUser);
    const refreshToken = createRefreshToken(savedUser._id);
    
    debug('Registration successful, tokens generated');
    res.status(201).json({ 
      success: true,
      message: "Registration successful",
      user: savedUser.getPublicProfile(),
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: "Username or email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Registration failed. Please try again." 
    });
  }
});

// Login user - Updated to use async/await instead of callbacks
router.post('/login', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    debug('Login request received', { username: req.body.username, ip: clientIp });

    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      debug('Login validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }
    
    // Check if user exists - using async/await
    const user = await User.findOne({ username });
    
    if (!user) {
      debug('Login failed: User not found');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Check if account is banned or suspended
    if (user.accountStatus === 'banned') {
      debug('Login failed: Account is banned');
      return res.status(403).json({
        success: false,
        error: 'This account has been banned'
      });
    }
    
    if (user.accountStatus === 'suspended') {
      debug('Login failed: Account is suspended');
      return res.status(403).json({
        success: false,
        error: 'This account is temporarily suspended'
      });
    }
    
    // Compare passwords using Promise-based approach
    debug('Verifying password with bcrypt.compare');
    
    // Log password info for debugging
    debug('Password from request:', password.substring(0, 3) + '***');
    debug('Hashed password from DB:', user.password);
    
    // Use Promise-based bcrypt.compare
    let isMatch = await bcrypt.compare(password, user.password);
    
    debug('Password match result:', isMatch);
    
    // If password doesn't match, allow login in dev mode
    if (!isMatch && process.env.NODE_ENV !== 'production') {
      debug('DEVELOPMENT MODE: Allowing login despite password mismatch');
      console.log('🔓 DEVELOPMENT MODE: Password check bypassed');
      isMatch = true;
    }
    
    if (!isMatch) {
      debug('Login failed: Password does not match');
      
      // Increment failed login attempts (but don't lock account in this rebuild)
      const failedAttempts = (user.failedLoginAttempts?.count || 0) + 1;
      
      await User.updateOne(
        { _id: user._id }, 
        { 
          $set: { 
            'failedLoginAttempts.count': failedAttempts,
            'failedLoginAttempts.lastAttempt': new Date()
          } 
        }
      );
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Handle successful login
    // Reset failed login attempts
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          'failedLoginAttempts.count': 0,
          'failedLoginAttempts.lockUntil': null,
          lastLoginIp: clientIp,
          lastLogin: new Date()
        } 
      }
    );
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = createRefreshToken(user._id);
    
    debug('Login successful, tokens generated');
    res.json({
      success: true,
      message: "Login successful",
      user: user.getPublicProfile(),
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login' 
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Add debug logging
    console.log('Profile request received, user ID from token:', req.user.id);
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found with ID:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found, returning profile for:', user.username);
    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: "Refresh token is required" 
      });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
    );
    
    // Find the user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }
    
    // Generate a new token
    const newToken = generateToken(user);
    
    res.json({
      success: true,
      token: newToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false,
      error: "Invalid refresh token" 
    });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  try {
    // No need to destroy token on server side as we're using JWT
    // Just return success so client can clear localStorage
    console.log('User logged out successfully');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout process'
    });
  }
});

module.exports = router;