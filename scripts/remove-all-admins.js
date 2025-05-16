const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Load User model
      const User = require('../models/User');
      
      console.log('Looking for admin accounts...');
      
      // Find all users with admin role or forum_rank
      const adminUsers = await User.find({
        $or: [
          { role: 'admin' },
          { forum_rank: 'admin' },
          { isOperator: true },
          { 'permissions.canAccessAdmin': true }
        ]
      });
      
      if (adminUsers.length === 0) {
        console.log('No admin accounts found.');
        return;
      }
      
      console.log(`Found ${adminUsers.length} admin accounts:`);
      for (const user of adminUsers) {
        console.log(`- ${user.username} (role: ${user.role}, forum_rank: ${user.forum_rank}, isOperator: ${user.isOperator})`);
      }
      
      // Ask for confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nDo you want to remove ALL these admin accounts? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() !== 'yes') {
          console.log('Operation cancelled.');
          readline.close();
          mongoose.connection.close();
          return;
        }
        
        console.log('\nRemoving admin accounts...');
        
        // Create backup of users before deletion
        console.log('Creating backup of users before deletion...');
        const fs = require('fs');
        const backupPath = `./admin-backup-${Date.now()}.json`;
        fs.writeFileSync(backupPath, JSON.stringify(adminUsers, null, 2));
        console.log(`Backup saved to ${backupPath}`);
        
        // Delete all admin accounts
        for (const user of adminUsers) {
          console.log(`Removing admin account: ${user.username}`);
          await User.deleteOne({ _id: user._id });
        }
        
        console.log('\nAll admin accounts have been removed.');
        console.log('You should now create a new admin account using the promote-user.js script.');
        
        readline.close();
        mongoose.connection.close();
      });
      
    } catch (error) {
      console.error('Error:', error);
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });