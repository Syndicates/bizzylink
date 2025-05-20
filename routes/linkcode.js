/**
 * +----+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +----+
 *
 * @file linkcode.js
 * @description Link code management and plugin API endpoints
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../backend/src/models/User');
const { protect } = require('../backend/src/middleware/auth');
const mongoose = require('mongoose');
const LinkCode = require('../backend/src/models/LinkCode');

// Import the link code manager
const linkCodeManager = require('./linkcode-manager');

// Import debug utilities
const debugUtils = require('./linkcode-debug');

/**
 * Generate a new link code for the authenticated user
 * POST /api/linkcode/generate
 */
router.post('/generate', protect, async (req, res) => {
  try {
    console.log(`\n===== GENERATING LINK CODE =====`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    const userId = req.user.id;
    const { mcUsername } = req.body;
    
    console.log(`Generating link code for user ${userId}${mcUsername ? ` with Minecraft username ${mcUsername}` : ''}`);
    
    // Get the user to store their Minecraft username
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    console.log(`✅ Found user: ${user.username}`);
    console.log(`- Current mcUsername: ${user.mcUsername || 'null'}`);
    console.log(`- Current minecraft.mcUsername: ${user.minecraft?.mcUsername || 'null'}`);
    console.log(`- Current linkCode: ${user.linkCode || 'null'}`);
    console.log(`- Current minecraft.linkCode: ${user.minecraft?.linkCode || 'null'}`);
    
    // Check if they're already linked
    const isLinked = user.linked || (user.minecraft && user.minecraft.linked);
    if (isLinked) {
      console.log(`❌ User ${userId} is already linked with Minecraft username ${user.mcUsername || user.minecraft?.mcUsername}`);
      return res.status(400).json({
        success: false,
        error: 'Your account is already linked with a Minecraft account'
      });
    }
    
    // Update the user with the provided Minecraft username if given
    if (mcUsername) {
      console.log(`Updating user with mcUsername: ${mcUsername}`);
      
      // Update the user model with the mcUsername directly
      user.mcUsername = mcUsername;
      
      // Also update the new structure if it exists
      if (user.minecraft) {
        user.minecraft.mcUsername = mcUsername;
      } else {
        user.minecraft = { mcUsername };
      }
      
      await user.save();
      console.log(`✅ Updated user ${userId} with Minecraft username ${mcUsername}`);
      console.log(`- After username update - mcUsername: ${user.mcUsername}`);
      console.log(`- After username update - minecraft.mcUsername: ${user.minecraft?.mcUsername}`);
    }
    
    // Use the link code manager to generate a code
    // Default is 30 minutes, but allow customization
    const expiryMinutes = parseInt(req.query.expiryMinutes) || 1440; // Default to 24 hours
    console.log(`Generating code with expiry: ${expiryMinutes} minutes`);
    
    const linkCodeData = await linkCodeManager.generateCode(userId, expiryMinutes);
    console.log(`Got link code from manager: ${linkCodeData.code}, expires: ${linkCodeData.expires}`);
    
    // Also update the user record with the link code - update both data structures
    user.linkCode = linkCodeData.code;
    user.linkCodeExpiry = new Date(linkCodeData.expires);
    
    // Also update the nested structure
    if (!user.minecraft) {
      user.minecraft = {};
    }
    user.minecraft.linkCode = linkCodeData.code;
    user.minecraft.linkCodeExpires = new Date(linkCodeData.expires);
    
    console.log(`Saving link code to user record: ${linkCodeData.code}, expires: ${linkCodeData.expires}`);
    console.log(`Before save - linkCode: ${user.linkCode}, minecraft.linkCode: ${user.minecraft?.linkCode}`);
    
    await user.save();
    
    console.log(`After save - linkCode: ${user.linkCode}, minecraft.linkCode: ${user.minecraft?.linkCode}`);
    console.log(`Generated link code ${linkCodeData.code} for user ${userId}, expires at ${linkCodeData.expires}`);
    
    // VERIFICATION: Verify the code was stored properly in the database
    console.log(`\n===== VERIFYING LINK CODE STORAGE =====`);
    
    try {
      // Check in LinkCode collection
      const verifyCode = await LinkCode.findOne({ code: linkCodeData.code });
      if (verifyCode) {
        console.log(`✅ LinkCode DB: Link code ${linkCodeData.code} found in database`);
        console.log(`- userId: ${verifyCode.userId}`);
        console.log(`- expires: ${verifyCode.expires}`);
      } else {
        console.log(`❌ LinkCode DB: Link code ${linkCodeData.code} NOT found in database!`);
      }
      
      // Verify in User collection
      const verifyUser = await User.findById(userId);
      if (verifyUser) {
        console.log(`✅ User DB: Found user ${verifyUser.username} with ID ${userId}`);
        console.log(`- linkCode: ${verifyUser.linkCode || 'null'}`);
        console.log(`- linkCodeExpiry: ${verifyUser.linkCodeExpiry || 'null'}`);
        console.log(`- minecraft.linkCode: ${verifyUser.minecraft?.linkCode || 'null'}`);
        console.log(`- minecraft.linkCodeExpires: ${verifyUser.minecraft?.linkCodeExpires || 'null'}`);
      } else {
        console.log(`❌ User DB: Could not find user with ID ${userId}`);
      }
      
      // Verify in memory map
      if (linkCodeManager.activeCodes && linkCodeManager.activeCodes.has(linkCodeData.code)) {
        const memoryData = linkCodeManager.activeCodes.get(linkCodeData.code);
        console.log(`✅ Memory Map: Link code ${linkCodeData.code} found in memory`);
        console.log(`- userId: ${memoryData.userId}`);
        console.log(`- expires: ${new Date(memoryData.expires)}`);
      } else {
        console.log(`❌ Memory Map: Link code ${linkCodeData.code} NOT found in memory map!`);
      }
    } catch (verifyError) {
      console.error('Error during verification:', verifyError);
    }
    
    console.log(`\n===== GENERATION COMPLETED =====`);
    
    res.json({
      success: true,
      code: linkCodeData.code,
      expires: linkCodeData.expires
    });
  } catch (error) {
    console.error('Error generating link code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate link code'
    });
  }
});

/**
 * Get active link code for the authenticated user
 * GET /api/linkcode
 */
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active code from manager - make async
    const codeInfo = await linkCodeManager.getActiveCodeForUser(userId);
    
    if (codeInfo) {
      res.json({
        success: true,
        code: codeInfo.code,
        expires: codeInfo.expires
      });
    } else {
      // No active code found
      res.json({
        success: false,
        error: 'No active link code found'
      });
    }
  } catch (error) {
    console.error('Error retrieving link code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve link code'
    });
  }
});

/**
 * Validate a link code (for Minecraft)
 * POST /api/linkcode/validate
 */
router.post('/validate', async (req, res) => {
  try {
    console.log(`\n===== RECEIVED VALIDATION REQUEST =====`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    const { username, code, uuid } = req.body;
    
    console.log(`Received validation request for:`);
    console.log(`- Username: ${username || 'not provided'}`);
    console.log(`- Code: ${code || 'not provided'}`);
    console.log(`- UUID: ${uuid || 'not provided'}`);
    
    if (!code) {
      console.warn('Code not provided in validation request');
      return res.status(400).json({
        success: false,
        error: 'Link code is required'
      });
    }
    
    // Verify the UUID format to prevent spoofing
    if (!uuid || !uuid.match(/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i)) {
      console.warn(`Invalid UUID format in verification request: ${uuid}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid UUID format'
      });
    }
    
    // Verify username format
    if (!username || username.length < 3 || username.length > 16 || !username.match(/^[a-zA-Z0-9_]+$/)) {
      console.warn(`Invalid username format in verification request: ${username}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid username format'
      });
    }
    
    // Check if this is a test code
    console.log(`\n===== CHECKING FOR TEST CODE =====`);
    if (code === 'A12B3C') {
      console.log(`🎯 Test code detected: ${code}, looking for test user`);
      
      // Find a user with matching Minecraft username
      const testUser = await User.findOne({ 
        $or: [
          { mcUsername: username },
          { 'minecraft.mcUsername': username }
        ]
      });
      
      if (testUser) {
        console.log(`✅ Found test user: ${testUser.username} with mcUsername: ${testUser.mcUsername || testUser.minecraft?.mcUsername}`);
        
        // Mark the user as linked
        testUser.linked = true;
        testUser.isLinked = true; // For backward compatibility
        if (!testUser.minecraft) testUser.minecraft = {};
        testUser.minecraft.linked = true;
        
        await testUser.save();
        
        return res.json({
          success: true,
          message: 'Account successfully linked (TEST MODE)',
          user: {
            id: testUser._id,
            username: testUser.username
          }
        });
      } else {
        console.log(`❌ No test user found with Minecraft username: ${username}`);
      }
    }
    
    // ENHANCED DEBUGGING: Check all link codes in the database
    console.log(`\n===== CHECKING ALL LINK CODES IN THE DATABASE =====`);
    let allCodes = [];
    try {
      allCodes = await LinkCode.find({});
      console.log(`Found ${allCodes.length} link codes in database`);
      allCodes.forEach(codeDoc => {
        const expiryStatus = new Date() < codeDoc.expires ? 'VALID' : 'EXPIRED';
        console.log(`- Code: ${codeDoc.code}, userId: ${codeDoc.userId}, expires: ${codeDoc.expires} (${expiryStatus})`);
      });
    } catch (err) {
      console.error('Error checking all link codes:', err);
    }
    
    // DEBUGGING: Check ALL users with link codes
    console.log(`\n===== CHECKING ALL USERS WITH LINK CODES =====`);
    try {
      const usersWithLinkCodes = await User.find({
        $or: [
          { linkCode: { $ne: null } },
          { 'minecraft.linkCode': { $ne: null } }
        ]
      }).select('username mcUsername linkCode linkCodeExpiry minecraft');
      
      console.log(`Found ${usersWithLinkCodes.length} users with link codes`);
      usersWithLinkCodes.forEach(user => {
        console.log(`- User: ${user.username}`);
        console.log(`  - mcUsername: ${user.mcUsername || 'null'}`);
        console.log(`  - linkCode: ${user.linkCode || 'null'}`);
        console.log(`  - linkCodeExpiry: ${user.linkCodeExpiry || 'null'}`);
        console.log(`  - minecraft.mcUsername: ${user.minecraft?.mcUsername || 'null'}`);
        console.log(`  - minecraft.linkCode: ${user.minecraft?.linkCode || 'null'}`);
        console.log(`  - minecraft.linkCodeExpires: ${user.minecraft?.linkCodeExpires || 'null'}`);
      });
    } catch (err) {
      console.error('Error checking users with link codes:', err);
    }
    
    // DEBUGGING: Check if the link code exists directly in the database
    console.log(`\n===== CHECKING LINK CODE IN DATABASE =====`);
    const upperCode = code.toUpperCase();
    try {
      const codeCheck = await LinkCode.findOne({ code: upperCode });
      if (codeCheck) {
        console.log(`✅ FOUND link code in database: ${codeCheck.code}, userId: ${codeCheck.userId}, expires: ${codeCheck.expires}`);
        
        // Compare expiry
        const now = new Date();
        if (codeCheck.expires > now) {
          console.log(`✅ Link code is still VALID! Expires at ${codeCheck.expires}, current time is ${now}`);
        } else {
          console.log(`❌ Link code is EXPIRED! Expires at ${codeCheck.expires}, current time is ${now}`);
        }
      } else {
        console.log(`❌ Link code ${upperCode} NOT found in database!`);
      }
    } catch (err) {
      console.error('Error checking link code directly:', err);
    }
    
    // DEBUGGING: Check in-memory map
    console.log(`\n===== CHECKING LINK CODE IN MEMORY MAP =====`);
    if (linkCodeManager.activeCodes && linkCodeManager.activeCodes.size > 0) {
      console.log(`Memory map has ${linkCodeManager.activeCodes.size} entries`);
      if (linkCodeManager.activeCodes.has(upperCode)) {
        const inMemoryData = linkCodeManager.activeCodes.get(upperCode);
        console.log(`✅ FOUND link code in memory: userId=${inMemoryData.userId}, expires=${new Date(inMemoryData.expires)}`);
        
        // Compare expiry
        const now = new Date().getTime();
        if (inMemoryData.expires > now) {
          console.log(`✅ Link code is still VALID! Expires at ${new Date(inMemoryData.expires)}, current time is ${new Date()}`);
        } else {
          console.log(`❌ Link code is EXPIRED! Expires at ${new Date(inMemoryData.expires)}, current time is ${new Date()}`);
        }
      } else {
        console.log(`❌ Link code ${upperCode} NOT found in memory map!`);
        
        // List all codes in memory
        console.log(`Here are all codes in memory:`);
        for (const [memCode, memData] of linkCodeManager.activeCodes.entries()) {
          console.log(`- Memory code: ${memCode}, userId: ${memData.userId}`);
        }
      }
    } else {
      console.log(`❌ Memory map is empty or not accessible`);
    }
    
    // Validate the code - use the async version
    console.log(`\n===== VALIDATING CODE =====`);
    const validatedData = await linkCodeManager.validateCode(code);
    console.log(`Validation result: ${validatedData ? 'VALID' : 'INVALID'}`);
    if (validatedData) {
      console.log(`- userId: ${validatedData.userId}`);
      console.log(`- expires: ${validatedData.expires}`);
    }
    
    if (!validatedData) {
      console.log(`\n===== VALIDATION FAILED =====`);
      return res.json({
        success: false,
        error: 'Invalid or expired link code'
      });
    }
    
    // Get linked user details
    console.log(`\n===== GETTING USER DETAILS =====`);
    const linkedUser = await User.findById(validatedData.userId);
    
    if (!linkedUser) {
      console.log(`❌ Linked user not found with ID: ${validatedData.userId}`);
      return res.status(404).json({
        success: false,
        error: 'Linked user not found'
      });
    }
    
    console.log(`✅ Found user: ${linkedUser.username}`);
    console.log(`- Current mcUsername: ${linkedUser.mcUsername || 'null'}`);
    console.log(`- Current minecraft.mcUsername: ${linkedUser.minecraft?.mcUsername || 'null'}`);
    
    // Update user with Minecraft info
    console.log(`\n===== UPDATING USER =====`);
    linkedUser.mcUsername = username;
    linkedUser.mcUUID = uuid;
    linkedUser.isLinked = true;
    linkedUser.mcLinkedAt = new Date();
    
    // Make sure we update both data structures
    linkedUser.linked = true;
    
    // Also update the minecraft sub-document
    if (!linkedUser.minecraft) {
      linkedUser.minecraft = {};
    }
    linkedUser.minecraft.linked = true;
    linkedUser.minecraft.mcUsername = username;
    linkedUser.minecraft.mcUUID = uuid;
    linkedUser.minecraft.lastLinked = new Date();
    
    console.log(`Updating user ${linkedUser.username} with Minecraft info: ${username} (${uuid})`);
    console.log(`Before save - linked status: linked=${linkedUser.linked}, isLinked=${linkedUser.isLinked}, minecraft.linked=${linkedUser.minecraft?.linked}`);
    
    try {
      await linkedUser.save();
      console.log(`After save - linked status: linked=${linkedUser.linked}, isLinked=${linkedUser.isLinked}, minecraft.linked=${linkedUser.minecraft?.linked}`);
      
      // Remove the used link code - use the async version
      await linkCodeManager.removeCode(code);
      console.log(`✅ Link code ${code} removed after successful use`);
      
      console.log(`\n===== VALIDATION SUCCEEDED =====`);
      return res.json({
        success: true,
        message: 'Account successfully linked',
        user: {
          id: linkedUser._id,
          username: linkedUser.username
        }
      });
    } catch (saveError) {
      console.error('Error saving user after link:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save user data'
      });
    }
  } catch (error) {
    console.error('Error validating link code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to validate link code'
    });
  }
});

/**
 * Check for pending link codes for a Minecraft player
 * POST /api/linkcode/pending
 */
router.post('/pending', async (req, res) => {
  try {
    const { username, uuid } = req.body;
    
    if (!username || !uuid) {
      return res.status(400).json({
        success: false,
        error: 'Username and UUID are required'
      });
    }
    
    // Verify the UUID format for security
    if (!uuid.match(/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UUID format'
      });
    }
    
    console.log(`Checking for pending link codes for ${username} (${uuid})`);
    
    // Attempt to find a matching user by Minecraft username and active link codes
    const users = await User.find({ 
      $or: [
        { mcUsername: username, linked: false },  // Try to match mcUsername if it was set earlier
        { }  // No match (empty filter to ensure we return active link codes)
      ]
    }).limit(10);  // Limit results to avoid large queries
    
    // Get all active link codes from the manager
    let allCodes = await linkCodeManager.getAllCodes();
    if (!Array.isArray(allCodes)) {
      console.error('[LINKCODE] getAllCodes() did not return an array. Value:', allCodes);
      allCodes = [];
    }
    let pendingCode = null;
    let pendingExpiry = null;
    
    // For debugging
    console.log(`Found ${allCodes.length} active link codes to check`);
    
    // Find a code that might be for this player
    for (const codeInfo of allCodes) {
      if (codeInfo.isExpired) continue;
      
      // Get the user this code is for
      const user = await User.findById(codeInfo.userId);
      
      // If there's a partial match (server knows username but player is not linked)
      if (user && !user.linked && (user.mcUsername === username || user.mcUsername === null)) {
        pendingCode = codeInfo.code;
        pendingExpiry = codeInfo.expires;
        console.log(`Found pending link code ${pendingCode} for ${username}`);
        break;
      }
    }
    
    if (pendingCode) {
      // Return the pending code
      res.json({
        success: true,
        code: pendingCode,
        expires: pendingExpiry,
        message: 'Pending link code found'
      });
    } else {
      // No pending code found
      res.json({
        success: false,
        message: 'No pending link codes found'
      });
    }
  } catch (error) {
    console.error('Error checking pending link codes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check pending link codes'
    });
  }
});

// Handle direct API calls from Minecraft plugin 
router.post('/', async (req, res) => {
  try {
    const { username, uuid } = req.body;
    
    if (!username || !uuid) {
      return res.status(400).json({
        success: false,
        error: 'Username and UUID are required'
      });
    }
    
    console.log(`Received direct POST request from Minecraft plugin for ${username} (${uuid})`);
    
    // Find or create user record for this Minecraft player
    let user = await User.findOne({ mcUUID: uuid });
    
    if (!user) {
      user = await User.findOne({ mcUsername: username });
    }
    
    // Return appropriate response for the plugin
    if (user) {
      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          linked: user.linked
        },
        message: 'User information retrieved'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No linked account found',
        shouldRegister: true
      });
    }
  } catch (error) {
    console.error('Error handling Minecraft plugin request:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error processing request'
    });
  }
});

// Manually unlink a Minecraft account
router.delete('/', protect, async (req, res) => {
    try {
        console.log(`[UNLINK] Received unlink request for user ID: ${req.user.id}`);
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            console.error(`[UNLINK] User not found with ID: ${req.user.id}`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log user's current Minecraft status to debug
        console.log(`[UNLINK] Found user: ${user.username}`);
        console.log(`[UNLINK] Minecraft status: linked=${user.linked}, minecraft.linked=${user.minecraft?.linked}`);
        console.log(`[UNLINK] Username: mcUsername=${user.mcUsername}, minecraft.mcUsername=${user.minecraft?.mcUsername}`);
        
        // Check if user is actually linked before attempting to unlink
        // Support both old and new data structure
        const isLinked = user.linked || (user.minecraft && user.minecraft.linked);
        const mcUsername = user.mcUsername || (user.minecraft && user.minecraft.mcUsername);
        
        if (!isLinked || !mcUsername) {
            console.log(`[UNLINK] User ${user.username} is not linked, returning success anyway`);
            return res.status(200).json({ message: 'Account already unlinked', alreadyUnlinked: true });
        }
        
        // Store the previous values for notification
        const previousMcUsername = mcUsername;
        const previousMcUUID = user.mcUUID || (user.minecraft && user.minecraft.mcUUID);
        
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
                    'minecraft.stats': {}
                },
                $unset: {
                    mcUUID: "",
                    'minecraft.mcUUID': ""
                }
            }
        );
        
        if (updateResult.modifiedCount === 0) {
            console.error(`[UNLINK] Failed to update user record for ${user.username}, DB returned: `, updateResult);
            return res.status(500).json({ error: 'Failed to unlink account - database update failed' });
        }
        
        console.log(`[UNLINK] Successfully unlinked account for user ${user.username}`);
        
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
        
        return res.status(200).json({ message: 'Account unlinked successfully' });
    } catch (error) {
        console.error('Error unlinking account:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Debug endpoint to list all active codes (admin only)
router.get('/debug/codes', protect, async (req, res) => {
  try {
    // Get the user to check admin status
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get all active codes
    const allCodes = linkCodeManager.getAllCodes();
    
    // Return the codes with user information
    const codesWithUsers = await Promise.all(allCodes.map(async (codeInfo) => {
      const user = await User.findById(codeInfo.userId);
      return {
        ...codeInfo,
        username: user ? user.username : 'Unknown user'
      };
    }));
    
    res.json({
      success: true,
      totalCodes: codesWithUsers.length,
      codes: codesWithUsers
    });
  } catch (error) {
    console.error('Error getting debug codes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Diagnostic endpoint to check link status for current user
router.get('/diagnostic', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    debugUtils.logMessage(`Running diagnostic for user ID: ${userId}`);
    
    // Check user link status
    const status = await debugUtils.checkUserLinkStatus(userId);
    
    if (!status.found) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If inconsistent state is found, provide option to fix it
    if (status.inconsistent) {
      debugUtils.logMessage(`Found inconsistent link state for user ${status.username}`);
      
      // Return the diagnostic status
      return res.json({
        status,
        message: 'Inconsistent link state detected. Use /api/linkcode/fix to repair.'
      });
    }
    
    // Return a clean status
    return res.json({
      status,
      message: 'Link state is consistent'
    });
  } catch (error) {
    debugUtils.logMessage(`Error running diagnostic: ${error.message}`);
    console.error('Error running link diagnostic:', error);
    return res.status(500).json({ error: 'Server error running diagnostic' });
  }
});

// Fix endpoint to repair inconsistent link states
router.post('/fix', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    debugUtils.logMessage(`Attempting to fix link state for user ID: ${userId}`);
    
    // Fix the link state
    const result = await debugUtils.fixUserLinkState(userId);
    
    // Return the result
    return res.json(result);
  } catch (error) {
    debugUtils.logMessage(`Error fixing link state: ${error.message}`);
    console.error('Error fixing link state:', error);
    return res.status(500).json({ error: 'Server error fixing link state' });
  }
});

// Debug: log all link statuses (admin only)
router.get('/debug/all-links', protect, async (req, res) => {
  try {
    // Get the user to check admin status
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Log all user link statuses
    await debugUtils.logAllLinkStatus();
    
    return res.json({
      success: true,
      message: 'All link statuses logged. Check server logs for details.'
    });
  } catch (error) {
    console.error('Error logging all link statuses:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Special endpoint to reset a user's Minecraft status
router.post('/reset-status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    debugUtils.logMessage(`Received reset-status request for user ID: ${userId}`);
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      debugUtils.logMessage(`User not found with ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    debugUtils.logMessage(`Reset-status: Found user ${user.username} with linked=${user.linked}, mcUsername=${user.mcUsername}`);
    
    // Force the user to be in an unlinked state
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $set: {
          linked: false,
          mcUsername: null,
          linkCode: null,
          linkCodeExpiry: null,
          mcStats: {} // Clear stats when resetting
        }
      }
    );
    
    if (updateResult.modifiedCount === 0 && updateResult.matchedCount > 0) {
      debugUtils.logMessage(`No changes made to user ${user.username} - already in unlinked state`);
      return res.status(200).json({ 
        success: true, 
        message: 'User already in unlinked state',
        noChanges: true
      });
    }
    
    debugUtils.logMessage(`Successfully reset Minecraft status for user ${user.username}`);
    
    // Notify connected clients about the status reset
    if (global.notifyUser) {
      global.notifyUser(user._id.toString(), {
        type: 'minecraft_status_reset',
        userId: user._id.toString(),
        linked: false,
        timestamp: new Date().toISOString(),
        message: 'Your Minecraft link status has been reset'
      });
      
      debugUtils.logMessage(`Notification sent to user ${user.username} about reset`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Minecraft status reset successfully'
    });
  } catch (error) {
    debugUtils.logMessage(`Error in reset-status: ${error.message}`);
    console.error('Error resetting Minecraft status:', error);
    return res.status(500).json({ error: 'Server error resetting Minecraft status' });
  }
});

module.exports = router;