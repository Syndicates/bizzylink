/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file enhanced-server.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const eventEmitter = require('./eventEmitter');
const axios = require('axios'); // Add axios for proxying requests

// Import the enhanced DB connection
const { connectDB, isConnected, withConnection, mongoose } = require('./db');

// Import User model (if needed)
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Set up Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New socket connection: ${socket.id}`);
  
  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const { userId } = data;
      
      if (!userId) {
        socket.emit('auth_error', { message: 'No user ID provided' });
        return;
      }
      
      // Only do actual DB lookup if we have a connection
      if (isConnected()) {
        // Associate this socket with the user
        socket.join(userId);
        socket.userId = userId;
        socket.emit('authenticated', { success: true });
        console.log(`Socket ${socket.id} authenticated for user ${userId}`);
      } else {
        // Even if DB is down, let the socket connect
        socket.userId = userId;
        socket.join(userId);
        socket.emit('authenticated', { 
          success: true, 
          warning: 'DB connection unavailable, some features may be limited'
        });
        console.log(`Socket ${socket.id} authenticated for user ${userId} (DB unavailable)`);
      }
    } catch (error) {
      console.error(`Socket authentication error:`, error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ success: true, message: 'Enhanced server is working' });
});

app.post('/api/test', (req, res) => {
  console.log('Test POST endpoint hit with body:', req.body);
  res.status(200).json({ 
    success: true, 
    message: 'Enhanced server is working', 
    receivedData: req.body,
    dbStatus: isConnected() ? 'connected' : 'disconnected'
  });
});

// Minecraft notification endpoint
app.post('/api/minecraft/notify', (req, res) => {
  console.log('Received notification request:', req.body);
  
  try {
    const { userId, event, data } = req.body;
    
    if (!userId || !event) {
      console.log('Notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Processing minecraft notification for user ${userId}, event: ${event}`);
    console.log('Notification data:', data);
    
    // Emit event for real-time notification
    eventEmitter.emit('userEvent', { 
      userId, 
      event, 
      data: data || {} 
    });
    
    // Also emit a socket.io event
    io.to(userId).emit(event, data || {});
    
    console.log('Notification processed successfully');
    
    // No database operation here, just return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).json({ error: 'Server error when processing notification', message: error.message });
  }
});

// Minecraft link notification endpoint
app.post('/api/minecraft/link/notify', (req, res) => {
  console.log('Received legacy link notification:', req.body);
  
  try {
    const { userId, mcUsername, mcUUID } = req.body;
    
    if (!userId || !mcUsername || !mcUUID) {
      console.log('Legacy notification rejected: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Processing legacy link notification for user ${userId}, minecraft: ${mcUsername}`);
    console.log('Link notification data:', { userId, mcUsername, mcUUID });
    
    // Emit event for real-time notification
    eventEmitter.emit('userEvent', { 
      userId, 
      event: 'minecraft_linked', 
      data: { mcUsername, mcUUID } 
    });
    
    // Also emit a socket.io event
    io.to(userId).emit('minecraft_linked', { mcUsername, mcUUID });
    
    // Try to update user in database if connected
    if (isConnected()) {
      withConnection(async () => {
        try {
          // Use findOneAndUpdate to update user info without requiring the model
          const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(userId) },
            { 
              $set: { 
                'minecraft.mcUsername': mcUsername,
                'minecraft.mcUUID': mcUUID,
                'minecraft.linkedAt': new Date(),
                'minecraft.linked': true
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
    
    console.log('Legacy notification processed successfully');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing legacy notification:', error);
    return res.status(500).json({ error: 'Server error when processing notification', message: error.message });
  }
});

// Player update endpoint
app.post('/api/player/update', async (req, res) => {
  console.log('Received player update:', req.body);
  const { mcUsername, mcUUID, uuid, username, userId, stats } = req.body;
  
  // Extract user ID either from direct field or from stats object
  let userIdToUse = userId;
  
  // If userId wasn't directly provided, try to find it in stats
  if (!userIdToUse && stats && stats.userId) {
    userIdToUse = stats.userId;
    console.log('Using userId from stats object:', userIdToUse);
  }
  
  // If neither direct userId nor stats.userId, try to look up by Minecraft username
  if (!userIdToUse && (mcUsername || username)) {
    const lookupName = mcUsername || username;
    try {
      const user = await withConnection(async () => {
        const User = mongoose.model('User');
        return await User.findOne({ 'minecraft.mcUsername': lookupName });
      });
      
      if (user) {
        userIdToUse = user._id.toString();
        console.log(`Found user ${userIdToUse} by Minecraft username ${lookupName}`);
      }
    } catch (error) {
      console.error('Error looking up user by Minecraft username:', error);
    }
  }

  // If still no userId, try to look up by UUID
  if (!userIdToUse && (mcUUID || uuid)) {
    const lookupUUID = mcUUID || uuid;
    try {
      const user = await withConnection(async () => {
        const User = mongoose.model('User');
        return await User.findOne({ 'minecraft.mcUUID': lookupUUID });
      });
      
      if (user) {
        userIdToUse = user._id.toString();
        console.log(`Found user ${userIdToUse} by Minecraft UUID ${lookupUUID}`);
      }
    } catch (error) {
      console.error('Error looking up user by Minecraft UUID:', error);
    }
  }

  // Final check if we have user ID and valid data
  if (!userIdToUse) {
    console.log('Player update rejected: Could not determine user ID', { 
      providedUserId: userId,
      statsUserId: stats?.userId,
      mcUsername: mcUsername || username,
      mcUUID: mcUUID || uuid
    });
    return res.status(200).json({ success: false, message: 'User ID not found' }); // Still return 200 to not break the plugin
  }

  try {
    // Update the user's stats in the database
    const statsToUpdate = stats || req.body;
    
    // Process player update
    console.log(`Processing player update for ${mcUsername || username} with user ID: ${userIdToUse}`);
    console.log('Player update data:', statsToUpdate);

    // Update user stats with withConnection
    await withConnection(async () => {
      const User = mongoose.model('User');
      const user = await User.findById(userIdToUse);
      
      if (user) {
        // Update Minecraft username and UUID if provided
        if (mcUsername || username) {
          user.minecraft = user.minecraft || {};
          user.minecraft.mcUsername = mcUsername || username || user.minecraft.mcUsername;
          user.minecraft.linked = true;
        }
        
        if (mcUUID || uuid) {
          user.minecraft = user.minecraft || {};
          user.minecraft.mcUUID = mcUUID || uuid || user.minecraft.mcUUID;
          user.minecraft.linked = true;
        }
        
        // Update stats fields
        user.minecraft = user.minecraft || {};
        user.minecraft.stats = statsToUpdate;
        user.minecraft.lastUpdated = new Date();
        
        await user.save();
        console.log('User stats updated in database');
      } else {
        console.log(`User ${userIdToUse} not found in database`);
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating player stats:', error);
    res.status(200).json({ success: false, message: 'Internal server error' }); // Still return 200 to not break the plugin
  }
});

// Player status endpoint
app.post('/api/player/status', async (req, res) => {
  console.log('Received player status request:', req.body);
  const { username, uuid } = req.body;
  
  if (!username && !uuid) {
    return res.status(400).json({ error: 'Missing player information' });
  }
  
  try {
    // Check if the player is linked in the database
    const user = await withConnection(async () => {
      const User = mongoose.model('User');
      
      // Try to find by UUID first
      if (uuid) {
        const userByUUID = await User.findOne({ 'minecraft.mcUUID': uuid });
        if (userByUUID) return userByUUID;
      }
      
      // Then try by username
      if (username) {
        const userByUsername = await User.findOne({ 'minecraft.mcUsername': username });
        if (userByUsername) return userByUsername;
      }
      
      return null;
    });
    
    if (user) {
      console.log(`Found user ${user._id} linked to Minecraft ${username || uuid}`);
      return res.status(200).json({ 
        linked: true, 
        username: user.minecraft?.mcUsername,
        uuid: user.minecraft?.mcUUID,
        userId: user._id.toString(),
        linkedAt: user.minecraft?.lastLinked
      });
    } else {
      console.log(`No user found linked to Minecraft ${username || uuid}`);
      return res.status(200).json({ linked: false });
    }
  } catch (error) {
    console.error('Error checking player status:', error);
    // Still return a valid response even if there's a database error
    return res.status(200).json({ linked: false, error: 'Database error' });
  }
});

// Add linkcode validation proxy endpoint
app.post('/api/linkcode/validate', async (req, res) => {
  console.log('==== LINK CODE VALIDATION PROXY REQUEST ====');
  console.log('Request body:', JSON.stringify(req.body));
  
  try {
    // Proxy the request to the direct-auth-server
    const response = await axios.post('http://localhost:8082/api/linkcode/validate', req.body);
    
    // Return the direct-auth-server's response
    console.log('Validation response:', JSON.stringify(response.data));
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying validation request:', error.message);
    
    // If we got a response from the auth server, pass it through
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Otherwise return a generic error
    return res.status(500).json({ 
      success: false, 
      message: 'Server error validating link code'
    });
  }
});

// Start server
const PORT = 8090;

// Connect to database and start server
(async () => {
  try {
    // Try to connect to database but don't block server startup
    connectDB().catch(err => {
      console.error('Initial database connection failed, continuing without DB:', err.message);
    });
    
    // Start server immediately
    server.listen(PORT, () => {
      console.log(`Enhanced server running on port ${PORT}`);
      console.log(`Database connection status: ${isConnected() ? 'Connected' : 'Disconnected'}`);
      
      // Print Socket.IO stats every minute
      setInterval(() => {
        const sockets = io.sockets.sockets;
        const roomCount = io.sockets.adapter.rooms.size;
        console.log(`📊 Socket.IO Stats - Connected clients: ${sockets.size}, Active rooms: ${roomCount}`);
      }, 60000);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
})(); 