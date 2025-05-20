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

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SecurityLog } = require('../models/SecurityLog');
const ErrorResponse = require('../utils/errorResponse');

// Ensure JWT_SECRET is set to the provided value
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'Q7v!pZ2rT9@xL6$wB1^sF4&nM8*eC3zY5hJ0!kR8@wV2^';
}

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      console.error('[AUTH] No token provided');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    console.log('[AUTH] Incoming token:', token.substring(0, 20) + '...');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[AUTH] Decoded token:', decoded);
      
      // Get user from database (excluding password)
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new ErrorResponse('User not found', 404));
      }
      
      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return next(new ErrorResponse('Your account is temporarily locked. Please try again later.', 403));
      }
      
      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('[AUTH] Token verification error:', error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
};

// Restrict routes to specific user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    if (!roles.includes(req.user.webRank)) {
      // Log unauthorized access attempt
      SecurityLog.create({
        user: req.user._id,
        action: 'UNAUTHORIZED_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        details: {
          requiredRoles: roles,
          userRole: req.user.webRank
        }
      }).catch(err => console.error('Error logging security event:', err));
      
      return next(new ErrorResponse(`User role ${req.user.webRank} is not authorized to access this route`, 403));
    }
    
    next();
  };
};

// Admin authorization middleware
exports.adminMiddleware = async (req, res, next) => {
  try {
    // First use the standard protection middleware
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    // Check if user has admin role
    if (!['admin', 'owner'].includes(req.user.webRank)) {
      // Log unauthorized admin access attempt
      await SecurityLog.create({
        user: req.user._id,
        action: 'UNAUTHORIZED_ADMIN_ACCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.originalUrl,
        details: {
          userRole: req.user.webRank
        }
      });
      
      return next(new ErrorResponse('Admin privileges required to access this route', 403));
    }
    
    // Enhanced security: IP validation for admins
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const knownIP = req.user.knownIPs.find(ip => ip.ip === clientIP && ip.trusted);
    
    // If IP is unknown or untrusted, require additional verification for extra security
    if (!knownIP && req.user.twoFactorEnabled) {
      return next(new ErrorResponse('Admin access from new IP requires 2FA verification', 403, {
        requiresTwoFactor: true
      }));
    }
    
    // Proceed to route handler
    next();
  } catch (error) {
    next(error);
  }
};