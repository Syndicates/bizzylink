/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file test-notification.js
 * @description Test script to send a notification to a user
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bizzylink')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Load models
let User, Notification;
try {
  User = require('./backend/src/models/User');
  Notification = require('./backend/src/models/Notification');
} catch (error) {
  try {
    User = require('./models/User');
    Notification = require('./models/Notification');
  } catch (innerError) {
    console.error('Failed to load models:', innerError);
    process.exit(1);
  }
}

// Function to create a notification
async function createTestNotification(username, message, type = 'system') {
  try {
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`User ${username} not found`);
      return false;
    }

    // Create notification
    const notification = new Notification({
      user: user._id,
      message: message || `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
      read: false,
      createdAt: new Date()
    });

    await notification.save();
    console.log(`Notification created for ${username}:`, notification);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// Ask for username
rl.question('Enter username to send notification to: ', (username) => {
  rl.question('Enter notification message (or press Enter for default): ', async (message) => {
    const result = await createTestNotification(username, message);
    if (result) {
      console.log('Notification sent successfully!');
    } else {
      console.log('Failed to send notification');
    }
    
    mongoose.connection.close();
    rl.close();
  });
}); 