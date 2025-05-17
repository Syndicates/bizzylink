/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file AuthContext.js
 * @description Authentication context provider for user authentication state management
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, clearApiCache } from '../services/api';
import api from '../services/api';
import Notification from '../components/Notification';
import { toast } from 'react-toastify';
// Import from the new utility instead of using a circular dependency
import TokenStorage from '../utils/tokenStorage';
// Remove mock users import
// import mockUsers from '../data/mockUsers';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export TokenStorage so api.js can use it directly via import
export { TokenStorage };

// Debug flag - can be disabled in production
const DEBUG = true;

// Debug logger that can be easily toggled
const debug = (message, data) => {
  if (DEBUG) {
    if (data) {
      console.log(`[Auth Debug] ${message}`, data);
    } else {
      console.log(`[Auth Debug] ${message}`);
    }
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Function to update user with proper ID normalization
  const updateUser = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      return null;
    }
    
    // Normalize IDs to ensure both id and _id are present
    const normalizedUser = { ...userData };
    
    if (normalizedUser.id && !normalizedUser._id) {
      normalizedUser._id = normalizedUser.id;
    } else if (normalizedUser._id && !normalizedUser.id) {
      normalizedUser.id = normalizedUser._id;
    }
    
    // Normalize Minecraft fields for consistent access in the UI
    // Handle both nested minecraft object and root-level properties
    if (normalizedUser.minecraft) {
      // If minecraft object exists, ensure root-level fields for backwards compatibility
      if (normalizedUser.minecraft.linked !== undefined) {
        normalizedUser.linked = normalizedUser.minecraft.linked;
      }
      
      if (normalizedUser.minecraft.mcUsername) {
        normalizedUser.mcUsername = normalizedUser.minecraft.mcUsername;
      }
      
      if (normalizedUser.minecraft.mcUUID) {
        normalizedUser.mcUUID = normalizedUser.minecraft.mcUUID;
      }
    } else {
      // Ensure the minecraft object exists even if using root-level properties
      normalizedUser.minecraft = {
        linked: normalizedUser.linked || false,
        mcUsername: normalizedUser.mcUsername || null,
        mcUUID: normalizedUser.mcUUID || null
      };
    }
    
    debug('Setting normalized user', normalizedUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  // Improved initialization with retries
  const initAuth = useCallback(async () => {
    debug('Initializing authentication state...');
    setLoading(true);
    
    try {
      // Check if we have a forced logout flag
      const forcedLogout = localStorage.getItem('FORCE_LOGGED_OUT') === 'true';
      if (forcedLogout) {
        debug('Found forced logout flag - ignoring any existing tokens');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      // Check if we have a token using our TokenStorage
      const token = TokenStorage.getToken();
      
      if (!token) {
        debug('No authentication token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      debug('Token found, fetching complete user data from server...');
      
      // Add retry mechanism for more reliable initialization
      let retryCount = 0;
      const MAX_RETRIES = 3;
      
      const fetchUserData = async () => {
        try {
          debug(`Attempt ${retryCount + 1} to fetch user data...`);
          const userData = await AuthService.getCurrentUser();
          
          if (userData) {
            debug('Successfully loaded complete user data', userData);
            setIsAuthenticated(true);
            const normalizedUser = updateUser(userData);
            setError(null);
            setLoading(false);
            setAuthInitialized(true);
            
            if (!normalizedUser) {
              throw new Error("User data normalization failed");
            }
            
            return true;
          }
          throw new Error("No user data returned from API");
        } catch (fetchErr) {
          debug('Error fetching complete user data:', fetchErr);
          
          // If we get a 401 error, the token is invalid
          if (fetchErr.response && fetchErr.response.status === 401) {
            debug('Token is invalid - removing and logging out');
            TokenStorage.removeToken();
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            setAuthInitialized(true);
            return true; // No need to retry on 401
          }
          
          // Retry logic
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            debug(`Retrying fetch... (${retryCount}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            return false; // Continue retrying
          }
          
          return false; // Failed after retries
        }
      };
      
      // Try to fetch user data with retries
      let fetchSuccess = await fetchUserData();
      
      while (!fetchSuccess && retryCount < MAX_RETRIES) {
        fetchSuccess = await fetchUserData();
      }
      
      // If we failed after all retries, fall back to JWT data extraction
      if (!fetchSuccess) {
        debug('All fetch attempts failed, falling back to JWT payload extraction');
        
        try {
          // Parse the token payload (JWT format: header.payload.signature)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const payload = JSON.parse(jsonPayload);
          
          if (payload && payload.user) {
            debug('Using token payload user data as fallback');
            // Set authenticated state with token-extracted user data
            setIsAuthenticated(true);
            updateUser(payload.user);
            setError(null);
          } else {
            debug('No user data found in token payload');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (tokenErr) {
          debug('Error extracting user data from token:', tokenErr);
          // Unable to authenticate user properly
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (err) {
      debug('Authentication initialization error:', err);
      
      // Handle specific API errors
      if (err.response) {
        debug('API response error:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          debug('Token is invalid or expired, clearing authentication state');
          // Clear token if unauthorized
          TokenStorage.removeToken();
        }
      } else if (err.request) {
        debug('API request error (no response):', err.request);
      } else {
        debug('Authentication setup error:', err.message);
      }
      
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message || 'Authentication failed');
    } finally {
      debug('Authentication initialization completed');
      setLoading(false);
      setAuthInitialized(true);
    }
  }, [updateUser]);
  
  // Run once when the component mounts
  useEffect(() => {
    debug('AuthProvider initialized');
    
    // Check for token and validate it
    initAuth();
    
    // Set up periodic token validation (every 30 seconds)
    const interval = setInterval(() => {
      // Only do checks after initial auth is complete
      if (!authInitialized) return;
      
      const hasToken = TokenStorage.hasToken();
      
      // Fix any inconsistencies between token existence and auth state
      if (hasToken && !isAuthenticated) {
        console.warn('Token exists but user not authenticated - fixing inconsistency');
        if (!user) {
          // Need to fetch user data
          initAuth();
        } else {
          // We have user data already, just set auth state
          setIsAuthenticated(true);
        }
      } else if (!hasToken && isAuthenticated) {
        console.warn('User authenticated but no token exists - fixing inconsistency');
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [initAuth, authInitialized, isAuthenticated, user]);
  
  // Enhanced login function with TokenStorage
  const login = async (username, password) => {
    console.log(`Attempting login for user: ${username}`);
    setLoading(true);
    
    // Clear the forced logout flag when attempting login
    try {
      localStorage.removeItem('FORCE_LOGGED_OUT');
    } catch (e) {
      console.error('Could not clear logout flag:', e);
    }

    try {
      const response = await api.post('/api/login', { username, password });
      console.log('Login successful, received response:', response.data);
      
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      console.log('Received token from server:', token ? `${token.substring(0, 15)}...` : 'No token');
      
      // Create a fallback user object if none provided
      const userObject = user || {
        id: 'temp_id_' + Date.now(),
        username: username,
        role: 'user'  // Regular user role - not admin
      };
      
      // Store token using our TokenStorage
      console.log('Storing token using TokenStorage...');
      TokenStorage.setToken(token);
      
      // Verify token was stored properly
      const storedToken = TokenStorage.getToken();
      console.log('Token storage verification:', !!storedToken ? 'Success' : 'Failed');
      
      // Update auth state
      setIsAuthenticated(true);
      setUser(userObject);
      setError(null);
      
      console.log('Login completed successfully, user is now authenticated');
      setLoading(false);
      
      return { success: true, user: userObject };
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response) {
        console.log('API error response:', err.response.status, err.response.data);
        errorMessage = err.response.data.message || errorMessage;
        
        if (err.response.status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (err.response.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (err.response.status === 404) {
          errorMessage = 'Login service not available. Please try again later.';
        }
      } else if (err.request) {
        console.log('Login request error (no response):', err.request);
        errorMessage = 'Server not responding. Please try again later.';
      } else {
        console.log('Login setup error:', err.message);
      }
      
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      
      return { success: false, error: errorMessage };
    }
  };
  
  // Enhanced register function with TokenStorage
  const register = async (userData) => {
    debug('Attempting to register new user:', userData.username);
    setLoading(true);
    
    // Clear the forced logout flag when attempting registration
    try {
      localStorage.removeItem('FORCE_LOGGED_OUT');
    } catch (e) {
      console.error('Could not clear logout flag:', e);
    }
    
    try {
      // Make sure we're sending the right data format
      if (!userData || !userData.username || !userData.password) {
        throw new Error('Missing required registration fields');
      }
      
      // Log the request for debugging
      debug('Sending registration request with data:', {
        username: userData.username,
        email: userData.email || 'Not provided',
        passwordLength: userData.password ? userData.password.length : 0
      });
      
      // Make the API request with proper error handling
      debug('Sending registration request to server...');
      const response = await api.post('/api/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      debug('Registration API response received:', response.status);
      debug('Registration response data:', response.data);
      
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No token received from server after registration');
      }
      
      // Store token using our TokenStorage
      debug('Storing authentication token...');
      TokenStorage.setToken(token);
      debug('Authentication token stored successfully');
      
      // Update auth state
      debug('Updating authentication state...');
      setIsAuthenticated(true);
      setUser(user);
      setError(null);
      
      debug('Registration completed successfully, user is now authenticated');
      return { success: true, user };
    } catch (err) {
      debug('Registration error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response) {
        debug('API error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        // Use server error message if available
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        debug('Registration request error (no response):', err.request);
        errorMessage = 'Server not responding. Please try again later.';
      } else {
        debug('Registration setup error:', err.message);
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function with TokenStorage
  const logout = () => {
    console.log('Logging out user');
    
    // Set a permanent logout flag in localStorage
    try {
      localStorage.setItem('FORCE_LOGGED_OUT', 'true');
      console.log('Set permanent logout flag');
    } catch (e) {
      console.error('Could not set logout flag:', e);
    }
    
    // First call the API
    AuthService.logout()
      .then(() => console.log('Logout API call successful'))
      .catch(err => console.error('Logout API call error:', err))
      .finally(() => {
        // FORCE clear ALL possible token storage locations
        try {
          // Clear via TokenStorage
          TokenStorage.removeToken();
          
          // Direct removal from all storages as a backup
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          
          // Clear cookies
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
          
          // Clear any auth-related items
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          localStorage.removeItem('auth');
          sessionStorage.removeItem('auth');
          
          // Clear any API cache that might contain auth data
          try {
            if (typeof clearApiCache === 'function') {
              clearApiCache();
            }
          } catch (e) {
            console.error('Error clearing API cache:', e);
          }
          
          console.log('All token storage cleared');
        } catch (e) {
          console.error('Error clearing tokens:', e);
        }
        
        // Reset auth state
        setIsAuthenticated(false);
        setUser(null);
        
        console.log('Logout completed, user is no longer authenticated');
        
        // FORCE page reload to clear any in-memory state
        window.location.href = '/';
      });
  };
  
  // Function to manually refresh auth state
  const refreshAuth = () => {
    debug('Manually refreshing authentication state');

    // Check if we have a token first
    if (!TokenStorage.hasToken()) {
      debug('No token exists, cannot refresh authentication');
      return Promise.reject(new Error('No token exists'));
    }

    // Return a promise for better control flow
    return AuthService.getCurrentUser()
      .then(userData => {
        debug('Successfully refreshed user data:', userData);
        setUser(userData);
        setLoading(false);
        return userData;
      })
      .catch(error => {
        debug('Error refreshing authentication:', error);
        // If we get a 401, clear the token and user
        if (error.response && error.response.status === 401) {
          debug('Unauthorized, clearing auth state');
          TokenStorage.clearToken();
          setUser(null);
        }
        setLoading(false);
        throw error;
      });
  };

  // Function to refresh user data without full auth refresh
  const refreshUserData = useCallback(() => {
    debug('Refreshing user data');
    
    // Check if we have a token and user
    if (!TokenStorage.hasToken()) {
      debug('No token exists, cannot refresh user data');
      return Promise.reject(new Error('No token exists'));
    }
    
    // Return a promise for better control flow
    return AuthService.getCurrentUser()
      .then(userData => {
        debug('Successfully refreshed user data:', userData);
        
        // Process the user data through our normalization function
        const normalizedUser = updateUser(userData);
        debug('User data normalized:', normalizedUser);
        
        return normalizedUser;
      })
      .catch(error => {
        debug('Error refreshing user data:', error);
        throw error;
      });
  }, []);

  // Force a complete refresh from server and reload UI
  const forceDataRefresh = useCallback(() => {
    debug('Force refreshing all user data and reloading UI');
    
    return refreshUserData()
      .then(userData => {
        debug('User data refreshed, reloading UI to apply all changes');
        // Force a reload after a short delay to ensure state is updated
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return userData;
      })
      .catch(error => {
        debug('Error in force refresh:', error);
        throw error;
      });
  }, [refreshUserData]);

  // Update user profile
  const updateUserProfile = (updatedUser) => {
    updateUser(updatedUser);
  };

  // Log authentication state changes
  useEffect(() => {
    const token = TokenStorage.getToken();
    console.log('Auth state changed:', {
      userExists: !!user,
      userData: user ? {
        id: user.id || user._id,
        username: user.username
      } : null,
      tokenExists: !!token,
      isAuthenticated: !!user && !!token
    });
  }, [user]);

  // Listen for force_refresh_user events
  useEffect(() => {
    const handleForceRefresh = async () => {
      console.log('Force refreshing user data...');
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await api.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response && response.data) {
          console.log('User data refreshed:', response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };
    
    window.addEventListener('force_refresh_user', handleForceRefresh);
    window.addEventListener('minecraft_linked', handleForceRefresh);
    
    return () => {
      window.removeEventListener('force_refresh_user', handleForceRefresh);
      window.removeEventListener('minecraft_linked', handleForceRefresh);
    };
  }, []);

  // Auth context value - COMPUTED PROPERTIES NOT STORED STATE
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUserProfile,
    setNotification,
    refreshAuth,
    refreshUserData,
    forceDataRefresh,
    // Always compute isAuthenticated from current state, never store it
    get isAuthenticated() {
      // Use our improved TokenStorage to check for token
      const hasToken = TokenStorage.hasToken();
      
      // Both user object AND token must exist to be authenticated
      const isAuth = !!user && hasToken;
      
      // Debug info for authentication state issues
      if (hasToken && !user) {
        console.warn('Token exists but user object is null - this should be fixed during auth initialization');
      }
      
      return isAuth;
    },
    get isAdmin() {
      return user?.role === 'admin' || user?.forum_rank === 'admin';
    },
    get hasLinkedAccount() {
      // Check both possible field paths for Minecraft data
      if (!user) return false;
      
      // Check direct properties first
      const directLinked = user.linked === true;
      const directHasMcUsername = !!user.mcUsername;
      const directHasMcUUID = !!user.mcUUID;
      
      // Then check nested minecraft object
      const nestedLinked = user.minecraft?.linked === true;
      const nestedHasMcUsername = !!user.minecraft?.mcUsername;
      const nestedHasMcUUID = !!user.minecraft?.mcUUID;
      
      // Account is linked if either structure indicates it is linked
      return (directLinked || nestedLinked) || 
             ((directHasMcUsername || nestedHasMcUsername) && 
              (directHasMcUUID || nestedHasMcUUID));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </AuthContext.Provider>
  );
};