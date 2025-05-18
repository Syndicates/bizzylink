/**
 * Simple MongoDB connection test
 */

const mongoose = require('mongoose');

// Set a timeout for mongo operations
mongoose.set('socketTimeoutMS', 10000);
mongoose.set('connectTimeoutMS', 10000);
mongoose.set('serverSelectionTimeoutMS', 10000);

console.log('Attempting MongoDB connection...');
mongoose.connect('mongodb://localhost:27017/bizzylink').then(async () => {
  console.log('Connected to MongoDB!');
  
  try {
    // Check for users with Minecraft data
    const users = await mongoose.connection.db.collection('users').find({
      'minecraft.linked': true 
    }).toArray();
    
    console.log(`Found ${users.length} users with Minecraft data`);
    
    // Display their minecraft data
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.minecraft.mcUsername})`);
      });
    } else {
      console.log('No users found with Minecraft data. Creating test users...');
      
      // Create a test user
      const testUser = {
        username: 'TestMiner',
        email: 'test@example.com',
        minecraft: {
          linked: true,
          mcUsername: 'TestMiner',
          mcUUID: '12345678-1234-1234-1234-123456789012',
          linkedAt: new Date(),
          stats: {
            playtime_minutes: 1500,
            playtime: '25h 0m',
            balance: 25000,
            blocks_mined: 12500,
            mobs_killed: 750
          }
        }
      };
      
      const result = await mongoose.connection.db.collection('users').insertOne(testUser);
      console.log('Created test user with ID:', result.insertedId);
    }
  } catch (err) {
    console.error('Error during database operations:', err);
  } finally {
    console.log('Closing MongoDB connection');
    await mongoose.connection.close();
  }
}).catch(err => {
  console.error('MongoDB connection failed:', err);
}); 