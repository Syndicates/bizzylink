/**
 * Authentication middleware for protecting routes
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.server.jwtSecret);
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'User not found, access denied' });
    }
    
    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ 
        message: 'Your account has been banned', 
        reason: user.banReason || 'No reason provided' 
      });
    }
    
    // Add user to request object
    req.user = user;
    req.token = token;
    
    // REMOVED automatic admin promotion for security
    // No longer automatically promoting operators to admin
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token, access denied' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please log in again' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = auth;