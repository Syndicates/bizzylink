/**
 * Reset User Password Script
 * 
 * This script updates a user's password in the database
 * 
 * Usage: node scripts/reset-user-password.js <username> <new_password>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/bizzylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Reset a user's password
const resetPassword = async (username, newPassword) => {
  try {
    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ User ${username} not found in database`);
      return false;
    }
    
    console.log(`✅ User ${username} found in database`);
    console.log(`User ID: ${user._id}`);
    
    // Generate password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user
    user.password = hashedPassword;
    
    // Reset failed login attempts
    user.failedLoginAttempts = {
      count: 0,
      lastAttempt: null,
      lockUntil: null
    };
    
    await user.save();
    
    console.log(`✅ Password for ${username} has been reset`);
    console.log(`✅ Failed login attempts have been reset`);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
};

// Main function
const main = async () => {
  // Get command line arguments
  const username = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!username || !newPassword) {
    console.log('Usage: node reset-user-password.js <username> <new_password>');
    process.exit(1);
  }
  
  await connectDB();
  
  // Reset password
  await resetPassword(username, newPassword);
  
  // Close connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
};

// Run the script
main();