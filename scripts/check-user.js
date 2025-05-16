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
        console.error('Please provide a username as an argument: node scripts/check-user.js <username>');
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
      console.log(`- Permissions:`, JSON.stringify(user.permissions || {}, null, 2));
      
      // 6. Check for isOperator flag
      console.log(`- isOperator flag: ${user.isOperator}`);
      
      // 7. Check for any other roles
      console.log('Full user document properties:');
      for (const [key, value] of Object.entries(user.toObject())) {
        if (key !== '_id' && key !== 'password' && key !== '__v') {
          console.log(`- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
      }
      
      console.log('\nUser check completed');
      
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