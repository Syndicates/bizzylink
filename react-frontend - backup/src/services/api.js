import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',  // Direct connection to backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor to include the auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
      // Log full request details for debugging
      console.log('Request details:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    } else {
      console.log('No token available for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error Response:', error.response?.status, error.response?.data, error.config?.url);
    
    // Handle authentication errors
    if (error.response) {
      // User not found or token validation failed
      if (error.response.status === 404 && error.config.url === '/api/profile') {
        console.error('User not found during profile validation - account may have been deleted');
        error.response.data = { 
          ...error.response.data,
          code: 'USER_NOT_FOUND', 
          message: 'User account not found. It may have been deleted.' 
        };
        
        // Force logout by clearing token
        localStorage.removeItem('token');
      }
      
      // Unauthorized - token invalid or expired
      if (error.response.status === 401) {
        console.error('Unauthorized access - token invalid or expired');
        // Force logout by clearing token
        localStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const AuthService = {
  register: (userData) => API.post('/register', userData),
  login: (credentials) => API.post('/login', credentials),
  logout: () => API.post('/logout'),
  getProfile: () => API.get('/api/profile'),
};

// Minecraft account services
export const MinecraftService = {
  linkAccount: (mcUsername) => API.post('/api/link', { mcUsername }),
  unlinkAccount: () => API.post('/api/unlink'),
  getPlayerStats: (username) => API.get(`/api/player/${username}`),
  getActiveLinkCode: () => API.get('/api/linkcode'),
};

// Admin services
export const AdminService = {
  getUsers: (page = 1, limit = 10) => API.get(`/api/admin/users?page=${page}&limit=${limit}`),
  deleteUser: (userId) => API.delete(`/api/admin/users/${userId}`),
};

export default API;