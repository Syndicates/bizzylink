/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2024          |
 * +-------------------------------------------------+
 * 
 * @file simple-leaderboard-server.js
 * @description Express server for fetching and serving game leaderboard data
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = 8083;

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bizzylink')
  .then(() => {
    console.log('Connected to MongoDB');
    global.db = mongoose.connection.db;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Generate formatted timestamp for lastSeen
function formatLastSeen(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Unknown';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Function to get leaderboard data
async function getLeaderboardData(category, timeFrame, limit) {
  try {
    console.log(`Getting leaderboard data for ${category}, timeFrame: ${timeFrame}, limit: ${limit}`);
    
    // Query for players with Minecraft accounts linked
    let pipeline = [
      // Only include players with linked Minecraft accounts
      { 
        $match: { 
          'minecraft.linked': true,
          'minecraft.mcUsername': { $exists: true, $ne: null },
          'minecraft.mcUUID': { $exists: true, $ne: null }
        } 
      }
    ];
    
    // Add sorting based on category
    switch(category) {
      case 'playtime':
        pipeline.push(
          { $addFields: {
              playtime_minutes: { $ifNull: ['$minecraft.stats.playtime_minutes', 0] },
              playtime: { $ifNull: ['$minecraft.stats.playtime', '0m'] },
              balance: { $ifNull: ['$minecraft.stats.balance', 0] },
              lastSeen: { $ifNull: ['$minecraft.stats.lastSeen', 'N/A'] },
              level: { $ifNull: ['$minecraft.stats.level', 1] },
              experience: { $ifNull: ['$minecraft.stats.experience', 0] },
              rank: { $ifNull: ['$minecraft.stats.rank', 'Member'] },
              blocks_mined: { $ifNull: ['$minecraft.stats.blocks_mined', 0] },
              mobs_killed: { $ifNull: ['$minecraft.stats.mobs_killed', 0] },
              deaths: { $ifNull: ['$minecraft.stats.deaths', 0] },
              world: { $ifNull: ['$minecraft.stats.world', 'world'] },
              gamemode: { $ifNull: ['$minecraft.stats.gamemode', 'SURVIVAL'] },
              achievements: { $ifNull: ['$minecraft.stats.achievements', 0] },
              advancements: { $size: { $ifNull: ['$minecraft.stats.advancements', []] } },
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID'
            }
          },
          { $sort: { playtime_minutes: -1 } },
          { $project: {
              id: '$_id',
              username: 1,
              mcUsername: 1,
              uuid: 1,
              playtime_minutes: 1,
              playtime: 1,
              lastSeen: 1,
              balance: 1,
              level: 1,
              experience: 1,
              rank: 1,
              blocks_mined: 1,
              mobs_killed: 1,
              deaths: 1,
              world: 1,
              gamemode: 1,
              achievements: 1,
              advancements: 1
            }
          }
        );
        break;
      case 'economy':
        pipeline.push(
          // Try multiple possible paths for balance data
          { $addFields: {
              'effectiveBalance': { 
                $ifNull: [
                  '$minecraft.stats.balance', 
                  { $ifNull: ['$minecraft.economy.balance', 0] }
                ]
              }
            }
          },
          { $sort: { 'effectiveBalance': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              balance: '$effectiveBalance',
              money_earned: { $ifNull: ['$minecraft.stats.money_earned', 0] },
              money_spent: { $ifNull: ['$minecraft.stats.money_spent', 0] },
              // Added support for daily earnings; will be 0 if not present in db
              money_earned_today: { $ifNull: ['$minecraft.stats.money_earned_today', 0] }
            }
          }
        );
        break;
      case 'mcmmo':
        pipeline.push(
          { $sort: { 'minecraft.stats.mcmmo_power_level': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              mcmmo_power_level: { $ifNull: ['$minecraft.stats.mcmmo_power_level', 0] },
              skills: { $ifNull: ['$minecraft.stats.mcmmo_data.skills', {}] }
            }
          }
        );
        break;
      case 'kills':
        pipeline.push(
          { $sort: { 'minecraft.stats.mobs_killed': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              mobs_killed: { $ifNull: ['$minecraft.stats.mobs_killed', 0] },
              player_kills: { $ifNull: ['$minecraft.stats.player_kills', 0] },
              deaths: { $ifNull: ['$minecraft.stats.deaths', 0] },
              kdr: { 
                $cond: [
                  { $gt: [{ $ifNull: ['$minecraft.stats.deaths', 0] }, 0] },
                  { $divide: [{ $ifNull: ['$minecraft.stats.mobs_killed', 0] }, { $ifNull: ['$minecraft.stats.deaths', 1] }] },
                  { $ifNull: ['$minecraft.stats.mobs_killed', 0] }
                ]
              }
            }
          }
        );
        break;
      case 'mining':
        pipeline.push(
          { $sort: { 'minecraft.stats.blocks_mined': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              blocks_mined: { $ifNull: ['$minecraft.stats.blocks_mined', 0] },
              ores_mined: { $ifNull: ['$minecraft.stats.ores_mined', 0] },
              diamonds_mined: { $ifNull: ['$minecraft.stats.diamonds_mined', 0] }
            }
          }
        );
        break;
      case 'achievements':
        pipeline.push(
          { $sort: { 'minecraft.stats.achievements': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              achievements: { $ifNull: ['$minecraft.stats.achievements', 0] },
              advancements_completed: { $ifNull: ['$minecraft.stats.advancements_completed', 0] }
            }
          }
        );
        break;
      default:
        // Default to playtime if category not recognized
        pipeline.push(
          { $sort: { 'minecraft.stats.playtime_minutes': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeenRaw: { $ifNull: ['$minecraft.lastSeen', '$lastUpdated'] },
              playtime_minutes: '$minecraft.stats.playtime_minutes',
              playtime: '$minecraft.stats.playtime'
            }
          }
        );
    }
    
    // Limit the results
    pipeline.push({ $limit: parseInt(limit) || 10 });
    
    // Execute the aggregation pipeline
    const players = await mongoose.connection.db.collection('users').aggregate(pipeline).toArray();
    console.log(`Found ${players.length} players for leaderboard category: ${category}`);
    
    // Post-processing for lastSeen
    const processedPlayers = players.map(player => {
      return {
        ...player,
        lastSeen: formatLastSeen(player.lastSeenRaw),
        // Remove raw timestamp from final output
        lastSeenRaw: undefined
      };
    });
    
    // If no players found, we might need to handle empty state explicitly
    if (players.length === 0) {
      console.log(`No players found for ${category} leaderboard. The database may be empty or missing data.`);
    } else {
      console.log('Sample player data:', JSON.stringify(processedPlayers[0], null, 2));
    }
    
    return processedPlayers;
  } catch (error) {
    console.error(`Error retrieving leaderboard data:`, error);
    return [];
  }
}

// Leaderboard endpoint
app.get('/api/leaderboard/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { timeFrame = 'all', limit = 10 } = req.query;
    
    console.log(`Leaderboard request for category: ${category}, timeFrame: ${timeFrame}, limit: ${limit}`);
    
    // Validate category
    const validCategories = ['playtime', 'economy', 'mcmmo', 'kills', 'mining', 'achievements'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid category. Valid options are: ${validCategories.join(', ')}` 
      });
    }
    
    // Retrieve leaderboard data
    const players = await getLeaderboardData(category, timeFrame, limit);
    
    // Format response
    return res.status(200).json({
      success: true,
      data: {
        players,
        category,
        timeFrame
      }
    });
  } catch (error) {
    console.error(`Error fetching leaderboard data:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving leaderboard data' 
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Leaderboard server is running!',
    port: PORT,
    time: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Leaderboard server running on port ${PORT}`);
}); 