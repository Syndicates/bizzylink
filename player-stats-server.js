/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file player-stats-server.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 8081;

// MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017/bizzylink';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB client
let db = null;

// Connect to MongoDB
async function connectToMongo() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Initialize MongoDB connection
connectToMongo().catch(console.error);

// Endpoint to update player stats
app.post('/api/test/player-stats', async (req, res) => {
  console.log('Received player stats update:', JSON.stringify(req.body, null, 2));
  
  try {
    // Validate required fields
    const { userId, mcUsername, stats } = req.body;
    
    if (!userId || !mcUsername || !stats) {
      console.error('Missing required fields in request');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, mcUsername, and stats are required' 
      });
    }
    
    // Ensure we have a MongoDB connection
    if (!db) {
      await connectToMongo();
    }
    
    // Convert userId to ObjectId if it's a string
    let userObjectId;
    try {
      userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    } catch (error) {
      console.error('Invalid userId format:', error);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid userId format. Must be a valid ObjectId.' 
      });
    }
    
    // Update user document with the new stats
    const updateResult = await db.collection('users').updateOne(
      { _id: userObjectId },
      { 
        $set: {
          'minecraft.stats': stats,
          'minecraft.lastUpdated': new Date(),
          'mcUsername': mcUsername,
          'minecraft.username': mcUsername
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({ 
        success: false, 
        error: `User with ID ${userId} not found` 
      });
    }
    
    console.log(`Successfully updated stats for user ${userId} (${mcUsername})`);
    console.log(`Modified ${updateResult.modifiedCount} document(s)`);
    
    return res.json({ 
      success: true, 
      message: `Successfully updated stats for user ${userId} (${mcUsername})` 
    });
  } catch (error) {
    console.error('Error updating player stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Server error: ${error.message}` 
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Player stats server is running' });
});

// GET endpoint to retrieve player stats by username or UUID
app.get('/api/player/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`Fetching player stats for identifier: ${identifier}`);

    // Ensure we have a MongoDB connection
    if (!db) {
      await connectToMongo();
    }
    
    // First, try to find by mcUsername
    let user = await db.collection('users').findOne({
      $or: [
        { 'mcUsername': identifier },
        { 'minecraft.mcUsername': identifier }
      ]
    });
    
    // If not found by username, try to find by UUID
    if (!user) {
      user = await db.collection('users').findOne({
        $or: [
          { 'mcUUID': identifier },
          { 'minecraft.mcUUID': identifier }
        ]
      });
    }
    
    // If still not found, try to treat it as an ObjectId
    if (!user && ObjectId.isValid(identifier)) {
      user = await db.collection('users').findOne({
        _id: new ObjectId(identifier)
      });
    }
    
    if (!user) {
      console.log(`No player found with identifier: ${identifier}`);
      return res.status(404).json({
        success: false,
        error: `Player not found: ${identifier}`
      });
    }
    
    // Construct response with default values
    const response = {
      userId: user._id.toString(),
      username: user.username,
      mcUsername: user.mcUsername || (user.minecraft && user.minecraft.mcUsername),
      mcUUID: user.mcUUID || (user.minecraft && user.minecraft.mcUUID),
      linked: user.linked || (user.minecraft && user.minecraft.linked) || false,
      // Default values for stats
      lastSeen: 'Never',
      balance: 0,
      playtime: '0h',
      level: 1,
      experience: 0,
      blocks_mined: 0,
      mobs_killed: 0,
      deaths: 0,
      rank: 'Member',
      // Include stats if available
      ...(user.minecraft && user.minecraft.stats ? user.minecraft.stats : {})
    };
    
    console.log(`Found player data for ${identifier}:`, response);
    return res.json(response);
    
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Player stats server running on port ${PORT}`);
  console.log(`Test the player stats update with: curl -X POST http://localhost:${PORT}/api/test/player-stats -H "Content-Type: application/json" -d '{"userId":"YOUR_USER_ID","mcUsername":"YOUR_MC_USERNAME","stats":{"achievements":{"MINE_STONE":1}}}'`);
}); 