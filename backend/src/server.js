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

console.log('>>> RUNNING: backend/src/server.js');

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');
const http = require('http');
const socketIo = require('socket.io');
const eventEmitter = require('./eventEmitter');
const User = require('./models/User');
const { protect } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const socialRoutes = require('./routes/social');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    logger.info('🟢 MongoDB connected successfully');
  })
  .catch(err => {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(helmet());
app.use(compression({
  filter: (req, res) => {
    // Disable compression for SSE endpoints
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(morgan('dev', { stream: logger.stream }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
app.use('/api', apiLimiter);

// Admin routes rate limiter (more lenient)
const adminLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.ADMIN_RATE_LIMIT_MAX || 200, // Higher limit for admin routes
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/admin', adminLimiter);

// Route files
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const minecraftRoutes = require('./routes/minecraft');
const forumRoutes = require('./routes/forum');
const achievementsRoutes = require('./routes/achievements');
const titlesRoutes = require('./routes/titles');
const linkcodeRoutes = require('../../routes/linkcode');
const profileRoutes = require('./routes/profile');
const friendsRoutes = require('./routes/friends');
const followingRoutes = require('./routes/following');
const notificationsRoutes = require('./routes/notifications');
const leaderboardRoutes = require('./routes/leaderboard');
const wallpostRoutes = require('./routes/wallpost');

// Mount routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/minecraft', minecraftRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/titles', titlesRoutes);
app.use('/api/linkcode', linkcodeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/following', followingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/wall', wallpostRoutes);
app.use('/api/social', socialRoutes);

// Internal endpoint to emit player_unlinked to plugin-mc (for use by other services)
app.post('/api/internal/emit-unlink', (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_EVENT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { mcUUID, message } = req.body;
  if (!mcUUID) {
    return res.status(400).json({ error: 'mcUUID is required' });
  }
  if (global.io && global.io.to) {
    global.io.to('plugin-mc').emit('player_unlinked', {
      mcUUID,
      message: message || 'Your Minecraft account has been unlinked.'
    });
    logger.info(`[SOCKET.IO] Emitted player_unlinked to plugin-mc for mcUUID: ${mcUUID}`);
    return res.json({ success: true });
  } else {
    logger.error('[SOCKET.IO] global.io not available!');
    return res.status(500).json({ error: 'Socket.IO not available' });
  }
});

// Startup banner
console.log('\n\x1b[36m==============================\x1b[0m');
console.log('  🚀 \x1b[32mBizzyLink Backend Server\x1b[0m 🚀');
console.log('  🟢 \x1b[33mStatus:\x1b[0m Starting up...');
console.log('  📅 \x1b[35mYear:\x1b[0m 2025');
console.log('  🛡️  \x1b[36mCopyright:\x1b[0m Bizzy Nation');
console.log('\x1b[36m==============================\x1b[0m\n');

// Basic root route
app.get('/', (req, res) => {
  res.json({
    app: 'BizzyLink API',
    version: '1.0.0',
    status: '🟢 Healthy',
    description: '✨ Welcome to the BizzyLink API! ✨',
    endpoints: [
      { path: '/api/profile', desc: '👤 User profile' },
      { path: '/api/friends', desc: '🤝 Friends system' },
      { path: '/api/following', desc: '👣 Following system' },
      { path: '/api/notifications', desc: '🔔 Notifications' },
      { path: '/api/minecraft', desc: '⛏️ Minecraft integration' },
      { path: '/api/forum', desc: '💬 Forum' },
      { path: '/api/achievements', desc: '🏆 Achievements' },
      { path: '/api/titles', desc: '🎖️ Titles' },
      { path: '/api/auth', desc: '🔑 Auth' }
    ],
    docs: 'https://github.com/BizzyNation/BizzyLink',
    message: 'Have a Bizzy day! 🐝'
  });
});

// Add this before the 404 handler
app.get('/api/player/:uuid', async (req, res) => {
  const { uuid } = req.params;
  try {
    // Try both mcUUID and minecraftUUID for compatibility
    const user = await User.findOne({ $or: [ { mcUUID: uuid }, { minecraftUUID: uuid } ] });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        mcUUID: user.mcUUID || user.minecraftUUID,
        mcUsername: user.mcUsername || user.minecraftUsername,
        username: user.username
      }
    });
  } catch (err) {
    logger.error('Error in /api/player/:uuid:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// --- Legacy Minecraft Notification and Player Stats Endpoints ---

// /api/minecraft/notify
app.post('/api/minecraft/notify', async (req, res) => {
  logger.info('Received notification request:', req.body);
  try {
    const { userId, event, data } = req.body;
    if (!userId || !event) {
      logger.warn('Notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    logger.info(`Processing minecraft notification for user ${userId}, event: ${event}`);
    // Emit event for real-time notification
    if (eventEmitter) {
      eventEmitter.emit('userEvent', { userId, event, data: data || {} });
    }
    // Also emit a socket.io event
    if (global.io && global.io.to) {
      global.io.to(userId).emit(event, data || {});
    }
    logger.info('Notification processed successfully');
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing notification:', error);
    res.status(500).json({ error: 'Server error when processing notification', message: error.message });
  }
});

// /api/minecraft/link/notify
app.post('/api/minecraft/link/notify', async (req, res) => {
  logger.info('Received legacy link notification:', req.body);
  try {
    const { userId, mcUsername, mcUUID } = req.body;
    if (!userId || !mcUsername || !mcUUID) {
      logger.warn('Legacy notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    logger.info(`Processing legacy link notification for user ${userId}, minecraft: ${mcUsername}`);
    // Update user in DB
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'minecraft.linked': true,
          'minecraft.mcUsername': mcUsername,
          'minecraft.mcUUID': mcUUID,
          'minecraft.lastLinked': new Date(),
          'mcUsername': mcUsername,
          'mcUUID': mcUUID
        }
      },
      { new: true }
    );
    // Emit event for real-time notification
    if (eventEmitter) {
      eventEmitter.emit('userEvent', { userId, event: 'minecraft_linked', data: { mcUsername, mcUUID } });
    }
    // Also emit a socket.io event
    if (global.io && global.io.to) {
      global.io.to(userId).emit('minecraft_linked', { mcUsername, mcUUID });
    }
    logger.info('Legacy link notification processed successfully');
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing legacy link notification:', error);
    res.status(500).json({ error: 'Server error when processing legacy link notification', message: error.message });
  }
});

// /api/player/update
app.post('/api/player/update', async (req, res) => {
  logger.info('Received player update:', req.body);
  try {
    const { mcUsername, mcUUID, stats } = req.body;
    if (!mcUsername || !mcUUID) {
      logger.warn('Player update rejected: Missing player information');
      return res.status(400).json({ error: 'Missing player information' });
    }
    logger.info(`Processing player update for ${mcUsername}`);
    // Try to update user in database if stats.userId is present
    if (stats?.userId) {
      await User.updateOne(
        { _id: stats.userId },
        {
          $set: {
            'minecraft.stats': stats,
            'minecraft.lastUpdated': new Date()
          }
        },
        { upsert: false }
      );
      logger.info('User stats updated in database');
      // Emit event for real-time notification
      if (eventEmitter) {
        eventEmitter.emit('userEvent', { userId: stats.userId, event: 'stats_updated', data: { mcUsername, stats } });
      }
      // Also emit a socket.io event
      if (global.io && global.io.to) {
        global.io.to(stats.userId).emit('stats_updated', { mcUsername, stats });
      }
    }
    res.status(200).json({ success: true, message: 'Stats update sent to connected clients' });
  } catch (error) {
    logger.error('Error processing player update:', error);
    res.status(500).json({ error: 'Server error when processing player update', message: error.message });
  }
});

// --- SSE (Server-Sent Events) /api/events Route ---
// This route provides real-time updates to authenticated users via SSE
const sseUserClients = new Map();

app.get('/api/events', async (req, res, next) => {
  let token;
  // Try Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    console.log('[SSE] No token provided');
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      console.log('[SSE] User not found for token');
      return res.status(401).json({ error: 'User not found' });
    }
  } catch (err) {
    console.log('[SSE] Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  console.log(`[SSE] Connection established for user ${req.user._id}`);

  // Send initial event
  res.write(`data: {"type":"sse_connected","timestamp":${Date.now()}}\n\n`);
  console.log(`[SSE] Initial event sent to user ${req.user._id}`);

  // Register client
  const userId = req.user._id.toString();
  const clientId = `${userId}:${Date.now()}:${Math.random()}`;
  sseUserClients.set(clientId, { userId, res });

  // Remove client on disconnect
  req.on('close', () => {
    sseUserClients.delete(clientId);
    console.log(`[SSE] Connection closed for user ${userId}`);
  });

  req.on('error', (err) => {
    console.log(`[SSE] Error for user ${userId}:`, err.message);
  });
});

// Broadcast helper for user events (can be called from anywhere)
global.sendSseToUser = (userId, event) => {
  let sent = false;
  for (const [clientId, client] of sseUserClients.entries()) {
    if (client.userId === userId && client.res) {
      try {
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        console.log(`[SSE] Wrote event to clientId: ${clientId} for userId: ${userId} | event:`, event);
        sent = true;
      } catch (err) {
        sseUserClients.delete(clientId);
        console.error(`[SSE] Failed to write event to clientId: ${clientId} for userId: ${userId}`, err);
      }
    }
  }
  if (!sent) {
    console.warn(`[SSE] No active SSE client found for userId: ${userId} when sending event:`, event);
  }
};

// Register the eventEmitter.on('userEvent', ...) handler after sendSseToUser is defined
if (eventEmitter && eventEmitter.on) {
  eventEmitter.on('userEvent', (payload) => {
    if (payload && payload.userId) {
      let eventData;
      if (payload.event === 'notification') {
        eventData = { type: 'notification', ...payload.data };
      } else {
        eventData = { type: payload.event, ...payload.data };
      }
      console.log('[SSE] Outgoing event to user', payload.userId, ':', eventData);
      global.sendSseToUser(payload.userId, eventData);
    }
  });
  // Direct test emit to verify handler
  eventEmitter.emit('userEvent', {
    userId: '682a55afa6dbf5d8f6950d88',
    event: 'notification',
    data: { message: 'Test direct emit', type: 'test', createdAt: new Date() }
  });
}

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
});
global.io = io;

// Store active socket clients
const socketClients = new Map();

// Helper: get user sockets
const getUserSockets = (userId) => {
  return Array.from(socketClients.entries())
    .filter(([_, client]) => client.userId === userId)
    .map(([_, client]) => client.socket);
};

// Enhance global.notifyUser with delayed redundancy for critical events
const notifyUserWithDelay = (userId, eventData, delayMs = 3000) => {
  setTimeout(() => {
    try {
      if (global.notifyUser) {
        global.notifyUser(userId, {
          ...eventData,
          redundant: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.error('Error sending delayed redundant notification:', err);
    }
  }, delayMs);
};

const originalNotifyUserWithSSE = global.notifyUser;
global.notifyUser = function(userId, eventData) {
  if (originalNotifyUserWithSSE) originalNotifyUserWithSSE(userId, eventData);
  // For critical events, send a delayed redundant notification
  if (eventData && (eventData.type === 'minecraft_linked' || eventData.type === 'account_unlinked')) {
    notifyUserWithDelay(userId, eventData, 3000);
  }
};

// Global player stats update helper
global.updatePlayerStats = function(userId, mcUsername, statData) {
  const eventData = {
    type: 'player_stats_update',
    userId,
    mcUsername,
    timestamp: Date.now(),
    data: statData
  };
  global.notifyUser(userId, eventData);
};

// --- Enhanced Socket.io Setup and Logging (ported from legacy server.js) ---

ioserverLog = (...args) => logger.info('[SOCKET.IO]', ...args);

ioserverWarn = (...args) => logger.warn('[SOCKET.IO]', ...args);

ioserverError = (...args) => logger.error('[SOCKET.IO]', ...args);

io.on('connection', (socket) => {
  ioserverLog(`New socket connection: ${socket.id}`);

  // Listen for authentication event (optional, for plugin or user auth)
  socket.on('authenticate', (token) => {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.user && decoded.user.id) {
        socket.userId = decoded.user.id;
        socket.join(decoded.user.id);
        ioserverLog(`Socket ${socket.id} authenticated as user ${decoded.user.id}`);
      } else if (decoded && decoded.plugin && decoded.plugin === 'minecraft') {
        socket.join('plugin-mc');
        ioserverLog(`Socket ${socket.id} authenticated as Minecraft plugin client`);
      } else {
        ioserverWarn(`Socket ${socket.id} sent unknown auth payload`);
      }
    } catch (err) {
      ioserverError(`Socket ${socket.id} failed authentication:`, err.message);
      socket.emit('error', { message: 'Invalid token' });
    }
  });

  // Listen for room join
  socket.on('joinRoom', (room) => {
    socket.join(room);
    ioserverLog(`Socket ${socket.id} joined room: ${room}`);
  });
  
  // Handle individual player stat updates from Minecraft plugin
  socket.on('player_stat_update', async (data) => {
    try {
      const { mcUUID, mcUsername, statType, value, timestamp } = data;
      
      if (!mcUUID || !mcUsername || !statType) {
        return ioserverWarn(`Invalid player_stat_update payload: missing required fields`);
      }
      
      // Log the received stat for debugging
      ioserverLog(`Received player_stat_update for ${mcUsername} (${mcUUID}): ${statType} = ${value}`);
      
      // Find the user linked to this Minecraft account
      const user = await User.findOne({ mcUUID });
      
      if (!user) {
        return ioserverWarn(`No user found for Minecraft UUID: ${mcUUID}`);
      }
      
      // Update the stat in the database - this depends on your schema structure
      // This is a simplistic approach; you might need to adapt it to your actual schema
      if (!user.mcStats) {
        user.mcStats = {};
      }
      
      // Update the specific stat
      user.mcStats[statType] = value;
      user.mcStats.lastUpdated = new Date();
      
      // Save the updated user document
      await user.save();
      
      // Broadcast the stat update to all clients that need to know about this user
      // 1. To the user themselves if they're online
      io.to(user._id.toString()).emit('player_stat_update', {
        statType,
        value,
        timestamp
      });
      
      // 2. To admin dashboards or other monitoring systems if needed
      io.to('admins').emit('player_stat_update', {
        mcUUID,
        mcUsername,
        userId: user._id.toString(),
        statType,
        value,
        timestamp
      });
      
    } catch (error) {
      ioserverError(`Error handling player_stat_update:`, error.message);
    }
  });
  
  // Handle bulk player stats updates from Minecraft plugin
  socket.on('player_stats_update', async (data) => {
    try {
      const { mcUUID, mcUsername, stats, timestamp } = data;
      
      if (!mcUUID || !mcUsername || !stats) {
        return ioserverWarn(`Invalid player_stats_update payload: missing required fields`);
      }
      
      // Log the received stats update
      ioserverLog(`Received bulk player_stats_update for ${mcUsername} (${mcUUID})`);
      
      // Find the user linked to this Minecraft account
      const user = await User.findOne({ mcUUID });
      
      if (!user) {
        return ioserverWarn(`No user found for Minecraft UUID: ${mcUUID}`);
      }
      
      // Update the stats in the database
      if (!user.mcStats) {
        user.mcStats = {};
      }
      
      // Merge the incoming stats with existing stats
      user.mcStats = { ...user.mcStats, ...stats, lastUpdated: new Date() };
      
      // Save the updated user document
      await user.save();
      
      // Broadcast the stats update to the user if they're online
      io.to(user._id.toString()).emit('player_stats_update', {
        stats,
        timestamp
      });
      
      // Broadcast to admin dashboards or other monitoring systems if needed
      io.to('admins').emit('player_stats_update', {
        mcUUID,
        mcUsername,
        userId: user._id.toString(),
        stats,
        timestamp
      });
      
    } catch (error) {
      ioserverError(`Error handling player_stats_update:`, error.message);
    }
  });
  
  // Listen for request_player_stats event from frontend clients
  socket.on('request_player_stats', async (data) => {
    try {
      // Ensure the client has authentication and permissions
      if (!socket.userId) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      
      const { mcUUID } = data;
      if (!mcUUID) {
        return socket.emit('error', { message: 'Missing mcUUID parameter' });
      }
      
      // Find user to verify permissions
      const requestingUser = await User.findById(socket.userId);
      if (!requestingUser) {
        return socket.emit('error', { message: 'User not found' });
      }
      
      // Forward the request to the Minecraft plugin
      io.to('plugin-mc').emit('request_player_stats', { mcUUID });
      ioserverLog(`Forwarded request_player_stats for ${mcUUID} from user ${socket.userId}`);
      
    } catch (error) {
      ioserverError(`Error handling request_player_stats:`, error.message);
      socket.emit('error', { message: 'Server error processing request' });
    }
  });

  // Listen for custom events (for debug)
  socket.onAny((event, ...args) => {
    ioserverLog(`Socket ${socket.id} event: ${event}`, ...args);
  });

  socket.on('disconnect', (reason) => {
    ioserverLog(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

// --- SSE (Server-Sent Events) Support ---
const sseClients = new Map();

// SSE subscribe endpoint
app.get('/api/sse/subscribe', (req, res) => {
  // For authentication, you can add a token check here if needed
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  // Set headers for SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  // Send initial event
  res.write(`data: {"type":"sse_connected","timestamp":${Date.now()}}

`);

  // Store client
  const clientId = `${userId}:${Date.now()}:${Math.random()}`;
  sseClients.set(clientId, { userId, res });

  // Remove client on close
  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// --- EventEmitter Integration for User Events ---
if (eventEmitter && eventEmitter.on) {
  // Listen for generic user events
  eventEmitter.on('userEvent', (payload) => {
    if (payload && payload.userId) {
      global.notifyUser(payload.userId, {
        type: payload.event,
        ...payload.data
      });
    }
  });
  // Listen for Minecraft account unlinked events
  eventEmitter.on('minecraft_account_unlinked', (payload) => {
    if (payload && payload.userId) {
      global.notifyUser(payload.userId, {
        type: 'account_unlinked',
        ...payload
      });
    }
  });
}

// --- Test SSE Endpoint for Debugging ---
app.post('/api/test-sse', async (req, res) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    // Emit a test SSE event
    global.sendSseToUser(user._id.toString(), {
      type: 'test',
      message: 'This is a test SSE event',
      timestamp: Date.now()
    });
    return res.json({ success: true, message: 'Test SSE event sent' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info('🟢 Server running in ' + process.env.NODE_ENV + ' mode on port ' + PORT);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle unhandled exceptions
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;