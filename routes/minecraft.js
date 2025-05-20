/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file minecraft.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');
const axios = require('axios');
const eventEmitter = require('../eventEmitter');

// GET current user's Minecraft link status
router.get('/link', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if the user has a linked Minecraft account
    // Check both field paths for backward compatibility
    const isLinked = (user.minecraft && user.minecraft.linked) || 
                     (user.mcUsername && user.mcUUID);
    
    const mcUsername = user.minecraft?.mcUsername || user.mcUsername;
    const mcUUID = user.minecraft?.mcUUID || user.mcUUID;
    
    if (isLinked && mcUsername) {
      return res.status(200).json({
        success: true,
        minecraft: {
          linked: true,
          username: mcUsername,
          uuid: mcUUID,
          lastSeen: user.minecraft?.lastSeen || null,
          lastLinked: user.minecraft?.lastLinked || null
        }
      });
    } else {
      // User doesn't have a linked Minecraft account
      // Check if they have an active link code
      if (user.minecraft && user.minecraft.linkCode && new Date(user.minecraft.linkCodeExpires) > new Date()) {
        return res.status(200).json({
          success: true,
          minecraft: {
            linked: false,
            linkCode: user.minecraft.linkCode,
            linkCodeExpires: user.minecraft.linkCodeExpires
          }
        });
      } else {
        // No active link code
        return res.status(200).json({
          success: true,
          minecraft: {
            linked: false
          }
        });
      }
    }
  } catch (error) {
    console.error('Error getting Minecraft link status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Generate a new link code for the current user
router.post('/link/generate', authenticateToken, async (req, res) => {
  try {
    const { mcUsername } = req.body;
    
    if (!mcUsername) {
      return res.status(400).json({
        success: false,
        message: 'Minecraft username is required'
      });
    }
    
    // Forward the request to the direct-auth-server
    const response = await axios.post('http://localhost:8082/api/linkcode/generate', {
      userId: req.user.id,
      mcUsername
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error generating link code:', error);
    
    // If the error came from the direct-auth-server, forward its response
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Unlink Minecraft account
router.delete('/link', authenticateToken, async (req, res) => {
  try {
    console.log(`[MINECRAFT UNLINK] Received unlink request for user ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.error(`[MINECRAFT UNLINK] User not found with ID: ${req.user.id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log(`[MINECRAFT UNLINK] Found user: ${user.username}`);
    console.log(`[MINECRAFT UNLINK] Current status: linked=${user.linked}, minecraft.linked=${user.minecraft?.linked}`);
    console.log(`[MINECRAFT UNLINK] Username: mcUsername=${user.mcUsername}, minecraft.mcUsername=${user.minecraft?.mcUsername}`);
    
    // Check if user is actually linked before attempting to unlink
    const isLinked = user.linked || (user.minecraft && user.minecraft.linked);
    const mcUsername = user.mcUsername || (user.minecraft && user.minecraft.mcUsername);
    
    if (!isLinked || !mcUsername) {
      console.log(`[MINECRAFT UNLINK] User ${user.username} is not linked, returning success anyway`);
      return res.status(200).json({
        success: true,
        message: 'Account already unlinked',
        alreadyUnlinked: true
      });
    }
    
    // Store the previous values for notification
    const previousMcUsername = mcUsername;
    
    // Update user directly with updateOne to avoid validation issues
    // Update both old and new data structures
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: {
          linked: false,
          mcUsername: null,
          linkCode: null,
          linkCodeExpiry: null,
          'minecraft.linked': false,
          'minecraft.mcUsername': null,
          'minecraft.linkCode': null,
          'minecraft.linkCodeExpires': null,
          'minecraft.stats': {},
          'minecraft.lastLinked': null
        },
        $unset: {
          mcUUID: "",
          'minecraft.mcUUID': ""
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.error(`[MINECRAFT UNLINK] Failed to update user record for ${user.username}, DB returned: `, updateResult);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to unlink account - database update failed' 
      });
    }
    
    console.log(`[MINECRAFT UNLINK] Successfully unlinked account for user ${user.username}`);
    
    // Notify any connected browser clients that the account has been unlinked
    if (global.notifyUser) {
      global.notifyUser(user._id.toString(), {
        type: 'account_unlinked',
        userId: user._id.toString(),
        previousMcUsername,
        linked: false,
        timestamp: new Date().toISOString(),
        message: 'Your Minecraft account has been successfully unlinked!'
      });
    }
    
    // Notify any connected clients via socket.io (real-time unlink event)
    // (Removed direct io usage - see RULES.md: emit events from main server context)
    // Use global.notifyUser for real-time notifications
    
    // Emit unlink event to all plugin clients (plugin-mc room) via main server
    const mcUUID = user.minecraft?.mcUUID || user.mcUUID;
    if (mcUUID) {
      try {
        await axios.post(
          'http://localhost:8080/api/internal/emit-unlink',
          { mcUUID, message: 'Your Minecraft account has been unlinked.' },
          { headers: { 'x-internal-secret': process.env.INTERNAL_EVENT_SECRET } }
        );
        console.log(`[INTERNAL] Requested player_unlinked emission for mcUUID: ${mcUUID}`);
      } catch (err) {
        console.error('[INTERNAL] Failed to request player_unlinked emission:', err.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Minecraft account unlinked successfully'
    });
  } catch (error) {
    console.error('Error unlinking Minecraft account:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Add a route to handle Minecraft account link notifications
router.post('/link/notify', async (req, res) => {
    const { userId, mcUsername, mcUUID } = req.body;
    
    console.log(`Received link notification for user ${userId} with Minecraft username ${mcUsername}`);
    
    try {
        // Update the user in the database with consistent field paths
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: {
                    'minecraft.linked': true,
                    'minecraft.mcUsername': mcUsername,
                    'minecraft.mcUUID': mcUUID,
                    'minecraft.lastLinked': new Date(),
                    // Also set at root level for backward compatibility
                    'mcUsername': mcUsername,
                    'mcUUID': mcUUID
                }
            },
            { new: true }
        );
        
        if (!user) {
            console.error(`User not found: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Emit an event to notify frontend using the correct 'userEvent' event
        eventEmitter.emit('userEvent', { 
            userId: userId,
            event: 'minecraft_linked',
            data: { 
                username: mcUsername,
                uuid: mcUUID,
                linkedAt: new Date().toISOString()
            }
        });
        
        console.log(`Successfully linked Minecraft account for user ${userId}`);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating user with Minecraft info:', error);
        return res.status(500).json({ error: 'Server error when updating user' });
    }
});

// Add a new route to handle the /notify endpoint
router.post('/notify', async (req, res) => {
    const { userId, mcUsername, mcUUID, event, data } = req.body;
    
    console.log(`Received minecraft notification for user ${userId}, event: ${event}`);
    
    try {
        // Update the user in the database with consistent field paths
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: {
                    'minecraft.linked': true,
                    'minecraft.mcUsername': mcUsername,
                    'minecraft.mcUUID': mcUUID,
                    'minecraft.lastLinked': new Date(),
                    // Also set at root level for backward compatibility
                    'mcUsername': mcUsername,
                    'mcUUID': mcUUID
                }
            },
            { new: true }
        );
        
        if (!user) {
            console.error(`User not found: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Emit an event to notify frontend via the global eventEmitter
        eventEmitter.emit('userEvent', { 
            userId: userId,
            event: 'minecraft_linked',
            data: { 
                username: mcUsername,
                uuid: mcUUID,
                linkedAt: new Date().toISOString()
            }
        });
        
        console.log(`Successfully processed minecraft event for user ${userId}`);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating user with Minecraft info:', error);
        return res.status(500).json({ error: 'Server error when updating user' });
    }
});

// Add a route to check if a Minecraft username is already linked
router.get('/check/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ 'minecraft.username': username });
        
        if (user) {
            return res.json({ linked: true, userId: user._id });
        }
        
        return res.json({ linked: false });
    } catch (error) {
        console.error('Error checking Minecraft username:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Add a route to get player statistics (requires authentication)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || !user.minecraft || !user.minecraft.linked) {
            return res.status(400).json({ error: 'No Minecraft account linked to this user' });
        }
        
        // Placeholder for actual stats logic
        // In a real implementation, you might fetch this from another service
        return res.json({
            username: user.minecraft.username,
            uuid: user.minecraft.uuid,
            lastUpdated: user.minecraft.lastUpdated,
            stats: {
                playtime: "10 hours",
                kills: 25,
                deaths: 5
            }
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Add a new endpoint to force refresh a player's link status
router.post('/force-refresh-link/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    if (!uuid) {
      return res.status(400).json({ error: 'UUID is required' });
    }
    
    console.log(`[Minecraft] Received force-refresh request for UUID: ${uuid}`);
    
    // Find user by minecraft UUID
    const user = await User.findOne({ mcUUID: uuid });
    
    if (!user) {
      console.log(`[Minecraft] No user found with UUID: ${uuid}`);
      return res.status(200).json({ 
        status: 'not_found',
        linked: false,
        message: 'No user found with this UUID' 
      });
    }
    
    console.log(`[Minecraft] Found user ${user.username} with linked=${user.linked}`);
    
    // Return the current status - the important thing is that we're getting
    // the fresh state directly from the database
    return res.status(200).json({
      status: 'success',
      linked: user.linked === true,
      username: user.username,
      mcUsername: user.mcUsername,
      userId: user._id.toString()
    });
  } catch (error) {
    console.error('Error in force-refresh-link:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Debug endpoint to test link code validation
 * POST /api/minecraft/debug/validate-code
 */
router.post('/debug/validate-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log(`[DEBUG] Testing link code validation for code: ${code}`);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Link code is required'
      });
    }
    
    // Get the link code manager
    const linkCodeManager = require('../routes/linkcode-manager');
    
    // Check if the code exists in the active codes map
    const activeCodes = linkCodeManager.getAllCodes();
    console.log(`[DEBUG] Active codes:`, activeCodes);
    
    // Validate the code
    const validatedData = linkCodeManager.validateCode(code);
    
    if (!validatedData) {
      console.log(`[DEBUG] Code validation failed: Invalid or expired link code`);
      return res.json({
        success: false,
        error: 'Invalid or expired link code',
        debug: {
          activeCodes,
          code,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Get linked user details
    const linkedUser = await User.findById(validatedData.userId);
    
    if (!linkedUser) {
      console.log(`[DEBUG] Code validation failed: Linked user not found`);
      return res.status(404).json({
        success: false,
        error: 'Linked user not found',
        debug: {
          userId: validatedData.userId,
          code,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log(`[DEBUG] Code validation successful for user: ${linkedUser.username}`);
    
    res.json({
      success: true,
      message: 'Link code is valid',
      user: {
        id: linkedUser._id,
        username: linkedUser.username,
        email: linkedUser.email
      },
      debug: {
        code,
        expires: new Date(validatedData.expires).toISOString(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in debug validate code endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during validation',
      debug: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// Special endpoint for Minecraft plugin unlinks - supports both DELETE and POST
router.post('/unlink', async (req, res) => {
  try {
    console.log(`[MINECRAFT UNLINK] Received unlink request via POST from Minecraft plugin`);
    console.log(`[MINECRAFT UNLINK] Request body:`, req.body);
    
    const { username, uuid } = req.body;
    
    if (!username || !uuid) {
      console.error(`[MINECRAFT UNLINK] Missing username or UUID in request`);
      return res.status(400).json({ 
        success: false, 
        message: 'Missing username or UUID' 
      });
    }
    
    console.log(`[MINECRAFT UNLINK] Looking for user with Minecraft username: ${username}`);
    
    // Find the user by Minecraft username and UUID
    const user = await User.findOne({
      $or: [
        { mcUsername: username },
        { "minecraft.mcUsername": username },
        { mcUUID: uuid },
        { "minecraft.mcUUID": uuid }
      ]
    });
    
    if (!user) {
      console.log(`[MINECRAFT UNLINK] No user found with Minecraft username: ${username} or UUID: ${uuid}`);
      return res.status(200).json({
        success: true,
        message: 'Account already unlinked',
        alreadyUnlinked: true
      });
    }
    
    console.log(`[MINECRAFT UNLINK] Found user: ${user.username}`);
    console.log(`[MINECRAFT UNLINK] Current status: linked=${user.linked}, minecraft.linked=${user.minecraft?.linked}`);
    
    // Check if user is actually linked before attempting to unlink
    const isLinked = user.linked || (user.minecraft && user.minecraft.linked);
    
    if (!isLinked) {
      console.log(`[MINECRAFT UNLINK] User ${user.username} is not linked, returning success anyway`);
      return res.status(200).json({
        success: true,
        message: 'Account already unlinked',
        alreadyUnlinked: true
      });
    }
    
    // Update user directly with updateOne to avoid validation issues
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: {
          linked: false,
          mcUsername: null,
          linkCode: null,
          linkCodeExpiry: null,
          'minecraft.linked': false,
          'minecraft.mcUsername': null,
          'minecraft.linkCode': null,
          'minecraft.linkCodeExpires': null,
          'minecraft.lastLinked': null
        },
        $unset: {
          mcUUID: "",
          'minecraft.mcUUID': ""
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.error(`[MINECRAFT UNLINK] Failed to update user record for ${user.username}, DB returned: `, updateResult);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to unlink account - database update failed' 
      });
    }
    
    console.log(`[MINECRAFT UNLINK] Successfully unlinked account for user ${user.username}`);
    
    // Notify any connected browser clients that the account has been unlinked
    if (global.notifyUser) {
      global.notifyUser(user._id.toString(), {
        type: 'account_unlinked',
        userId: user._id.toString(),
        previousMcUsername: username,
        linked: false,
        timestamp: new Date().toISOString(),
        message: 'Your Minecraft account has been unlinked from the Minecraft client!'
      });
    }
    
    // Notify any connected clients via socket.io (real-time unlink event)
    // (Removed direct io usage - see RULES.md: emit events from main server context)
    // Use global.notifyUser for real-time notifications
    
    // Emit unlink event to all plugin clients (plugin-mc room) via main server
    const mcUUID = user.minecraft?.mcUUID || user.mcUUID;
    if (mcUUID) {
      try {
        await axios.post(
          'http://localhost:8080/api/internal/emit-unlink',
          { mcUUID, message: 'Your Minecraft account has been unlinked.' },
          { headers: { 'x-internal-secret': process.env.INTERNAL_EVENT_SECRET } }
        );
        console.log(`[INTERNAL] Requested player_unlinked emission for mcUUID: ${mcUUID}`);
      } catch (err) {
        console.error('[INTERNAL] Failed to request player_unlinked emission:', err.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Account successfully unlinked'
    });
  } catch (error) {
    console.error(`[MINECRAFT UNLINK] Error processing unlink request:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Special endpoint for Minecraft plugin to unlink an account
// This accepts POST requests to accommodate the plugin's implementation
router.post('/unlink', async (req, res) => {
  try {
    const { username, uuid } = req.body;
    
    if (!username || !uuid) {
      console.error('[MC-UNLINK] Missing username or UUID in request');
      return res.status(400).json({ 
        success: false, 
        error: 'Username and UUID are required' 
      });
    }
    
    console.log(`[MC-UNLINK] Received unlink request for Minecraft account: ${username} (${uuid})`);
    
    // Find user by Minecraft UUID
    // Support both old and new data structures
    const user = await User.findOne({
      $or: [
        { 'minecraft.mcUUID': uuid },
        { mcUUID: uuid }
      ]
    });
    
    if (!user) {
      console.error(`[MC-UNLINK] No user found with Minecraft UUID: ${uuid}`);
      return res.status(404).json({ 
        success: false, 
        error: 'No linked user found with this Minecraft UUID' 
      });
    }
    
    console.log(`[MC-UNLINK] Found user: ${user.username}`);
    console.log(`[MC-UNLINK] Minecraft status: linked=${user.linked}, minecraft.linked=${user.minecraft?.linked}`);
    console.log(`[MC-UNLINK] Username: mcUsername=${user.mcUsername}, minecraft.mcUsername=${user.minecraft?.mcUsername}`);
    
    // Check if user is actually linked before attempting to unlink
    const isLinked = user.linked || (user.minecraft && user.minecraft.linked);
    const mcUsername = user.mcUsername || (user.minecraft && user.minecraft.mcUsername);
    
    if (!isLinked || !mcUsername) {
      console.log(`[MC-UNLINK] User ${user.username} is not linked, returning success anyway`);
      return res.status(200).json({ 
        success: true, 
        message: 'Account already unlinked', 
        alreadyUnlinked: true 
      });
    }
    
    // Store the previous values for notification
    const previousMcUsername = mcUsername;
    
    // Update user directly with updateOne to avoid validation issues
    // Update both old and new data structures
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: {
          linked: false,
          mcUsername: null,
          linkCode: null,
          linkCodeExpiry: null,
          mcStats: {}, // Clear stats when unlinking
          'minecraft.linked': false,
          'minecraft.mcUsername': null,
          'minecraft.linkCode': null,
          'minecraft.linkCodeExpires': null,
          'minecraft.lastLinked': null
        },
        $unset: {
          mcUUID: "",
          'minecraft.mcUUID': ""
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.error(`[MC-UNLINK] Failed to update user record for ${user.username}, DB returned: `, updateResult);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to unlink account - database update failed' 
      });
    }
    
    console.log(`[MC-UNLINK] Successfully unlinked account for user ${user.username}`);
    
    // Notify any connected browser clients that the account has been unlinked
    if (global.notifyUser) {
      global.notifyUser(user._id.toString(), {
        type: 'account_unlinked',
        userId: user._id.toString(),
        previousMcUsername,
        linked: false,
        timestamp: new Date().toISOString(),
        message: 'Your Minecraft account has been unlinked from the Minecraft client!'
      });
    }
    
    // Notify any connected clients via socket.io (real-time unlink event)
    // (Removed direct io usage - see RULES.md: emit events from main server context)
    // Use global.notifyUser for real-time notifications
    
    // Emit event for other server components
    eventEmitter.emit('minecraft_account_unlinked', {
      userId: user._id.toString(),
      mcUsername: previousMcUsername,
      mcUUID: uuid
    });
    
    // Emit unlink event to all plugin clients (plugin-mc room) via main server
    const mcUUID = user.minecraft?.mcUUID || user.mcUUID;
    if (mcUUID) {
      try {
        await axios.post(
          'http://localhost:8080/api/internal/emit-unlink',
          { mcUUID, message: 'Your Minecraft account has been unlinked.' },
          { headers: { 'x-internal-secret': process.env.INTERNAL_EVENT_SECRET } }
        );
        console.log(`[INTERNAL] Requested player_unlinked emission for mcUUID: ${mcUUID}`);
      } catch (err) {
        console.error('[INTERNAL] Failed to request player_unlinked emission:', err.message);
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Account unlinked successfully' 
    });
  } catch (error) {
    console.error('[MC-UNLINK] Error unlinking account:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

module.exports = router; 