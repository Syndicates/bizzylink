/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2024          |
 * +-------------------------------------------------+
 * 
 * @file tokenStorage.js
 * @description Utility for secure token storage with multiple fallback mechanisms
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// Create a robust token storage solution that uses multiple storage mechanisms
const TokenStorage = {
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
    
    // If we're logging out, return null to prevent auto re-auth
    if (window.__LOGGING_OUT) {
      console.log('getToken called during logout - returning null');
      return null;
    }
    
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

export default TokenStorage; 