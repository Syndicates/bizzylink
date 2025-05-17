import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/Notification';

// Create auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const navigate = useNavigate();

  // Function to handle auth errors and logout
  const handleAuthError = useCallback((error, message) => {
    console.error('Auth error:', error);
    
    // Show notification to user
    setNotification({
      show: true,
      type: 'error',
      message: message || 'Authentication error. Please log in again.'
    });
    
    // Clear auth data
    localStorage.removeItem('token');
    setUser(null);
    
    // Redirect to login
    navigate('/login');
  }, [navigate]);

  // Validate user profile with the backend
  const validateUserSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) return false;
    
    try {
      console.log('Validating user session...');
      const response = await AuthService.getProfile();
      console.log('Profile response:', response.data);
      setUser(response.data.user);
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      
      // Handle specific error codes
      if (error.response?.status === 404 || error.response?.data?.code === 'USER_NOT_FOUND') {
        handleAuthError(error, 'User account not found. It may have been deleted.');
      } else if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        handleAuthError(error, 'Your session has expired. Please log in again.');
      } else {
        handleAuthError(error);
      }
      
      return false;
    }
  }, [handleAuthError]);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        console.log('Checking auth with token:', token ? `${token.substring(0, 10)}...` : 'no token');
        
        if (token) {
          await validateUserSession();
        } else {
          console.log('No token found, user is not logged in');
        }
      } catch (err) {
        console.error('Auth validation error:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [navigate, validateUserSession]);
  
  // Periodically validate user session (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      validateUserSession();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [user, validateUserSession]);

  // Register a new user
  const register = async (username, password, email) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.register({ username, password, email });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login for:', username);
      const response = await AuthService.login({ username, password });
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        console.log('Token stored successfully:', response.data.token);
        
        // Set the user in state
        setUser(response.data.user);
        
        // Validate that user was actually set
        console.log('User set in state:', response.data.user);
        
        // Force a delay to ensure state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.error('No token received in login response');
      }
      
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    
    try {
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      navigate('/');
    }
  };

  // Update user profile
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  // Auth context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUserProfile,
    setNotification,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    // Helper for reliably checking if a user has a properly linked account
    hasLinkedAccount: !!user && user.linked === true && !!user.mcUsername
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