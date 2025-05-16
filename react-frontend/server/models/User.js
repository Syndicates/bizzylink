const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define user schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
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
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  forum_rank: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  linked: {
    type: Boolean,
    default: false
  },
  mcUsername: {
    type: String,
    trim: true,
    sparse: true
  },
  mcUUID: {
    type: String,
    trim: true,
    sparse: true
  },
  isOperator: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String
  }],
  profilePicture: {
    type: String,
    default: null
  },
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Update forum rank based on Minecraft operator status - removed auto-admin promotion
UserSchema.methods.updateForumRank = function() {
  // REMOVED automatic admin promotion based on operator status
  // for security reasons
  
  // Handle role consistency
  if (this.forum_rank === 'admin' && this.role !== 'admin') {
    // Only update role if forum_rank is explicitly set to admin
    this.role = this.forum_rank;
  } else if (this.forum_rank === 'moderator' && this.role !== 'moderator') {
    this.role = this.forum_rank;
  }
};

// Virtuals
UserSchema.virtual('displayName').get(function() {
  return this.mcUsername || this.username;
});

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ mcUsername: 1 });
UserSchema.index({ mcUUID: 1 });
UserSchema.index({ forum_rank: 1 });
UserSchema.index({ role: 1 });

// Create and export the User model
const User = mongoose.model('User', UserSchema);
module.exports = User;