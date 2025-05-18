/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file test-leaderboard.js
 * @description Simple script to test MongoDB connection and get Minecraft player data for leaderboard
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the database
async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/bizzylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check if we have any users with linked Minecraft accounts
    const db = mongoose.connection.db;
    
    // Query for all users with linked Minecraft accounts
    const pipeline = [
      {
        $match: {
          'minecraft.linked': true,
          'minecraft.mcUsername': { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          mcUsername: '$minecraft.mcUsername',
          mcUUID: '$minecraft.mcUUID',
          playtime_minutes: '$minecraft.stats.playtime_minutes',
          playtime: '$minecraft.stats.playtime',
          balance: '$minecraft.stats.balance',
          blocks_mined: '$minecraft.stats.blocks_mined',
          mobs_killed: '$minecraft.stats.mobs_killed',
          achievements: '$minecraft.stats.achievements'
        }
      },
      {
        $sort: { playtime_minutes: -1 }
      },
      {
        $limit: 10
      }
    ];
    
    console.log('Querying for users with linked Minecraft accounts...');
    const users = await db.collection('users').aggregate(pipeline).toArray();
    
    console.log(`Found ${users.length} users with linked Minecraft accounts`);
    console.log('Top players by playtime:');
    
    if (users.length === 0) {
      console.log('No users found with linked Minecraft accounts');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.mcUsername}) - ${user.playtime || 'No playtime data'}`);
      });
      
      console.log('\nFirst user details:');
      console.log(JSON.stringify(users[0], null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('Done');
  }
}

main(); 