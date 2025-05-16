import axios from 'axios';
// Use window.location.origin as a fallback if config isn't available yet
const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

// Create axios instance with auth token
const apiClient = axios.create({
  baseURL: `${API_URL}/api/user`,
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

// User API methods
const UserAPI = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await apiClient.put('/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Update user privacy settings
  updatePrivacySettings: async (settings) => {
    try {
      const response = await apiClient.put('/settings/privacy', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  // Update user notification settings
  updateNotificationSettings: async (settings) => {
    try {
      const response = await apiClient.put('/settings/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Get user's balance and transaction history
  getBalance: async () => {
    try {
      const response = await apiClient.get('/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching balance and transactions:', error);
      throw error;
    }
  },

  // Get user's reputation history
  getReputation: async () => {
    try {
      const response = await apiClient.get('/reputation');
      return response.data;
    } catch (error) {
      console.error('Error fetching reputation history:', error);
      throw error;
    }
  },

  // Get user's vouches history
  getVouches: async () => {
    try {
      const response = await apiClient.get('/vouches');
      return response.data;
    } catch (error) {
      console.error('Error fetching vouches history:', error);
      throw error;
    }
  }
};

export default UserAPI;