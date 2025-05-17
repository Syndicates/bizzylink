/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file WebSocketContext.js
 * @description Real-time WebSocket communication provider for event-driven updates
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import TokenStorage from '../utils/tokenStorage';

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

// Debug flag - can be disabled in production
const DEBUG = true;

// Debug logger that can be easily toggled
const debug = (message, data) => {
  if (DEBUG) {
    if (data) {
      console.log(`[WebSocket] ${message}`, data);
    } else {
      console.log(`[WebSocket] ${message}`);
    }
  }
};

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const socketRef = useRef(null);
  const maxRetries = 5;
  
  // Cleanup function to properly disconnect socket
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      debug('Cleaning up WebSocket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setConnectionId(null);
    }
  }, []);
  
  // Connect to WebSocket server when user is authenticated
  useEffect(() => {
    // Only attempt connection if user is authenticated and has data
    if (!isAuthenticated || !user || !user.id) {
      debug('User not authenticated or missing data, not connecting to WebSocket');
      cleanupSocket();
      return;
    }
    
    debug('User is authenticated, preparing WebSocket connection');
    
    // Check for an existing socket and clean it up if needed
    if (socketRef.current) {
      debug('Cleaning up existing socket before creating new one');
      cleanupSocket();
    }
    
    // Reset connection attempts for a new connection sequence
    setConnectionAttempts(0);
    
    // Attempt to establish connection
    const connectWebSocket = () => {
      // Check again if user is authenticated
      if (!isAuthenticated || !user) {
        debug('User no longer authenticated, aborting WebSocket connection');
        return;
      }
      
      // Get authentication token
      const token = TokenStorage.getToken();
      
      if (!token) {
        debug('No token available for WebSocket connection');
        return;
      }
      
      // Track connection attempts
      setConnectionAttempts(prev => prev + 1);
      
      // Create Socket.io connection
      debug('Creating new WebSocket connection, attempt #' + (connectionAttempts + 1));
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:8090', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        auth: { token } // Send token with initial connection for auth
      });
      
      // Store socket reference
      socketRef.current = socketInstance;
      setSocket(socketInstance);
      
      // Set up event handlers
      socketInstance.on('connect', () => {
        debug('Connected to server with socket ID:', socketInstance.id);
        
        // Authenticate with server
        socketInstance.emit('authenticate', token);
      });
      
      socketInstance.on('authenticated', (data) => {
        debug('Authentication successful:', data);
        setIsConnected(true);
        setConnectionId(data.connectionId);
        // Reset connection attempts on successful connection
        setConnectionAttempts(0);
      });
      
      socketInstance.on('notification', (data) => {
        debug('Notification received:', data);
        setLastMessage(data);
      });
      
      socketInstance.on('stats_update', (data) => {
        debug('Stats update received:', data);
        setLastMessage(data);
      });
      
      socketInstance.on('minecraft_linked', (data) => {
        debug('Minecraft linked event received:', data);
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
        debug('Dispatching minecraft_linked event with data:', data);
        
        // Refresh user data to show the linked account
        window.dispatchEvent(new CustomEvent('minecraft_linked', { 
          detail: {
            mcUsername: data.mcUsername || data.username,
            mcUUID: data.mcUUID || data.uuid,
            linkedAt: new Date().toISOString()
          } 
        }));
        
        // Force a refresh of the user data
        debug('Forcing user data refresh');
        
        // Add a small delay to ensure the database has been updated
        setTimeout(() => {
          debug('Dispatching force_refresh_user event');
          window.dispatchEvent(new CustomEvent('force_refresh_user'));
          
          // Reload the page after a short delay to ensure everything is updated
          setTimeout(() => {
            debug('Reloading page to ensure all data is fresh');
            window.location.reload();
          }, 2000);
        }, 1000);
      });
      
      socketInstance.on('connect_error', (error) => {
        debug('Connection error:', error);
        
        // Retry connection if under max attempts and still authenticated
        if (connectionAttempts < maxRetries && isAuthenticated) {
          debug(`Connection attempt ${connectionAttempts} failed, retrying in ${connectionAttempts * 2}s...`);
          setTimeout(connectWebSocket, connectionAttempts * 2000);
        } else if (connectionAttempts >= maxRetries) {
          debug('Max connection attempts reached, giving up');
        }
      });
      
      socketInstance.on('error', (error) => {
        debug('Socket error:', error);
      });
      
      socketInstance.on('disconnect', (reason) => {
        debug('Disconnected:', reason);
        setIsConnected(false);
        
        // If disconnected for a reason that warrants a reconnect and still authenticated
        if (
          (reason === 'io server disconnect' || reason === 'transport close') && 
          isAuthenticated && 
          connectionAttempts < maxRetries
        ) {
          debug('Disconnected unexpectedly, attempting to reconnect...');
          setTimeout(connectWebSocket, 2000);
        }
      });
    };
    
    // Start connection process
    connectWebSocket();
    
    // Cleanup on unmount
    return cleanupSocket;
  }, [isAuthenticated, user, cleanupSocket, connectionAttempts]);
  
  // Function to request stats update
  const requestStatsUpdate = useCallback(() => {
    if (socket && isConnected) {
      debug('Requesting stats update');
      socket.emit('request_stats');
    } else {
      debug('Cannot request stats update - no active connection');
    }
  }, [socket, isConnected]);
  
  // Function to send custom event
  const sendEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      debug(`Sending event '${eventName}':`, data);
      socket.emit(eventName, data);
    } else {
      debug(`Cannot send event '${eventName}' - no active connection`);
    }
  }, [socket, isConnected]);
  
  // Function to add event listener
  const addEventListener = useCallback((eventName, callback) => {
    if (socket) {
      debug(`Adding listener for event '${eventName}'`);
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