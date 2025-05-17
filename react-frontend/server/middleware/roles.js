/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file roles.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Role-based access control middleware
 * Provides middleware functions to restrict access based on user roles
 */

/**
 * Require admin role middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  // Ensure user object exists (auth middleware should have set this)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user has admin role or forum_rank
  if ((!req.user.role || req.user.role !== 'admin') && 
      (!req.user.forum_rank || req.user.forum_rank !== 'admin')) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  // User is an admin, proceed
  next();
};

/**
 * Require moderator role middleware (allows moderators or admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const requireModerator = (req, res, next) => {
  // Ensure user object exists (auth middleware should have set this)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user has moderator or admin role/forum_rank
  const hasModRole = req.user.role === 'moderator' || req.user.role === 'admin';
  const hasModForumRank = req.user.forum_rank === 'moderator' || req.user.forum_rank === 'admin';
  
  if (!hasModRole && !hasModForumRank) {
    return res.status(403).json({ message: 'Moderator privileges required' });
  }
  
  // User is a moderator or admin, proceed
  next();
};

/**
 * Require Minecraft server operator role
 * This checks if the user is an operator on the Minecraft server
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const requireMinecraftOperator = (req, res, next) => {
  // Ensure user object exists (auth middleware should have set this)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user is linked to Minecraft account
  if (!req.user.linked || !req.user.mcUsername) {
    return res.status(403).json({ 
      message: 'You must link your Minecraft account to access this feature'
    });
  }
  
  // Check if user has operator status on the server
  if (!req.user.minecraftPerms || !req.user.minecraftPerms.isOperator) {
    return res.status(403).json({ 
      message: 'Minecraft operator privileges required'
    });
  }
  
  // User is a Minecraft operator, proceed
  next();
};

/**
 * Check if user has a specific Minecraft permission
 * @param {string} permission - Permission node to check
 * @returns {Function} Express middleware
 */
const hasMinecraftPermission = (permission) => {
  return (req, res, next) => {
    // Ensure user object exists (auth middleware should have set this)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is linked to Minecraft account
    if (!req.user.linked || !req.user.mcUsername) {
      return res.status(403).json({ 
        message: 'You must link your Minecraft account to access this feature'
      });
    }
    
    // Check if user has operators status (admins have all permissions)
    if (req.user.minecraftPerms && req.user.minecraftPerms.isOperator) {
      return next();
    }
    
    // Check for specific permission
    if (!req.user.minecraftPerms || 
        !req.user.minecraftPerms.permissions ||
        !req.user.minecraftPerms.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: `You don't have the required permission: ${permission}`
      });
    }
    
    // User has the permission, proceed
    next();
  };
};

module.exports = {
  requireAdmin,
  requireModerator,
  requireMinecraftOperator,
  hasMinecraftPermission
};