const axios = require('axios');
const User = require('../models/User');
const { SecurityLog } = require('../models/SecurityLog');
const logger = require('../utils/logger');

/**
 * Service to synchronize LuckPerms data with our system
 */
class LuckPermsSync {
  constructor() {
    // Mapping from LuckPerms groups to website ranks
    this.rankMapping = {
      'owner': 'owner',
      'admin': 'admin',
      'moderator': 'moderator',
      'helper': 'helper',
      'developer': 'developer',
      'builder': 'content_creator',
      'donor': 'donor',
      'tiktok': 'tiktok_sub',
      'default': 'user'
    };
    
    // Define rank priority (higher index = higher rank)
    this.rankPriority = [
      'default',
      'tiktok',
      'donor',
      'builder',
      'helper',
      'moderator',
      'admin', 
      'developer',
      'owner'
    ];
    
    // API endpoint for LuckPerms
    this.apiUrl = process.env.LUCKPERMS_API_URL;
  }
  
  /**
   * Fetches and syncs player rank from LuckPerms
   * @param {string} uuid Minecraft UUID
   * @returns {Promise} Promise resolving to updated player data
   */
  async syncPlayerRank(uuid) {
    try {
      logger.info(`Syncing rank for player with UUID: ${uuid}`);
      
      // Fetch player groups from LuckPerms
      const playerGroups = await this._fetchPlayerGroups(uuid);
      
      if (!playerGroups) {
        logger.warn(`No groups found for player with UUID: ${uuid}`);
        return null;
      }
      
      // Process groups to determine highest rank
      const highestRank = this._determineHighestRank(playerGroups);
      const isOperator = playerGroups.some(group => 
        group.permissions && group.permissions.includes('minecraft.command.op')
      );
      
      // Update user in database
      const user = await User.findOne({ minecraftUUID: uuid });
      if (!user) {
        logger.warn(`No user found with Minecraft UUID: ${uuid}`);
        return null;
      }
      
      // Store previous rank for logging
      const previousRank = user.webRank;
      
      // Map LuckPerms ranks to minecraftRanks array
      user.minecraftRanks = playerGroups.map(group => ({
        server: group.server || 'global',
        rank: group.group || group.name,
        prefix: group.prefix,
        suffix: group.suffix,
        isOperator,
        permissions: group.permissions || []
      }));
      
      // If player is operator, force admin web rank
      if (isOperator) {
        user.webRank = 'admin';
      } else {
        // Use mapped rank or default to 'user'
        user.webRank = this.rankMapping[highestRank] || 'user';
      }
      
      // Log rank change if different
      if (previousRank !== user.webRank) {
        logger.info(`Rank changed for user ${user.username}: ${previousRank} -> ${user.webRank}`);
        
        // Create security log for rank change
        await SecurityLog.create({
          user: user._id,
          action: 'RANK_CHANGE',
          details: {
            previousRank,
            newRank: user.webRank,
            source: 'luckperms_sync',
            isOperator
          }
        });
      }
      
      await user.save();
      return user;
    } catch (error) {
      logger.error('Error syncing LuckPerms data:', error);
      return null;
    }
  }
  
  /**
   * Fetch player groups from LuckPerms
   * @param {string} uuid Minecraft UUID
   * @returns {Promise<Array>} Array of player groups
   * @private
   */
  async _fetchPlayerGroups(uuid) {
    try {
      // Method 1: LuckPerms API plugin
      if (this.apiUrl) {
        const response = await axios.get(`${this.apiUrl}/player/${uuid}/groups`);
        return response.data;
      }
      
      // Method 2: Direct database query (placeholder)
      // In a real implementation, this would connect to the LuckPerms database
      logger.warn('No LuckPerms API URL configured, using mock data');
      return this._getMockPlayerGroups(uuid);
    } catch (error) {
      logger.error(`Error fetching player groups from LuckPerms: ${error.message}`);
      
      // Fallback to mock data if API fails
      logger.warn('Using mock data as fallback');
      return this._getMockPlayerGroups(uuid);
    }
  }
  
  /**
   * Get mock player groups for testing/fallback
   * @param {string} uuid Minecraft UUID
   * @returns {Array} Mock player groups
   * @private
   */
  _getMockPlayerGroups(uuid) {
    // This is just for testing/fallback purposes
    // In production, this would be replaced with actual database queries
    const mockGroups = {
      // Owner UUID
      'a1b2c3d4-e5f6-1234-5678-abcdef123456': [
        { name: 'owner', permissions: ['minecraft.command.op'] }
      ],
      // Admin UUID
      'b2c3d4e5-f6a1-2345-6789-bcdef1234567': [
        { name: 'admin', permissions: ['minecraft.command.op'] }
      ],
      // Moderator UUID
      'c3d4e5f6-a1b2-3456-789a-cdef12345678': [
        { name: 'moderator', permissions: [] }
      ],
      // Default players
      'default': [
        { name: 'default', permissions: [] }
      ]
    };
    
    return mockGroups[uuid] || mockGroups['default'];
  }
  
  /**
   * Determine highest rank from player's groups
   * @param {Array} groups - Player's groups from LuckPerms
   * @returns {string} The highest rank group name
   * @private
   */
  _determineHighestRank(groups) {
    let highestRank = 'default';
    let highestPriority = -1;
    
    groups.forEach(group => {
      const groupName = group.group || group.name;
      const priority = this.rankPriority.indexOf(groupName);
      if (priority > highestPriority) {
        highestPriority = priority;
        highestRank = groupName;
      }
    });
    
    return highestRank;
  }
  
  /**
   * Sync all active players at once
   */
  async syncAllPlayers() {
    try {
      logger.info('Starting bulk rank sync for all players');
      
      const activeUsers = await User.find({ minecraftUUID: { $exists: true, $ne: null } });
      logger.info(`Found ${activeUsers.length} players with linked Minecraft accounts`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const user of activeUsers) {
        try {
          await this.syncPlayerRank(user.minecraftUUID);
          successCount++;
        } catch (error) {
          logger.error(`Error syncing rank for ${user.username}: ${error.message}`);
          failureCount++;
        }
      }
      
      logger.info(`Completed bulk rank sync. Success: ${successCount}, Failed: ${failureCount}`);
    } catch (error) {
      logger.error('Error in bulk rank sync:', error);
    }
  }
}

module.exports = new LuckPermsSync();