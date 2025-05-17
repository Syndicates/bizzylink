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

// Add a simple in-memory cache
const playerCache = {
  cache: new Map(),
  
  // Set cache with expiration
  set(identifier, data, ttlMs = 30000) { // 30 second cache by default
    this.cache.set(identifier, {
      data,
      expiry: Date.now() + ttlMs
    });
    console.log(`Cached player stats for ${identifier}, expires in ${ttlMs/1000}s`);
  },
  
  // Get from cache, returns undefined if expired or not found
  get(identifier) {
    const item = this.cache.get(identifier);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      console.log(`Cache expired for ${identifier}`);
      this.cache.delete(identifier);
      return undefined;
    }
    
    console.log(`Cache hit for ${identifier}`);
    return item.data;
  },
  
  // Clear cache
  clear() {
    this.cache.clear();
    console.log('Player stats cache cleared');
  },
  
  // Clear entry for specific player
  clearPlayer(identifier) {
    this.cache.delete(identifier);
    console.log(`Cleared cache for player ${identifier}`);
  }
};

// Add a debounce mechanism to prevent duplicate requests
const requestTracker = {
  activeRequests: new Map(),
  
  isActive(identifier) {
    return this.activeRequests.has(identifier);
  },
  
  startRequest(identifier) {
    this.activeRequests.set(identifier, Date.now());
  },
  
  endRequest(identifier) {
    this.activeRequests.delete(identifier);
  }
};

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
    
    // Clear player from cache to force fresh data on next request
    playerCache.clearPlayer(mcUsername);
    playerCache.clearPlayer(userId);
    
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
  console.log('Player stats server test endpoint accessed');
  res.json({
    success: true,
    message: 'Player stats server is working',
    cache: {
      size: playerCache.cache.size,
      status: 'active'
    }
  });
});

// GET endpoint to retrieve player stats by username or UUID
app.get('/api/player/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`Fetching player stats for identifier: ${identifier}`);
    
    // Check cache first
    const cachedData = playerCache.get(identifier);
    if (cachedData) {
      console.log(`Returning cached player data for ${identifier}`);
      return res.json(cachedData);
    }
    
    // Check if there's an active request for this identifier
    if (requestTracker.isActive(identifier)) {
      console.log(`Request already in progress for ${identifier}, sending 'please wait' response`);
      return res.status(429).json({
        success: false,
        error: 'A request for this player is already in progress. Please wait a moment and try again.'
      });
    }
    
    // Mark this request as active
    requestTracker.startRequest(identifier);

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
      // End the active request tracker
      requestTracker.endRequest(identifier);
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
    
    // Cache the response for future requests
    playerCache.set(identifier, response);
    
    console.log(`Found player data for ${identifier}:`, response);
    
    // End the active request tracker
    requestTracker.endRequest(identifier);
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

// Add a new endpoint to clear player cache
app.delete('/api/player/:identifier/cache', (req, res) => {
  const { identifier } = req.params;
  playerCache.clearPlayer(identifier);
  return res.json({ 
    success: true, 
    message: `Cache for player ${identifier} has been cleared` 
  });
});

// Add request logging middleware to log all requests
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  
  console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Request received`);
  
  // Override end method to log response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Response sent: ${res.statusCode} (${duration}ms)`);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Player stats server running on port ${PORT}`);
  console.log(`Test the player stats update with: curl -X POST http://localhost:${PORT}/api/test/player-stats -H "Content-Type: application/json" -d '{"userId":"YOUR_USER_ID","mcUsername":"YOUR_MC_USERNAME","stats":{"achievements":{"MINE_STONE":1}}}'`);
}); 