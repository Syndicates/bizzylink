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
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new ErrorResponse('User not found', 404));
      }
      
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return next(new ErrorResponse('Your account is temporarily locked. Please try again later.', 403));
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
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
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    if (!['admin', 'owner'].includes(req.user.webRank)) {
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
    
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const knownIP = req.user.knownIPs.find(ip => ip.ip === clientIP && ip.trusted);
    
    if (!knownIP && req.user.twoFactorEnabled) {
      return next(new ErrorResponse('Admin access from new IP requires 2FA verification', 403, {
        requiresTwoFactor: true
      }));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};