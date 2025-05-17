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

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, clearApiCache } from '../services/api';
import api from '../services/api';
import Notification from '../components/Notification';
import { toast } from 'react-toastify';
// Import from the new utility instead of using a circular dependency
import TokenStorage from '../utils/tokenStorage';
import { createLogger, trackFunctionCall, trackRender } from '../utils/debugLogger';
// Remove mock users import
// import mockUsers from '../data/mockUsers';

// Create logger for this module
const logger = createLogger('AuthContext');

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  logger('useAuth hook called');
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export TokenStorage so api.js can use it directly via import
export { TokenStorage };

// Debug flag - can be disabled in production
const DEBUG = false;

// EMERGENCY FIX: Disable auto verify and other problematic features
const DISABLE_AUTO_VERIFY = true;
const DISABLE_AUTO_REFRESH = true;
const DISABLE_FREQUENT_CHECKS = true;
const MIN_REFRESH_INTERVAL = 30000; // 30 seconds minimum between any auth-related refreshes

// Tracking last update time across all auth methods to prevent excessive updates
let lastGlobalAuthUpdateTime = 0;

// Global throttling function that prevents ANY auth updates happening too frequently
const shouldThrottleGlobally = () => {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastGlobalAuthUpdateTime;
  
  if (timeSinceLastUpdate < MIN_REFRESH_INTERVAL) {
    logger(`Global throttling applied - last update was ${timeSinceLastUpdate}ms ago`);
    return true;
  }
  
  // Update timestamp
  lastGlobalAuthUpdateTime = now;
  return false;
};

// Debugging helper for state updates
function debugSetState(setter, value, name) {
  if (DEBUG) {
    console.log(`[Auth Debug] Setting state: ${name}`, typeof value === 'function' ? 'Function update' : value);
  }
  setter(value);
}

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
  logger('AuthProvider rendering');
  
  // Track component renders
  useEffect(() => {
    trackRender('AuthProvider');
  });
  
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Add throttling mechanism to prevent excessive verification calls
  const verifyStateTimeoutRef = useRef(null);
  const lastVerifyTimeRef = useRef(0);
  
  // Add throttling for refreshUserData
  const lastRefreshTimeRef = useRef(0);
  const refreshUserDataTimeoutRef = useRef(null);
  const forceRefreshTimeoutRef = useRef(null);
  const lastForceRefreshRef = useRef(0);

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
    
    logger('Setting normalized user', normalizedUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  // Function to refresh user data without full auth refresh
  // IMPORTANT: This function MUST be defined before it's used in verifyAuthState or other hooks
  const refreshUserData = useCallback(() => {
    logger('Refreshing user data');
    
    // EMERGENCY FIX: Skip refreshes if disabled
    if (DISABLE_AUTO_REFRESH) {
      logger('Auto refresh is disabled');
      return Promise.reject(new Error('Auto refresh is disabled'));
    }
    
    // Check if we have a token and user
    if (!TokenStorage.hasToken()) {
      logger('No token exists, cannot refresh user data');
      return Promise.reject(new Error('No token exists'));
    }
    
    // Apply global throttling
    if (shouldThrottleGlobally()) {
      logger('Global throttling applied to refreshUserData');
      return Promise.reject(new Error('Throttled'));
    }
    
    // Add throttling to prevent excessive refreshes
    const now = Date.now();
    const minRefreshInterval = 5000; // 5 seconds between refreshes
    
    if (now - lastRefreshTimeRef.current < minRefreshInterval) {
      logger(`Throttling refreshUserData - last refresh was ${now - lastRefreshTimeRef.current}ms ago`);
      
      // Return a cached promise to avoid creating multiple refreshes
      if (refreshUserDataTimeoutRef.current) {
        return refreshUserDataTimeoutRef.current;
      }
      
      // Create a new promise that will resolve after the throttle period
      refreshUserDataTimeoutRef.current = new Promise((resolve, reject) => {
        const waitTime = minRefreshInterval - (now - lastRefreshTimeRef.current);
        setTimeout(() => {
          // Clear the ref
          refreshUserDataTimeoutRef.current = null;
          // Update timestamp
          lastRefreshTimeRef.current = Date.now();
          // Execute the actual refresh
          AuthService.getCurrentUser()
            .then(userData => {
              const normalizedUser = updateUser(userData);
              resolve(normalizedUser);
            })
            .catch(reject);
        }, waitTime);
      });
      
      return refreshUserDataTimeoutRef.current;
    }
    
    // Update timestamp
    lastRefreshTimeRef.current = now;
    
    // Return a promise for better control flow
    return AuthService.getCurrentUser()
      .then(userData => {
        logger('Successfully refreshed user data:', userData);
        
        // Process the user data through our normalization function
        const normalizedUser = updateUser(userData);
        logger('User data normalized:', normalizedUser);
        
        return normalizedUser;
      })
      .catch(error => {
        logger('Error refreshing user data:', error);
        throw error;
      });
  }, [updateUser]);

  // Function to ensure auth state consistency with improved throttling
  const verifyAuthState = useCallback(() => {
    // EMERGENCY FIX: Skip verification if disabled
    if (DISABLE_AUTO_VERIFY || DISABLE_FREQUENT_CHECKS) {
      logger('Auto verify state is disabled');
      return;
    }
    
    // Apply global throttling
    if (shouldThrottleGlobally()) {
      logger('Global throttling applied to verifyAuthState');
      return;
    }
    
    // Add throttling mechanism to prevent rapid consecutive calls
    const now = Date.now();
    const minInterval = 5000; // 5 seconds between verifications (increased from 2 seconds)
    
    if (now - lastVerifyTimeRef.current < minInterval) {
      // Skip this verification if we've just done one recently
      logger(`Skipping verifyAuthState - last verify was ${now - lastVerifyTimeRef.current}ms ago`);
      return;
    }
    
    // Update timestamp
    lastVerifyTimeRef.current = now;
    
    // Clear any pending verification
    if (verifyStateTimeoutRef.current) {
      clearTimeout(verifyStateTimeoutRef.current);
      verifyStateTimeoutRef.current = null;
    }
    
    logger('Verifying auth state consistency');
    const token = TokenStorage.getToken();
    
    // Check if auth state matches token existence
    if (!!token !== isAuthenticated) {
      logger(`Auth state (${isAuthenticated}) doesn't match token existence (${!!token}), fixing...`);
      
      if (token) {
        // We have a token but not authenticated - fix the state
        setIsAuthenticated(true);
        
        // Try to load user data if we don't have it
        if (!user) {
          logger('Token exists but user object is null, scheduling user data fetch...');
          
          // Schedule a delayed fetch instead of immediate execution
          verifyStateTimeoutRef.current = setTimeout(() => {
            logger('Executing delayed user data fetch');
            refreshUserData().catch(err => {
              logger('Error loading user data during state verification:', err);
              
              // If we can't load the user data, the token might be invalid
              if (err.response && err.response.status === 401) {
                logger('Token is invalid, clearing authentication state');
                TokenStorage.removeToken();
                setIsAuthenticated(false);
              }
            });
          }, 2000); // 2 second delay to prevent immediate execution
        }
      } else {
        // We don't have a token but are authenticated - fix the state
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  }, [isAuthenticated, user, refreshUserData]);

  // Improved initialization with retries
  const initAuth = useCallback(async () => {
    // Skip if already initialized
    if (authInitialized) {
      return;
    }
    
    logger('Initializing authentication state...');
    setLoading(true);
    
    try {
      // Check if we have a forced logout flag
      const forcedLogout = localStorage.getItem('FORCE_LOGGED_OUT') === 'true';
      if (forcedLogout) {
        logger('Found forced logout flag - ignoring any existing tokens');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      // Check if we have a token using our TokenStorage
      const token = TokenStorage.getToken();
      
      if (!token) {
        logger('No authentication token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      // Log token found but don't fetch user data here immediately
      logger('Token found, will attempt to load user data');
      
      // Set authenticated first based on token
      setIsAuthenticated(true);
      
      // Single attempt to get user data
      try {
        const userData = await AuthService.getCurrentUser();
        
        // Update user data if available
        if (userData) {
          updateUser(userData);
        }
      } catch (err) {
        logger('Error loading user data during initialization:', err);
        
        // If unauthorized, clear authentication
        if (err.response && err.response.status === 401) {
          TokenStorage.removeToken();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      
      // Always mark as initialized
      setLoading(false);
      setAuthInitialized(true);
    } catch (err) {
      logger('Authentication initialization error:', err);
      
      // Set safe default state
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message || 'Authentication failed');
      setLoading(false);
      setAuthInitialized(true);
    }
  }, [updateUser, authInitialized]);

  // Run once when the component mounts
  useEffect(() => {
    logger('AuthProvider initialized');
    
    // Initial auth check
    initAuth();
    
    // Cleanup when unmounting
    return () => {
      logger('AuthProvider unmounting');
    };
  }, []); // Empty dependency array means this only runs once on mount

  // Separate effect to handle automatic verification ONLY when needed
  useEffect(() => {
    // Skip all checks if disabled
    if (DISABLE_AUTO_VERIFY || DISABLE_FREQUENT_CHECKS) {
      return;
    }
    
    // Only start verification checks after initialization completes
    if (!authInitialized) {
      return;
    }
    
    logger('Setting up periodic auth verification');
    
    // Use a fixed interval to check auth state
    const intervalId = setInterval(() => {
      // Don't run if throttled
      if (shouldThrottleGlobally()) {
        return;
      }
      
      // Verify auth state without causing a loop
      const token = TokenStorage.getToken();
      const hasToken = !!token;
      
      // Only attempt to fix a mismatch
      if (hasToken !== isAuthenticated) {
        logger(`Fixing auth state mismatch: token=${hasToken}, isAuthenticated=${isAuthenticated}`);
        
        if (hasToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    }, 60000); // Check once per minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, [authInitialized, isAuthenticated]);

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

  // Force a complete refresh from server and reload UI
  const forceDataRefresh = useCallback(() => {
    debug('Force refreshing all user data and reloading UI');
    
    // Add strong throttling to prevent excessive refreshes
    const now = Date.now();
    const minForceRefreshInterval = 30000; // 30 seconds between forced refreshes
    
    if (now - lastForceRefreshRef.current < minForceRefreshInterval) {
      debug(`Throttling forceDataRefresh - last refresh was ${now - lastForceRefreshRef.current}ms ago`);
      return Promise.resolve(user); // Return current user without refresh
    }
    
    // Update timestamp
    lastForceRefreshRef.current = now;
    
    // Clear any existing timeout
    if (forceRefreshTimeoutRef.current) {
      clearTimeout(forceRefreshTimeoutRef.current);
      forceRefreshTimeoutRef.current = null;
    }
    
    return refreshUserData()
      .then(userData => {
        debug('User data refreshed, reloading UI to apply all changes');
        
        // Only reload in extreme cases - this causes a full page refresh
        // Instead, set a flag that signals components to refresh their state
        try {
          localStorage.setItem('force_ui_refresh', Date.now().toString());
          window.dispatchEvent(new CustomEvent('force_ui_refresh', { detail: { timestamp: Date.now() } }));
        } catch (e) {
          debug('Error dispatching UI refresh event:', e);
        }
        
        return userData;
      })
      .catch(error => {
        debug('Error in force refresh:', error);
        throw error;
      });
  }, [refreshUserData, user]);

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
    // Compute isAuthenticated from current state and token
    isAuthenticated: !!user && TokenStorage.hasToken(),
    isAdmin: user?.role === 'admin' || user?.forum_rank === 'admin',
    hasLinkedAccount: user ? (
      // Check if user has linked Minecraft account
      (user.linked === true || user.minecraft?.linked === true) || 
      ((!!user.mcUsername || !!user.minecraft?.mcUsername) && 
       (!!user.mcUUID || !!user.minecraft?.mcUUID))
    ) : false
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