/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file EventSourceContext.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create context
const EventSourceContext = createContext();

// Custom hook for using the EventSource context
export const useEventSource = () => {
  const context = useContext(EventSourceContext);
  if (!context) {
    throw new Error('useEventSource must be used within an EventSourceProvider');
  }
  return context;
};

export const EventSourceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [eventSource, setEventSource] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [listeners, setListeners] = useState({});

  // Create or destroy event source based on authentication state
  useEffect(() => {
    // Only create EventSource if user is authenticated
    if (isAuthenticated && user) {
      console.log('[EventSource] User is authenticated, setting up SSE connection');
      
      // Get the auth token - with detailed logging for debugging
      let token;
      try {
        token = localStorage.getItem('token');
        console.log('[EventSource] Token found:', token ? 'Token available' : 'No token in localStorage');
      } catch (err) {
        console.error('[EventSource] Error getting token:', err);
        return; // Don't continue if we can't get the token
      }
      
      if (!token) {
        console.error('[EventSource] No token available for SSE connection');
        return;
      }
      
      // Ensure token is encoded properly for URL
      const encodedToken = encodeURIComponent(token);
      console.log('[EventSource] Creating EventSource with token parameter');
      
      // Create EventSource with token as query parameter
      // Use absolute URL with port to ensure correct endpoint
      const es = new EventSource(`http://localhost:8080/api/events?token=${encodedToken}`);
      
      es.onopen = () => {
        console.log('[EventSource] Connection opened');
        setConnected(true);
      };
      
      es.onerror = (error) => {
        console.error('[EventSource] Error:', error);
        setConnected(false);
      };
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[EventSource] Message received:', data);
          
          // Store the event in our history
          setLastEvent(data);
          setEvents(prevEvents => [...prevEvents.slice(-9), data]);
          
          // Trigger any registered listeners for this event type
          if (data.type && listeners[data.type]) {
            listeners[data.type].forEach(callback => {
              try {
                callback(data);
              } catch (err) {
                console.error(`[EventSource] Error in ${data.type} listener:`, err);
              }
            });
          }
          
          // Also trigger any global listeners (listening to all events)
          if (listeners['*']) {
            listeners['*'].forEach(callback => {
              try {
                callback(data);
              } catch (err) {
                console.error('[EventSource] Error in global listener:', err);
              }
            });
          }
        } catch (err) {
          console.error('[EventSource] Error parsing event data:', err);
        }
      };
      
      setEventSource(es);
      
      // Cleanup function
      return () => {
        console.log('[EventSource] Cleaning up SSE connection');
        es.close();
        setEventSource(null);
        setConnected(false);
      };
    } else if (eventSource) {
      console.log('[EventSource] User logged out, closing SSE connection');
      eventSource.close();
      setEventSource(null);
      setConnected(false);
    }
  }, [isAuthenticated, user]);
  
  // Reset state when user changes
  useEffect(() => {
    return () => {
      setEvents([]);
      setLastEvent(null);
    };
  }, [user]);
  
  // Register event listener
  const addEventListener = (eventType, callback) => {
    setListeners(prevListeners => {
      const newListeners = { ...prevListeners };
      if (!newListeners[eventType]) {
        newListeners[eventType] = [];
      }
      newListeners[eventType].push(callback);
      return newListeners;
    });
    
    // Return function to remove the listener
    return () => {
      setListeners(prevListeners => {
        const newListeners = { ...prevListeners };
        if (newListeners[eventType]) {
          newListeners[eventType] = newListeners[eventType].filter(cb => cb !== callback);
        }
        return newListeners;
      });
    };
  };
  
  // Remove all listeners for a specific event type
  const removeAllEventListeners = (eventType) => {
    setListeners(prevListeners => {
      const newListeners = { ...prevListeners };
      if (eventType) {
        delete newListeners[eventType];
      } else {
        // If no event type specified, remove all listeners
        return {};
      }
      return newListeners;
    });
  };
  
  // Create memoized context value
  const value = useMemo(() => ({
    connected,
    lastEvent,
    events,
    addEventListener,
    removeAllEventListeners
  }), [connected, lastEvent, events]);
  
  return (
    <EventSourceContext.Provider value={value}>
      {children}
    </EventSourceContext.Provider>
  );
};

export default EventSourceContext;