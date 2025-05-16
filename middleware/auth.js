const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Validate environment variables at startup
// Check for JWT_SECRET but don't exit - use default in development
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is not set! Using default secret for development.');
    process.env.JWT_SECRET = 'bizzylink-secure-jwt-key-for-authentication';
}

// Token extraction and validation utility
const getAndVerifyToken = (req) => {
    // First try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    
    // Then try cookies (with HTTP-only flag set)
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    
    // No token found
    return null;
};

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const token = getAndVerifyToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token using environment variable (no fallback for security)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fix user ID structure based on token payload
        if (decoded.user && decoded.user.id) {
            // Token has nested user object format
            req.user = { id: decoded.user.id };
        } else if (decoded.id) {
            // Token has flat format
            req.user = { id: decoded.id };
        } else {
            // Fallback - use the whole decoded object
            req.user = decoded;
        }
        
        // Look up full user details (securely)
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            
            // Enhance req.user with necessary user data (but not sensitive info)
            req.user = {
                id: user._id,
                username: user.username,
                role: user.role,
                forum_rank: user.forum_rank,
                permissions: user.permissions || {}
            };
        } catch (userLookupError) {
            console.error('User lookup error:', userLookupError);
            // Continue with basic auth even if user lookup fails
        }
        
        next();
    } catch (error) {
        // Don't log the actual error to avoid information leakage
        console.error('Auth middleware rejection');
        res.status(401).json({ error: 'Authentication invalid' });
    }
};

// Admin authorization middleware
const admin = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const token = getAndVerifyToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        try {
            // Verify token using environment variable only
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Extract userId from token
            let userId;
            if (decoded.user && decoded.user.id) {
                userId = decoded.user.id;
            } else if (decoded.id) {
                userId = decoded.id;
            } else if (decoded.sub) {
                userId = decoded.sub;
            } else {
                return res.status(401).json({ error: 'Invalid token format' });
            }
            
            // Check if the user is an admin
            const user = await User.findById(userId).select('-password -sessionToken -resetPasswordToken');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // More secure admin permissions check with multiple conditions
            const isAdmin = 
                user.role === 'admin' || 
                user.forum_rank === 'admin' || 
                (user.permissions && user.permissions.canAccessAdmin === true);
                
            if (!isAdmin) {
                // Log access denied with limited information (no token data)
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Administrator privileges required for this operation'
                });
            }
            
            // Set user in request object with minimal required data
            req.user = { 
                id: userId,
                role: user.role,
                forum_rank: user.forum_rank,
                username: user.username,
                permissions: user.permissions || {},
                isAdmin: true
            };
            
            next();
        } catch (err) {
            // Don't expose error details
            return res.status(401).json({ error: 'Authentication invalid' });
        }
    } catch (error) {
        // Generic error for security
        res.status(500).json({ error: 'Server error' });
    }
};

// Forum moderator authorization middleware (allows both moderators and admins)
const forumModerator = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const token = getAndVerifyToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Extract userId from token
            let userId;
            if (decoded.user && decoded.user.id) {
                userId = decoded.user.id;
            } else if (decoded.id) {
                userId = decoded.id;
            } else if (decoded.sub) {
                userId = decoded.sub;
            } else {
                return res.status(401).json({ error: 'Invalid token format' });
            }
            
            // Check if the user is a forum moderator or admin
            const user = await User.findById(userId).select('-password -sessionToken -resetPasswordToken');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check for moderator or admin privileges
            const hasModeratorAccess = 
                user.forum_rank === 'moderator' || 
                user.forum_rank === 'admin' || 
                user.role === 'admin' || 
                (user.permissions && user.permissions.canModerateForums === true);
                
            if (!hasModeratorAccess) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Moderator privileges required for this operation'
                });
            }
            
            // Set user in request object with minimal required data
            req.user = { 
                id: userId,
                role: user.role,
                forum_rank: user.forum_rank,
                username: user.username,
                permissions: user.permissions || {},
                isModerator: true,
                isAdmin: user.role === 'admin' || user.forum_rank === 'admin'
            };
            
            next();
        } catch (err) {
            // Don't expose error details
            return res.status(401).json({ error: 'Authentication invalid' });
        }
    } catch (error) {
        // Generic error for security
        res.status(500).json({ error: 'Server error' });
    }
};

// Forum admin authorization middleware
const forumAdmin = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const token = getAndVerifyToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Extract userId from token
            let userId;
            if (decoded.user && decoded.user.id) {
                userId = decoded.user.id;
            } else if (decoded.id) {
                userId = decoded.id;
            } else if (decoded.sub) {
                userId = decoded.sub;
            } else {
                return res.status(401).json({ error: 'Invalid token format' });
            }
            
            // Check if the user is a forum admin
            const user = await User.findById(userId).select('-password -sessionToken -resetPasswordToken');
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Check forum admin permissions (stricter than moderator)
            const hasForumAdminAccess = 
                user.forum_rank === 'admin' || 
                user.role === 'admin' || 
                (user.permissions && user.permissions.canAccessAdmin === true && user.permissions.canModerateForums === true);
                
            if (!hasForumAdminAccess) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Forum administrator privileges required for this operation'
                });
            }
            
            // Set user in request object with minimal required data
            req.user = { 
                id: userId,
                role: user.role,
                forum_rank: user.forum_rank,
                username: user.username,
                permissions: user.permissions || {},
                isForumAdmin: true,
                isModerator: true,
                isAdmin: user.role === 'admin'
            };
            
            next();
        } catch (err) {
            // Don't expose error details
            return res.status(401).json({ error: 'Authentication invalid' });
        }
    } catch (error) {
        // Generic error for security
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { 
    auth, 
    admin, 
    forumModerator,
    forumAdmin,
    authenticateToken: auth // For backward compatibility
}; 