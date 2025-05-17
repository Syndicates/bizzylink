/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file AuthDebugger.js
 * @description Debug component for displaying authentication state
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TokenStorage from '../utils/tokenStorage';
import { createLogger } from '../utils/debugLogger';

// Create a logger for this component
const logger = createLogger('AuthDebugger');

const AuthDebugger = () => {
  const auth = useAuth();
  const { user, isAuthenticated } = auth || { user: null, isAuthenticated: false };
  const [expanded, setExpanded] = useState(false);
  const [tokenExists, setTokenExists] = useState(false);
  
  // Use a ref to track component mount state
  const isMountedRef = useRef(true);
  
  // Check token existence with clean error handling
  useEffect(() => {
    const checkToken = () => {
      try {
        const hasToken = TokenStorage.hasToken();
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setTokenExists(hasToken);
        }
      } catch (err) {
        logger('Error checking token existence', err);
        // Don't update state on error
      }
    };
    
    // Check immediately
    checkToken();
    
    // Set up interval to check every 5 seconds
    const interval = setInterval(checkToken, 5000);
    
    // Clean up on unmount
    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, []);
  
  // Safely close the debugger
  const handleClose = () => {
    const container = document.getElementById('auth-debugger-container');
    if (container) {
      try {
        container.style.display = 'none';
      } catch (err) {
        logger('Error hiding debugger container', err);
      }
    }
  };
  
  return (
    <div id="auth-debugger-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#1e2124',
      color: 'white',
      padding: '10px',
      borderRadius: '0 0 5px 0',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      border: '1px solid #444',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span role="img" aria-label="Auth">🔐</span>
          <span style={{ fontWeight: 'bold' }}>Auth Debugger</span>
        </div>
        <div>
          <button 
            onClick={() => setExpanded(!expanded)}
            style={{
              backgroundColor: '#2c2f33',
              color: 'white',
              border: '1px solid #444',
              borderRadius: '3px',
              padding: '2px 8px',
              marginRight: '5px',
              cursor: 'pointer'
            }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button 
            onClick={handleClose}
            style={{
              backgroundColor: '#c6262e',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '5px'
      }}>
        <div style={{ 
          backgroundColor: '#2c2f33',
          padding: '5px',
          borderRadius: '3px',
          border: '1px solid #444'
        }}>
          <div>isAuthenticated: <span style={{ color: isAuthenticated ? '#43b581' : '#f04747' }}>{String(isAuthenticated)}</span></div>
          <div>User: <span style={{ color: user ? '#43b581' : '#f04747' }}>{user ? (user.username || user.id || JSON.stringify(user).substring(0, 20) + '...') : '(none)'}</span></div>
        </div>
        
        <div style={{ 
          backgroundColor: '#2c2f33',
          padding: '5px',
          borderRadius: '3px',
          border: '1px solid #444'
        }}>
          <div>Token exists: <span style={{ color: tokenExists ? '#43b581' : '#f04747' }}>{tokenExists ? 'yes' : 'no'}</span></div>
        </div>
      </div>
      
      {expanded && user && (
        <div style={{ 
          marginTop: '10px',
          backgroundColor: '#2c2f33',
          padding: '5px',
          borderRadius: '3px',
          border: '1px solid #444',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger; 