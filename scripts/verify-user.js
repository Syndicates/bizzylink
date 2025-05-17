/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file verify-user.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Verify User Script
 * 
 * This script connects to the database and verifies if a specific user exists
 * and checks that the password is valid.
 * 
 * Usage: node scripts/verify-user.js <username> <password>
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

// Verify a user exists and password is valid
const verifyUser = async (username, password) => {
  try {
    console.log(`Verifying user: ${username}`);
    
    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ User ${username} not found in database`);
      return false;
    }
    
    console.log(`✅ User ${username} found in database`);
    console.log(`User ID: ${user._id}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.accountStatus || 'active'}`);
    console.log(`Linked: ${user.linked ? 'Yes' : 'No'}`);
    
    // Check if account is locked
    if (user.failedLoginAttempts && user.failedLoginAttempts.lockUntil) {
      const lockUntil = new Date(user.failedLoginAttempts.lockUntil);
      if (lockUntil > new Date()) {
        console.log(`❌ Account is locked until: ${lockUntil}`);
      } else {
        console.log(`✅ Account lock has expired`);
      }
    }
    
    // Verify password if provided
    if (password) {
      console.log('Verifying password...');
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        console.log('✅ Password is correct');
      } else {
        console.log('❌ Password is incorrect');
      }
      
      // Show failed login attempts
      console.log(`Failed login attempts: ${user.failedLoginAttempts?.count || 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

// Create a password hash for a new user
const createPasswordHash = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Create a new user if not exists
const createUserIfNotExists = async (username, password) => {
  try {
    // Check if user exists
    let user = await User.findOne({ username });
    
    if (user) {
      console.log(`User ${username} already exists`);
      return user;
    }
    
    console.log(`Creating new user: ${username}`);
    
    // Create password hash
    const hashedPassword = await createPasswordHash(password);
    
    // Create new user
    user = new User({
      username,
      password: hashedPassword,
      role: 'user',
      forum_rank: 'user',
      registeredAt: new Date(),
      accountStatus: 'active'
    });
    
    await user.save();
    console.log(`✅ User ${username} created successfully`);
    console.log(`User ID: ${user._id}`);
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Main function
const main = async () => {
  // Get command line arguments
  const username = process.argv[2];
  const password = process.argv[3];
  const createFlag = process.argv.includes('--create');
  
  if (!username) {
    console.log('Usage: node verify-user.js <username> [password] [--create]');
    console.log('Options:');
    console.log('  --create  Create the user if it does not exist');
    process.exit(1);
  }
  
  await connectDB();
  
  // Verify user
  const userExists = await verifyUser(username, password);
  
  // Create user if requested and doesn't exist
  if (!userExists && createFlag && password) {
    await createUserIfNotExists(username, password);
  }
  
  // Close connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
};

// Run the script
main();