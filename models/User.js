/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file User.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_]+$/ // Only allow letters, numbers and underscores
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    minecraft: {
        linked: { 
            type: Boolean, 
            default: false 
        },
        mcUsername: {
            type: String,
            required: false
        },
        mcUUID: { 
            type: String, 
            required: false, 
            index: true,
            sparse: true
        },
        linkCode: { 
            type: String, 
            required: false 
        },
        linkCodeExpires: { 
            type: Date, 
            required: false 
        },
        lastLinked: {
            type: Date,
            required: false
        },
        lastSeen: {
            type: Date,
            required: false
        },
        stats: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    mcUUID: { 
        type: String, 
        required: false, 
        unique: true,
        sparse: true
    },
    mcUsername: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    },
    forum_rank: {
        type: String,
        enum: ['user', 'trusted', 'moderator', 'admin'],
        default: 'user'
    },
    luckperms_group: {
        type: String,
        enum: ['default', 'vip', 'mvp', 'staff', 'moderator', 'admin', 'owner'],
        default: 'default'
    },
    permissions: {
        canAccessAdmin: {
            type: Boolean,
            default: false
        },
        canModerateForums: {
            type: Boolean,
            default: false
        },
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canEditServer: {
            type: Boolean,
            default: false
        }
    },
    avatar: {
        type: String,
        default: '/images/default-avatar.png'
    },
    linked: { 
        type: Boolean, 
        default: false 
    },
    isLinked: { 
        type: Boolean, 
        default: false 
    },
    linkCode: { 
        type: String, 
        required: false 
    },
    linkCodeExpiry: { 
        type: Date, 
        required: false 
    },
    mcLinkedAt: {
        type: Date,
        required: false
    },
    codeExpiry: { 
        type: Date, 
        required: false 
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    registrationIp: {
        type: String
    },
    lastLogin: { 
        type: Date, 
        required: false 
    },
    lastLoginIp: {
        type: String
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active'
    },
    // Track failed login attempts for security
    failedLoginAttempts: {
        count: {
            type: Number,
            default: 0
        },
        lastAttempt: Date,
        lockUntil: Date
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    // Social system fields
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Forum statistics
    postCount: {
        type: Number,
        default: 0
    },
    threadCount: {
        type: Number,
        default: 0
    },
    reputation: {
        type: Number,
        default: 0
    },
    vouches: {
        type: Number,
        default: 0
    },
    // Users who have given reputation to this user
    reputationFrom: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        value: {
            type: Number, // 1 for positive, -1 for negative
            default: 1
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    // Users who have vouched for this user
    vouchesFrom: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        },
        context: { // optional context for the vouch (e.g. transaction id, thread id)
            type: String,
            required: false
        }
    }],
    // Balance used for donations between users
    balance: {
        type: Number,
        default: 0
    },
    // Transaction history for donations
    transactions: [{
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String,
            required: false
        }
    }],
    // User profile signature for forum posts
    signature: {
        type: String,
        required: false,
        maxlength: 500
    },
    // Minecraft player statistics
    mcStats: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    settings: {
        notifications: {
            friendRequests: {
                type: Boolean,
                default: true
            },
            newFollowers: {
                type: Boolean,
                default: true
            },
            friendActivity: {
                type: Boolean,
                default: true
            },
            inGame: {
                type: Boolean,
                default: true
            },
            reputation: {
                type: Boolean,
                default: true
            },
            vouches: {
                type: Boolean,
                default: true
            },
            donations: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'friends', 'private'],
                default: 'public'
            },
            allowFriendRequests: {
                type: Boolean,
                default: true
            },
            allowFollowers: {
                type: Boolean,
                default: true
            },
            showReputation: {
                type: Boolean,
                default: true
            },
            showVouches: {
                type: Boolean,
                default: true
            },
            showBalance: {
                type: Boolean,
                default: true
            }
        }
    },
    avatarUrl: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: ''
    },
    personal: {
        displayName: { type: String, default: '' },
        location: { type: String, default: '' },
        website: { type: String, default: '' },
        birthday: { type: Date, default: null }
    },
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        language: { type: String, default: 'en' }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Minecraft-related fields
    mcData: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// Hash password before saving - FIXED VERSION
UserSchema.pre('save', function(next) {
  const user = this;
  
  // Only hash password if it has been modified
  if (!user.isModified('password')) {
    // Normalize link codes to uppercase
    if (user.linkCode) {
      user.linkCode = user.linkCode.toUpperCase();
    }
    
    if (user.minecraft && user.minecraft.linkCode) {
      user.minecraft.linkCode = user.minecraft.linkCode.toUpperCase();
    }
    
    return next();
  }
  
  // Generate salt
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    
    // Hash the password with the generated salt
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      
      // Replace plaintext password with hash
      user.password = hash;
      
      // Normalize link codes to uppercase
      if (user.linkCode) {
        user.linkCode = user.linkCode.toUpperCase();
      }
      
      if (user.minecraft && user.minecraft.linkCode) {
        user.minecraft.linkCode = user.minecraft.linkCode.toUpperCase();
      }
      
      next();
    });
  });
});

// Method to compare passwords - FIXED VERSION with callbacks
UserSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

// Method to get public profile
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  
  // Ensure permissions are set for older users
  if (!userObject.permissions) {
    userObject.permissions = {
      canAccessAdmin: userObject.role === 'admin' || userObject.forum_rank === 'admin',
      canModerateForums: userObject.role === 'admin' || userObject.forum_rank === 'admin' || userObject.forum_rank === 'moderator',
      canManageUsers: userObject.role === 'admin' || userObject.forum_rank === 'admin',
      canEditServer: userObject.role === 'admin'
    };
  }
  
  return userObject;
};

module.exports = mongoose.model('User', UserSchema); 