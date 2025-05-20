/**
 * MinecraftService.js
 * Provides API methods for interacting with the Minecraft server
 */

import axiosInstance from '../utils/axiosConfig';
import { toast } from 'react-toastify';

// Global cache for player stats
let playerStatsCache = {};
const CACHE_EXPIRY = 10000; // 10 seconds cache

const MinecraftService = {
  /**
   * Get player statistics from the server with optional cache
   * @param {string} username - Minecraft username
   * @param {boolean} bypassCache - Whether to bypass cache
   * @returns {Promise} - API response
   */
  /**
   * Force refresh player stats - bypass cache but use same method
   * @param {string} username - Minecraft username
   * @returns {Promise} - API response with fresh data
   */
  forceRefreshStats: async (username) => {
    console.log(`[SERVICE] ⚡ REFRESHING player stats for ${username}`);
    // Clear this user's cache entry
    delete playerStatsCache[username];
    // Call normal method with bypassCache=true
    return MinecraftService.getPlayerStats(username, true);
  },

  /**
   * Get player statistics from the server with optional cache
   * @param {string} username - Minecraft username
   * @param {boolean} bypassCache - Whether to bypass cache
   * @returns {Promise} - API response
   */
  getPlayerStats: async (username, bypassCache = false) => {
    try {
      // Check cache first (if not bypassing)
      if (!bypassCache && 
          playerStatsCache[username] && 
          (Date.now() - playerStatsCache[username].timestamp < CACHE_EXPIRY)) {
        console.log(`[SERVICE] Using cached player stats for ${username}`);
        return {
          success: true,
          data: playerStatsCache[username].data,
          cached: true
        };
      }
      
      console.log(`[SERVICE] Fetching fresh player stats for ${username}`);
      // See RULES.md: Always use real backend API endpoints, no mock or legacy paths
      const response = await axiosInstance.get(`/minecraft/player/${username}`);
      
      // Cache the response if successful
      if (response.data && response.data.success) {
        playerStatsCache[username] = {
          data: response.data.data,
          timestamp: Date.now()
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch player stats',
        error
      };
    }
  },
  
  // NEW METHOD - Force refresh player stats
  forceRefreshStats: async (username) => {
    console.log(`[SERVICE] FORCE REFRESHING stats for ${username}`);
    // Clear cache and fetch fresh data
    delete playerStatsCache[username];
    return MinecraftService.getPlayerStats(username, true);
  },
  
  /**
   * Generate a link code for account linking
   * @param {string} username - Minecraft username
   * @returns {Promise} - API response
   */
  generateLinkCode: async (username) => {
    try {
      const response = await axiosInstance.post('/minecraft/link', { username });
      return response.data;
    } catch (error) {
      console.error('Error generating link code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate link code',
        error
      };
    }
  },
  
  /**
   * Unlink Minecraft account
   * @returns {Promise} - API response
   */
  unlinkAccount: async () => {
    try {
      const response = await axiosInstance.post('/minecraft/unlink');
      return response.data;
    } catch (error) {
      console.error('Error unlinking account:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlink account',
        error
      };
    }
  },
  
  /**
   * Get server stats
   * @returns {Promise} - API response
   */
  getServerStats: async () => {
    try {
      const response = await axiosInstance.get('/minecraft/server/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching server stats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch server stats',
        error
      };
    }
  },
  
  /**
   * Get recent player achievements
   * @param {string} username - Minecraft username
   * @returns {Promise} - API response
   */
  getRecentAchievements: async (username) => {
    try {
      const response = await axiosInstance.get(`/minecraft/player/${username}/achievements`);
      return response.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch achievements',
        error
      };
    }
  },
  
  /**
   * Get news items
   * @returns {Promise} - API response
   */
  getNews: async () => {
    try {
      const response = await axiosInstance.get('/news');
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch news',
        error
      };
    }
  },
  
  /**
   * Get events
   * @returns {Promise} - API response
   */
  getEvents: async () => {
    try {
      const response = await axiosInstance.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch events',
        error
      };
    }
  },
  
  /**
   * Get current poll
   * @returns {Promise} - API response
   */
  getCurrentPoll: async () => {
    try {
      const response = await axiosInstance.get('/polls/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching poll:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch poll',
        error
      };
    }
  },
  
  /**
   * Vote in a poll
   * @param {string} pollId - Poll ID
   * @param {string} optionId - Option ID
   * @returns {Promise} - API response
   */
  voteInPoll: async (pollId, optionId) => {
    try {
      const response = await axiosInstance.post(`/polls/${pollId}/vote`, { optionId });
      return response.data;
    } catch (error) {
      console.error('Error voting in poll:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit vote',
        error
      };
    }
  }
};

export default MinecraftService;
