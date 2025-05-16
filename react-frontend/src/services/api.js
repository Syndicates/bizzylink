import axios from 'axios';

// Import our TokenStorage helper
// Using a safe import pattern in case it's not defined yet
let TokenStorage = null;
try {
  // This is a dynamic import that will be resolved at runtime
  const contextModule = require('../contexts/AuthContext');
  TokenStorage = contextModule.TokenStorage || null;
} catch (err) {
  console.warn('Could not import TokenStorage, falling back to direct localStorage access');
}

// Safe token getter function that uses TokenStorage if available
const getToken = () => {
  // If we're logging out, return null to prevent auto re-auth
  if (window.__LOGGING_OUT) {
    console.log('getToken called during logout - returning null');
    return null;
  }
  
  if (TokenStorage) {
    return TokenStorage.getToken();
  }
  
  // Fallback to direct localStorage access
  try {
    return localStorage.getItem('token');
  } catch (err) {
    console.warn('Error accessing localStorage:', err);
    return null;
  }
};

// Safe token setter function that uses TokenStorage if available
const setAuthToken = (token) => {
  if (TokenStorage) {
    TokenStorage.setToken(token);
    return;
  }
  
  // Fallback to direct localStorage access with safety
  try {
    localStorage.setItem('token', token);
  } catch (err) {
    console.error('Error setting token in localStorage:', err);
    
    // Try sessionStorage as backup
    try {
      sessionStorage.setItem('token', token);
    } catch (err2) {
      console.error('Error setting token in sessionStorage:', err2);
    }
  }
};

// Safe token remover function that uses TokenStorage if available
const removeAuthToken = () => {
  if (TokenStorage) {
    TokenStorage.removeToken();
    return;
  }
  
  // Fallback to direct localStorage access with safety
  try {
    localStorage.removeItem('token');
  } catch (err) {
    console.error('Error removing token from localStorage:', err);
  }
  
  // Try sessionStorage as backup
  try {
    sessionStorage.removeItem('token');
  } catch (err) {
    console.error('Error removing token from sessionStorage:', err);
  }
};

// In-memory cache for API responses
const apiCache = {
  cache: new Map(),
  
  // Set cache with expiration
  set(key, value, ttlMs = 60000) { // Default 1 minute TTL
    // Skip caching certain problematic endpoints like /follow and /unfollow
    if (key.includes('/api/follow') || key.includes('/api/unfollow')) {
      console.log(`Skipping cache for sensitive endpoint: ${key}`);
      return;
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
    console.log(`Cached response for ${key}, expires in ${ttlMs/1000}s`);
  },
  
  // Get from cache, returns undefined if expired or not found
  get(key) {
    // Skip cache lookup for certain problematic endpoints
    if (key.includes('/api/follow') || key.includes('/api/unfollow')) {
      console.log(`Skipping cache lookup for sensitive endpoint: ${key}`);
      return undefined;
    }
    
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      console.log(`Cache expired for ${key}`);
      this.cache.delete(key);
      return undefined;
    }
    
    console.log(`Cache hit for ${key}`);
    return item.value;
  },
  
  // Generate cache key from config
  getKey(config) {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  },
  
  // Clear cache
  clear() {
    this.cache.clear();
  }
};

/**
 * Get the base URL for API connection
 * @returns {string} The base URL for API connections
 */
const getBaseUrl = () => {
  // For production, use the deployed API URL
  // For development, use the local API URL
  // Always explicitly use localhost:8080 in development
  return process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL || window.location.origin
    : 'http://localhost:8080';  // Hard-coded for development
};

/**
 * Get the appropriate URL for different endpoints
 * @param {string} endpoint - The API endpoint
 * @returns {string} The base URL for the specific endpoint
 */
const getEndpointUrl = (endpoint) => {
  // Use our direct auth server for all auth-related endpoints
  if (endpoint.includes('/api/login') || 
      endpoint.includes('/api/verify-token') ||
      endpoint.includes('/api/refresh-token') ||
      endpoint.includes('/api/auth') ||
      endpoint.includes('/api/linkcode/generate')) {
    return 'http://localhost:8082';
  }
  
  // Use the player-stats server for player stats
  if (endpoint.includes('/api/test/player-stats') ||
      endpoint.includes('/api/player-stats')) {
    return 'http://localhost:8081';
  }
  
  // Use the default server for everything else
  return getBaseUrl();
};

// Log the base URL on startup
console.log('API Service: Using base URL:', getBaseUrl());

// Create an Axios instance with configuration
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, // Reduce timeout to 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Important for CORS and credentials
  withCredentials: true,
  // Enable HTTP keep-alive for better performance
  keepAlive: true,
  // Enable compression
  decompress: true,
  // Avoid large response buffering
  maxContentLength: 10 * 1024 * 1024, // 10MB max response size
  // Don't parse dates automatically (reduces overhead)
  transformResponse: [
    function(data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
  ]
});

// Override the baseURL dynamically based on the endpoint
api.interceptors.request.use(config => {
  // Get the full URL path for matching
  const fullPath = config.url || '';
  
  // Override the baseURL dynamically based on the endpoint
  const endpoint = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
  config.baseURL = getEndpointUrl(endpoint);
  
  console.log(`API Request to ${config.method?.toUpperCase()} ${endpoint} using baseURL: ${config.baseURL}`);

  return config;
}, error => {
  return Promise.reject(error);
});

// Add a request interceptor to include the auth token and handle caching
api.interceptors.request.use(
  (config) => {
    // Check if this is a GET request that we can cache
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = apiCache.getKey(config);
      const cachedResponse = apiCache.get(cacheKey);
      
      if (cachedResponse) {
        // Create an axiosMock to immediately resolve with cached data
        const axiosMock = new Promise(resolve => {
          resolve({
            ...cachedResponse,
            cached: true,
            config: config
          });
        });
        
        // Add the cacheHit property to signal that we're returning from cache
        axiosMock.cacheHit = true;
        
        // Cancel the actual request
        config.adapter = () => axiosMock;
      }
    }
    
    // Add authorization token - with safe access through our helper
    const token = getToken();
    
    if (token) {
      // Make sure we're adding the token to all requests
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // For profile requests, always include credentials
      if (config.url.includes('/api/profile')) {
        // For profile requests, always include credentials
        config.withCredentials = true;
        
        // Set specific content type for profile requests
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
      }
    } else {
      // Only redirect for non-public endpoints
      if (config.url.includes('/api/') && 
          !config.url.includes('/api/login') && 
          !config.url.includes('/api/register') &&
          !config.url.includes('/api/profile') &&  // Don't redirect for profile checks
          !config.url.includes('/api/verify-token')) {  // Don't redirect for token verification
        console.warn('Protected endpoint accessed without token - redirecting to login');
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          // Use a more gentle approach - don't force redirect immediately
          // This allows components to handle the error gracefully
          setTimeout(() => {
            // Use our safe token getter
            const hasToken = !!getToken();
            
            if (!hasToken) {
              window.location.href = '/login';
            }
          }, 100);
        }
      }
    }
    
    // Add request retry capability
    config.retryCount = config.retryCount || 0;
    config.retryDelay = config.retryDelay || 1000;
    config.maxRetries = config.maxRetries || 2; // Reduce default from 3 to 2
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors and caching
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`API Response [${response.config.url}]:`, response.data);
    
    // Cache successful GET responses
    if (response.config.method === 'get' && !response.cached && !response.config.skipCache) {
      const cacheKey = apiCache.getKey(response.config);
      
      // Determine cache TTL based on the endpoint
      let cacheTTL = 60000; // Default 1 minute
      
      // Use longer cache for certain endpoints
      if (response.config.url.includes('/api/player/')) {
        cacheTTL = 300000; // 5 minutes for player data
      } else if (response.config.url.includes('/api/leaderboard/')) {
        cacheTTL = 600000; // 10 minutes for leaderboard data
      } else if (response.config.url.includes('/api/profile')) {
        cacheTTL = 180000; // 3 minutes for profile data
      } else if (response.config.url.includes('/api/friends') || 
                 response.config.url.includes('/api/following') ||
                 response.config.url.includes('/api/notifications')) {
        cacheTTL = 120000; // 2 minutes for social data
      }
      
      apiCache.set(cacheKey, response, cacheTTL);
    }
    
    return response;
  },
  async (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Special handling for storage errors
    if (error.message?.includes('storage') || error.name === 'SecurityError') {
      console.error('Storage access error detected:', error);
      return Promise.reject(error);
    }
    
    // Handle authentication errors - BUT DON'T REDIRECT on profile validation requests
    if (error.response?.status === 401) {
      console.error('Authentication error - clearing token');
      
      // Don't redirect for profile validation requests - let the AuthContext handle it
      if (error.config?.url.includes('/api/profile') || error.config?.url.includes('/api/verify-token')) {
        console.log('Token validation failed - returning error without redirect');
        // Use our safe token remover
        removeAuthToken();
        return Promise.reject(error);
      }
      
      // Only redirect for other API calls if not on login/register pages
      // Use our safe token remover
      removeAuthToken();
      
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        console.log('API call unauthorized - redirecting to login');
        // Delay redirect to allow components to handle error
        setTimeout(() => {
          window.location.href = '/login';
        }, 200);
      }
    }
    
    // If it's a network error (ECONNABORTED, Network Error, etc)
    if (axios.isCancel(error)) {
      // Request was cancelled, just return a rejected promise
      return Promise.reject(error);
    }
        
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      const originalRequest = error.config;
      
      if (!originalRequest.retryCount) originalRequest.retryCount = 0;
      if (!originalRequest.maxRetries) originalRequest.maxRetries = 2; // Reduce from 3 to 2
      
      // Don't retry on file uploads and certain endpoints
      if (originalRequest.url.includes('/upload') || 
          originalRequest.url.includes('/profile-picture') ||
          originalRequest.url.includes('/cover-photo')) {
        return Promise.reject(error);
      }
      
      if (originalRequest.retryCount < originalRequest.maxRetries) {
        originalRequest.retryCount++;
        
        // Use exponential backoff with jitter
        const jitter = Math.random() * 300;
        const delayMs = 
          (originalRequest.retryDelay || 1000) * 
          Math.pow(2, originalRequest.retryCount - 1) + jitter;
        
        console.log(`Network error, retrying ${originalRequest.url} (${originalRequest.retryCount}/${originalRequest.maxRetries}) after ${delayMs}ms`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Create a fresh axios instance for the retry to avoid connection reuse
        const retryConfig = {...originalRequest};
        
        // Use a fresh connection
        retryConfig.freshConnect = true;
        
        // Retry the request
        return api(retryConfig);
      }
    }
    
    // Continue with rate limit handling
    if (error.response && error.response.status === 429) {
      const config = error.config;
      if (!config) return Promise.reject(error);
      
      // Get retry-after header if available, or calculate based on retryCount
      const retryAfter = error.response.headers['retry-after'] || 
                         error.response.data?.retryAfter || 
                         Math.pow(2, config.retryCount || 0);
                         
      // Convert to milliseconds (if in seconds)
      const retryMs = retryAfter > 100 ? retryAfter : retryAfter * 1000;
      
      // Initialize retry count if not set
      if (!config.retryCount) config.retryCount = 0;
      if (!config.maxRetries) config.maxRetries = 3;
      
      // Check for social endpoints that need special handling
      const isSocialEndpoint = config.url?.includes('/api/follow') || 
                             config.url?.includes('/api/friends') || 
                             config.url?.includes('/api/notifications');
      
      // For social endpoints, use a longer delay between retries to avoid spamming
      if (isSocialEndpoint) {
        console.log(`Social endpoint rate limited: ${config.url} - Using extended delay`);
        
        // For social endpoints, longer wait between retries
        const socialDelayMs = 8000 + (Math.random() * 7000);
        
        // Allow up to 2 retries for social endpoints
        if (config.retryCount < 2) {
          config.retryCount++;
          
          console.log(`Rate limit hit on social endpoint, waiting ${socialDelayMs}ms before retry ${config.retryCount}/2`);
          
          // Wait for the extended delay
          await new Promise(resolve => setTimeout(resolve, socialDelayMs));
          
          // Retry the request
          return api(config);
        } else {
          console.log(`Maximum social endpoint retries reached for ${config.url} - giving up`);
          error.isSocialRateLimited = true;
          error.retryAfter = retryAfter;
        }
      }
      // Regular endpoints use exponential backoff
      else if (config.retryCount < config.maxRetries) {
        // Calculate dynamic delay based on retry count, with an increased backoff factor
        const jitter = Math.random() * 500;
        const delayMs = 
          (config.retryDelay || 1000) * 
          Math.pow(2, config.retryCount) + jitter; // Increase backoff multiplier
        
        // Increment retry count
        config.retryCount++;
        
        console.log(`Rate limit hit, retrying ${config.url} (${config.retryCount}/${config.maxRetries}) after ${delayMs}ms`);
        
        // Wait for the backoff period
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Retry the request
        return api(config);
      } else {
        console.log(`Maximum retries (${config.maxRetries}) reached for ${config.url} - giving up`);
        
        // Add information about rate limiting to the error
        error.isRateLimited = true;
        error.retryAfter = retryAfter;
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a utility function to clear cache
export const clearApiCache = () => {
  console.log('Clearing API cache');
  apiCache.clear();
};

// Debug utility to inspect token
export const debugToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No authentication token found in localStorage');
    return null;
  }
  
  console.log('Token found in localStorage:', token.substring(0, 10) + '...');
  
  // Check if it's a valid JWT token (simple structure check)
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('Token does not appear to be a valid JWT (should have 3 parts)');
    return { valid: false, token: token };
  }
  
  try {
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    
    // Check expiration
    if (payload.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      console.log('Token expires:', expirationDate);
      console.log('Token is', expirationDate > now ? 'valid' : 'expired');
    }
    
    return { valid: true, payload, token };
  } catch (e) {
    console.error('Error decoding token:', e);
    return { valid: false, error: e.message, token };
  }
};

// Auth services
export const AuthService = {
  register: (userData) => {
    // Clear cache on register to ensure fresh data
    clearApiCache();
    console.log('Registering new user:', { ...userData, password: '[REDACTED]' });
    return api.post('/api/register', userData);
  },
  
  login: (credentials) => {
    // Clear cache on login to ensure fresh data
    clearApiCache();
    console.log('Logging in user:', { ...credentials, password: '[REDACTED]' });
    
    // Make sure we're targeting the direct auth server
    const directAuthServerUrl = 'http://localhost:8082';
    console.log('Using Direct Auth Server URL:', directAuthServerUrl);
    
    // Create a special instance just for login to avoid any interceptor issues
    const loginInstance = axios.create({
      baseURL: directAuthServerUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true // Important for CORS with credentials
    });
    
    // Explicitly log the full login endpoint being called
    const loginEndpoint = '/api/login';
    console.log('Full login endpoint:', directAuthServerUrl + loginEndpoint);
    
    return loginInstance.post(loginEndpoint, credentials)
      .then(response => {
        console.log('Login API response:', response.data);
        
        // Check if the response contains a token
        if (!response.data.token) {
          console.error('No token in login response!', response.data);
        } else {
          console.log('Token received from server:', response.data.token.substring(0, 15) + '...');
          // Store the token immediately
          setAuthToken(response.data.token);
          
          // Verify token was stored
          const storedToken = getToken();
          console.log('Token storage verification:', storedToken ? 'Success' : 'Failed');
        }
        
        return response;
      })
      .catch(error => {
        console.error('Login API error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : 'No response',
          config: error.config ? {
            url: error.config.url,
            method: error.config.method,
            baseURL: error.config.baseURL
          } : 'No config'
        });
        throw error;
      });
  },
  
  logout: () => {
    // Mark that we're in logout process to prevent auto re-auth
    window.__LOGGING_OUT = true;
    
    // Clear cache on logout
    clearApiCache();
    
    // Create an instance without auth interceptors for logout
    const noAuthApi = axios.create({
      baseURL: getBaseUrl()
    });
    
    console.log('API service: Calling logout endpoint');
    
    // Call logout endpoint - use /api/logout to match server route
    return noAuthApi.post('/api/logout')
      .then(response => {
        console.log('Logout successful:', response);
        return response;
      })
      .catch(error => {
        console.error('Logout API call failed:', error);
        // Still return success even if API call fails
        return { success: true, message: 'Locally logged out' };
      })
      .finally(() => {
        // Clear flag after 3 seconds to allow normal operation if page not reloaded
        setTimeout(() => {
          window.__LOGGING_OUT = false;
        }, 3000);
      });
  },
  
  getProfile: (skipCache = false) => {
    console.log('Fetching user profile, skipCache:', skipCache);
    
    // Get token for logging
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Attempting to fetch profile without a token');
    }
    
    return api.get('/api/profile', { 
      skipCache,
      // Use higher retry and longer delay for profile 
      maxRetries: 5,
      retryDelay: 2000,
      // For profile requests, always include credentials
      withCredentials: true,
      // Ensure headers are properly set
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  },
  
  // Helper method to verify token is valid
  verifyToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found during verification');
      return { valid: false, reason: 'no_token' };
    }
    
    try {
      const response = await api.get('/api/verify-token', { skipCache: true });
      console.log('Token verification response:', response.data);
      return { valid: true, data: response.data };
    } catch (error) {
      console.error('Token verification failed:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        return { valid: false, reason: 'invalid_token' };
      }
      return { valid: false, reason: 'server_error', error };
    }
  },
  
  getCurrentUser: () => {
    console.log('Getting current user from AuthService');
    
    // Check if we have a token
    const token = getToken();
    if (!token) {
      console.log('No token found, returning null for current user');
      return null;
    }
    
    // First try to extract basic user info from token for immediate use
    let tokenUser = null;
    try {
      // Parse the token payload (JWT format: header.payload.signature)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      if (payload && payload.user) {
        console.log('Successfully extracted basic user data from token');
        tokenUser = payload.user;
      }
    } catch (err) {
      console.error('Error extracting user data from token:', err);
    }
    
    // Always fetch the latest complete profile from the server
    console.log('Fetching complete user profile from server');
    return api.get('/api/profile')
      .then(response => {
        console.log('Profile API response:', response.data);
        
        // Merge with token data for completeness if needed
        const completeUser = response.data;
        
        // Normalize user data structure for both new and old formats
        if (completeUser.minecraft) {
          // If we have the new nested minecraft structure, ensure root-level properties also exist
          if (!completeUser.linked && completeUser.minecraft.linked !== undefined) {
            completeUser.linked = completeUser.minecraft.linked;
          }
          
          if (!completeUser.mcUsername && completeUser.minecraft.mcUsername) {
            completeUser.mcUsername = completeUser.minecraft.mcUsername;
          }
          
          if (!completeUser.mcUUID && completeUser.minecraft.mcUUID) {
            completeUser.mcUUID = completeUser.minecraft.mcUUID;
          }
        } else if (completeUser.linked || completeUser.mcUsername || completeUser.mcUUID) {
          // If we have old root-level properties, ensure the minecraft object exists
          completeUser.minecraft = {
            linked: completeUser.linked || false,
            mcUsername: completeUser.mcUsername || null,
            mcUUID: completeUser.mcUUID || null
          };
        }
        
        console.log('Returning normalized user data:', completeUser);
        return completeUser;
      })
      .catch(error => {
        console.error('Error fetching profile:', error);
        // If server fetch fails but we have token data, return that as fallback
        if (tokenUser) {
          console.log('Using token data as fallback');
          return tokenUser;
        }
        throw error;
      });
  },
};

// Minecraft account services
export const MinecraftService = {
  // Get base URL for API connections
  getBaseUrl: () => process.env.REACT_APP_API_URL || 'http://localhost:8080', // Changed from 3001 to 8080
  
  // Special URL for player stats updates to use our standalone server
  getPlayerStatsUrl: () => 'http://localhost:8081',
  
  linkAccount: (mcUsername) => {
    // Clear cache when linking accounts
    clearApiCache();
    // Fixed endpoint to match server implementation
    return api.post('/api/linkcode/generate', { mcUsername }, {
      maxRetries: 3,
      retryDelay: 2000
    });
  },
  
  unlinkAccount: () => {
    // Clear cache when unlinking accounts
    clearApiCache();
    console.log('Unlinking Minecraft account, checking auth headers...');
    
    // Add debug logging to check auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found in localStorage!');
    } else {
      console.log('Authentication token exists in localStorage');
    }
    
    // Try the minecraft-specific endpoint first which has more debugging
    return api.delete('/api/minecraft/link', {
      maxRetries: 3,
      retryDelay: 2000
    })
    .catch(error => {
      console.error('Error using /api/minecraft/link:', error.message);
      console.log('Falling back to /api/linkcode endpoint...');
      
      // Fall back to the linkcode endpoint as a secondary option
      return api.delete('/api/linkcode', {
        maxRetries: 2,
        retryDelay: 1500
      });
    });
  },
  
  // Enhanced player stats retrieval with better error handling
  getPlayerStats: (username, skipCache = false) => {
    console.log(`Getting player stats for ${username}${skipCache ? ' (forced refresh)' : ''}`);
    
    // Clear cache if skipCache is true
    if (skipCache) {
      console.log('Clearing cache for player stats');
      clearApiCache();
    }
    
    // Handle bizzy/n0t_awake special case
    let lookupName = username;
    if (username === 'bizzy') {
      lookupName = 'n0t_awake';
      console.log('Special case: Using MC username n0t_awake for user bizzy');
    }
    
    // Normalize response to handle both data structures
    const normalizeResponse = (response) => {
      const data = response.data;
      
      console.log('Raw API response data:', JSON.stringify(data, null, 2));
      
      // Create a normalized version of the data
      const normalizedData = { ...data };
      
      // Handle nested minecraft object
      if (normalizedData.minecraft) {
        console.log('Found minecraft object in response');
        
        // Copy minecraft fields to root for consistency
        if (normalizedData.minecraft.mcUsername) {
          normalizedData.mcUsername = normalizedData.minecraft.mcUsername;
        }
        
        if (normalizedData.minecraft.mcUUID) {
          normalizedData.mcUUID = normalizedData.minecraft.mcUUID;
        }
        
        if (normalizedData.minecraft.linked !== undefined) {
          normalizedData.linked = normalizedData.minecraft.linked;
        }
        
        if (normalizedData.minecraft.stats) {
          console.log('Found stats in minecraft object');
          // Copy all stats to root level
          Object.assign(normalizedData, normalizedData.minecraft.stats);
          
          // Also set stats fields individually for compatibility
          normalizedData.achievements = normalizedData.minecraft.stats.achievements || 0;
          normalizedData.playtime = normalizedData.minecraft.stats.playtime || '0h';
          normalizedData.experience = normalizedData.minecraft.stats.experience || 0;
          normalizedData.level = normalizedData.minecraft.stats.level || 0;
          normalizedData.blocks_mined = normalizedData.minecraft.stats.blocks_mined || 0;
          normalizedData.mobs_killed = normalizedData.minecraft.stats.mobs_killed || 0;
          normalizedData.player_kills = normalizedData.minecraft.stats.player_kills || 0;
          normalizedData.deaths = normalizedData.minecraft.stats.deaths || 0;
          normalizedData.mcmmo_data = normalizedData.minecraft.stats.mcmmo_data || { skills: {}, power_level: 0 };
          normalizedData.inventory = normalizedData.minecraft.stats.inventory || {};
          normalizedData.advancements = normalizedData.minecraft.stats.advancements || [];
          
          // Set lastSeen from appropriate property
          if (normalizedData.minecraft.stats.lastSeen || normalizedData.minecraft.stats.last_seen) {
            normalizedData.lastSeen = normalizedData.minecraft.stats.lastSeen || normalizedData.minecraft.stats.last_seen;
          } else if (normalizedData.minecraft.lastSeen) {
            normalizedData.lastSeen = normalizedData.minecraft.lastSeen;
          }
          
          // Set location coordinates if available
          if (normalizedData.minecraft.stats.location) {
            normalizedData.coords = {
              x: normalizedData.minecraft.stats.location.x,
              y: normalizedData.minecraft.stats.location.y,
              z: normalizedData.minecraft.stats.location.z
            };
            normalizedData.world = normalizedData.minecraft.stats.location.world || 'overworld';
            normalizedData.biome = normalizedData.minecraft.stats.location.biome || '';
          }
        }
      } else {
        // If no minecraft object, create one from root properties for compatibility
        normalizedData.minecraft = {
          linked: normalizedData.linked || false,
          mcUsername: normalizedData.mcUsername || null,
          mcUUID: normalizedData.mcUUID || null
        };
      }
      
      console.log('Normalized player data:', normalizedData);
      
      // Return the normalized data
      return { data: normalizedData };
    };
    
    // Create an instance with the player stats server URL
    const playerStatsApi = axios.create({
      baseURL: MinecraftService.getPlayerStatsUrl(),
      timeout: 10000
    });
    
    // First try getting by username from the player-stats-server
    return playerStatsApi.get(`/api/player/${lookupName}`, {
      skipCache,
      maxRetries: 2,
      retryDelay: 1500
    })
    .then(normalizeResponse)
    .catch(err => {
      console.error(`Error getting player stats for ${username} from player-stats-server:`, err.message);
      
      // If it fails, check if we have UUID
      const userUUID = (typeof localStorage !== 'undefined' && localStorage.getItem('mcUUID')) || null;
      
      if (userUUID) {
        console.log(`Trying to get player stats with UUID: ${userUUID}`);
        return playerStatsApi.get(`/api/player/${userUUID}`, {
          skipCache: true,
          maxRetries: 2
        }).then(normalizeResponse)
        .catch(uuidErr => {
          console.error(`Error getting player stats with UUID ${userUUID}:`, uuidErr.message);
          
          // Fallback to main API as final attempt
          console.log('Falling back to main API server as final attempt');
          return api.get(`/api/player/${lookupName}`, {
            skipCache: true,
            maxRetries: 2
          }).then(normalizeResponse);
        });
      }
      
      // If not found by MC username, try fallback to main API
      console.log('Trying fallback to main API server');
      return api.get(`/api/player/${lookupName}`, {
        skipCache: true,
        maxRetries: 2
      }).then(normalizeResponse)
      .catch(finalErr => {
        console.error('All player stats retrieval attempts failed:', finalErr.message);
        throw finalErr;
      });
    });
  },
  
  getActiveLinkCode: (skipCache = false) => api.get('/api/minecraft/link', {
    skipCache,
    maxRetries: 3,
    retryDelay: 2000
  }),
  
  getLeaderboard: (category, timeFrame = 'all', limit = 10) => 
    api.get(`/api/leaderboard/${category}?timeFrame=${timeFrame}&limit=${limit}`, {
      // Use long cache for leaderboards (5 minutes)
      maxRetries: 5,
      retryDelay: 1000,
      cacheTTL: 5 * 60 * 1000 // 5 minutes cache
    }),
  
  // Method to manually trigger a sync from frontend
  triggerSync: (uuid) => {
    console.log('Triggering manual sync for UUID:', uuid);
    // Clear cache for the player being synced
    if (uuid) {
      // We don't know the username, so clear all cache
      clearApiCache();
    }
    
    return api.post('/api/realtime/notify', { 
      type: 'player_update', 
      uuid,
      timestamp: Date.now(),
      forceUpdate: true,  // Signal this is a manual update that should bypass thresholds
      source: 'website'   // Indicate this sync came from website button
    }, {
      maxRetries: 2,
      retryDelay: 1000
    });
  },
  
  // Helper methods to work with the enhanced player data
  
  // Parse player level for display
  parsePlayerLevel: (level, experience) => {
    let displayData = {
      level: 1,
      experience: 0,
      isMaxLevel: false,
      extraLevels: 0,
      tag: null,
      tagClass: ''
    };
    
    if (!level) return displayData;
    
    // Convert to number if needed
    const numLevel = Number(level);
    const numExperience = Number(experience || 0);
    
    displayData.level = numLevel;
    displayData.experience = numExperience;
    displayData.isMaxLevel = numLevel >= 100;
    
    if (displayData.isMaxLevel) {
      displayData.extraLevels = numLevel - 100;
      
      // Calculate tag based on level
      if (numLevel >= 500) {
        displayData.tag = "GOD MODE";
        displayData.tagClass = "from-white via-yellow-300 to-yellow-500";
      } else if (numLevel >= 400) {
        displayData.tag = "IMMORTAL";
        displayData.tagClass = "from-blue-400 via-purple-500 to-pink-500";
      } else if (numLevel >= 350) {
        displayData.tag = "LEGENDARY";
        displayData.tagClass = "from-purple-500 to-pink-500";
      } else if (numLevel >= 300) {
        displayData.tag = "MYTHICAL";
        displayData.tagClass = "from-indigo-500 to-purple-500";
      } else if (numLevel >= 250) {
        displayData.tag = "GODLIKE";
        displayData.tagClass = "from-cyan-500 to-blue-500";
      } else if (numLevel >= 200) {
        displayData.tag = "UNSTOPPABLE";
        displayData.tagClass = "from-green-500 to-cyan-500";
      } else if (numLevel >= 150) {
        displayData.tag = "OVERPOWERED";
        displayData.tagClass = "from-yellow-400 to-red-500";
      } else if (numLevel >= 125) {
        displayData.tag = "SUPERHUMAN";
        displayData.tagClass = "from-orange-400 to-amber-500";
      }
    }
    
    return displayData;
  },
  
  // Calculate derived statistics
  calculateDerivedStats: (playerData) => {
    const stats = {
      kill_death_ratio: 0,
      combat_score: 0,
      mining_efficiency: 0,
      exploration_score: 0
    };
    
    if (playerData) {
      // Calculate kill/death ratio
      if (playerData.deaths && playerData.deaths > 0) {
        stats.kill_death_ratio = Number(((playerData.mobs_killed || 0) + (playerData.player_kills || 0)) / playerData.deaths).toFixed(2);
      } else {
        stats.kill_death_ratio = (playerData.mobs_killed || 0) + (playerData.player_kills || 0);
      }
      
      // Calculate combat score based on kills, damage, etc.
      stats.combat_score = Math.floor(
        (playerData.mobs_killed || 0) * 10 + 
        (playerData.player_kills || 0) * 50 + 
        (playerData.damage_dealt || 0) / 100
      );
      
      // Calculate mining efficiency
      const blocksMined = playerData.blocks_mined || 0;
      const playTimeHours = (playerData.time_played || 60) / 60;
      stats.mining_efficiency = Math.floor(blocksMined / (playTimeHours || 1));
      
      // Calculate exploration score
      stats.exploration_score = Math.floor(
        (playerData.distance_traveled || 0) / 100 + 
        (playerData.playtime_minutes || 0) / 10
      );
    }
    
    return stats;
  },
  
  // Format playtime for display
  formatPlaytime: (minutes) => {
    if (!minutes) return '0h';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  },
  
  // Format distance for display
  formatDistance: (blocks) => {
    if (!blocks) return '0 blocks';
    
    if (blocks > 1000) {
      return `${(blocks / 1000).toFixed(1)}k blocks`;
    }
    
    return `${blocks} blocks`;
  },
  
  // Update player stats - use the special URL for the player-stats endpoint
  updatePlayerStats: (userId, mcUsername, stats) => {
    console.log(`Updating player stats for ${mcUsername}`);
    
    return api.post('/api/test/player-stats', {
      userId,
      mcUsername,
      stats
    }, {
      baseURL: MinecraftService.getPlayerStatsUrl(), // Use the special URL
      maxRetries: 1, // Reduce retries to avoid overwhelming the server
      retryDelay: 5000 // Increase delay between retries
    });
  }
};

// Admin services
export const AdminService = {
  getUsers: (page = 1, limit = 10) => api.get(`/api/admin/users?page=${page}&limit=${limit}`),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
};

// Social system services
export const SocialService = {
  // Friend requests
  sendFriendRequest: (username) => {
    clearApiCache(); // Clear cache when sending request
    
    // Enhanced validation
    if (!username) {
      console.error('Username is null or undefined');
      return Promise.reject(new Error('Username is required'));
    }
    
    if (typeof username !== 'string') {
      console.error('Username must be a string, received:', typeof username);
      return Promise.reject(new Error('Username must be a string'));
    }
    
    const trimmedUsername = username.trim();
    if (trimmedUsername === '') {
      console.error('Username cannot be empty');
      return Promise.reject(new Error('Username cannot be empty'));
    }
    
    // Log the request details
    console.log('SocialService - Sending friend request:', { 
      originalUsername: username,
      trimmedUsername,
      type: typeof username,
      length: username.length,
      trimmedLength: trimmedUsername.length,
      endpoint: '/api/friends/request'
    });
    
    // Send request with trimmed username
    return api.post('/api/friends/request', { username: trimmedUsername })
      .then(response => {
        console.log('Friend request API response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      })
      .catch(error => {
        // Enhanced error logging
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          requestPayload: { username: trimmedUsername }
        };
        
        console.error('Friend request API error:', errorDetails);
        
        // Provide more specific error messages based on status
        if (error.response?.status === 400) {
          throw new Error('Invalid username format or user not found');
        } else if (error.response?.status === 401) {
          throw new Error('You must be logged in to send friend requests');
        } else if (error.response?.status === 403) {
          throw new Error('You are not allowed to send friend requests at this time');
        } else if (error.response?.status === 409) {
          throw new Error('Friend request already exists or users are already friends');
        } else {
          throw error;
        }
      });
  },
  
  acceptFriendRequest: (username, mcUsername) => {
    clearApiCache();
    console.log('Accepting friend request:', { username, mcUsername });
    return api.post('/api/friends/accept', { 
      username,
      mcUsername: mcUsername || username
    });
  },
  
  rejectFriendRequest: (username, mcUsername) => {
    clearApiCache();
    console.log('Rejecting friend request:', { username, mcUsername });
    return api.post('/api/friends/reject', { 
      username,
      mcUsername: mcUsername || username
    });
  },
  
  cancelFriendRequest: (username, mcUsername) => {
    clearApiCache();
    console.log('Canceling friend request:', { username, mcUsername });
    return api.post('/api/friends/cancel', { 
      username,
      mcUsername: mcUsername || username
    });
  },
  
  removeFriend: (username, mcUsername) => {
    clearApiCache();
    console.log('Removing friend:', { username, mcUsername });
    return api.post('/api/friends/remove', { 
      username,
      mcUsername: mcUsername || username
    });
  },
  
  // Get friend relationships
  getFriends: (skipCache = false) => api.get('/api/friends', { skipCache }),
  
  getFriendStatus: (username, skipCache = false) => api.get(`/api/friends/status?username=${username}`, { skipCache }),
  
  // Following functionality
  followUser: async (username, mcUsername) => {
    try {
      console.log(`API: Following user ${username} (MC: ${mcUsername || 'N/A'})`);
      
      // Clear cache before making request
      await api.clearCache();
      
      const response = await api.post('/api/following/follow', {
        username,
        mcUsername
      });
      
      return response;
    } catch (error) {
      console.error('API Error - Failed to follow user:', error);
      throw error;
    }
  },
  
  unfollowUser: async (username, mcUsername) => {
    try {
      console.log(`API: Unfollowing user ${username} (MC: ${mcUsername || 'N/A'})`);
      
      // Clear cache before making request
      await api.clearCache();
      
      const response = await api.post('/api/following/unfollow', {
        username,
        mcUsername
      });
      
      return response;
    } catch (error) {
      console.error('API Error - Failed to unfollow user:', error);
      throw error;
    }
  },
  
  getFollowing: async () => {
    try {
      console.log('API: Fetching following list');
      const response = await api.get('/api/following/list');
      return response;
    } catch (error) {
      console.error('API Error - Failed to fetch following list:', error);
      throw error;
    }
  },
  
  getFollowers: (skipCache = false) => api.get('/api/following', {
    skipCache,
    maxRetries: 3,
    retryDelay: 1500
  }),
  
  checkFollowStatus: (username, skipCache = false) => api.get(`/api/friends/status?username=${username}`, {
    skipCache,
    maxRetries: 2,
    retryDelay: 1000
  }),
  
  // Notifications
  getNotifications: (page = 1, limit = 20, skipCache = false) => {
    console.log('Fetching notifications:', { page, limit });
    return api.get(`/api/notifications?page=${page}&limit=${limit}`, { 
      skipCache,
      maxRetries: 3,
      retryDelay: 1500
    });
  },
  
  markNotificationAsRead: (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    return api.post(`/api/notifications/${notificationId}/read`);
  },
  
  markAllNotificationsAsRead: () => {
    console.log('Marking all notifications as read');
    return api.post('/api/notifications/read-all');
  },
  
  deleteNotification: (notificationId) => {
    console.log('Deleting notification:', notificationId);
    return api.delete(`/api/notifications/${notificationId}`);
  },
  
  // User settings
  updateSettings: (settings) => 
    api.put('/api/settings', settings),
  
  // User profile
  fetchUser: async (username, skipCache = false) => {
    try {
      console.log(`Fetching user profile for ${username}${skipCache ? ' (forced refresh)' : ''}`);
      
      // Clear cache if skipCache is true
      if (skipCache) {
        console.log('Clearing cache for user profile');
        clearApiCache();
      }
      
      const response = await api.get(`/api/users/${username}`, {
        skipCache,
        maxRetries: 3,
        retryDelay: 1500
      });
      
      return response.data;
    } catch (error) {
      console.error(`API Error - Failed to fetch user profile for ${username}:`, error);
      throw error;
    }
  }
};

// Export the API instance as default export
export default api;