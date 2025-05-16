import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Authentication Debugger Component
 * This component provides real-time debugging information for the authentication state.
 * It can be included in the development build and toggled with a key combination (CTRL+SHIFT+D)
 */
const AuthDebugger = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated, user, TokenStorage } = useAuth();
  const [tokenInfo, setTokenInfo] = useState({ exists: false, content: null });
  const [storageStatus, setStorageStatus] = useState({
    localStorage: { available: false, token: null },
    sessionStorage: { available: false, token: null },
    cookies: { available: false, token: null }
  });

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update token info when auth state changes and debugger is visible
  useEffect(() => {
    if (!visible) return;
    
    // Check token in different storages
    const checkStorage = () => {
      try {
        const localToken = localStorage.getItem('token');
        const sessionToken = sessionStorage.getItem('token');
        
        // Simple function to check cookie existence
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return null;
        };
        
        const cookieToken = getCookie('token');
        
        setStorageStatus({
          localStorage: { 
            available: true, 
            token: localToken ? localToken.substring(0, 10) + '...' : null 
          },
          sessionStorage: { 
            available: true, 
            token: sessionToken ? sessionToken.substring(0, 10) + '...' : null 
          },
          cookies: { 
            available: true, 
            token: cookieToken ? cookieToken.substring(0, 10) + '...' : null 
          }
        });

        // Get token from TokenStorage if available
        if (TokenStorage) {
          const token = TokenStorage.getToken();
          if (token) {
            try {
              // Decode JWT to show expiration and payload
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                setTokenInfo({
                  exists: true,
                  content: {
                    exp: new Date(payload.exp * 1000).toLocaleString(),
                    userId: payload.user?.id || 'Not found',
                    iat: new Date(payload.iat * 1000).toLocaleString()
                  }
                });
              } else {
                setTokenInfo({ exists: true, content: 'Invalid JWT format' });
              }
            } catch (e) {
              setTokenInfo({ exists: true, content: 'Error decoding token' });
            }
          } else {
            setTokenInfo({ exists: false, content: null });
          }
        }
      } catch (error) {
        console.error('Error accessing storage:', error);
        setStorageStatus({
          localStorage: { available: false, token: null },
          sessionStorage: { available: false, token: null },
          cookies: { available: false, token: null }
        });
      }
    };

    checkStorage();
    // Check every 5 seconds while visible
    const interval = setInterval(checkStorage, 5000);
    return () => clearInterval(interval);
  }, [visible, isAuthenticated, user, TokenStorage]);

  if (!visible) {
    // Only show a small indicator in the corner when not fully visible
    return (
      <div 
        className="fixed bottom-1 right-1 bg-gray-800 text-white text-xs p-1 rounded-full opacity-50 hover:opacity-100 cursor-pointer z-50"
        onClick={() => setVisible(true)}
        title="Auth Debugger (Ctrl+Shift+D)"
      >
        🔐
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-0 right-0 z-50 bg-gray-800 text-white p-3 rounded-tl-lg shadow-lg max-w-md" 
      style={{ opacity: 0.9, fontSize: '12px' }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🔐 Auth Debugger</h3>
        <div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="px-2 py-1 bg-gray-700 rounded mr-1 hover:bg-gray-600"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button 
            onClick={() => setVisible(false)} 
            className="px-2 py-1 bg-red-700 rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-gray-700 p-2 rounded">
          <div>isAuthenticated: <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
            {isAuthenticated ? "true" : "false"}
          </span></div>
          <div>User: {user ? `${user.username} (${user._id?.substring(0, 8)}...)` : "null"}</div>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <div>Token exists: <span className={tokenInfo.exists ? "text-green-400" : "text-red-400"}>
            {tokenInfo.exists ? "yes" : "no"}
          </span></div>
          {expanded && tokenInfo.exists && tokenInfo.content && (
            <div className="mt-1 text-xs">
              <div>Expires: {tokenInfo.content.exp}</div>
              <div>User ID: {tokenInfo.content.userId}</div>
              <div>Issued: {tokenInfo.content.iat}</div>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <>
          <h4 className="font-bold mt-2 mb-1">Storage Status:</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-700 p-2 rounded">
              <div className="font-semibold">localStorage</div>
              <div className={storageStatus.localStorage.available ? "text-green-400" : "text-red-400"}>
                {storageStatus.localStorage.available ? "Available" : "Unavailable"}
              </div>
              {storageStatus.localStorage.token && (
                <div className="text-xs mt-1">Token: {storageStatus.localStorage.token}</div>
              )}
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <div className="font-semibold">sessionStorage</div>
              <div className={storageStatus.sessionStorage.available ? "text-green-400" : "text-red-400"}>
                {storageStatus.sessionStorage.available ? "Available" : "Unavailable"}
              </div>
              {storageStatus.sessionStorage.token && (
                <div className="text-xs mt-1">Token: {storageStatus.sessionStorage.token}</div>
              )}
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <div className="font-semibold">cookies</div>
              <div className={storageStatus.cookies.available ? "text-green-400" : "text-red-400"}>
                {storageStatus.cookies.available ? "Available" : "Unavailable"}
              </div>
              {storageStatus.cookies.token && (
                <div className="text-xs mt-1">Token: {storageStatus.cookies.token}</div>
              )}
            </div>
          </div>

          <div className="text-xs mt-2 italic">
            Pro tip: You can toggle this debugger with Ctrl+Shift+D
          </div>
        </>
      )}
    </div>
  );
};

export default AuthDebugger; 