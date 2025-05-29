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
 * Minecraft API Service
 * This service handles fetching Minecraft item images and player information from various APIs
 */

import axios from 'axios';

// Base URLs for different Minecraft item/texture APIs
const API_URLS = {
  // MineAPI - switched to local assets
  mineapi: '/minecraft-assets',
  
  // Crafatar - provides player skins and heads
  crafatar: '/minecraft-assets/avatars',
  
  // Minecraft Static - backup for item textures
  mcStatic: '/minecraft-assets',
  
  // Alternative item API
  itemsAlt: '/minecraft-assets',
  
  // Visage - for 3D player renders
  visage: '/minecraft-assets/renders',
  
  // PlayerDB API for player lookup
  playerdb: '/minecraft-assets/players',
  
  // Server status APIs - REVERT TO ORIGINAL EXTERNAL ENDPOINTS
  mcsrvstat: 'https://api.mcsrvstat.us/2',
  mcapi: 'https://mcapi.us/server/status',
  minetools: 'https://api.minetools.eu/ping',
  serverpinger: 'https://mcstatus.snowdev.com.br/api/query/v3'
};

// Local fallback paths for common items using existing SVG assets
const LOCAL_FALLBACKS = {
  'diamond': '/minecraft-assets/diamond.svg',
  'diamond_sword': '/minecraft-assets/sword.svg',
  'diamond_pickaxe': '/minecraft-assets/pickaxe.svg',
  'grass_block': '/minecraft-assets/grass_block.svg',
  'dirt': '/minecraft-assets/dirt-texture.svg',
  'stone': '/minecraft-assets/stone-texture.svg',
  'oak_log': '/minecraft-assets/wood-texture.svg',
  'gold_ingot': '/minecraft-assets/gold-ingot.svg',
  'iron_ingot': '/minecraft-assets/iron-ingot.svg',
  'emerald': '/minecraft-assets/emerald.svg',
  'chest': '/minecraft-assets/chest.svg',
  'xp_orb': '/minecraft-assets/xp-orb.svg',
  'player_head': '/minecraft-assets/player_head.svg',
  'book': '/minecraft-assets/book.svg',
  'experience_bottle': '/minecraft-assets/experience_bottle.svg',
  'enchanted_golden_apple': '/minecraft-assets/enchanted_golden_apple.svg',
  'writable_book': '/minecraft-assets/writable_book.svg',
};

/**
 * Get a Minecraft item image URL
 * @param {string} itemName - The Minecraft item name (e.g., "diamond_sword", "grass_block")
 * @param {number} size - The size of the image (default: 100)
 * @param {string} source - The API source to use (default: 'mineapi')
 * @returns {string} - URL to the item image
 */
export const getItemImageUrl = (itemName, size = 100, source = 'mineapi') => {
  // Check if the itemName already includes .svg extension
  if (itemName.toLowerCase().endsWith('.svg')) {
    return `${API_URLS.mineapi}/${itemName}`;
  }
  
  // Convert spaces to underscores and make lowercase
  const formattedName = itemName.replace(/\\s+/g, '_').toLowerCase();
  
  // Handle special cases and normalization
  const normalizedName = normalizeItemName(formattedName);
  
  // Choose API based on source parameter
  switch (source) {
    case 'mineapi':
      // Check if this item has a direct mapping in LOCAL_FALLBACKS
      if (LOCAL_FALLBACKS[normalizedName]) {
        return LOCAL_FALLBACKS[normalizedName];
      }
      return `${API_URLS.mineapi}/${normalizedName}.svg`;
    case 'mcStatic':
      return `${API_URLS.mcStatic}/${normalizedName}/${size}`;
    default:
      // Fallback to a static image if API doesn't exist
      return `/minecraft-assets/${normalizedName}.svg`;
  }
};

/**
 * Get a Minecraft player head/avatar image URL
 * @param {string} uuid - The player's UUID
 * @param {number} size - Size of the avatar (default: 100)
 * @returns {string} - URL to the player's head image
 */
export const getPlayerHeadUrl = (uuid, size = 100) => {
  return `${API_URLS.crafatar}/${uuid}?size=${size}&overlay=true`;
};

/**
 * Get a full 3D render of a Minecraft player
 * @param {string} uuid - The player's UUID
 * @param {number} size - Size of the render (default: 300)
 * @returns {string} - URL to the player's 3D render
 */
export const getPlayerRenderUrl = (uuid, size = 300) => {
  return `${API_URLS.visage}/${uuid}/${size}`;
};

/**
 * Fetch player information from PlayerDB API
 * @param {string} username - Minecraft username
 * @returns {Promise<Object>} - Player data object
 */
export const fetchPlayerInfo = async (username) => {
  try {
    const response = await axios.get(`${API_URLS.playerdb}/${username}`);
    return response.data.data.player;
  } catch (error) {
    console.error('Error fetching player info:', error);
    return null;
  }
};

/**
 * Function to normalize item names to match API expectations
 * @param {string} itemName - Original item name
 * @returns {string} - Normalized item name
 */
const normalizeItemName = (itemName) => {
  // Common name mapping for items that might have different API names
  const nameMap = {
    // Blocks
    'grass_block': 'grass_block',
    'grass': 'grass_block',
    'dirt': 'dirt',
    'stone': 'stone',
    'oak_log': 'oak_log',
    'wood': 'oak_log',
    'oak_planks': 'oak_planks',
    'planks': 'oak_planks',
    
    // Tools & Weapons
    'diamond_sword': 'diamond_sword',
    'sword': 'diamond_sword',
    'diamond_pickaxe': 'diamond_pickaxe',
    'pickaxe': 'diamond_pickaxe',
    'diamond_axe': 'diamond_axe',
    'axe': 'diamond_axe',
    
    // Items
    'diamond': 'diamond',
    'emerald': 'emerald',
    'gold_ingot': 'gold_ingot',
    'iron_ingot': 'iron_ingot',
    'apple': 'apple',
    'golden_apple': 'golden_apple',
    'ender_pearl': 'ender_pearl',
    'ender_eye': 'ender_eye',
    
    // Characters
    'character': 'player_head',
    'player': 'player_head',
    'steve': 'player_head',
    
    // Fallback for unknown items
    'unknown': 'barrier'
  };
  
  // Return mapped name or original if not in the map
  return nameMap[itemName] || itemName;
};

/**
 * Create an ItemImage component that handles loading and fallbacks
 * @param {string} itemName - The Minecraft item name
 * @param {object} options - Additional options (size, className, etc.)
 * @returns {React.ReactElement} - The React element for the image
 */
export const createItemImage = (itemName, { size = 100, className = '', alt = '', onError = null } = {}) => {
  // This is a utility to be used in components to create consistent item images
  // with proper error handling and fallbacks
  const normalizedName = normalizeItemName(itemName);
  
  // First try MineAPI
  const primaryUrl = getItemImageUrl(normalizedName, size, 'mineapi');
  
  // Fallback to MC-Heads if MineAPI fails
  const fallbackUrl = getItemImageUrl(normalizedName, size, 'mcStatic');
  
  // Second fallback to static SVG assets from our public directory
  const localFallback = LOCAL_FALLBACKS[normalizedName] || '/minecraft-assets/server-preview.svg';
  
  // Create a function for error handling to try fallbacks
  const handleImageError = (e) => {
    console.log(`Image load failed for ${e.target.src}, trying fallback`);
    
    // If image fails to load, try the first fallback
    if (e.target.src === primaryUrl) {
      console.log(`Switching to fallback URL: ${fallbackUrl}`);
      e.target.src = fallbackUrl;
    } 
    // If fallback fails, try the local fallback
    else if (e.target.src === fallbackUrl) {
      console.log(`Switching to local fallback: ${localFallback}`);
      e.target.src = localFallback;
    }
    // If the local fallback fails and doesn't end with .svg, try adding it
    else if (!e.target.src.endsWith('.svg')) {
      console.log(`Adding .svg extension to URL: ${e.target.src}`);
      e.target.src = `${e.target.src}.svg`;
    }
    // If provided, call custom error handler
    if (onError) onError(e);
  };
  
  // Return image with error handling set up
  return {
    src: primaryUrl,
    alt: alt || `Minecraft ${itemName}`,
    className: `minecraft-item ${className}`,
    width: size,
    height: size,
    onError: handleImageError,
    style: { imageRendering: 'pixelated' }
  };
};

/**
 * Get server status (online status, player count) for a Minecraft server
 * @param {string} serverIP - The server IP address (e.g., play.bizzynation.co.uk)
 * @returns {Promise} - Promise that resolves to server status object
 */
export const getServerStatus = async (serverIP = 'play.bizzynation.co.uk') => {
  const apis = [
    // MCSrvStat API (most reliable and feature-rich)
    {
      url: `${API_URLS.mcsrvstat}/${serverIP}`,
      parser: (data) => ({
        online: data.online || false,
        playerCount: data.players?.online || 0,
        maxPlayers: data.players?.max || 100,
        lastUpdated: new Date(),
        motd: data.motd?.clean?.join(' ') || '',
        version: data.version || '',
        players: data.players?.list || [],
        icon: data.icon || null
      })
    },
    // MCApi.us (original primary API)
    {
      url: `${API_URLS.mcapi}?ip=${serverIP}`,
      parser: (data) => ({
        online: data.online,
        playerCount: data.players?.now || 0,
        maxPlayers: data.players?.max || 100,
        lastUpdated: new Date(),
        motd: data.motd || '',
        version: data.server?.name || '',
        players: []
      })
    },
    // Minetools API
    {
      url: `${API_URLS.minetools}/${serverIP}`,
      parser: (data) => ({
        online: data.error ? false : true,
        playerCount: data.players?.online || 0,
        maxPlayers: data.players?.max || 100,
        lastUpdated: new Date(),
        motd: data.description?.text || '',
        version: data.version?.name || '',
        players: []
      })
    },
    // ServerPinger API
    {
      url: `${API_URLS.serverpinger}/${serverIP}`,
      parser: (data) => ({
        online: data.online || false,
        playerCount: data.players?.online || 0,
        maxPlayers: data.players?.max || 100,
        lastUpdated: new Date(),
        motd: data.motd?.clean || '',
        version: data.version || '',
        players: data.players?.list || [],
        icon: data.icon || null
      })
    }
  ];

  // Try each API in sequence until one works
  for (const api of apis) {
    try {
      const response = await axios.get(api.url, { timeout: 5000 });
      
      if (response.data) {
        console.log(`Server status fetched successfully from ${api.url}`);
        return api.parser(response.data);
      }
    } catch (error) {
      console.warn(`Failed to get server status from ${api.url}:`, error.message);
      // Continue to next API
    }
  }
  
  // If all APIs fail, return offline status
  console.error('All server status APIs failed');
  return {
    online: false,
    playerCount: 0,
    maxPlayers: 100,
    lastUpdated: new Date(),
    error: 'Could not connect to any server status API'
  };
};

/**
 * Get a list of online players on a Minecraft server
 * @param {string} serverIP - The server IP address
 * @returns {Promise<Array>} - Promise that resolves to array of player names
 */
export const getOnlinePlayers = async (serverIP = 'play.bizzynation.co.uk') => {
  try {
    // Try to get server status with player list
    const status = await getServerStatus(serverIP);
    
    // If we have a player list, return it
    if (status.players && status.players.length > 0) {
      return status.players;
    }
    
    // If no player list but server is online, return empty array
    if (status.online) {
      return [];
    }
    
    // If server is offline, throw error
    throw new Error('Server is offline');
  } catch (error) {
    console.error('Error getting online players:', error);
    return [];
  }
};

export default {
  getItemImageUrl,
  getPlayerHeadUrl,
  getPlayerRenderUrl,
  fetchPlayerInfo,
  createItemImage,
  getServerStatus,
  getOnlinePlayers,
  // Add compatibility with utility function expected by MinecraftItem.js
  getItemImage: (name, size) => getItemImageUrl(name, size)
};