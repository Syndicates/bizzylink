import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService, clearApiCache } from '../services/api';
import api from '../services/api';
import Notification from '../components/Notification';
import { toast } from 'react-toastify';
import mockUsers from '../data/mockUsers';

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

// Create a robust token storage solution that uses multiple storage mechanisms
export const TokenStorage = {
  // Set token in all available storage mechanisms
  setToken: (token) => {
    // Try localStorage first
    try {
      localStorage.setItem('token', token);
      // Don't log token info to console in production
    } catch (err) {
      // Silent error handling for localStorage
    }
    
    // Backup to sessionStorage
    try {
      sessionStorage.setItem('token', token);
    } catch (err) {
      // Silent error handling for sessionStorage
    }
    
    // Set a cookie as last resort (30 days expiry)
    try {
      const date = new Date();
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
      document.cookie = `token=${token}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
    } catch (err) {
      // Silent error handling for cookies
    }
  },
  
  // Get token from any available storage mechanism
  getToken: () => {
    let token = null;
    
    // Try localStorage first
    try {
      token = localStorage.getItem('token');
      if (token) {
        return token;
      }
    } catch (err) {
      // Silent error handling for localStorage
    }
    
    // Try sessionStorage next
    try {
      token = sessionStorage.getItem('token');
      if (token) {
        // Also save it back to localStorage if possible
        try { localStorage.setItem('token', token); } catch (e) {}
        return token;
      }
    } catch (err) {
      // Silent error handling for sessionStorage
    }
    
    // Try cookies as last resort
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('token=')) {
          token = cookie.substring('token='.length);
          // Save it back to other storage mechanisms if possible
          try { localStorage.setItem('token', token); } catch (e) {}
          try { sessionStorage.setItem('token', token); } catch (e) {}
          return token;
        }
      }
    } catch (err) {
      // Silent error handling for cookies
    }
    
    return null;
  },
  
  // Remove token from all storage mechanisms
  removeToken: () => {
    let removed = false;
    
    // Remove from localStorage
    try {
      localStorage.removeItem('token');
      removed = true;
    } catch (err) {
      // Silent error handling for localStorage
    }
    
    // Remove from sessionStorage
    try {
      sessionStorage.removeItem('token');
      removed = true;
    } catch (err) {
      // Silent error handling for sessionStorage
    }
    
    // Remove from cookies
    try {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
      removed = true;
    } catch (err) {
      // Silent error handling for cookies
    }
    
    return removed;
  },
  
  // Check if token exists in any storage mechanism
  hasToken: () => {
    return TokenStorage.getToken() !== null;
  }
};

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

  // Function to update user with proper ID normalization
  const updateUser = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      return;
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
    
    console.log('Setting normalized user:', normalizedUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  // Improved initialization with our TokenStorage
  const initAuth = useCallback(async () => {
    console.log('Initializing authentication state...');
    setLoading(true);
    
    try {
      // Check if we have a forced logout flag
      const forcedLogout = localStorage.getItem('FORCE_LOGGED_OUT') === 'true';
      if (forcedLogout) {
        console.log('Found forced logout flag - ignoring any existing tokens');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Check if we have a token using our TokenStorage
      const token = TokenStorage.getToken();
      
      if (!token) {
        console.log('No authentication token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('Token found, fetching complete user data from server...');
      
      // Use the improved getCurrentUser function that fetches from the server
      try {
        const userData = await AuthService.getCurrentUser();
        if (userData) {
          console.log('Successfully loaded complete user data', userData);
          setIsAuthenticated(true);
          updateUser(userData);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (fetchErr) {
        console.error('Error fetching complete user data:', fetchErr);
        
        // If we get a 401 error, the token is invalid
        if (fetchErr.response && fetchErr.response.status === 401) {
          console.log('Token is invalid - removing and logging out');
          TokenStorage.removeToken();
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      // Fallback: Try to extract user data from the JWT token directly
      try {
        // Parse the token payload (JWT format: header.payload.signature)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        
        if (payload && payload.user) {
          console.log('Using token payload user data as fallback');
          // Set authenticated state with token-extracted user data
          setIsAuthenticated(true);
          updateUser(payload.user);
          setError(null);
        }
      } catch (tokenErr) {
        console.error('Error extracting user data from token:', tokenErr);
        // Unable to authenticate user properly
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error('Authentication initialization error:', err);
      
      // Handle specific API errors
      if (err.response) {
        console.log('API response error:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          console.log('Token is invalid or expired, clearing authentication state');
          // Clear token if unauthorized
          TokenStorage.removeToken();
        }
      } else if (err.request) {
        console.log('API request error (no response):', err.request);
      } else {
        console.log('Authentication setup error:', err.message);
      }
      
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message || 'Authentication failed');
    } finally {
      console.log('Authentication initialization completed');
      setLoading(false);
    }
  }, []);
  
  // Run once when the component mounts
  useEffect(() => {
    debug('AuthProvider initialized');
    
    // Check for token and validate it
    initAuth();
    
    // Set up periodic token validation (every minute)
    const interval = setInterval(() => {
      const hasToken = TokenStorage.hasToken();
      
      // Fix any inconsistencies between token existence and auth state
      if (hasToken && !isAuthenticated) {
        console.warn('Token exists but user not authenticated - fixing inconsistency');
        setIsAuthenticated(true);
        initAuth();
      } else if (!hasToken && isAuthenticated) {
        console.warn('User authenticated but no token exists - fixing inconsistency');
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [initAuth]);
  
  // This effect ensures auth state is always in sync with token existence
  useEffect(() => {
    const checkAuthConsistency = () => {
      // Skip if we're actively logging out
      if (window.__LOGGING_OUT) {
        console.log('Skipping auth check during logout process');
        return;
      }
      
      const hasToken = TokenStorage.hasToken();
      
      if (hasToken !== isAuthenticated) {
        console.warn(`Auth state (${isAuthenticated}) doesn't match token existence (${hasToken}) - fixing`);
        setIsAuthenticated(hasToken);
        if (!hasToken) {
          setUser(null);
        }
      }
    };
    
    // Check immediately
    checkAuthConsistency();
    
    // And check periodically
    const interval = setInterval(checkAuthConsistency, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
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