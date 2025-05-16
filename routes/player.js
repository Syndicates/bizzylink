/**
 * Player API for BizzyLink
 * 
 * Handles player-related API endpoints
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const eventEmitter = require('../eventEmitter');

/**
 * Get player status - endpoint that minecraft checks to see if a player is linked
 * POST /api/player/status
 */
router.post('/status', async (req, res) => {
  try {
    const { username, uuid } = req.body;
    
    console.log(`Checking status for Minecraft player: ${username} (${uuid})`);
    
    if (!username || !uuid) {
      return res.status(400).json({
        success: false,
        error: 'Username and UUID are required'
      });
    }
    
    // Find user with this Minecraft username
    const user = await User.findOne({ 
      mcUsername: username,
      isLinked: true
    });
    
    if (!user) {
      console.log(`No linked user found for Minecraft player: ${username}`);
      return res.json({
        success: true,
        linked: false
      });
    }
    
    console.log(`Found linked user for Minecraft player: ${username} -> Website user: ${user.username}`);
    
    // Return player status
    return res.json({
      success: true,
      linked: true,
      websiteUsername: user.username
    });
  } catch (error) {
    console.error('Error checking player status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check player status'
    });
  }
});

/**
 * Update player data from Minecraft server
 * POST /api/player/update
 */
router.post('/update', async (req, res) => {
  try {
    const { uuid, username, data } = req.body;
    
    if (!uuid || !username) {
      return res.status(400).json({
        success: false,
        error: 'UUID and username are required'
      });
    }
    
    // Find the linked user
    const user = await User.findOne({ 
      mcUsername: username,
      isLinked: true
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No linked user found'
      });
    }
    
    // Update player data
    user.mcData = {
      ...user.mcData,
      ...data,
      lastUpdate: new Date()
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Player data updated'
    });
  } catch (error) {
    console.error('Error updating player data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update player data'
    });
  }
});

module.exports = router; 