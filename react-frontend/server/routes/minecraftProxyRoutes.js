/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file minecraftProxyRoutes.js
 * @description Proxy routes for Minecraft assets to avoid CORS issues
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cache directory for skin assets
const CACHE_DIR = path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'cache');

// Log the cache directory path
console.log('Minecraft skin cache directory:', CACHE_DIR);

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    console.log('Creating cache directory:', CACHE_DIR);
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log('Cache directory created successfully');
  } else {
    console.log('Cache directory already exists');
  }
} catch (err) {
  console.error('Error creating skin cache directory:', err);
}

/**
 * Proxy endpoint for Minecraft skins to avoid CORS issues
 * GET /api/minecraft/skin/:username
 */
router.get('/skin/:username', async (req, res) => {
  const username = req.params.username;
  console.log(`Skin requested for username: ${username}`);
  
  if (!username) {
    console.log('No username provided');
    return res.status(400).send('Username is required');
  }
  
  // Cache file path
  const cacheFile = path.join(CACHE_DIR, `${username}.png`);
  console.log('Cache file path:', cacheFile);
  
  try {
    // Check if we have a cached version
    if (fs.existsSync(cacheFile)) {
      // Check if cache is older than 24 hours
      const stats = fs.statSync(cacheFile);
      const cacheAge = Date.now() - stats.mtimeMs;
      
      // If cache is fresh (less than 24 hours old), serve it
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return res.sendFile(cacheFile);
      }
    }
    
    // Try different skin providers in order of reliability
    try {
      // First try Crafatar
      console.log(`Attempting to fetch skin from Crafatar for ${username}`);
      try {
        const response = await axios.get(`https://crafatar.com/skins/${username}`, {
          responseType: 'arraybuffer',
          timeout: 3000 // Add timeout
        });
        
        console.log(`Successfully fetched skin from Crafatar for ${username}`);
        
        // Save to cache
        fs.writeFileSync(cacheFile, Buffer.from(response.data));
        
        // Set headers
        res.set('Content-Type', 'image/png');
        return res.send(Buffer.from(response.data));
      } catch (err) {
        console.error(`Crafatar fetch failed for ${username}:`, err.message);
        
        // If Crafatar fails, try Minotar
        try {
          console.log(`Attempting to fetch skin from Minotar for ${username}`);
          const minotarResponse = await axios.get(`https://minotar.net/skin/${username}`, {
            responseType: 'arraybuffer',
            timeout: 3000 // Add timeout
          });
          
          console.log(`Successfully fetched skin from Minotar for ${username}`);
          
          // Save to cache
          fs.writeFileSync(cacheFile, Buffer.from(minotarResponse.data));
          
          // Set headers
          res.set('Content-Type', 'image/png');
          return res.send(Buffer.from(minotarResponse.data));
        } catch (minotarErr) {
          console.error(`Minotar fetch failed for ${username}:`, minotarErr.message);
          
          // If both fail, try Mojang API
          try {
            console.log(`Attempting to fetch skin from Mojang API for ${username}`);
            // First get UUID
            const profileRes = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, {
              timeout: 5000 // Add timeout
            });
            
            if (!profileRes.data || !profileRes.data.id) {
              console.error(`No profile data found for ${username}`);
              throw new Error('Player not found');
            }
            
            console.log(`Found UUID for ${username}: ${profileRes.data.id}`);
            
            // Get skin URL from profile
            const uuid = profileRes.data.id;
            const textureRes = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
            
            if (!textureRes.data.properties || !textureRes.data.properties.length) {
              console.error(`No texture properties found for ${username}`);
              throw new Error('No texture data found');
            }
            
            const textureProperty = textureRes.data.properties.find(p => p.name === 'textures');
            if (!textureProperty || !textureProperty.value) {
              console.error(`No texture value found for ${username}`);
              throw new Error('No texture value found');
            }
            
            const textureData = JSON.parse(Buffer.from(textureProperty.value, 'base64').toString());
            const skinUrl = textureData.textures?.SKIN?.url;
            
            if (!skinUrl) {
              console.error(`No skin URL found for ${username}`);
              throw new Error('No skin URL found');
            }
            
            console.log(`Found skin URL for ${username}: ${skinUrl}`);
            
            // Download the skin
            const skinRes = await axios.get(skinUrl, {
              responseType: 'arraybuffer',
              timeout: 5000 // Add timeout
            });
            
            console.log(`Successfully downloaded skin for ${username}`);
            
            // Save to cache
            fs.writeFileSync(cacheFile, Buffer.from(skinRes.data));
            
            // Set headers
            res.set('Content-Type', 'image/png');
            return res.send(Buffer.from(skinRes.data));
          } catch (mojangErr) {
            console.error(`Mojang API fetch failed for ${username}:`, mojangErr.message);
            // If all else fails, serve default Steve skin
            const stevePath = path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'steve.png');
            console.log(`Falling back to default Steve skin at: ${stevePath}`);
            
            if (fs.existsSync(stevePath)) {
              return res.sendFile(stevePath);
            } else {
              console.error(`Steve skin not found at ${stevePath}`);
              return res.status(404).send('Default skin not found');
            }
          }
        }
      }
    } catch (error) {
      console.error(`Overall error fetching skin for ${username}:`, error.message);
      
      // Serve default Steve skin on error
      const stevePath = path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'steve.png');
      console.log(`Falling back to default Steve skin at: ${stevePath}`);
      
      if (fs.existsSync(stevePath)) {
        return res.sendFile(stevePath);
      } else {
        console.error(`Steve skin not found at ${stevePath}`);
        return res.status(404).send('Default skin not found');
      }
    }
  } catch (error) {
    console.error('Error fetching Minecraft skin:', error);
    
    // Serve default Steve skin on error
    const stevePath = path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'steve.png');
    return res.sendFile(stevePath);
  }
});

/**
 * Endpoint to clear skin cache
 * POST /api/minecraft/clear-cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let count = 0;
    
    for (const file of files) {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
        count++;
      }
    }
    
    res.json({ success: true, message: `Cleared ${count} cached skins` });
  } catch (err) {
    console.error('Error clearing skin cache:', err);
    res.status(500).json({ success: false, message: 'Error clearing cache' });
  }
});

/**
 * Test endpoint to make sure the router is working
 * GET /api/minecraft/test
 */
router.get('/test', (req, res) => {
  console.log('Minecraft proxy test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Minecraft proxy is working',
    cacheDir: CACHE_DIR,
    cacheExists: fs.existsSync(CACHE_DIR),
    defaultSkinPath: path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'steve.png'),
    defaultSkinExists: fs.existsSync(path.join(__dirname, '..', '..', 'public', 'minecraft-assets', 'steve.png'))
  });
});

module.exports = router; 