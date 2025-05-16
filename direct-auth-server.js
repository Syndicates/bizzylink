const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback){
    // Allow any origin
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(bodyParser.json());

// JWT Secret
const JWT_SECRET = 'bizzylink-secure-jwt-key-for-authentication';

// MongoDB Connection
let db;

// Connect to MongoDB
async function connectToDB() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient('mongodb://127.0.0.1:27017', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 30,
      minPoolSize: 5,
      heartbeatFrequencyMS: 10000
    });
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db('bizzylink');
    console.log('Database selected: bizzylink');
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name).join(', '));

    // Setup reconnection logic
    client.on('close', () => {
      console.log('MongoDB connection closed. Attempting to reconnect...');
      setTimeout(async () => {
        try {
          await connectToDB();
          console.log('Reconnection to MongoDB successful');
        } catch (err) {
          console.error('Failed to reconnect to MongoDB:', err);
        }
      }, 5000);
    });
    
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Details:', error.message);
    
    // More detailed error reporting
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not select a MongoDB server. Please check if MongoDB is running.');
    } else if (error.name === 'MongoNetworkError') {
      console.error('Network error connecting to MongoDB. Please check network settings and MongoDB status.');
    }
    
    // Instead of exiting, retry after a delay
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectToDB, 5000);
  }
}

// Middleware to extract user from token
const extractUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authorization token required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log(`[Auth Route Debug] Login request received { username: '${username}', ip: '${req.ip}' }`);
  
  try {
    // Find user by username
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });
    
    if (!user) {
      console.log(`Login failed: User '${username}' not found`);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user '${username}'`);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    // Create JWT token
    const userData = {
      username: user.username,
      id: user._id.toString(),
      role: user.role || 'user',
      forum_rank: user.forum_rank || 'user',
      permissions: user.permissions || {
        canAccessAdmin: false,
        canModerateForums: false,
        canManageUsers: false,
        canEditServer: false
      }
    };
    
    const token = jwt.sign({ user: userData }, JWT_SECRET, { expiresIn: '24h' });
    
    console.log(`Login successful for user '${username}' with ID ${user._id}`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      token,
      user: userData
    });
    
  } catch (error) {
    console.error(`Login error:`, error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server not responding. Please try again later.' 
    });
  }
});

// Generate Link Code Route
app.post('/api/linkcode/generate', extractUser, async (req, res) => {
  const userId = req.user.id;
  const { mcUsername } = req.body;
  
  console.log(`[Link Code] Generating link code for user: ${userId}, Minecraft username: ${mcUsername}`);
  
  if (!mcUsername) {
    return res.status(400).json({
      success: false,
      error: 'Minecraft username is required'
    });
  }
  
  try {
    // Generate a random 6-character code
    const linkCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Update user with the link code
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          'minecraft.linkCode': linkCode,
          'minecraft.linkCodeExpires': expiresAt,
          'minecraft.mcUsername': mcUsername
        } 
      }
    );
    
    console.log(`Link code ${linkCode} generated for user ${userId}, expires at ${expiresAt}`);
    
    // Return the link code in the format expected by the frontend
    return res.status(200).json({
      success: true,
      message: 'Link code generated successfully',
      code: linkCode,
      expires: expiresAt
    });
    
  } catch (error) {
    console.error(`Link code generation error:`, error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error. Please try again later.' 
    });
  }
});

// Add to the top of the file for better axios handling
axios.defaults.timeout = 10000; // 10 second timeout
axios.interceptors.request.use(request => {
  console.log(`Making ${request.method.toUpperCase()} request to: ${request.url}`);
  console.log('Request data:', JSON.stringify(request.data));
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log(`Response from ${response.config.url}: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`Error response from ${error.config.url}: ${error.response.status}`);
      console.error('Error response data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error(`No response received for request to ${error.config.url}`);
      console.error('Error details:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Update the route for validating link codes
app.post('/api/linkcode/validate', async (req, res) => {
  console.log('==== LINK CODE VALIDATION REQUEST ====');
  console.log('Request body:', JSON.stringify(req.body));
  
  try {
    const { code, username, uuid } = req.body;
    
    if (!code) {
      console.log('Validation rejected: No code provided');
      return res.status(400).json({ message: 'No code provided' });
    }

    if (!username || !uuid) {
      console.log('Validation rejected: Missing Minecraft info');
      return res.status(400).json({ message: 'Missing Minecraft user information' });
    }

    console.log(`Validating link code: ${code} for Minecraft user: ${username} (${uuid})`);
    
    // Find the link code in database
    const usersCollection = db.collection('users');
    
    // Find user with this link code
    const user = await usersCollection.findOne({ 
      'minecraft.linkCode': code,
      'minecraft.linkCodeExpires': { $gt: new Date() }
    });
    
    if (!user) {
      console.log(`Link code not found or expired: ${code}`);
      return res.status(404).json({ message: 'Invalid or expired code' });
    }
    
    console.log(`Found user for link code: ${user._id} (${user.username})`);
    
    // Mark code as used and link the account
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'minecraft.mcUsername': username,
          'minecraft.mcUUID': uuid,
          'minecraft.linkedAt': new Date(),
          'minecraft.linked': true,
          'minecraft.lastSeen': new Date()
        },
        $unset: {
          'minecraft.linkCode': '',
          'minecraft.linkCodeExpires': ''
        }
      }
    );
    
    console.log(`Successfully linked Minecraft account ${username} (${uuid}) to user ${user._id}`);
    
    // Notify main server about successful linking - try multiple methods
    console.log('Notifying main server about account link...');
    
    // Track whether notification was successful
    let notificationSuccess = false;
    
    // Method 1: Use the notify endpoint
    try {
      console.log('=== NOTIFICATION ATTEMPT 1 ===');
      console.log('Sending to: http://localhost:8080/api/minecraft/notify');
      
      const notifyResponse = await axios.post('http://localhost:8080/api/minecraft/notify', {
        userId: user._id.toString(),
        mcUsername: username,
        mcUUID: uuid,
        event: 'minecraft_linked',
        data: { 
          username: username, 
          uuid: uuid,
          linkedAt: new Date().toISOString()
        }
      });
      
      console.log(`Notification method 1 successful: ${notifyResponse.status}`);
      console.log('Response data:', JSON.stringify(notifyResponse.data));
      notificationSuccess = true;
    } catch (notifyError) {
      console.error('Notification method 1 failed:', notifyError.message);
      
      // Method 2: Try the player update endpoint
      setTimeout(async () => {
        try {
          console.log('=== NOTIFICATION ATTEMPT 2 ===');
          console.log('Sending to: http://localhost:8080/api/player/update');
          
          const updateResponse = await axios.post('http://localhost:8080/api/player/update', {
            mcUsername: username,
            mcUUID: uuid,
            stats: { 
              linkedAccount: true,
              userId: user._id.toString(),
              linkedAt: new Date().toISOString()
            }
          });
          
          console.log(`Notification method 2 successful: ${updateResponse.status}`);
          console.log('Response data:', JSON.stringify(updateResponse.data));
          notificationSuccess = true;
        } catch (updateError) {
          console.error('Notification method 2 failed:', updateError.message);
          
          // Method 3: Try the legacy endpoint
          setTimeout(async () => {
            try {
              console.log('=== NOTIFICATION ATTEMPT 3 ===');
              console.log('Sending to: http://localhost:8080/api/minecraft/link/notify');
              
              const legacyResponse = await axios.post('http://localhost:8080/api/minecraft/link/notify', {
                userId: user._id.toString(),
                mcUsername: username,
                mcUUID: uuid
              });
              
              console.log(`Notification method 3 successful: ${legacyResponse.status}`);
              console.log('Response data:', JSON.stringify(legacyResponse.data));
              notificationSuccess = true;
            } catch (legacyError) {
              console.error('Notification method 3 failed:', legacyError.message);
              console.error('All notification methods failed. Frontend may not update automatically.');
            }
          }, 2000);
        }
      }, 2000);
    }
    
    // Return success response with user data
    console.log('Returning success response to Minecraft server');
    
    return res.status(200).json({ 
      message: 'Account linked successfully',
      notificationSent: notificationSuccess,
      user: {
        id: user._id,
        username: user.username,
        minecraft: {
          username: username,
          uuid: uuid,
          linkedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error in link code validation:', error);
    return res.status(500).json({ 
      message: 'Server error processing link request', 
      error: error.message 
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  return res.json({ success: true, message: 'Direct auth server is working' });
});

// Add player data update endpoint
app.post('/api/player/update', async (req, res) => {
  const playerData = req.body;
  
  console.log(`[Player Update] Received update for player ${playerData.username || playerData.mcUsername} (${playerData.uuid || playerData.mcUUID})`);
  
  // Extract the UUID and username from various possible fields
  const mcUUID = playerData.uuid || playerData.mcUUID || playerData.UUID || null;
  const mcUsername = playerData.username || playerData.mcUsername || playerData.player || null;
  const userId = playerData.userId || playerData.user_id || null;
  
  if (!mcUUID && !mcUsername && !userId) {
    return res.status(400).json({
      success: false,
      error: 'Minecraft UUID and username are required'
    });
  }
  
  try {
    const usersCollection = db.collection('users');
    
    // Check if player exists with this UUID
    let query = {};
    
    if (userId) {
      query = { _id: new ObjectId(userId) };
    } else if (mcUUID) {
      query = { 'minecraft.mcUUID': mcUUID };
    } else if (mcUsername) {
      query = { 'minecraft.mcUsername': mcUsername };
    }
    
    const updateResult = await usersCollection.updateOne(
      query,
      {
        $set: {
          'minecraft.lastSeen': new Date(),
          'minecraft.stats': playerData
        }
      }
    );
    
    if (updateResult.matchedCount === 0) {
      console.log(`No user found with UUID ${mcUUID}, username ${mcUsername}, or userId ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'No linked user found with these Minecraft credentials'
      });
    }
    
    console.log(`Updated player data for ${mcUsername} (${mcUUID})`);
    return res.status(200).json({
      success: true,
      message: 'Player data updated successfully'
    });
    
  } catch (error) {
    console.error(`Player data update error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
});

// Start server
const PORT = 8082;

connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Direct authentication server running on port ${PORT}`);
  });
}).catch(console.error); 