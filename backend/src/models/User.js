const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const KnownIPSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  trusted: { type: Boolean, default: false }
});

const MinecraftRankSchema = new mongoose.Schema({
  server: { type: String, default: 'global' },
  rank: { type: String, required: true },
  prefix: { type: String },
  suffix: { type: String },
  isOperator: { type: Boolean, default: false },
  permissions: [String]
});

const TitleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'godly', 'divine'],
    default: 'common'
  },
  category: { type: String },
  unlocked: { type: Boolean, default: false },
  unlockedDate: { type: Date },
  textColor: { type: String, default: 'text-white' }
});

const AchievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  progress: { type: Number, default: 0 },
  maxProgress: { type: Number, default: 100 },
  unlocked: { type: Boolean, default: false },
  unlockedDate: { type: Date },
  icon: { type: String }
});

const UserSchema = new mongoose.Schema({
  // Core user data
  username: { 
    type: String, 
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Please provide an email address'],
    unique: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email address'
    ]
  },
  password: { 
    type: String, 
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Minecraft integration
  minecraftUUID: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true
  },
  minecraftUsername: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true
  },
  linkCode: { 
    type: String,
    trim: true
  },
  linkExpiryDate: { 
    type: Date 
  },
  
  // Rank system
  webRank: { 
    type: String, 
    enum: ['user', 'helper', 'moderator', 'admin', 'owner', 'developer', 'content_creator', 'tiktok_sub', 'donor'],
    default: 'user'
  },
  
  // LuckPerms integration
  minecraftRanks: [MinecraftRankSchema],
  
  // Titles system
  titles: [TitleSchema],
  activeTitle: { type: String },
  
  // Achievements system
  achievements: [AchievementSchema],
  
  // Security & session management
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  
  // IP tracking for security
  knownIPs: [KnownIPSchema],
  
  // User preferences
  preferences: {
    theme: { type: String, default: 'dark' },
    emailNotifications: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  }
});

// Add indexes for performance
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ minecraftUUID: 1 }, { sparse: true });
UserSchema.index({ minecraftUsername: 1 }, { sparse: true });
UserSchema.index({ webRank: 1 });

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      rank: this.webRank,
      isAdmin: this.webRank === 'admin' || this.webRank === 'owner',
      isLinked: !!this.minecraftUUID
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Add method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.webRank === 'admin' || this.webRank === 'owner';
};

// Add method to check if user has minecraft account linked
UserSchema.methods.isLinked = function() {
  return !!this.minecraftUUID;
};

// Add method to generate link code
UserSchema.methods.generateLinkCode = function() {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Set link code and expiry (30 minutes)
  this.linkCode = code;
  this.linkExpiryDate = new Date(Date.now() + 30 * 60 * 1000);
  
  return code;
};

// Add method to check if link code is valid
UserSchema.methods.isLinkCodeValid = function() {
  return this.linkCode && this.linkExpiryDate && this.linkExpiryDate > new Date();
};

// Add method to link minecraft account
UserSchema.methods.linkMinecraftAccount = function(uuid, username) {
  this.minecraftUUID = uuid;
  this.minecraftUsername = username;
  this.linkCode = undefined;
  this.linkExpiryDate = undefined;
};

module.exports = mongoose.model('User', UserSchema);