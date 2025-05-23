/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file wallService.js
 * @description Service for wall post functionality
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import API from './api';

class WallService {
  // Internal helper to log API calls with improved error handling
  static async #makeRequest(method, endpoint, data = null) {
    try {
      console.log(`[WallService] ${method} ${endpoint}`, data ? 'with data' : '');
      
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
      console.log(`[WallService] ${method} ${endpoint} response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[WallService] Error in ${method} ${endpoint}:`, error);
      
      // Add detailed error info for debugging
      if (error.response) {
        console.error(`[WallService] Response status: ${error.response.status}`);
        console.error(`[WallService] Response data:`, error.response.data);
      } else if (error.request) {
        console.error(`[WallService] No response received, request was:`, error.request);
      }
      
      // Format the error for better handling in components
      const formattedError = new Error(
        error.response?.data?.error || 
        error.message || 
        'An unknown error occurred with the wall service'
      );
      
      formattedError.status = error.response?.status;
      formattedError.originalError = error;
      throw formattedError;
    }
  }

  /**
   * Get wall posts for a user
   * @param {string} username - Username to get posts for
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of posts per page
   * @returns {Promise} - The response data
   */
  static async getWallPosts(username, page = 1, limit = 10) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    console.log(`[WallService] Getting wall posts for ${username}, page ${page}, limit ${limit}`);
    
    const response = await this.#makeRequest('GET', `/api/wall/${username}?page=${page}&limit=${limit}`);
    
    // Normalize response structure in case API returns inconsistent format
    if (!response.posts && response.data && response.data.posts) {
      console.log('[WallService] Normalizing response structure (posts in data)');
      response.posts = response.data.posts;
    }
    
    // Ensure posts is an array, even if empty
    if (!response.posts) {
      console.log('[WallService] No posts found in response, setting empty array');
      response.posts = [];
    }
    
    // Ensure each post has an author field
    if (Array.isArray(response.posts)) {
      response.posts = response.posts.map(post => {
        if (!post.author) {
          console.log(`[WallService] Adding missing author for post ${post._id || 'unknown'}`);
          post.author = {
            username: post.author_username || username,
            mcUsername: post.author_mcUsername || username,
            _id: post.author_id || `user-${Date.now()}`
          };
        }
        return post;
      });
    }
    
    // Ensure pagination object exists
    if (!response.pagination) {
      response.pagination = {
        totalPages: 1,
        currentPage: page,
        limit: limit
      };
    }
    
    console.log('[DEBUG][WallService] API response posts:', response.posts.map(p => ({ id: p._id, content: p.content })));
    console.log(`[WallService] Returning ${response.posts.length} posts for ${username}`);
    return response;
  }

  /**
   * Create a new wall post
   * @param {string} username - Username of the recipient
   * @param {string} content - Post content
   * @param {string} image - Optional image URL
   * @returns {Promise} - The response data
   */
  static async createWallPost(username, content, image = null) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Post content cannot be empty');
    }
    
    const postData = { content };
    if (image) {
      postData.image = image;
    }
    
    console.log(`[WallService] Creating post for ${username}:`, postData);
    
    const response = await this.#makeRequest('POST', `/api/wall/${username}`, postData);
    
    // Enhance the response to ensure it has the expected structure
    if (!response.success && !response.error) {
      response.success = true;
    }
    
    // If there's a post but no post.author, add basic author info
    if (response.post && !response.post.author) {
      console.log('[WallService] Adding missing author to returned post');
      
      // Try to get user info from localStorage
      let currentUser = null;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          currentUser = JSON.parse(userJson);
        }
      } catch (e) {
        console.error('[WallService] Error getting user from localStorage:', e);
      }
      
      response.post.author = {
        username: currentUser?.username || username,
        mcUsername: currentUser?.mcUsername || username,
        _id: currentUser?._id || `user-${Date.now()}`
      };
    }
    
    // Ensure the post object exists in the response
    if (!response.post && response.data && response.data.post) {
      response.post = response.data.post;
    }
    
    console.log('[WallService] Post creation response:', response);
    return response;
  }

  /**
   * Delete a wall post
   * @param {string} postId - ID of the post to delete
   * @returns {Promise} - The response data
   */
  static async deleteWallPost(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    return this.#makeRequest('DELETE', `/api/wall/post/${postId}`);
  }

  /**
   * Like a wall post
   * @param {string} postId - ID of the post to like
   * @returns {Promise} - The response data
   */
  static async likeWallPost(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    return this.#makeRequest('POST', `/api/wall/post/${postId}/like`);
  }

  /**
   * Unlike a wall post
   * @param {string} postId - ID of the post to unlike
   * @returns {Promise} - The response data
   */
  static async unlikeWallPost(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    return this.#makeRequest('POST', `/api/wall/post/${postId}/unlike`);
  }

  /**
   * Add a comment to a wall post
   * @param {string} postId - ID of the post
   * @param {string} content - Comment content
   * @returns {Promise} - The response data
   */
  static async addComment(postId, content) {
    if (!postId || !content) throw new Error('Post ID and content are required');
    const response = await this.#makeRequest('POST', `/api/wall/post/${postId}/comment`, { content });
    return response;
  }

  /**
   * Delete a comment from a wall post
   * @param {string} postId - ID of the post
   * @param {string} commentId - ID of the comment
   * @returns {Promise} - The response data
   */
  static async deleteComment(postId, commentId) {
    if (!postId || !commentId) throw new Error('Post ID and comment ID are required');
    const response = await this.#makeRequest('DELETE', `/api/wall/post/${postId}/comment/${commentId}`);
    return response;
  }

  /**
   * Get a single wall post by its ID
   * @param {string} postId - ID of the post to fetch
   * @returns {Promise} - The post object
   */
  static async getWallPostById(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const response = await this.#makeRequest('GET', `/api/wall/post/${postId}`);
    // Normalize response
    if (response && response.post) return response.post;
    if (response && response.data && response.data.post) return response.data.post;
    return null;
  }
}

export default WallService; 