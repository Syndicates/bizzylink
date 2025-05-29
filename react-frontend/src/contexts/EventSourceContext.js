/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file EventSourceContext.js
 * @description Server-Sent Events (SSE) context provider for real-time updates with enhanced performance and error handling
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import TokenStorage from '../utils/tokenStorage';
import { createLogger, trackFunctionCall, trackRender } from '../utils/debugLogger';

// Create logger for this module
const logger = createLogger('EventSource');

// Create context
const EventSourceContext = createContext();

// Custom hook to use the EventSource context
export const useEventSource = () => {
  const context = useContext(EventSourceContext);
  if (!context) {
    throw new Error('useEventSource must be used within an EventSourceProvider');
  }
  return context;
};

// Debug flag - disabled in production to reduce console logs
const DEBUG = process.env.NODE_ENV === 'development' && false;

// Configuration constants
const RECONNECT_MAX_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second
const RECONNECT_MAX_DELAY = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const EVENT_BATCH_DELAY = 50; // 50ms for batching rapid events

/**
 * Simple event emitter for internal use
 * Provides better performance and memory management than window events
 */
class EventEmitter {
  constructor() {
    this.events = new Map();
    this.eventQueue = [];
    this.batchTimeout = null;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.events.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.events.delete(event);
  }
      }
    };
  }

  /**
   * Emit an event with optional batching
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {boolean} immediate - Skip batching
   */
  emit(event, data, immediate = false) {
    if (immediate) {
      this._emitNow(event, data);
    } else {
      // Add to queue for batching
      this.eventQueue.push({ event, data });
      
      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Set new timeout for batch processing
      this.batchTimeout = setTimeout(() => {
        this._processBatch();
      }, EVENT_BATCH_DELAY);
    }
  }

  /**
   * Process batched events
   * @private
   */
  _processBatch() {
    const queue = [...this.eventQueue];
    this.eventQueue = [];
    this.batchTimeout = null;

    // Group events by type for efficient processing
    const groupedEvents = queue.reduce((acc, { event, data }) => {
      if (!acc[event]) {
        acc[event] = [];
      }
      acc[event].push(data);
      return acc;
    }, {});

    // Emit grouped events
    Object.entries(groupedEvents).forEach(([event, dataArray]) => {
      const handlers = this.events.get(event);
      if (handlers && handlers.size > 0) {
        handlers.forEach(handler => {
        try {
            // If multiple events of same type, pass array
            handler(dataArray.length === 1 ? dataArray[0] : { batch: true, data: dataArray });
          } catch (error) {
            console.error(`[EventEmitter] Error in handler for event "${event}":`, error);
          }
        });
      }
    });
  }

  /**
   * Emit event immediately
   * @private
   */
  _emitNow(event, data) {
    const handlers = this.events.get(event);
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventEmitter] Error in handler for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Clear all event listeners
   */
  clear() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.eventQueue = [];
    this.events.clear();
  }
}

// Create a singleton event emitter instance
const sseEventEmitter = new EventEmitter();

/**
 * EventSourceProvider component
 * Manages SSE connection lifecycle and provides event subscription API
 */
export const EventSourceProvider = ({ children }) => {
  const { user } = useAuth();
  const [eventSource, setEventSource] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStats, setConnectionStats] = useState({
    connectedAt: null,
    reconnectAttempts: 0,
    eventsReceived: 0,
    lastHeartbeat: null
  });
  
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  const eventSourceRef = useRef(null);
  
  /**
   * Connect to SSE endpoint
   * @param {boolean} isReconnect - Whether this is a reconnection attempt
   */
  const connect = useCallback((isReconnect = false) => {
    if (!user || !user.id) {
      DEBUG && console.log('[SSE] No user, skipping connection');
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      }

    try {
      // Build connection URL with authentication
      const token = TokenStorage.getToken();
      let url = `/api/events?userId=${user.id}`;
      if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }

      DEBUG && console.log('[SSE] Connecting to:', url);
      const es = new window.EventSource(url);
      eventSourceRef.current = es;
      setEventSource(es);

      // Connection opened successfully
      es.onopen = () => {
        console.log('[SSE] Connection opened');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Update connection stats
        setConnectionStats(prev => ({
          ...prev,
          connectedAt: new Date(),
          reconnectAttempts: reconnectAttempts.current,
          lastHeartbeat: new Date()
        }));

        // Start heartbeat monitoring
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
        heartbeatInterval.current = setInterval(() => {
          setConnectionStats(prev => ({
            ...prev,
            lastHeartbeat: new Date()
          }));
        }, HEARTBEAT_INTERVAL);
      };

      // Handle incoming messages
      es.onmessage = (event) => {
        DEBUG && console.log('[SSE] Raw event:', event);
        
        try {
          const parsed = JSON.parse(event.data);
          DEBUG && console.log('[SSE] Parsed event data:', parsed);
          
          // Update stats
          setConnectionStats(prev => ({
            ...prev,
            eventsReceived: prev.eventsReceived + 1,
            lastHeartbeat: new Date()
          }));
          
          // Handle heartbeat/ping events
          if (parsed.type === 'ping' || parsed.type === 'heartbeat') {
            DEBUG && console.log('[SSE] Heartbeat received');
            return;
          }
          
          // Store last event for debugging
          setLastEvent(event);
          
          // Emit via internal event emitter (primary)
          if (parsed.type) {
            sseEventEmitter.emit(parsed.type, parsed);
            
            // Also emit via window for backward compatibility
            try {
              window.dispatchEvent(new CustomEvent(parsed.type, { detail: parsed }));
            } catch (e) {
              console.warn('[SSE] Could not dispatch window event:', e);
            }
          }
        } catch (e) {
          console.warn('[SSE] Could not parse event data:', event.data, e);
        }
      };

      // Handle connection errors
      es.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        setError(err);
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        
        // Close the connection
        es.close();
        eventSourceRef.current = null;
        
        // Attempt reconnection with exponential backoff
        const attempt = reconnectAttempts.current + 1;
        reconnectAttempts.current = attempt;
        
        if (attempt <= RECONNECT_MAX_ATTEMPTS) {
          const delay = Math.min(
            RECONNECT_BASE_DELAY * Math.pow(2, attempt - 1),
            RECONNECT_MAX_DELAY
          );
          console.log(`[SSE] Attempting reconnect #${attempt} in ${delay / 1000}s`);
          
          reconnectTimeout.current = setTimeout(() => {
            connect(true);
          }, delay);
        } else {
          const errorMsg = 'Unable to reconnect to real-time server. Please refresh the page.';
          console.error(`[SSE] ${errorMsg}`);
          setError(new Error(errorMsg));
        }
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setError(error);
      setIsConnected(false);
    }
  }, [user]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    DEBUG && console.log('[SSE] Disconnecting');
    
    // Clear reconnect timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    // Clear heartbeat interval
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    
    // Close EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setEventSource(null);
    setIsConnected(false);
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  /**
   * Enhanced addEventListener with internal emitter support
   * Maintains backward compatibility while adding performance benefits
   */
  const addEventListener = useCallback((event, callback) => {
    if (!event || !callback) {
      console.warn('[SSE] Invalid addEventListener call:', { event, callback });
      return () => {};
    }

    // Subscribe to internal emitter (primary)
    const unsubscribeInternal = sseEventEmitter.on(event, callback);
    
    // Also subscribe to window events for backward compatibility
    const windowHandler = (e) => {
      try {
        callback(e.detail || e);
      } catch (error) {
        console.error(`[SSE] Error in window event handler for "${event}":`, error);
      }
    };
    window.addEventListener(event, windowHandler);
    
    // Return cleanup function that removes both listeners
    return () => {
      unsubscribeInternal();
      window.removeEventListener(event, windowHandler);
    };
  }, []);

  /**
   * Emit event manually (for testing/debugging)
   */
  const emitEvent = useCallback((event, data, immediate = false) => {
    if (!event) {
      console.warn('[SSE] Cannot emit event without type');
      return;
    }
    
    DEBUG && console.log('[SSE] Manual emit:', event, data);
    sseEventEmitter.emit(event, data, immediate);
    
    // Also emit via window for backward compatibility
    try {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
        } catch (e) {
      console.warn('[SSE] Could not dispatch window event:', e);
        }
  }, []);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (!user || !user.id) {
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Connection state
    eventSource,
    isConnected,
    lastEvent,
    error,
    connectionStats,
    
    // Methods
    addEventListener,
    emitEvent,
    connect: () => connect(false),
    disconnect,
    
    // For debugging
    getEventEmitter: () => DEBUG ? sseEventEmitter : null
  }), [
    eventSource,
    isConnected,
    lastEvent,
    error,
    connectionStats,
    addEventListener,
    emitEvent,
    connect,
    disconnect
  ]);
  
  return (
    <EventSourceContext.Provider value={value}>
      {children}
    </EventSourceContext.Provider>
  );
};

export default EventSourceContext;