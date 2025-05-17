/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumAPI.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import axios from 'axios';
// Use window.location.origin as a fallback if config isn't available yet
const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

// Create axios instance with auth token
const apiClient = axios.create({
  baseURL: `${API_URL}/api/forum`,
  withCredentials: true
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Forum API methods
const ForumAPI = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get threads by category
  getThreadsByCategory: async (categoryId, page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/categories/${categoryId}/threads?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching threads for category ${categoryId}:`, error);
      throw error;
    }
  },

  // Get thread with posts
  getThread: async (threadId, page = 1, limit = 20) => {
    try {
      const response = await apiClient.get(`/threads/${threadId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching thread ${threadId}:`, error);
      throw error;
    }
  },

  // Create new thread
  createThread: async (title, content, categoryId) => {
    try {
      const response = await apiClient.post('/threads', { title, content, categoryId });
      return response.data;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  },

  // Add post to thread
  addPost: async (threadId, content) => {
    try {
      const response = await apiClient.post(`/threads/${threadId}/posts`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error adding post to thread ${threadId}:`, error);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, content) => {
    try {
      const response = await apiClient.put(`/posts/${postId}`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const response = await apiClient.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  },

  // Update thread
  updateThread: async (threadId, data) => {
    try {
      const response = await apiClient.put(`/threads/${threadId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating thread ${threadId}:`, error);
      throw error;
    }
  },

  // Delete thread
  deleteThread: async (threadId) => {
    try {
      const response = await apiClient.delete(`/threads/${threadId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting thread ${threadId}:`, error);
      throw error;
    }
  },

  // Search forum
  search: async (query, page = 1, limit = 20) => {
    try {
      const response = await apiClient.get(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching forum for "${query}":`, error);
      throw error;
    }
  },

  // Give reputation to a user
  giveReputation: async (userId, value, postId = null) => {
    try {
      const response = await apiClient.post(`/reputation/${userId}`, { value, postId });
      return response.data;
    } catch (error) {
      console.error(`Error giving reputation to user ${userId}:`, error);
      throw error;
    }
  },

  // Give vouch to a user
  giveVouch: async (userId, context = null, postId = null) => {
    try {
      const response = await apiClient.post(`/vouch/${userId}`, { context, postId });
      return response.data;
    } catch (error) {
      console.error(`Error vouching for user ${userId}:`, error);
      throw error;
    }
  },

  // Donate to a user
  donate: async (userId, amount, note = null) => {
    try {
      const response = await apiClient.post(`/donate/${userId}`, { amount, note });
      return response.data;
    } catch (error) {
      console.error(`Error donating to user ${userId}:`, error);
      throw error;
    }
  },

  // Get user forum stats
  getUserStats: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching forum stats for user ${userId}:`, error);
      throw error;
    }
  },

  // Update user signature
  updateSignature: async (signature) => {
    try {
      const response = await apiClient.put('/signature', { signature });
      return response.data;
    } catch (error) {
      console.error('Error updating signature:', error);
      throw error;
    }
  },

  // Like/unlike a post
  toggleLike: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling like for post ${postId}:`, error);
      throw error;
    }
  }
};

export default ForumAPI;