const mongoose = require('mongoose');
require('dotenv').config();

// 1. Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // 2. Get username from command line
      const username = process.argv[2];
      if (!username) {
        console.error('Please provide a username as an argument: node scripts/demote-user.js <username>');
        process.exit(1);
      }
      
      // 3. Load User model
      const User = require('../models/User');
      
      // 4. Find the user
      const user = await User.findOne({ username });
      if (!user) {
        console.error(`User "${username}" not found`);
        process.exit(1);
      }
      
      // 5. Display current status
      console.log('Current user status:');
      console.log(`- Username: ${user.username}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Forum Rank: ${user.forum_rank}`);
      console.log(`- LuckPerms Group: ${user.luckperms_group || 'none'}`);
      console.log(`- isOperator: ${user.isOperator}`);
      console.log(`- Permissions:`, JSON.stringify(user.permissions || {}, null, 2));
      
      // 6. Update to regular user
      console.log('\nDemoting user to regular user...');
      
      // Direct DB update to avoid any middleware issues
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: {
            role: 'user',
            forum_rank: 'user',
            luckperms_group: 'default',
            isOperator: false,
            permissions: {
              canAccessAdmin: false,
              canModerateForums: false,
              canManageUsers: false,
              canEditServer: false
            }
          }
        }
      );
      
      // 7. Verify update worked
      const updatedUser = await User.findOne({ username });
      console.log('\nNew user status:');
      console.log(`- Username: ${updatedUser.username}`);
      console.log(`- Role: ${updatedUser.role}`);
      console.log(`- Forum Rank: ${updatedUser.forum_rank}`);
      console.log(`- LuckPerms Group: ${updatedUser.luckperms_group || 'none'}`);
      console.log(`- isOperator: ${updatedUser.isOperator}`);
      console.log(`- Permissions:`, JSON.stringify(updatedUser.permissions || {}, null, 2));
      
      console.log('\nUser demotion completed successfully!');
      console.log('Try logging in with this user now');
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // 8. Close the connection
      mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });