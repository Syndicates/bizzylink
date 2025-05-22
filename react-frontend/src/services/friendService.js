/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file friendService.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import API from './api';

class FriendService {
  // Internal helper to log API calls
  static async #makeRequest(method, endpoint, data = null) {
    try {
      console.log(`[FriendService] ${method} ${endpoint}`, data);
      
      const config = {
        method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await API(config);
      console.log(`[FriendService] Response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[FriendService] Error in ${method} ${endpoint}:`, error);
      throw this.#formatError(error);
    }
  }

  // Error formatter
  static #formatError(error) {
    const formattedError = new Error(
      error.response?.data?.error || 
      error.message || 
      'An unknown error occurred'
    );
    formattedError.status = error.response?.status;
    formattedError.originalError = error;
    return formattedError;
  }

  // Friend Requests
  static async sendFriendRequest(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/friends/request', { username });
  }

  static async getFriendRequests() {
    const data = await this.#makeRequest('GET', '/api/friends/requests');
    return { data };
  }

  static async acceptFriendRequest(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/friends/accept', { username });
  }

  static async rejectFriendRequest(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/friends/reject', { username });
  }

  static async cancelFriendRequest(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/friends/cancel', { username });
  }

  static async removeFriend(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/friends/remove', { username });
  }

  // Friend Status
  static async getFriendStatus(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('GET', `/api/friends/status/${username}`);
  }

  // Following
  static async followUser(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/following/follow', { username });
  }

  static async unfollowUser(username) {
    if (!username) {
      throw new Error('Username is required');
    }
    return this.#makeRequest('POST', '/api/following/unfollow', { username });
  }

  static async getFriends() {
    const data = await this.#makeRequest('GET', '/api/friends');
    return { data };
  }

  static async getFollowing() {
    const data = await this.#makeRequest('GET', '/api/following');
    return { data };
  }

  static async getFollowers() {
    const data = await this.#makeRequest('GET', '/api/followers');
    return { data };
  }

  // Notifications
  static async getNotifications(page = 1, limit = 10) {
    const data = await this.#makeRequest('GET', `/api/notifications?page=${page}&limit=${limit}`);
    return { data };
  }

  static async markNotificationRead(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }
    const data = await this.#makeRequest('POST', `/api/notifications/${notificationId}/read`);
    return { data };
  }

  static async markAllNotificationsRead() {
    const data = await this.#makeRequest('POST', '/api/notifications/read-all');
    return { data };
  }

  // Test connection
  static async testConnection() {
    try {
      const response = await this.#makeRequest('GET', '/api/health');
      console.log('[FriendService] Connection test result:', response);
      return true;
    } catch (error) {
      console.error('[FriendService] Connection test failed:', error);
      return false;
    }
  }

  // Settings
  static async getSettings() {
    const data = await this.#makeRequest('GET', '/api/settings');
    return { data };
  }

  // Relationship Status
  static async getRelationshipStatus(username, mcUsername) {
    if (!username && !mcUsername) {
      throw new Error('Username or MC Username is required');
    }
    const params = [];
    if (username) params.push(`username=${encodeURIComponent(username)}`);
    if (mcUsername) params.push(`mcUsername=${encodeURIComponent(mcUsername)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const data = await this.#makeRequest('GET', `/api/friends/relationship${query}`);
    return { data };
  }
}

export default FriendService;