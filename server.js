/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file server.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto'); // Use native crypto instead of bcrypt for now
const jwt = require('jsonwebtoken');
const path = require('path');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
// Add Socket.io
const http = require('http');
const socketIo = require('socket.io');
// Use the shared eventEmitter instead of creating a new one
const eventEmitter = require('./eventEmitter');

// Import the enhanced DB connection
const { connectDB, isConnected, withConnection, dbEvents } = require('./db');

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');
// const Session = require('./models/Session');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Import routes
const userRelationshipRoutes = require('./routes/UserRelationshipEndpoint');
const friendRoutes = require('./routes/friends');
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const linkcodeRoutes = require('./routes/linkcode');
const followingRoutes = require('./routes/following');
const forumRoutes = require('./routes/forum');
const adminRoutes = require('./routes/admin');
const minecraftRoutes = require('./routes/minecraft');
const playerRoutes = require('./routes/player');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const playerRouter = require('./routes/player');

// Store active SSE clients
const sseClients = new Map();

// Store active socket clients
const socketClients = new Map();

// Initialize active users map to track connected users
const activeUsers = new Map();

// Helper function to get user sockets
const getUserSockets = (userId) => {
  return Array.from(socketClients.entries())
    .filter(([_, client]) => client.userId === userId)
    .map(([_, client]) => client.socket);
};

// Helper function to send events to specific user - enhanced with WebSocket support
global.notifyUser = function(userId, eventData) {
  if (!userId) return;
  
  console.log(`[notifyUser] Attempting to notify user ${userId} with event:`, eventData.type);
  
  // Add specific handling for Minecraft events
  if (eventData.type && eventData.type.includes('minecraft')) {
    console.log(`[notifyUser] Processing Minecraft event for user ${userId}:`, eventData.type);
    
    // For minecraft_linked events, ensure all clients get updated with the latest status
    if (eventData.type === 'minecraft_linked') {
      // Make this event high priority
      console.log(`[notifyUser] Sending high-priority minecraft_linked event to user ${userId}`);
      
      // Force update to all clients using multiple channels
      setTimeout(() => {
        console.log(`[notifyUser] Sending delayed follow-up notification to user ${userId}`);
        try {
          // Find all clients for this user and send again (for redundancy)
          const userSocketClients = Array.from(socketClients.entries())
            .filter(([_, client]) => client.userId === userId);
          
          userSocketClients.forEach(([id, client]) => {
            try {
              if (client.socket && client.socket.connected) {
                // Send a follow-up refresh event
                client.socket.emit('refresh', { 
                  type: 'refresh',
                  target: 'minecraft',
                  timestamp: new Date()
                });
              }
            } catch (err) {
              console.error(`Error sending refresh to client ${id}:`, err);
            }
          });
        } catch (err) {
          console.error('Error sending delayed notifications:', err);
        }
      }, 3000);
    }
  }
  
  // First try WebSocket clients (faster and more reliable)
  const userSocketClients = Array.from(socketClients.entries())
    .filter(([_, client]) => client.userId === userId);
  
  if (userSocketClients.length > 0) {
    console.log(`[notifyUser] Sending WebSocket notification to ${userSocketClients.length} clients for user ${userId}`);
    
    userSocketClients.forEach(([id, client]) => {
      try {
        if (client.socket && client.socket.connected) {
          client.socket.emit('notification', eventData);
          
          // For Minecraft events, also emit a specific minecraft_event
          if (eventData.type && eventData.type.includes('minecraft')) {
            client.socket.emit('minecraft_event', eventData);
          }
        }
      } catch (err) {
        console.error(`[notifyUser] Error sending WebSocket notification to client ${id}:`, err);
        socketClients.delete(id);
      }
    });
  }
  
  // Then try SSE clients as fallback (backwards compatibility)
  const userClients = Array.from(sseClients.entries())
    .filter(([_, client]) => client.userId === userId);
  
  if (userClients.length === 0 && userSocketClients.length === 0) {
    console.log(`[notifyUser] No connected clients for user ${userId}`);
    return;
  }
  
  if (userClients.length > 0) {
    console.log(`[notifyUser] Sending SSE notification to ${userClients.length} clients for user ${userId}`);
    
    userClients.forEach(([id, client]) => {
      try {
        // Format the message for SSE
        const eventMessage = `data: ${JSON.stringify(eventData)}\n\n`;
        client.res.write(eventMessage);
      } catch (err) {
        console.error(`[notifyUser] Error sending SSE notification to client ${id}:`, err);
        sseClients.delete(id);
      }
    });
  }
};

// New helper for specific player stat updates
global.updatePlayerStats = function(userId, mcUsername, statData) {
  // Create an event with the user's updated stats
  const eventData = {
    type: 'player_stats_update',
    userId: userId,
    mcUsername: mcUsername,
    timestamp: Date.now(),
    data: statData
  };
  
  // Send to the user via our notification system
  global.notifyUser(userId, eventData);
}

// Initialize Express app
const app = express();

// Configure rate limiters for different endpoints
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = true) => {
    return rateLimit({
        windowMs,
        max,
    message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
    // Allows successful responses to not count against rate limit
        skipSuccessfulRequests,
    // Always skip rate limiting in development mode or if env variable is set
    skip: (req) => process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true'
    });
};

// Define rate limiters with different settings - but much more permissive
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  600,            // 600 requests per window (40/minute)
  'Too many requests, please try again later.'
);

// Stricter rate limit for authentication endpoints - increased limits for development
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200,            // 200 login attempts per window (increased from 30)
  'Too many login attempts, please try again later.',
  true            // Only count failed requests against limit (was false)
);

// Rate limit for password reset
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 60 minutes
  10,             // 10 attempts per window
  'Too many password reset attempts, please try again later.',
  false           // Count all requests, not just failed ones
);

// Rate limit for admin endpoints
const adminLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200,            // 200 requests per window
  'Too many requests to admin endpoints, please try again later.'
);

// Rate limit for leaderboard endpoints
const leaderboardRateLimiter = createRateLimiter(
  5 * 60 * 1000,  // 5 minutes
  100,            // 100 requests per window
  'Too many leaderboard requests, please try again later.'
);

// CORS configuration with enhanced security but more permissive in development
app.use(cors({
    origin: function(origin, callback) {
        // In development mode, allow all origins for easier testing
        if (process.env.NODE_ENV === 'development') {
            // Don't use wildcard when credentials are true
            // Instead, echo back the origin of the request
            return callback(null, origin || true);
        }
        
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        
        // List of allowed origins - use environment variables instead of hardcoding
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8080,http://localhost:8081')
          .split(',')
          .map(origin => origin.trim());
        
        // If WEBSITE_URL is defined in environment, add it to allowed origins
        if (process.env.WEBSITE_URL) {
            allowedOrigins.push(process.env.WEBSITE_URL);
        }
        
        // Check if the origin is allowed
        if (allowedOrigins.includes(origin)) {
            callback(null, origin); // Echo back the specific origin instead of true
        } else {
            console.log(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // CORS preflight request cache time - 24 hours
}));

// Parse JSON bodies with reasonable limits for development
app.use(bodyParser.json({ 
  limit: '1mb', // Increased from 250kb
  // Only perform strict JSON validation in production
  verify: (req, res, buf) => {
    if (process.env.NODE_ENV === 'production') {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }
}));

// Set cookie parser with secure options
app.use(cookieParser());

// Configuration for security headers
const helmetConfig = process.env.NODE_ENV === 'production' ? 
  // Production security configuration
  {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://crafatar.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      }
    },
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true
    },
    noSniff: true,
    xssFilter: true
  } 
  : 
  // Development security configuration (much less restrictive)
  {
    contentSecurityPolicy: false, // Disable CSP in development
    hsts: false, // Disable HSTS in development
    noSniff: true, 
    xssFilter: true
  };

// Apply security headers with environment-appropriate configuration
app.use(helmet(helmetConfig));

// Apply rate limiting only to specific sensitive endpoints
// Don't apply general limiting to ALL api routes as that's too restrictive
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/password/reset', passwordResetLimiter);
app.use('/api/admin/users/emergency', adminLimiter); // Only emergency endpoints
// Removed app.use('/api/', generalLimiter) as it was too restrictive

// Register emergency login route - REMOVE BEFORE PRODUCTION
app.use('/api', require('./routes/emergency-login'));

// Register routes
app.use('/api/user/relationship', userRelationshipRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api', authRoutes); // Register auth routes under /api
app.use('/api/notifications', notificationRoutes);
app.use('/api/linkcode', linkcodeRoutes);
app.use('/api/following', followingRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/minecraft', minecraftRoutes);
app.use('/api/player', playerRoutes); // Register player routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/player', playerRouter);

// SSE endpoint for real-time notifications
app.get('/api/events', authenticateToken, (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevent Nginx from buffering the response
  
  // Extract user ID from the authenticated request
  const userId = req.user.id || req.user._id || req.user;
  
  if (!userId) {
    console.error('SSE connection failed: No user ID in token');
    return res.status(401).json({ error: 'Authentication failed' });
  }
  
  console.log(`SSE connection attempt with token:`, userId ? 'Token provided' : 'No token');
  
  // Check for existing connections for this user and limit to 3 max connections per user
  const userConnections = Array.from(sseClients.values())
    .filter(client => client.userId === userId);
  
  if (userConnections.length >= 3) {
    console.log(`User ${userId} already has ${userConnections.length} SSE connections. Closing oldest.`);
    // Find the oldest connection and close it
    const oldestConnection = userConnections.sort((a, b) => a.connectedAt - b.connectedAt)[0];
    if (oldestConnection) {
      try {
        // Send a close message to the client
        oldestConnection.res.write('event: close\ndata: {"reason":"Too many connections"}\n\n');
        oldestConnection.res.end();
        sseClients.delete(oldestConnection.id);
        console.log(`Closed oldest SSE connection for user ${userId}`);
      } catch (err) {
        console.error(`Error closing old SSE connection:`, err);
        // Just remove from tracking if we can't close cleanly
        sseClients.delete(oldestConnection.id);
      }
    }
  }
  
  // Generate a unique ID for this connection
  const clientId = crypto.randomBytes(16).toString('hex');
  
  // Add client to the map
  sseClients.set(clientId, {
    id: clientId,
    userId: userId,
    res,
    connectedAt: Date.now(),
    lastActivity: Date.now()
  });
  
  console.log(`SSE connection established for user ${userId}`);
  
  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', connectionId: clientId })}\n\n`);
  
  // Send a heartbeat every 30 seconds to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat ${Date.now()}\n\n`);
      
      // Update last activity timestamp
      if (sseClients.has(clientId)) {
        const client = sseClients.get(clientId);
        client.lastActivity = Date.now();
        sseClients.set(clientId, client);
      }
    } catch (error) {
      // Connection might be closed
      console.error(`Error sending heartbeat to client ${clientId}:`, error);
      clearInterval(heartbeatInterval);
      
      // Clean up the client if not already removed
      if (sseClients.has(clientId)) {
        sseClients.delete(clientId);
        console.log(`SSE connection removed due to heartbeat error: ${clientId}`);
      }
    }
  }, 30000);
  
  // Handle connection close
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    
    // Remove client from the map
    if (sseClients.has(clientId)) {
      sseClients.delete(clientId);
      console.log(`SSE connection closed for user ${userId}`);
    }
  });
});

// Find the test endpoint and make sure it's working
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ success: true, message: 'Server is working' });
});

app.post('/api/test', (req, res) => {
  console.log('Test POST endpoint hit with body:', req.body);
  res.status(200).json({ 
    success: true, 
    message: 'Server is working', 
    receivedData: req.body 
  });
});

// Player stats update route - Handles Minecraft player stats updates
app.post('/api/test/player-stats', (req, res) => {
  try {
    const { userId, mcUsername, stats } = req.body;
    
    // Add request logging
    console.log(`Received stats update for user ${userId} (${mcUsername})`);
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    // Validate required fields
    if (!userId || !mcUsername || !stats) {
      console.error('Missing required fields in player stats update:', { userId, mcUsername, hasStats: !!stats });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, mcUsername, and stats are required' 
      });
    }
    
    // Create event with user stats
    const statsEvent = {
      userId,
      mcUsername,
      stats
    };
    
    // Send update to connected WebSocket clients
    const userSockets = getUserSockets(userId);
    if (userSockets && userSockets.length > 0) {
      userSockets.forEach(socket => {
        socket.emit('stats-update', statsEvent);
        console.log(`Sent stats update to WebSocket client: ${socket.id}`);
      });
    } else {
      console.log(`No connected clients for user ${userId}`);
    }
    
    // Send update to SSE clients if any
    if (sseClients) {
      const userSSEClients = Array.from(sseClients.values())
        .filter(client => client.userId === userId);
      
      if (userSSEClients && userSSEClients.length > 0) {
        userSSEClients.forEach(client => {
          client.res.write(`data: ${JSON.stringify({ type: 'stats-update', data: statsEvent })}\n\n`);
          console.log(`Sent stats update to SSE client: ${client.id}`);
        });
      }
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Stats update sent to connected clients'
    });
    
  } catch (error) {
    console.error('Error updating player stats:', error);
    return res.status(500).json({ 
        success: false,
      message: 'Error processing stats update'
    });
  }
});

// Function to get leaderboard data from the database
const getLeaderboardData = async (category, timeFrame, limit) => {
  try {
    console.log(`Getting leaderboard data for ${category}, timeFrame: ${timeFrame}, limit: ${limit}`);
    
    // Create sample player data for development environment
    const generateSamplePlayers = () => {
      console.log('Generating sample leaderboard data for development');
      
      const ranks = ['Member', 'VIP', 'VIP+', 'MVP', 'MVP+', 'Admin'];
      const usernames = [
        'DiamondMiner42', 'EmberCraft', 'PixelWarrior', 'CosmicBuilder', 
        'RubyRaider', 'MythicSurvival', 'GalaxyGamer', 'ShadowExplorer',
        'EnderCrafter', 'BlazeRunner', 'FrostByte', 'SapphireQuest'
      ];
      
      return usernames.map((username, index) => {
        const now = new Date();
        const lastSeen = new Date(now - Math.floor(Math.random() * 1000000000));
        
        // Base player data
        const player = {
          id: `player-${index}`,
          username,
          mcUsername: username,
          uuid: `sample-${index}-uuid-${Math.random().toString(36).substring(2, 15)}`,
          rank: ranks[Math.floor(Math.random() * ranks.length)],
          lastSeen: lastSeen
        };
        
        // Add category-specific data
        switch(category) {
          case 'playtime':
            player.playtime_minutes = 10000 - (index * 800) + Math.floor(Math.random() * 500);
            const hours = Math.floor(player.playtime_minutes / 60);
            const mins = player.playtime_minutes % 60;
            player.playtime = `${hours}h ${mins}m`;
            break;
          case 'economy':
            player.balance = 1000000 - (index * 75000) + Math.floor(Math.random() * 20000);
            player.money_earned = Math.floor(Math.random() * 10000) + 500;
            player.money_spent = Math.floor(Math.random() * 5000) + 300;
            break;
          case 'mcmmo':
            player.mcmmo_power_level = 2500 - (index * 200) + Math.floor(Math.random() * 100);
            player.skills = {
              mining: Math.floor(Math.random() * 500) + 200,
              woodcutting: Math.floor(Math.random() * 500) + 150,
              herbalism: Math.floor(Math.random() * 500) + 100,
              fishing: Math.floor(Math.random() * 500) + 50,
              excavation: Math.floor(Math.random() * 500) + 25
            };
            break;
          case 'kills':
            player.mobs_killed = 5000 - (index * 400) + Math.floor(Math.random() * 200);
            player.player_kills = Math.floor(Math.random() * 50) + 1;
            player.deaths = Math.floor(Math.random() * 200) + 10;
            break;
          case 'mining':
            player.blocks_mined = 100000 - (index * 8000) + Math.floor(Math.random() * 4000);
            player.ores_mined = Math.floor(player.blocks_mined * 0.15);
            player.diamonds_mined = Math.floor(player.ores_mined * 0.05);
            break;
          case 'achievements':
            player.achievements = Math.floor(Math.random() * 15) + 5;
            player.advancements_completed = player.achievements * 3;
            break;
          default:
            // Add default data for any other category
            player.playtime_minutes = 10000 - (index * 800) + Math.floor(Math.random() * 500);
            const h = Math.floor(player.playtime_minutes / 60);
            const m = player.playtime_minutes % 60;
            player.playtime = `${h}h ${m}m`;
        }
        
        return player;
      });
    };
    
    // Initialize MongoDB connection if needed
    const db = global.db;
    if (!db) {
      console.error('Database connection not available');
      return generateSamplePlayers();
    }
    
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
    
    // Add category-specific sorting and fields
    switch(category) {
      case 'playtime':
        pipeline.push(
          { $sort: { 'minecraft.stats.playtime_minutes': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeen: '$minecraft.lastSeen',
              playtime_minutes: '$minecraft.stats.playtime_minutes',
              playtime: '$minecraft.stats.playtime'
            }
          }
        );
        break;
      case 'economy':
        pipeline.push(
          { $sort: { 'minecraft.stats.balance': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeen: '$minecraft.lastSeen',
              balance: '$minecraft.stats.balance',
              money_earned: '$minecraft.stats.money_earned',
              money_spent: '$minecraft.stats.money_spent'
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
              lastSeen: '$minecraft.lastSeen',
              mcmmo_power_level: '$minecraft.stats.mcmmo_power_level',
              skills: '$minecraft.stats.mcmmo_data.skills'
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
              lastSeen: '$minecraft.lastSeen',
              mobs_killed: '$minecraft.stats.mobs_killed',
              player_kills: '$minecraft.stats.player_kills',
              deaths: '$minecraft.stats.deaths',
              kdr: { 
                $cond: [
                  { $gt: ['$minecraft.stats.deaths', 0] },
                  { $divide: ['$minecraft.stats.mobs_killed', '$minecraft.stats.deaths'] },
                  '$minecraft.stats.mobs_killed'
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
              lastSeen: '$minecraft.lastSeen',
              blocks_mined: '$minecraft.stats.blocks_mined',
              ores_mined: '$minecraft.stats.ores_mined',
              diamonds_mined: '$minecraft.stats.diamonds_mined'
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
              lastSeen: '$minecraft.lastSeen',
              achievements: '$minecraft.stats.achievements',
              advancements_completed: '$minecraft.stats.advancements_completed'
            }
          }
        );
        break;
      default:
        // Default to playtime if category is not recognized
        pipeline.push(
          { $sort: { 'minecraft.stats.playtime_minutes': -1 } },
          { 
            $project: {
              id: '$_id',
              username: 1,
              mcUsername: '$minecraft.mcUsername',
              uuid: '$minecraft.mcUUID',
              rank: '$minecraft.rank',
              lastSeen: '$minecraft.lastSeen',
              playtime_minutes: '$minecraft.stats.playtime_minutes',
              playtime: '$minecraft.stats.playtime'
            }
          }
        );
    }
    
    // Limit the results
    pipeline.push({ $limit: parseInt(limit) });
    
    // Execute the aggregation pipeline
    const players = await db.collection('users').aggregate(pipeline).toArray();
    console.log(`Found ${players.length} players for leaderboard category: ${category}`);
    
    // If no players found, use sample data
    if (players.length === 0) {
      console.log('No players found - using sample data');
      return generateSamplePlayers();
    }
    
    return players;
  } catch (error) {
    console.error(`Error retrieving leaderboard data:`, error);
    
    // In non-production, provide sample data on errors
    if (process.env.NODE_ENV !== 'production') {
      return generateSamplePlayers();
    }
    
    return [];
  }
};

// Leaderboard endpoint with rate limiting
app.get('/api/leaderboard/:category', leaderboardRateLimiter, async (req, res) => {
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
    
    // Retrieve leaderboard data from MongoDB or cache
    const players = await getLeaderboardData(category, timeFrame, limit);
    
    // Format response in the way the frontend expects
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

// Handle 404 for API routes (MAKE SURE THIS IS AFTER ALL API ROUTES)
app.use('/api/*', (req, res) => {
  // Log detailed information about the 404 error
  console.log(`❌ 404 ERROR: ${req.method} ${req.originalUrl}`);
  console.log(`  - Headers: ${JSON.stringify(req.headers)}`);
  console.log(`  - Body: ${JSON.stringify(req.body)}`);
  
  res.status(404).json({ error: "API endpoint not found" });
});

// Handle static file serving for React frontend
app.use(express.static('public'));

// Handle React routing (SPA) - Send index.html for any non-API routes
app.get('*', (req, res) => {
    // Skip handling for API routes
    if (req.url.startsWith('/api/')) return;
    
    // Log SPA route handling
    console.log(`📱 SPA route: ${req.originalUrl}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Create server and socket.io instance before starting
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Improved socket.io settings for better performance
  connectTimeout: 20000,         // Timeout for new connections (ms)
  maxHttpBufferSize: 1e6,        // Max size of packets (1MB)
  pingTimeout: 20000,            // How long to wait after ping before timeout
  pingInterval: 25000,           // How often to ping clients
  upgradeTimeout: 10000,         // Timeout for upgrade requests
  transports: ['websocket', 'polling'],  // Prefer websocket, fallback to polling
  allowUpgrades: true,           // Allow transport upgrades
  perMessageDeflate: {           // Compression settings
    threshold: 1024              // Only compress data above this size (bytes)
  }
});

// Socket.io connection monitoring
setInterval(() => {
  const connectedSockets = io.sockets.sockets.size;
  const rooms = io.sockets.adapter.rooms;
  const roomsCount = rooms ? rooms.size : 0;
  console.log(`📊 Socket.IO Stats - Connected clients: ${connectedSockets}, Active rooms: ${roomsCount}`);
}, 60000); // Log every minute

// Error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('⚠️ Socket.IO connection error:', err);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Set connection timeout options
  socket.conn.pingTimeout = 30000; // 30 seconds ping timeout
  
  // Add error handling for individual socket
  socket.on('error', (err) => {
    console.error(`❌ Socket ${socket.id} error:`, err);
  });
  
  // Handle authentication
  socket.on('authenticate', async (token) => {
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Extract userId consistently
      let userId;
      if (decoded.user && decoded.user.id) {
        userId = decoded.user.id;
      } else if (decoded.id) {
        userId = decoded.id;
      } else if (decoded.sub) {
        userId = decoded.sub;
      } else {
        socket.emit('error', { message: 'Invalid token format' });
        return;
      }
      
      // Associate this socket with the user immediately to ensure real-time updates
      // even if DB is temporarily unavailable
      socket.userId = userId;
      socket.join(userId);
      
      // Verify user exists if DB is connected
      if (isConnected()) {
        try {
          await withConnection(async () => {
            const user = await User.findById(userId).select('username mcUsername isActive roles');
            
            if (!user) {
              console.log(`❌ Socket ${socket.id} user lookup error: User not found`);
              socket.emit('warning', { message: 'User not found in database, some features may be limited' });
            } else {
              console.log(`✅ Socket ${socket.id} authenticated for user ${user.username} (${userId})`);
              socket.username = user.username;
              socket.mcUsername = user.mcUsername;
              
              // Emit authenticated event with user info
              socket.emit('authenticated', { 
                userId, 
                username: user.username,
                mcUsername: user.mcUsername
              });
            }
          });
        } catch (dbError) {
          console.error(`❌ Socket ${socket.id} user lookup error:`, dbError);
          // Still allow connection but with a warning
          socket.emit('warning', { message: 'Database error, some features may be limited' });
        }
      } else {
        console.log(`⚠️ Socket ${socket.id} authenticated for user ${userId} (DB unavailable)`);
        socket.emit('authenticated', { 
          userId,
          warning: 'Database connection unavailable, some features may be limited'
        });
      }
      
      // Add to active users list
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} added to active users list`);
      
    } catch (error) {
      console.error(`❌ Socket ${socket.id} authentication error:`, error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
  
  // Handle specific stat requests
  socket.on('request_stats', async (data) => {
    try {
      // Ensure authenticated
      if (!socket.secureId || !socketClients.has(socket.secureId)) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const clientInfo = socketClients.get(socket.secureId);
      const userId = clientInfo.userId;
      
      // Get user info
      const user = await User.findById(userId);
      if (!user || !user.mcUsername) {
        socket.emit('error', { message: 'User or Minecraft account not found' });
        return;
      }
      
      // Get stats directly from the appropriate service or database
      try {
        // Create a simple function to get player stats
        const getPlayerStats = async (mcUsername) => {
          // This is a placeholder - implement your actual stat fetching logic here
          // For now, we'll return some mock data
          return {
            balance: 1000 + Math.floor(Math.random() * 500),
            playtime: '10h 30m',
            playtimeMinutes: 630,
            level: 25,
            experience: 45 + Math.floor(Math.random() * 30),
            rank: 'Member',
            achievements: 12,
            blocks_mined: 5000,
            mobs_killed: 1200,
            deaths: 15,
            lastSeen: 'Online now',
            world: 'world',
            gamemode: 'SURVIVAL'
          };
        };
        
        const stats = await getPlayerStats(user.mcUsername);
        
        socket.emit('stats_update', {
          type: 'player_stats_update',
          data: stats
        });
      } catch (statError) {
        console.error('Error fetching player stats:', statError);
        socket.emit('error', { message: 'Could not fetch player stats' });
    }
    } catch (error) {
      console.error('Error processing stats request:', error);
      socket.emit('error', { message: 'Server error processing request' });
    }
  });
  
  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    
    // Clean up client map
    if (socket.secureId && socketClients.has(socket.secureId)) {
      socketClients.delete(socket.secureId);
    }
  });
});

// Add test endpoint to insert Minecraft data for a user (TEMPORARY)
app.post('/api/test-insert-mcdata', async (req, res) => {
    try {
        const { username, mcUsername, mcUUID } = req.body;
        
        if (!username) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username is required' 
            });
        }
        
        // Find the user
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User ${username} not found`
            });
        }
        
        // Update Minecraft data
        if (mcUsername) user.mcUsername = mcUsername;
        if (mcUUID) user.mcUUID = mcUUID;
        user.linked = true;
        
        // Add test mcStats data
        user.mcStats = {
            balance: 2537892,
            playtime: "652h",
            level: 86,
            experience: 72,
            rank: 'ELITE',
            lastSeen: 'Online now',
            blocks_mined: 158632,
            mobs_killed: 12489,
            deaths: 187,
            world: "Survival",
            biome: 'Dark Forest',
            coords: {x: 2451, y: 72, z: -348},
            lastUpdated: new Date(),
            
            // McMMO data
            mcmmo_data: {
                power_level: 3782,
                skills: {
                    mining: 874,
                    woodcutting: 785,
                    herbalism: 652,
                    excavation: 712,
                    fishing: 435,
                    repair: 321,
                    unarmed: 124,
                    archery: 283,
                    swords: 462,
                    axes: 329,
                    acrobatics: 381,
                    taming: 218,
                    alchemy: 156
                }
            },
            
            // Jobs data
            jobs_data: {
                points: 4835,
                total_money_earned: 1423985,
                jobs: [
                    {
                        name: 'Miner',
                        level: 73,
                        exp: 67,
                        quest_progress: 82
                    },
                    {
                        name: 'Farmer',
                        level: 58,
                        exp: 92,
                        quest_progress: 100
                    },
                    {
                        name: 'Hunter',
                        level: 65,
                        exp: 34,
                        quest_progress: 57
                    }
                ]
            }
        };
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: `Test Minecraft data added to user ${username}`,
            user: {
                username: user.username,
                mcUsername: user.mcUsername,
                mcUUID: user.mcUUID,
                linked: user.linked
            }
        });
    } catch (error) {
        console.error('Error adding test Minecraft data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add test endpoint for direct user creation (TEMPORARY)
app.post('/api/test-create-user', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        
        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            // Return the existing user for testing
            return res.status(200).json({
                success: true,
                message: "Test user already exists",
                user: user
            });
        }
        
        // Create a password hash directly
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create the user without validation
        user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });
        
        await user.save();
        
        res.status(201).json({
            success: true,
            message: "Test user created",
            user: user
        });
    } catch (error) {
        console.error('Test user creation error:', error);
        res.status(500).json({
            success: false,
            error: "Failed to create test user"
        });
    }
});

// Register simple auth route for reliable login
app.use('/api', require('./routes/simple-auth'));

// Configure server timeouts to avoid ECONNRESET
app.use((req, res, next) => {
    // Increase header timeout
    req.socket.setTimeout(120000);

    // Increase keepalive timeout
    if (req.socket.server) {
        req.socket.server.keepAliveTimeout = 65000; // 65 seconds
        req.socket.server.headersTimeout = 66000; // 66 seconds
    }
    next();
});

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});


// SECURED EMERGENCY RANK CHANGE ENDPOINT - WITH AUTH AND VALIDATION
const { admin } = require('./middleware/auth');

// Access this via: /api/admin/users/emergency/:userId with proper admin token
app.post('/api/admin/users/emergency/:userId', admin, async (req, res) => {
  try {
    // Get parameters from request body (not URL query for security)
    const userId = req.params.userId;
    const { role, forum_rank, luckperms_group, emergencyCode } = req.body;
    
    // Additional validation for security
    if (!emergencyCode || emergencyCode !== process.env.EMERGENCY_ACCESS_CODE) {
      // Log attempt but don't reveal the reason
      console.warn(`Emergency code validation failed from IP: ${req.ip}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Request validation
    if (!role && !forum_rank && !luckperms_group) {
      return res.status(400).json({ error: 'No changes specified' });
    }
    
    // Validate input content (basic sanitization)
    const validRoles = ['user', 'moderator', 'admin'];
    const validForumRanks = ['user', 'moderator', 'admin', 'member', 'contributor', 'vip'];
    
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    if (forum_rank && !validForumRanks.includes(forum_rank)) {
      return res.status(400).json({ error: 'Invalid forum rank specified' });
    }
    
    // Prepare update fields with validation
    const updateFields = {};
    if (role) updateFields.role = role;
    if (forum_rank) updateFields.forum_rank = forum_rank;
    if (luckperms_group) updateFields.luckperms_group = luckperms_group;
    
    // Security improvement - only update permissions if explicitly requested
    if (role === 'admin' || forum_rank === 'admin') {
      updateFields.permissions = {
        canAccessAdmin: true,
        canModerateForums: true,
        canManageUsers: true,
        canEditServer: true
      };
    } else if (role === 'moderator' || forum_rank === 'moderator') {
      updateFields.permissions = {
        canAccessAdmin: false,
        canModerateForums: true,
        canManageUsers: false,
        canEditServer: false
      };
    } else if (role === 'user') {
      updateFields.permissions = {
        canAccessAdmin: false,
        canModerateForums: false,
        canManageUsers: false,
        canEditServer: false
      };
    }
    
    // Log the admin user making the change
    console.log(`Admin user ${req.user.username} (${req.user.id}) making emergency rank change for user ${userId}`);
    
    // Get user before update (for audit log)
    const userBefore = await User.findById(userId).select('-password');
    if (!userBefore) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create audit log entry
    const auditLog = {
      action: 'emergency_rank_change',
      performedBy: req.user.id,
      targetUser: userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      changes: {
        before: {
          role: userBefore.role,
          forum_rank: userBefore.forum_rank,
          luckperms_group: userBefore.luckperms_group
        },
        after: {
          role: role || userBefore.role,
          forum_rank: forum_rank || userBefore.forum_rank,
          luckperms_group: luckperms_group || userBefore.luckperms_group
        }
      }
    };
    
    // Store audit log (ideally in a separate collection, but for now, add to the user)
    if (!userBefore.auditLogs) {
      userBefore.auditLogs = [];
    }
    userBefore.auditLogs.push(auditLog);
    await userBefore.save();
    
    // Direct database update
    const result = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    // Return the updated user (JSON only, no HTML)
    return res.status(200).json({
      success: true,
      message: 'User rank updated successfully',
      user: {
        id: result._id,
        username: result.username,
        role: result.role,
        forum_rank: result.forum_rank,
        luckperms_group: result.luckperms_group
      }
    });
  } catch (err) {
    console.error('Error in emergency rank change:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected API version of rank change - with proper auth and validation
app.post('/api/admin/users/:userId/change-rank', admin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role, forum_rank, luckperms_group } = req.body;
    
    // Validate inputs
    const validRoles = ['user', 'moderator', 'admin'];
    const validForumRanks = ['user', 'moderator', 'admin', 'member', 'contributor', 'vip'];
    
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    if (forum_rank && !validForumRanks.includes(forum_rank)) {
      return res.status(400).json({ error: 'Invalid forum rank specified' });
    }
    
    // Additional validation - prevent non-admin users from creating admins
    if ((role === 'admin' || forum_rank === 'admin') && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only administrators can create other administrators'
      });
    }
    
    // Prepare update fields
    const updateFields = {};
    if (role) updateFields.role = role;
    if (forum_rank) updateFields.forum_rank = forum_rank;
    if (luckperms_group) updateFields.luckperms_group = luckperms_group;
    
    // Set appropriate permissions based on role
    if (role === 'admin' || forum_rank === 'admin') {
      updateFields.permissions = {
        canAccessAdmin: true,
        canModerateForums: true,
        canManageUsers: true,
        canEditServer: true
      };
    } else if (role === 'moderator' || forum_rank === 'moderator') {
      updateFields.permissions = {
        canAccessAdmin: false,
        canModerateForums: true,
        canManageUsers: false,
        canEditServer: false
      };
    } else if (role === 'user') {
      updateFields.permissions = {
        canAccessAdmin: false,
        canModerateForums: false,
        canManageUsers: false,
        canEditServer: false
      };
    }
    
    // Get user before update (for audit log)
    const userBefore = await User.findById(userId).select('-password');
    if (!userBefore) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create audit log entry
    const auditLog = {
      action: 'rank_change',
      performedBy: req.user.id,
      targetUser: userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      changes: {
        before: {
          role: userBefore.role,
          forum_rank: userBefore.forum_rank,
          luckperms_group: userBefore.luckperms_group
        },
        after: {
          role: role || userBefore.role,
          forum_rank: forum_rank || userBefore.forum_rank,
          luckperms_group: luckperms_group || userBefore.luckperms_group
        }
      }
    };
    
    // Store audit log
    if (!userBefore.auditLogs) {
      userBefore.auditLogs = [];
    }
    userBefore.auditLogs.push(auditLog);
    await userBefore.save();
    
    // Update the user with proper validation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -sessionToken -resetPasswordToken');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return sanitized user data
    return res.json({
            success: true, 
      message: 'User rank updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        forum_rank: updatedUser.forum_rank,
        luckperms_group: updatedUser.luckperms_group || 'default'
      }
    });
  } catch (err) {
    console.error('Error in rank change:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// This endpoint is now removed for security
// It has been replaced by the more secure /api/admin/users/:userId/change-rank endpoint

// Secure admin-only user management API endpoint
app.get('/api/admin/users', admin, async (req, res) => {
  try {
    // Add query filtering
    const query = {};
    
    // Filter by role, forum_rank, etc. if provided
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    if (req.query.forum_rank) {
      query.forum_rank = req.query.forum_rank;
    }
    
    // Filter by username search
    if (req.query.search) {
      query.username = { $regex: req.query.search, $options: 'i' };
    }
    
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Add sorting
    const sortField = req.query.sort || 'username';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination, sorting, and proper field exclusion
    const users = await User.find(query)
      .select('-password -resetPasswordToken -sessionToken -mcStats -auditLogs')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // Return JSON response with sanitized user data
    return res.json({
                success: true, 
      data: {
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          forum_rank: user.forum_rank,
          linked: user.linked,
          mcUsername: user.mcUsername,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          permissions: user.permissions || {}
        })),
        pagination: {
          total: totalUsers,
          page,
          limit,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Direct forum category access endpoint (fallback solution)
app.get('/api/direct-forum-categories', async (req, res) => {
  try {
    console.log('Directly accessing forum categories from server...');
    
    // Force mongoose to use the correct database
    if (mongoose.connection.readyState !== 1) {
      console.log('Mongoose connection not ready, connecting now...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink');
    }
    
    console.log('Fetching categories from database:', mongoose.connection.name);
    const Category = require('./models/Category');
    
    // Query with explicit collection name
    const categories = await Category.find().sort({ order: 1 });
    console.log(`Found ${categories.length} categories directly from server endpoint`);
    
    if (categories.length > 0) {
      console.log('First category:', categories[0].name);
    } else {
      // Create default categories if none exist
      console.log('No categories found, creating defaults...');
      const defaultCategories = [
        {
          name: 'Announcements',
          description: 'Official announcements from the BizzyLink team',
          order: 1
        },
        {
          name: 'General Discussion',
          description: 'Discuss anything related to Minecraft and BizzyLink',
          order: 2
        },
        {
          name: 'Help & Support',
          description: 'Get help with BizzyLink or Minecraft issues',
          order: 3
        },
        {
          name: 'Suggestions',
          description: 'Suggest new features for BizzyLink',
          order: 4
        },
        {
          name: 'Off-Topic',
          description: 'Discuss anything not related to Minecraft or BizzyLink',
          order: 5
        }
      ];
      
      // Create categories
      for (const categoryData of defaultCategories) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`Created category: ${category.name}`);
      }
      
      // Fetch again after creation
      const newCategories = await Category.find().sort({ order: 1 });
      console.log(`Created ${newCategories.length} default categories`);
      return res.json(newCategories);
    }
    
    res.json(categories);
  } catch (err) {
    console.error('Error in direct forum categories endpoint:', err);
    res.status(500).json({ 
      message: 'Server error fetching categories',
      error: err.message
    });
    }
});

// Add minecraft notification endpoints
app.post('/api/minecraft/notify', (req, res) => {
  console.log('Received notification request:', req.body);
  
  try {
    const { userId, event, data } = req.body;
    
    if (!userId || !event) {
      console.log('Notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Processing minecraft notification for user ${userId}, event: ${event}`);
    
    // Just log the event and return success
    console.log('Notification data:', data);
    console.log('Notification processed successfully');
    
    // Emit event for SSE clients if eventEmitter is available
    if (eventEmitter) {
      eventEmitter.emit('userEvent', { 
        userId, 
        event, 
        data: data || {} 
      });
      
      // Also emit a generic refresh event to force UI update
      setTimeout(() => {
        console.log(`Sending refresh event to user ${userId}`);
        eventEmitter.emit('userEvent', { 
          userId, 
          event: 'refresh', 
          data: { timestamp: new Date().toISOString() } 
        });
      }, 1000);
    } else {
      console.log('Event emitter not available, skipping event emission');
    }
    
    // Also emit a socket.io event if available
    if (io && io.to) {
      io.to(userId).emit(event, data || {});
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).json({ error: 'Server error when processing notification', message: error.message });
  }
});

// Add API endpoint for legacy notifications
app.post('/api/minecraft/link/notify', async (req, res) => {
  console.log('Received legacy link notification:', req.body);
  
  try {
    const { userId, mcUsername, mcUUID } = req.body;
    
    if (!userId || !mcUsername || !mcUUID) {
      console.log('Legacy notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Processing legacy link notification for user ${userId}, minecraft: ${mcUsername}`);
    
    // Emit events for SSE if available
    if (eventEmitter) {
      eventEmitter.emit('userEvent', { 
        userId, 
        event: 'minecraft_linked', 
        data: { mcUsername, mcUUID } 
      });
      
      // Also emit profile update event
      setTimeout(() => {
        eventEmitter.emit('userEvent', { 
          userId, 
          event: 'profile_updated', 
          data: { field: 'minecraft' } 
        });
      }, 500);
      
      // Also emit refresh event
      setTimeout(() => {
        eventEmitter.emit('userEvent', { 
          userId, 
          event: 'refresh', 
          data: { timestamp: new Date().toISOString() } 
        });
      }, 1000);
    } else {
      console.log('Event emitter not available, skipping event emission');
    }
    
    // Also emit a socket.io event if available
    if (io && io.to) {
      io.to(userId).emit('minecraft_linked', { mcUsername, mcUUID });
    }
    
    // Try to update user in database if connected
    if (isConnected()) {
      withConnection(async () => {
        try {
          // Use findOneAndUpdate to update user info without requiring the model
          const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(userId) },
            { 
              $set: { 
                mcUsername,
                mcUUID,
                'minecraft.mcUsername': mcUsername,
                'minecraft.mcUUID': mcUUID,
                'minecraft.linkedAt': new Date(),
                linked: true
              } 
            },
            { upsert: false }
          );
          
          console.log('User Minecraft linking status updated in database');
        } catch (dbError) {
          console.error('Database update error:', dbError);
          // Don't fail the request if DB update fails
        }
      }).catch(err => {
        console.error('Error in withConnection:', err);
      });
    } else {
      console.log('Database not connected, skipping user update');
    }
    
    console.log('Link notification data:', { userId, mcUsername, mcUUID });
    console.log('Legacy notification processed successfully');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing legacy notification:', error);
    return res.status(500).json({ error: 'Server error when processing notification', message: error.message });
  }
});

// Add player update endpoint
app.post('/api/player/update', (req, res) => {
  console.log('Received player update:', req.body);
  
  try {
    const { mcUsername, mcUUID, stats } = req.body;
    
    if (!mcUsername || !mcUUID) {
      console.log('Player update rejected: Missing player information');
      return res.status(400).json({ error: 'Missing player information' });
    }
    
    console.log(`Processing player update for ${mcUsername}`);
    
    // Try to update user in database if connected
    if (isConnected() && stats?.userId) {
      withConnection(async () => {
        try {
          // Use findOneAndUpdate to update user stats without requiring the model
          const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(stats.userId) },
            { 
              $set: { 
                'minecraft.stats': stats,
                'minecraft.lastUpdated': new Date()
              } 
            },
            { upsert: false }
          );
          
          if (result.value) {
            console.log('User stats updated in database');
            
            // Emit event for real-time notification
            if (eventEmitter) {
              eventEmitter.emit('userEvent', { 
                userId: stats.userId, 
                event: 'stats_updated', 
                data: { mcUsername, stats } 
              });
            }
            
            // Also emit a socket.io event if available
            if (io && io.to) {
              io.to(stats.userId).emit('stats_updated', { mcUsername, stats });
            }
          } else {
            console.log('No user found with ID:', stats.userId);
          }
        } catch (dbError) {
          console.error('Database update error:', dbError);
          // Don't fail the request if DB update fails
        }
      }).catch(err => {
        console.error('Error in withConnection:', err);
      });
    } else {
      console.log('Database not connected or userId missing, skipping user update');
    }
    
    // Just log the request and return success
    console.log('Player update data:', { mcUsername, mcUUID, stats });
    console.log('Player update processed successfully');
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing player update:', error);
    res.status(500).json({ error: 'Server error when processing player update', message: error.message });
  }
});

// This should be placed right before the server.listen call
const PORT = process.env.PORT || 8080;

// Connect to database and start server
(async () => {
  try {
    // Try to connect to database but don't block server startup
    connectDB().catch(err => {
      console.error('Initial database connection failed, continuing without DB:', err.message);
      console.log('Server will continue to run and retry database connection');
    });
    
    // Start server immediately
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Database connection status: ${isConnected() ? 'Connected' : 'Disconnected'}`);
      
      // Print Socket.IO stats every 5 minutes
      setInterval(() => {
        const sockets = io.sockets.sockets;
        const roomCount = io.sockets.adapter.rooms.size;
        console.log(`📊 Socket.IO Stats - Connected clients: ${sockets.size}, Active rooms: ${roomCount}`);
      }, 300000); // 5 minutes
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})();