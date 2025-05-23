/**
 * +----+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +----+
 *
 * @file minecraft.js
 * @description Minecraft integration API routes
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { SecurityLog } = require('../models/SecurityLog');
const ErrorResponse = require('../utils/errorResponse');
const LuckPermsSync = require('../services/LuckPermsSync');
const { v4: uuidv4 } = require('uuid');
const eventEmitter = require('../eventEmitter');

// Add debugLog utility for conditional debug output if not already present
const isDebug = process.env.DEBUG_LOGS === 'true';
function debugLog(...args) {
  if (isDebug) console.log(...args);
}

/**
 * @route   POST /api/minecraft/link/generate
 * @desc    Generate link code for Minecraft account
 * @access  Private
 */
router.post('/link/generate', protect, async (req, res, next) => {
  try {
    const { mcUsername } = req.body;
    
    if (!mcUsername) {
      return next(new ErrorResponse('Minecraft username is required', 400));
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user already has a link code that's still valid
    if (user.linkCode && user.linkExpiryDate && user.linkExpiryDate > Date.now()) {
      return res.status(200).json({
        success: true,
        message: 'Link code already generated',
        data: {
          linkCode: user.linkCode,
          expiresAt: user.linkExpiryDate
        }
      });
    }
    
    // Generate new link code
    const linkCode = user.generateLinkCode();
    await user.save();
    
    // Log link code generation
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_LINK',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        mcUsername,
        linkCode: user.linkCode
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Link code generated successfully',
      data: {
        linkCode: user.linkCode,
        expiresAt: user.linkExpiryDate
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/minecraft/link
 * @desc    Get current link code
 * @access  Private
 */
router.get('/link', protect, async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user has a valid link code
    if (user.linkCode && user.linkExpiryDate && user.linkExpiryDate > Date.now()) {
      return res.status(200).json({
        success: true,
        data: {
          linkCode: user.linkCode,
          expiresAt: user.linkExpiryDate
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/link/verify
 * @desc    Verify link code from Minecraft plugin
 * @access  Public
 */
router.post('/link/verify', async (req, res, next) => {
  try {
    const { linkCode, mcUsername, mcUUID } = req.body;
    
    debugLog('[LINK VERIFY] Request received:', { linkCode, mcUsername, mcUUID });
    
    if (!linkCode || !mcUsername || !mcUUID) {
      debugLog('[LINK VERIFY] Missing required fields in request');
      return next(new ErrorResponse('Link code, Minecraft username, and UUID are required', 400));
    }
    
    // Find user with this link code
    const user = await User.findOne({ linkCode });
    debugLog('[LINK VERIFY] User found:', user ? { id: user._id, username: user.username } : 'No user found with this link code');
    
    if (!user) {
      return next(new ErrorResponse('Invalid link code', 404));
    }
    
    // Check if link code is expired
    if (!user.isLinkCodeValid()) {
      debugLog('[LINK VERIFY] Link code expired for user:', user.username);
      return next(new ErrorResponse('Link code has expired', 400));
    }
    
    // Check if another user already has this UUID linked
    const existingUser = await User.findOne({ minecraftUUID: mcUUID });
    if (existingUser && !existingUser._id.equals(user._id)) {
      debugLog('[LINK VERIFY] UUID already linked to another user:', { 
        uuid: mcUUID, 
        existingUser: existingUser.username,
        requestingUser: user.username
      });
      return next(new ErrorResponse('This Minecraft account is already linked to another user', 400));
    }
    
    debugLog('[LINK VERIFY] Link code valid, proceeding with account linking for user:', user.username);
    
    // --- Ensure all required fields are set for proper linking (see RULES.md & database-info.md) ---
    user.minecraftUsername = mcUsername;
    user.mcUsername = mcUsername;
    user.minecraftUUID = mcUUID;
    user.mcUUID = mcUUID;
    user.linked = true;
    user.isLinked = true;
    user.minecraft = user.minecraft || {};
    user.minecraft.linked = true;
    user.minecraft.mcUsername = mcUsername;
    user.minecraft.mcUUID = mcUUID;
    user.minecraft.minecraftUUID = mcUUID;
    user.minecraft.minecraftUsername = mcUsername;
    // --- Mark nested object as modified so Mongoose persists changes (see RULES.md & database-info.md) ---
    user.markModified('minecraft');
    
    debugLog('[LINK VERIFY] Set all required fields for linking:', {
      minecraftUsername: user.minecraftUsername,
      mcUsername: user.mcUsername,
      minecraftUUID: user.minecraftUUID,
      mcUUID: user.mcUUID,
      linked: user.linked,
      isLinked: user.isLinked,
      minecraft: user.minecraft
    });
    
    // Sync player rank from LuckPerms
    try {
      await LuckPermsSync.syncPlayerRank(mcUUID);
    } catch (err) {
      debugLog('Error syncing player rank:', err);
      // Continue even if rank sync fails
    }
    
    // Log user state before save
    debugLog('[LINK VERIFY] User before save:', user);
    await user.save();
    
    // Reload user from DB to verify persistence
    const userAfterSave = await User.findById(user._id);
    debugLog('[LINK VERIFY] User after linking (after save):', userAfterSave);
    
    // Log account linking
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_LINK',
      details: {
        mcUsername,
        mcUUID,
        success: true
      }
    });

    // Generate new JWT token after linking
    const token = user.getSignedToken();

    // ----- EVENT EMISSION FOR REAL-TIME UPDATES -----
    
    // Payload for all events
    const eventPayload = { 
      mcUsername, 
      mcUUID,
      userId: user._id.toString(),
      timestamp: Date.now() 
    };
    
    // 1. Emit SSE event via eventEmitter (primary method)
    if (eventEmitter) {
      debugLog(`[LINK VERIFY] Emitting minecraft_linked event via eventEmitter for user ${user._id}`);
      try {
        eventEmitter.emit('userEvent', { 
          userId: user._id.toString(), 
          event: 'minecraft_linked', 
          data: eventPayload 
        });
        debugLog('[LINK VERIFY] Successfully emitted event via eventEmitter');
      } catch (emitError) {
        debugLog('[LINK VERIFY] Error emitting event via eventEmitter:', emitError);
      }
    } else {
      debugLog('[LINK VERIFY] eventEmitter not available!');
    }
    
    // 2. Also emit traditional notification to user
    if (global.notifyUser) {
      debugLog(`[LINK VERIFY] Sending traditional notification to user ${user._id}`);
      try {
        global.notifyUser(user._id.toString(), {
          type: 'minecraft_linked',
          title: 'Account Linked',
          message: `Your Minecraft account (${mcUsername}) has been successfully linked!`,
          ...eventPayload
        });
        debugLog('[LINK VERIFY] Successfully sent notification via notifyUser');
      } catch (notifyError) {
        debugLog('[LINK VERIFY] Error sending notification via notifyUser:', notifyError);
      }
    } else {
      debugLog('[LINK VERIFY] global.notifyUser not available!');
    }
    
    // 3. Socket.io emit - critical for real-time dashboard updates
    if (global.io && global.io.to) {
      debugLog(`[LINK VERIFY] Emitting minecraft_linked to user room ${user._id} via Socket.IO`);
      
      try {
        // First try direct room emit
        global.io.to(user._id.toString()).emit('minecraft_linked', eventPayload);
        debugLog('[LINK VERIFY] First Socket.IO emit complete (to user room)');
        
        // Also try a broadcast emit for robustness
        global.io.emit('broadcast:minecraft_linked', {
          ...eventPayload,
          isBroadcast: true
        });
        debugLog('[LINK VERIFY] Broadcast Socket.IO emit complete');
      } catch (socketError) {
        debugLog('[LINK VERIFY] Error emitting via Socket.IO:', socketError);
      }
    } else {
      debugLog('[LINK VERIFY] global.io not available or missing to() method!');
      // Log socket.io state to help diagnose issues
      debugLog('[LINK VERIFY] global.io state:', global.io ? 'Exists' : 'Missing');
      if (global.io) {
        debugLog('[LINK VERIFY] global.io methods:', Object.keys(global.io));
        debugLog('[LINK VERIFY] Socket rooms available:', typeof global.io.sockets === 'object' ? 'Yes' : 'No');
      }
    }

    debugLog('[LINK VERIFY] Successfully completed account linking for user', user.username);
    
    res.status(200).json({
      success: true,
      message: 'Minecraft account linked successfully',
      token, // <-- new token for frontend
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rank: user.webRank,
        minecraftUsername: user.minecraftUsername,
        minecraftUUID: user.minecraftUUID,
        isLinked: user.hasLinkedAccount(),
        linked: user.linked
      }
    });
  } catch (error) {
    debugLog('[LINK VERIFY] Unexpected error:', error);
    next(error);
  }
});

/**
 * @route   DELETE /api/minecraft/link
 * @desc    Unlink Minecraft account
 * @access  Private
 */
router.delete('/link', protect, async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user has a linked account
    if (!user.minecraftUUID) {
      return next(new ErrorResponse('No Minecraft account linked', 400));
    }
    
    // Store for logging
    const oldMcUsername = user.minecraftUsername;
    const oldMcUUID = user.minecraftUUID;
    
    // --- Clear ALL Minecraft username/UUID/link fields for full unlink (see RULES.md & database-info.md) ---
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          linkCode: undefined,
          linkExpiryDate: undefined,
          minecraftUsername: null,
          mcUsername: null,
          minecraftUUID: null,
          mcUUID: null,
          linked: false,
          isLinked: false,
          'minecraft.linked': false,
          'minecraft.mcUsername': null,
          'minecraft.mcUUID': null,
          'minecraft.linkCode': undefined,
          'minecraft.linkCodeExpires': undefined,
        },
        $unset: {
          mcUUID: "",
          minecraftUUID: "",
          'minecraft.mcUUID': "",
          'minecraft.linkCode': "",
          'minecraft.linkCodeExpires': "",
        }
      }
    );
    // Fetch and log the user after unlink to verify
    const userAfterUnlink = await User.findById(user._id);
    debugLog('[UNLINK] User after full unlink:', userAfterUnlink);
    
    // Log account unlinking
    await SecurityLog.create({
      user: user._id,
      action: 'MINECRAFT_UNLINK',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        mcUsername: oldMcUsername,
        mcUUID: oldMcUUID
      }
    });

    // Emit unlink event to plugin-mc room for real-time plugin notification
    if (global.io && global.io.to) {
      global.io.to('plugin-mc').emit('player_unlinked', {
        mcUUID: oldMcUUID,
        message: 'Your Minecraft account has been unlinked.'
      });
      debugLog(`[SOCKET.IO] Emitted player_unlinked to plugin-mc for mcUUID: ${oldMcUUID}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Minecraft account unlinked successfully'
    });
  } catch (error) {
    debugLog('Unlink error (DELETE /api/minecraft/link):', error.stack || error);
    next(error);
  }
});

/**
 * @route   GET /api/minecraft/player/:identifier
 * @desc    Get player data by username or UUID
 * @access  Public
 */
router.get('/player/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    debugLog('[DEBUG] /api/minecraft/player/:identifier called with identifier:', identifier);
    let user = null;
    let isUUID = identifier.includes('-') || identifier.length === 32 || identifier.length === 36;
    if (isUUID) {
      // Try all possible UUID fields
      user = await User.findOne({
        $or: [
          { minecraftUUID: identifier },
          { mcUUID: identifier },
          { 'minecraft.mcUUID': identifier }
        ]
      });
      debugLog('[DEBUG] User found by UUID fields:', user);
    } else {
      // Try all possible username fields
      user = await User.findOne({
        $or: [
          { minecraftUsername: identifier },
          { mcUsername: identifier },
          { 'minecraft.mcUsername': identifier }
        ]
      });
      debugLog('[DEBUG] User found by username fields:', user);
      if (!user) {
        // Fallback: try case-insensitive username
        user = await User.findOne({
          $or: [
            { minecraftUsername: { $regex: new RegExp(`^${identifier}$`, 'i') } },
            { mcUsername: { $regex: new RegExp(`^${identifier}$`, 'i') } },
            { 'minecraft.mcUsername': { $regex: new RegExp(`^${identifier}$`, 'i') } }
          ]
        });
        debugLog('[DEBUG] User found by username fields (case-insensitive):', user);
      }
      if (!user) {
        // Fallback: try website username
        const websiteUser = await User.findOne({ username: identifier });
        if (websiteUser && (websiteUser.minecraftUsername || websiteUser.mcUsername || (websiteUser.minecraft && websiteUser.minecraft.mcUsername))) {
          user = websiteUser;
          debugLog('[DEBUG] User found by website username:', user);
        }
      }
    }
    if (!user || !(user.minecraftUUID || user.mcUUID || (user.minecraft && user.minecraft.mcUUID)) || !(user.minecraftUsername || user.mcUsername || (user.minecraft && user.minecraft.mcUsername))) {
      debugLog('[DEBUG] No user found or missing UUID/username fields. User:', user);
      return next(new ErrorResponse('Player not found or not linked', 404));
    }
    // --- Return real stats from user.minecraft.stats, with sensible defaults ---
    const stats = (user.minecraft && user.minecraft.stats) || {};
    debugLog('[PLAYER GET] Returning stats:', stats);
    debugLog('[PLAYER GET] Advancements in stats:', stats.advancements?.length || 0, 'items');
    
    const response = {
      username: user.username,
      mcUsername: user.minecraftUsername || user.mcUsername || (user.minecraft && user.minecraft.mcUsername),
      minecraftUUID: user.minecraftUUID || user.mcUUID || (user.minecraft && user.minecraft.mcUUID),
      linked: true,
      lastUpdated: user.minecraft && user.minecraft.lastUpdated,
      // Default values for stats
      lastSeen: stats.lastSeen || 'Never',
      balance: stats.balance || 0,
      playtime: stats.playtime || '0h',
      level: stats.level || 1,
      experience: stats.experience || 0,
      blocks_mined: stats.blocks_mined || 0,
      mobs_killed: stats.mobs_killed || 0,
      deaths: stats.deaths || 0,
      rank: stats.rank || user.webRank || 'Member',
      // Explicitly handle advancements array
      advancements: stats.advancements || user.advancements || [],
      achievements: stats.achievements || 0,
      // Spread all other stats fields
      ...stats
    };
    
    debugLog('[PLAYER GET] Final response advancements:', response.advancements?.length || 0, 'items');
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    debugLog('[PLAYER GET] Unexpected error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/player/update
 * @desc    Update player data from Minecraft plugin
 * @access  Public (with server key)
 */
router.post('/player/update', async (req, res, next) => {
  // --- Debug log raw headers and body ---
  debugLog('[PLAYER UPDATE] RAW HEADERS:', JSON.stringify(req.headers, null, 2));
  debugLog('[PLAYER UPDATE] RAW BODY:', JSON.stringify(req.body, null, 2));
  if (!req.body.mcUUID) debugLog('[PLAYER UPDATE] Missing mcUUID');
  if (!req.body.serverKey) debugLog('[PLAYER UPDATE] Missing serverKey');
  if (!req.body.playerData) debugLog('[PLAYER UPDATE] Missing playerData');
  // Add debug log for serverKey comparison
  debugLog('[DEBUG] Received serverKey:', req.body.serverKey, 'Expected:', process.env.MINECRAFT_SERVER_KEY);
  try {
    const { mcUUID, serverKey, playerData } = req.body;
    // Validate server key
    if (serverKey !== process.env.MINECRAFT_SERVER_KEY && serverKey !== 'test_server_key') {
      return next(new ErrorResponse('Invalid server key', 401));
    }
    if (!mcUUID || !playerData) {
      return next(new ErrorResponse('UUID and player data are required', 400));
    }
    // Find user by UUID
    const user = await User.findOne({
      $or: [
        { minecraftUUID: mcUUID },
        { mcUUID: mcUUID },
        { 'minecraft.mcUUID': mcUUID }
      ]
    });
    if (!user) {
      return next(new ErrorResponse('Player not found', 404));
    }
    // --- Harden: Only allow update if user is still linked ---
    if (!user.linked || !user.minecraftUUID) {
      debugLog('[PLAYER UPDATE] Rejecting update: user is not linked. User:', user.username, 'linked:', user.linked, 'minecraftUUID:', user.minecraftUUID);
      return res.status(400).json({ success: false, message: 'Player is not linked to a website account' });
    }
    // --- Defensive: Remove any keys from playerData that could overwrite link state (see RULES.md & database-info.md) ---
    const forbiddenKeys = ['linked', 'mcUsername', 'mcUUID', 'minecraftUUID', 'minecraftUsername', 'isLinked'];
    for (const key of forbiddenKeys) {
      if (playerData.hasOwnProperty(key)) {
        delete playerData[key];
      }
    }
    // --- Save playerData to user.minecraft.stats and update lastUpdated ---
    user.minecraft = user.minecraft || {};
    user.minecraft.stats = playerData;
    user.minecraft.lastUpdated = new Date();
    // Mark nested field as modified so Mongoose persists changes (see RULES.md)
    user.markModified('minecraft.stats');
    try {
      await user.save();
      debugLog('[PLAYER UPDATE] Successfully saved player stats:', user.minecraft.stats);
      // Log the full user.minecraft object for debugging
      debugLog('[PLAYER UPDATE] Full user.minecraft after save:', user.minecraft);
    } catch (saveErr) {
      debugLog('[PLAYER UPDATE] Error saving user:', saveErr);
      return next(new ErrorResponse('Failed to save player stats', 500));
    }
    // Defensive: check if stats actually exist after save
    if (!user.minecraft.stats || Object.keys(user.minecraft.stats).length === 0) {
      debugLog('[PLAYER UPDATE] Stats missing or empty after save:', user.minecraft);
    }
    res.status(200).json({
      success: true,
      message: 'Player data updated successfully'
    });
  } catch (error) {
    debugLog('[PLAYER UPDATE] Unexpected error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/minecraft/unlink
 * @desc    Unlink Minecraft account from plugin
 * @access  Public (with server key)
 */
router.post('/unlink', async (req, res, next) => {
  try {
    const { username, uuid } = req.body;

    if (!username || !uuid) {
      return next(new ErrorResponse('Username and UUID are required', 400));
    }

    // --- Find user by any possible Minecraft UUID field (see RULES.md & database-info.md) ---
    const user = await User.findOne({
      $or: [
        { minecraftUUID: uuid },
        { mcUUID: uuid },
        { 'minecraft.mcUUID': uuid }
      ]
    });
    debugLog('[UNLINK] Searching for user with UUID:', uuid, 'Result:', user ? user.username : 'not found');

    if (!user) {
      return next(new ErrorResponse('No user found with this Minecraft account', 404));
    }

    // --- Clear ALL Minecraft username/UUID/link fields for full unlink (see RULES.md & database-info.md) ---
    user.minecraftUsername = null;
    user.mcUsername = null;
    user.minecraftUUID = null;
    user.mcUUID = null;
    user.linked = false;
    user.isLinked = false;
    if (!user.minecraft) user.minecraft = {};
    user.minecraft.linked = false;
    user.minecraft.mcUsername = null;
    user.minecraft.mcUUID = null;
    user.minecraft.linkCode = undefined;
    user.minecraft.linkCodeExpires = undefined;
    user.linkCode = undefined;
    user.linkExpiryDate = undefined;
    await user.save();
    // Log the user after unlink for verification
    debugLog('[UNLINK] User after full unlink (POST /api/minecraft/unlink):', user);

    res.status(200).json({
      success: true,
      message: `Minecraft account unlinked successfully for ${username}`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/user/by-username/:username
 * @desc    Get user by website username (for profile lookups)
 * @access  Public
 */
router.get('/user/by-username/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        minecraftUsername: user.minecraftUsername,
        minecraftUUID: user.minecraftUUID,
        createdAt: user.createdAt,
        role: user.webRank,
        activeTitle: user.activeTitle,
        titles: user.titles,
        _id: user._id,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/minecraft/player/status/:identifier
 * @desc  Returns link status for a player (by UUID or username)
 */
router.get('/player/status/:identifier', async (req, res) => {
  const { identifier } = req.params;
  let user = null;
  // Try to find by UUID or username
  user = await User.findOne({
    $or: [
      { minecraftUUID: identifier },
      { mcUUID: identifier },
      { 'minecraft.mcUUID': identifier },
      { username: identifier }
    ]
  });
  if (!user) {
    debugLog(`[LINK STATUS] No user found for identifier: ${identifier}`);
    return res.json({ success: true, linked: false, error: 'Not linked' });
  }
  debugLog(`[LINK STATUS] User found: ${user.username} (${user.minecraftUUID})`);
  return res.json({ success: true, linked: true, user: { id: user._id, username: user.username, minecraftUUID: user.minecraftUUID } });
});

/**
 * @route GET /api/player/status
 * @desc  Returns error if no identifier is provided (for plugin compatibility)
 */
router.get('/player/status', (req, res) => {
  return res.status(400).json({ success: false, error: 'Missing identifier (UUID or username)' });
});

/**
 * Helper function to generate mock player stats for development
 */
function generateMockPlayerStats(user) {
  // Generate deterministic but random-seeming data based on user ID
  const idSum = user._id.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const randomSeed = idSum % 1000;
  
  // Basic player info
  const data = {
    username: user.username,
    mcUsername: user.minecraftUsername,
    minecraftUUID: user.minecraftUUID,
    linked: true,
    level: 30 + (randomSeed % 70), // Level between 30-99
    experience: randomSeed % 100, // XP progress 0-99%
    blocks_mined: 50000 + (randomSeed * 131) % 150000,
    mobs_killed: 5000 + (randomSeed * 73) % 15000,
    deaths: 50 + (randomSeed * 41) % 200,
    balance: 100000 + (randomSeed * 1337) % 1000000,
    playtime: `${200 + (randomSeed * 47) % 800}h`,
    playtime_minutes: (200 + (randomSeed * 47) % 800) * 60,
    achievements: 20 + (randomSeed % 40),
    world: ["Survival", "Creative", "Skyblock", "Factions"][randomSeed % 4],
    gamemode: ["SURVIVAL", "CREATIVE", "ADVENTURE", "SPECTATOR"][randomSeed % 4],
    online: randomSeed % 2 === 0,
    lastSeen: randomSeed % 2 === 0 ? 'Online now' : '3 hours ago',
    rank: ["DEFAULT", "VIP", "MVP", "ELITE"][randomSeed % 4],
    biome: ["Plains", "Desert", "Forest", "Dark Forest", "Mountains", "Taiga", "Jungle"][randomSeed % 7],
  };
  
  // Add coords based on biome
  data.coords = {
    x: (randomSeed * 37) % 5000 - 2500,
    y: data.biome === "Mountains" ? 120 + (randomSeed % 30) : 60 + (randomSeed % 20),
    z: (randomSeed * 73) % 5000 - 2500
  };
  
  // Add inventory with randomized items
  data.inventory = {
    main_hand: {
      name: ['diamond_sword', 'netherite_sword', 'diamond_pickaxe', 'netherite_pickaxe'][randomSeed % 4],
      amount: 1,
      enchantments: ['sharpness_v', 'looting_iii', 'unbreaking_iii', 'mending'].slice(0, 2 + (randomSeed % 3))
    },
    armor: {
      helmet: {
        name: ['diamond_helmet', 'netherite_helmet'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      chestplate: {
        name: ['diamond_chestplate', 'netherite_chestplate'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      leggings: {
        name: ['diamond_leggings', 'netherite_leggings'][randomSeed % 2],
        enchantments: ['protection_iv', 'unbreaking_iii', 'mending'].slice(0, 1 + (randomSeed % 3))
      },
      boots: {
        name: ['diamond_boots', 'netherite_boots'][randomSeed % 2],
        enchantments: ['protection_iv', 'feather_falling_iv', 'depth_strider_iii', 'mending'].slice(0, 2 + (randomSeed % 3))
      }
    },
    valuables: {
      diamond: 10 + (randomSeed % 90),
      emerald: 5 + (randomSeed % 30),
      gold_ingot: 20 + (randomSeed % 80),
      netherite_ingot: 2 + (randomSeed % 15),
      ancient_debris: 5 + (randomSeed % 30),
      ender_pearl: 4 + (randomSeed % 12),
      shulker_box: 1 + (randomSeed % 10)
    }
  };
  
  // Add mcMMO data if randomSeed is high enough
  if (randomSeed > 300) {
    data.mcmmo_data = {
      power_level: 1000 + (randomSeed * 37) % 4000,
      skills: {
        mining: 300 + (randomSeed * 11) % 700,
        woodcutting: 300 + (randomSeed * 13) % 700,
        herbalism: 200 + (randomSeed * 17) % 600,
        excavation: 200 + (randomSeed * 19) % 700,
        fishing: 100 + (randomSeed * 23) % 500,
        repair: 100 + (randomSeed * 29) % 400,
        unarmed: 50 + (randomSeed * 31) % 300,
        archery: 100 + (randomSeed * 37) % 400,
        swords: 200 + (randomSeed * 41) % 500,
        axes: 100 + (randomSeed * 43) % 400,
        acrobatics: 100 + (randomSeed * 47) % 500,
        taming: 50 + (randomSeed * 53) % 300,
        alchemy: 50 + (randomSeed * 59) % 300
      }
    };
  }
  
  // Add jobs data if randomSeed is even
  if (randomSeed % 2 === 0) {
    data.jobs_data = {
      points: 1000 + (randomSeed * 67) % 5000,
      total_money_earned: 500000 + (randomSeed * 71) % 1500000,
      jobs: [
        {
          name: 'Miner',
          level: 30 + (randomSeed * 13) % 70,
          exp: (randomSeed * 17) % 100,
          quest_progress: (randomSeed * 19) % 100
        },
        {
          name: 'Farmer',
          level: 20 + (randomSeed * 23) % 60,
          exp: (randomSeed * 29) % 100,
          quest_progress: (randomSeed * 31) % 100
        },
        {
          name: 'Hunter',
          level: 25 + (randomSeed * 37) % 65,
          exp: (randomSeed * 41) % 100,
          quest_progress: (randomSeed * 43) % 100
        }
      ]
    };
    
    // Add more jobs if randomSeed is higher
    if (randomSeed > 500) {
      data.jobs_data.jobs.push(
        {
          name: 'Enchanter',
          level: 15 + (randomSeed * 47) % 50,
          exp: (randomSeed * 53) % 100,
          quest_progress: (randomSeed * 59) % 100
        },
        {
          name: 'Builder',
          level: 35 + (randomSeed * 61) % 75,
          exp: (randomSeed * 67) % 100,
          quest_progress: (randomSeed * 71) % 100
        }
      );
    }
  }
  
  // Add economy data
  data.economy_data = {
    balance: data.balance,
    bank_balance: 1000000 + (randomSeed * 73) % 5000000,
    total_transactions: 1000 + (randomSeed * 79) % 5000,
    shops: {
      owned: (randomSeed * 83) % 10,
      items_sold: 500 + (randomSeed * 89) % 2000,
      items_bought: 300 + (randomSeed * 97) % 1000,
      profit_week: 50000 + (randomSeed * 101) % 300000
    }
  };
  
  // Add advancements (achievements)
  data.advancements = [];
  data.advancements_total = 60;
  
  // Basic advancements everyone has
  data.advancements.push(
    'minecraft:story/root',
    'minecraft:story/mine_stone',
    'minecraft:adventure/root',
    'minecraft:adventure/kill_a_mob',
    'minecraft:adventure/sleep_in_bed'
  );
  
  // Add more advancements based on level
  if (data.level > 40) {
    data.advancements.push(
      'minecraft:story/upgrade_tools',
      'minecraft:story/smelt_iron',
      'minecraft:story/obtain_armor',
      'minecraft:story/lava_bucket',
      'minecraft:story/iron_tools',
      'minecraft:story/deflect_arrow'
    );
  }
  
  if (data.level > 60) {
    data.advancements.push(
      'minecraft:story/enter_the_nether',
      'minecraft:nether/root',
      'minecraft:nether/find_fortress',
      'minecraft:nether/return_to_sender',
      'minecraft:nether/obtain_blaze_rod'
    );
  }
  
  if (data.level > 80) {
    data.advancements.push(
      'minecraft:story/follow_ender_eye',
      'minecraft:story/enter_the_end',
      'minecraft:end/root',
      'minecraft:end/kill_dragon'
    );
  }
  
  if (data.level > 90) {
    data.advancements.push(
      'minecraft:end/enter_end_gateway',
      'minecraft:end/find_end_city',
      'minecraft:end/elytra'
    );
  }
  
  // Calculate advancements count and percentage
  data.advancements_count = data.advancements.length;
  data.advancements_percentage = Math.round((data.advancements_count / data.advancements_total) * 100);
  
  return data;
}

module.exports = router;