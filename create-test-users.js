/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file create-test-users.js
 * @description Script to create test users with Minecraft data for leaderboard testing
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to the database
mongoose.connect('mongodb://localhost:27017/bizzylink')
  .then(async () => {
    try {
      console.log('Connected to MongoDB');
      
      // Define a simple user schema
      const UserSchema = new mongoose.Schema({
        username: String,
        email: String,
        minecraft: {
          linked: Boolean,
          mcUsername: String,
          mcUUID: String,
          linkedAt: Date,
          stats: {
            playtime_minutes: Number,
            playtime: String,
            balance: Number,
            blocks_mined: Number,
            ores_mined: Number,
            diamonds_mined: Number,
            mobs_killed: Number,
            player_kills: Number,
            deaths: Number,
            achievements: Number,
            advancements_completed: Number,
            mcmmo_power_level: Number
          }
        }
      });
      
      // Create model
      const User = mongoose.model('User', UserSchema);
      
      // Check if we have any users with Minecraft data
      const existingUsers = await User.countDocuments({'minecraft.linked': true});
      console.log(`Found ${existingUsers} users with Minecraft accounts linked`);
      
      if (existingUsers < 5) {
        console.log('Creating test users with Minecraft data...');
        
        const testUsers = [
          { username: 'DiamondMiner42', mcUsername: 'DiamondMiner42' },
          { username: 'EmberCraft', mcUsername: 'EmberCraft' },
          { username: 'PixelWarrior', mcUsername: 'PixelWarrior' },
          { username: 'CosmicBuilder', mcUsername: 'CosmicBuilder' },
          { username: 'RubyRaider', mcUsername: 'RubyRaider' },
          { username: 'MythicSurvival', mcUsername: 'MythicSurvival' },
          { username: 'GalaxyGamer', mcUsername: 'GalaxyGamer' },
          { username: 'ShadowExplorer', mcUsername: 'ShadowExplorer' },
          { username: 'EnderCrafter', mcUsername: 'EnderCrafter' },
          { username: 'BlazeRunner', mcUsername: 'BlazeRunner' }
        ];
        
        for (const userData of testUsers) {
          // Check if user already exists
          let user = await User.findOne({username: userData.username});
          
          if (!user) {
            user = new User({
              username: userData.username,
              email: `${userData.username.toLowerCase()}@example.com`
            });
            await user.save();
            console.log(`Created new user: ${userData.username}`);
          }
          
          // Calculate playtime string
          const playtimeMinutes = Math.floor(Math.random() * 10000) + 1000;
          const hours = Math.floor(playtimeMinutes / 60);
          const minutes = playtimeMinutes % 60;
          const playtimeString = `${hours}h ${minutes}m`;
          
          // Generate random stats for variety in the leaderboard
          const blocksMined = Math.floor(Math.random() * 100000) + 5000;
          
          // Update user with Minecraft data
          user.minecraft = {
            linked: true,
            mcUsername: userData.mcUsername,
            mcUUID: crypto.randomUUID(),
            linkedAt: new Date(),
            stats: {
              playtime_minutes: playtimeMinutes,
              playtime: playtimeString,
              balance: Math.floor(Math.random() * 1000000) + 10000,
              blocks_mined: blocksMined,
              ores_mined: Math.floor(blocksMined * 0.15),
              diamonds_mined: Math.floor(blocksMined * 0.01),
              mobs_killed: Math.floor(Math.random() * 5000) + 500,
              player_kills: Math.floor(Math.random() * 50) + 1,
              deaths: Math.floor(Math.random() * 100) + 10,
              achievements: Math.floor(Math.random() * 20) + 5,
              advancements_completed: Math.floor(Math.random() * 60) + 15,
              mcmmo_power_level: Math.floor(Math.random() * 2500) + 500
            }
          };
          
          await user.save();
          console.log(`Updated user ${userData.username} with Minecraft data`);
        }
        
        console.log('Test users created and updated successfully!');
      } else {
        console.log('Enough users with Minecraft data already exist.');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 