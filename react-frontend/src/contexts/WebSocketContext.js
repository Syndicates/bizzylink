import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create context
const WebSocketContext = createContext();

// Custom hook for using the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  
  // Connect to WebSocket server when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[WebSocket] User is authenticated, connecting to WebSocket server');
      
      // Get authentication token
      let token;
      try {
        token = localStorage.getItem('token');
      } catch (err) {
        console.error('[WebSocket] Error getting token:', err);
        return;
      }
      
      if (!token) {
        console.error('[WebSocket] No token available for WebSocket connection');
        return;
      }
      
      // Create Socket.io connection
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:8090', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000
      });
      
      // Set up event handlers
      socketInstance.on('connect', () => {
        console.log('[WebSocket] Connected to server with socket ID:', socketInstance.id);
        
        // Authenticate with server
        socketInstance.emit('authenticate', token);
      });
      
      socketInstance.on('authenticated', (data) => {
        console.log('[WebSocket] Authentication successful:', data);
        setIsConnected(true);
        setConnectionId(data.connectionId);
      });
      
      socketInstance.on('notification', (data) => {
        console.log('[WebSocket] Notification received:', data);
        setLastMessage(data);
      });
      
      socketInstance.on('stats_update', (data) => {
        console.log('[WebSocket] Stats update received:', data);
        setLastMessage(data);
      });
      
      socketInstance.on('minecraft_linked', (data) => {
        console.log('[WebSocket] Minecraft linked event received:', data);
        setLastMessage({
          type: 'minecraft_linked',
          data: data,
          timestamp: new Date().toISOString()
        });
        
        // Show a notification to the user
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Minecraft Account Linked', {
            body: `Your Minecraft account ${data.mcUsername || data.username} has been successfully linked!`,
            icon: '/favicon.ico'
          });
        }
        
        // Log the event data before dispatching
        console.log('[WebSocket] Dispatching minecraft_linked event with data:', data);
        
        // Refresh user data to show the linked account
        window.dispatchEvent(new CustomEvent('minecraft_linked', { 
          detail: {
            mcUsername: data.mcUsername || data.username,
            mcUUID: data.mcUUID || data.uuid,
            linkedAt: new Date().toISOString()
          } 
        }));
        
        // Force a refresh of the user data
        console.log('[WebSocket] Forcing user data refresh');
        
        // Add a small delay to ensure the database has been updated
        setTimeout(() => {
          console.log('[WebSocket] Dispatching force_refresh_user event');
          window.dispatchEvent(new CustomEvent('force_refresh_user'));
          
          // Reload the page after a short delay to ensure everything is updated
          setTimeout(() => {
            console.log('[WebSocket] Reloading page to ensure all data is fresh');
            window.location.reload();
          }, 2000);
        }, 1000);
      });
      
      socketInstance.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });
      
      socketInstance.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        setIsConnected(false);
      });
      
      // Store socket instance
      setSocket(socketInstance);
      
      // Cleanup on unmount
      return () => {
        console.log('[WebSocket] Cleaning up connection');
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionId(null);
      };
    }
  }, [isAuthenticated, user]);
  
  // Function to request stats update
  const requestStatsUpdate = useCallback(() => {
    if (socket && isConnected) {
      console.log('[WebSocket] Requesting stats update');
      socket.emit('request_stats');
    } else {
      console.warn('[WebSocket] Cannot request stats update - no active connection');
    }
  }, [socket, isConnected]);
  
  // Function to send custom event
  const sendEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      console.log(`[WebSocket] Sending event '${eventName}':`, data);
      socket.emit(eventName, data);
    } else {
      console.warn(`[WebSocket] Cannot send event '${eventName}' - no active connection`);
    }
  }, [socket, isConnected]);
  
  // Function to add event listener
  const addEventListener = useCallback((eventName, callback) => {
    if (socket) {
      console.log(`[WebSocket] Adding listener for event '${eventName}'`);
      socket.on(eventName, callback);
      
      // Return remove function
      return () => {
        socket.off(eventName, callback);
      };
    }
    
    // Return no-op if no socket
    return () => {};
  }, [socket]);
  
  // Memoize context value
  const value = useMemo(() => ({
    socket,
    isConnected,
    connectionId,
    lastMessage,
    requestStatsUpdate,
    sendEvent,
    addEventListener
  }), [socket, isConnected, connectionId, lastMessage, requestStatsUpdate, sendEvent, addEventListener]);
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext; 