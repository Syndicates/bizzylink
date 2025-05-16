/**
 * Minecraft Notification Service
 * 
 * This service handles sending notifications to the Minecraft server,
 * particularly for important forum posts created by admins.
 */

// Import Minecraft API service for RCON or plugin communication
const axios = require('axios');
const config = require('../config');

class MinecraftNotificationService {
  /**
   * Send a notification to the Minecraft server
   * @param {Object} options - Notification options
   * @param {string} options.message - The message to send (supports color codes)
   * @param {string} options.type - The notification type (FORUM, ANNOUNCEMENT, etc)
   * @param {string} options.link - Optional URL to be clicked
   * @param {string} options.sender - Username of sender
   * @param {string} options.priority - Priority level (NORMAL, HIGH, CRITICAL)
   * @param {boolean} options.broadcast - Whether to broadcast to all players
   * @returns {Promise<Object>} Response from the Minecraft server
   */
  static async sendNotification(options) {
    try {
      const { message, type = 'FORUM', link, sender = 'System', priority = 'NORMAL', broadcast = true } = options;
      
      // Log notification request
      console.log(`[MinecraftNotificationService] Sending ${priority} notification: ${message}`);
      
      // If we're in development mode, just log instead of actually sending
      if (process.env.NODE_ENV === 'development' && !process.env.FORCE_MC_NOTIFICATIONS) {
        console.log('[MinecraftNotificationService] DEV MODE - Notification would be sent:', {
          message, type, link, sender, priority, broadcast
        });
        return { success: true, simulated: true };
      }
      
      // Prepare the payload for the Minecraft server API
      const payload = {
        message,
        type,
        link,
        sender,
        priority,
        broadcast,
        apiKey: config.minecraft.apiKey // API key for authentication
      };
      
      // Send the notification to the Minecraft server API
      const response = await axios.post(
        `${config.minecraft.apiUrl}/notification`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.minecraft.apiKey}`
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      console.log(`[MinecraftNotificationService] Notification sent successfully: ${response.data.message}`);
      return response.data;
    } catch (error) {
      console.error('[MinecraftNotificationService] Failed to send notification:', error.message);
      
      // Add more details if available
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Send a notification for a new forum thread
   * @param {Object} thread - The forum thread
   * @param {Object} author - The thread author
   * @returns {Promise<Object>} Response from the Minecraft server
   */
  static async notifyForumThread(thread, author) {
    const threadUrl = `${config.website.url}/forum/thread/${thread._id}`;
    
    // Define different message formats based on thread properties
    let message;
    let priority = 'NORMAL';
    
    if (thread.pinned && author.role === 'admin') {
      // Admin pinned post - highest priority with special formatting
      message = `§6[IMPORTANT] §f${author.username} §7posted §a${thread.title} §7- Click to read!`;
      priority = 'HIGH';
    } else if (author.role === 'admin') {
      // Regular admin post - medium priority
      message = `§f${author.username} §7posted §a${thread.title} §7on the forum`;
      priority = 'NORMAL';
    } else if (thread.pinned) {
      // Pinned by moderator - medium priority
      message = `§e[Pinned] §f${author.username} §7posted §a${thread.title} §7on the forum`;
      priority = 'NORMAL';
    } else {
      // Regular post - lowest priority, might not broadcast
      message = `§f${author.username} §7posted §a${thread.title} §7on the forum`;
      priority = 'LOW';
    }
    
    return this.sendNotification({
      message,
      type: 'FORUM_POST',
      link: threadUrl,
      sender: author.username,
      priority,
      broadcast: thread.notifyInGame
    });
  }
  
  /**
   * Send a notification for a thread reply, particularly to thread author
   * @param {Object} post - The forum post/reply
   * @param {Object} thread - The parent thread
   * @param {Object} author - The post author
   * @param {Object} threadAuthor - The original thread author
   * @returns {Promise<Object>} Response from the Minecraft server
   */
  static async notifyThreadReply(post, thread, author, threadAuthor) {
    const postUrl = `${config.website.url}/forum/thread/${thread._id}#post-${post._id}`;
    
    // Only notify the thread author directly, not everyone
    return this.sendNotification({
      message: `§f${author.username} §7replied to your thread §a${thread.title}`,
      type: 'FORUM_REPLY',
      link: postUrl,
      sender: author.username,
      priority: 'LOW',
      broadcast: false,
      targets: [threadAuthor.mcUsername] // Only send to thread author if online
    });
  }
}

module.exports = MinecraftNotificationService;