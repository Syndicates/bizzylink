/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file minecraft-api.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Utility functions for fetching Minecraft server data
 */
import axios from 'axios';

/**
 * Get server status (online status, player count) for a Minecraft server
 * @param {string} serverIP - The server IP address (e.g., play.bizzynation.co.uk)
 * @returns {Promise} - Promise that resolves to server status object
 */
export const getServerStatus = async (serverIP) => {
  try {
    // Try the MCApi service first
    const response = await axios.get(`https://mcapi.us/server/status?ip=${serverIP}`);
    
    // If successful, format the data
    if (response.data && response.status === 200) {
      return {
        online: response.data.online,
        playerCount: response.data.players?.now || 0,
        maxPlayers: response.data.players?.max || 100,
        lastUpdated: new Date(),
        motd: response.data.motd || '',
        version: response.data.server?.name || ''
      };
    }
    
    throw new Error('Failed to get server data from primary API');
  } catch (error) {
    // Fallback to alternate API
    try {
      const fallbackResponse = await axios.get(`https://api.mcsrvstat.us/2/${serverIP}`);
      
      if (fallbackResponse.data) {
        return {
          online: fallbackResponse.data.online || false,
          playerCount: fallbackResponse.data.players?.online || 0,
          maxPlayers: fallbackResponse.data.players?.max || 100,
          lastUpdated: new Date(),
          motd: fallbackResponse.data.motd?.clean?.join(' ') || '',
          version: fallbackResponse.data.version || ''
        };
      }
      
      throw new Error('Failed to get server data from fallback API');
    } catch (fallbackError) {
      console.error('Failed to get server status:', fallbackError);
      // Return offline status as last resort
      return {
        online: false,
        playerCount: 0,
        maxPlayers: 100,
        lastUpdated: new Date(),
        error: 'Could not connect to server status API'
      };
    }
  }
};

/**
 * Get online players from a Minecraft server 
 * Note: This requires the server to have a plugin that exposes this information via API
 * @param {string} serverIP - The server IP address
 * @returns {Promise} - Promise that resolves to array of online players
 */
export const getOnlinePlayers = async (serverIP) => {
  try {
    // Try to get data from server API (this will only work if server has appropriate plugin)
    const response = await axios.get(`https://${serverIP}/api/players/online`, {
      timeout: 5000 // 5 second timeout to prevent long waits
    });
    
    if (response.data && Array.isArray(response.data.players)) {
      return response.data.players;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to get online players:', error);
    // Return empty array if we can't get the data
    return [];
  }
};

/**
 * Check if a Minecraft username is valid and get their UUID
 * @param {string} username - Minecraft username to check
 * @returns {Promise} - Promise that resolves to player data object
 */
export const checkMinecraftUsername = async (username) => {
  try {
    const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    
    if (response.data && response.data.id) {
      return {
        exists: true,
        username: response.data.name, // The correctly capitalized username
        uuid: response.data.id,
        // Format UUID with dashes (Mojang API returns without dashes)
        formattedUuid: `${response.data.id.slice(0, 8)}-${response.data.id.slice(8, 12)}-${response.data.id.slice(12, 16)}-${response.data.id.slice(16, 20)}-${response.data.id.slice(20)}`
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Failed to check Minecraft username:', error);
    return { 
      exists: false, 
      error: error.response?.status === 404 ? 'Username not found' : 'API error' 
    };
  }
};

/**
 * Format avatar URL for a Minecraft player
 * @param {string} username - Minecraft username or UUID
 * @param {string} size - Size of avatar (default: 100)
 * @returns {string} - URL for player's avatar
 */
export const getPlayerAvatar = (username, size = 100) => {
  if (!username) return `https://mc-heads.net/avatar/steve/${size}`;
  
  // Handle both username and UUID inputs
  const isUUID = username.includes('-') || username.length > 16;
  
  // Try multiple services to increase chances of working
  const services = [
    `https://visage.surgeplay.com/face/${size}/${username}`,
    `https://mc-heads.net/avatar/${username}/${size}`,
    `https://minotar.net/avatar/${username}/${size}.png`,
    `https://crafatar.com/avatars/${isUUID ? username : `${username}`}?size=${size}&overlay=true`,
    `https://api.mineatar.io/face/${username}?scale=${size/100}`
  ];
  
  // Return the first service - the component should handle fallbacks
  return services[0];
};

/**
 * Get skin model URL for a Minecraft player
 * @param {string} username - Minecraft username or UUID
 * @param {string} type - Type of model (full, bust, head, face, etc)
 * @returns {string} - URL for player's 3D skin model
 */
export const getPlayerModel = (username, type = 'full') => {
  if (!username) return `https://mc-heads.net/body/steve`;
  
  const validTypes = ['full', 'bust', 'head', 'face', 'skin', 'body'];
  const renderType = validTypes.includes(type) ? type : 'full';
  
  // These services offer different kinds of skin renders
  const models = {
    full: `https://visage.surgeplay.com/full/512/${username}`,
    bust: `https://visage.surgeplay.com/bust/512/${username}`,
    head: `https://visage.surgeplay.com/head/512/${username}`,
    face: `https://visage.surgeplay.com/face/512/${username}`,
    skin: `https://crafatar.com/skins/${username}`,
    body: `https://mc-heads.net/body/${username}`
  };
  
  return models[renderType];
};

/**
 * Get various inventory item images
 * @param {string} itemName - Minecraft item name (e.g. "diamond_sword")
 * @param {number} size - Size of the image (default: 64)
 * @returns {string} - URL for item image
 */
export const getItemImage = (itemName, size = 64) => {
  if (!itemName) return '';
  
  // Clean the item name to make it usable in URLs
  const cleanName = itemName.toLowerCase().replace(/\s+/g, '_');
  
  return `https://minecraftitemids.com/item/64/${cleanName}.png`;
};

/**
 * Get block/item texture
 * @param {string} name - The name of the block/item
 * @returns {string} - URL for the texture
 */
export const getBlockTexture = (name) => {
  if (!name) return '';
  const cleanName = name.toLowerCase().replace(/\s+/g, '_');
  
  // Using a public Minecraft textures API
  return `https://mc-api.net/v3/block/${cleanName}`;
};

/**
 * Format achievement/advancement name for display
 * @param {string} advancementKey - The raw advancement key
 * @returns {string} - Formatted advancement name
 */
export const formatAdvancementName = (advancementKey) => {
  if (!advancementKey) return '';
  
  // Extract the last part of the advancement key
  const parts = advancementKey.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Convert from snake_case to Title Case with spaces
  return lastPart
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default {
  getServerStatus,
  getOnlinePlayers,
  checkMinecraftUsername,
  getPlayerAvatar,
  getPlayerModel,
  getItemImage,
  getBlockTexture,
  formatAdvancementName
};