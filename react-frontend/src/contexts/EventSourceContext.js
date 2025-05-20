/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file EventSourceContext.js
 * @description Server-Sent Events (SSE) context provider for real-time updates
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
const DEBUG = false;

// Re-enable EventSource (SSE) fallback for real-time updates
const DISABLE_EVENT_SOURCE = false;

// Create a mock EventSource that can be used as a safe no-op implementation
class MockEventSource {
  constructor() {
    this.listeners = {};
    this.readyState = 0; // Connecting state by default
  }
  
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  close() {
    this.readyState = 2; // Closed state
    if (this.listeners.close) {
      this.listeners.close.forEach(callback => {
        try {
          callback();
        } catch (err) {
          console.error('Error in EventSource mock close listener:', err);
        }
      });
    }
  }
}

// EMERGENCY FIX LEVEL 2: Completely replace EventSourceProvider with a stub
export const EventSourceProvider = ({ children }) => {
  const { user } = useAuth();
  const [eventSource, setEventSource] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  // NOTE: cleanup is defined inside the effect to avoid dependency loops.
  // Only re-run this effect when the user changes, not on every render or eventSource change.
  useEffect(() => {
    if (!user || !user.id) return;

    let es;
    let stopped = false;

    const cleanup = () => {
      if (es) es.close();
      setIsConnected(false);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    const connect = () => {
      if (stopped) return;
      // Get the JWT token from TokenStorage
      const token = TokenStorage.getToken();
      let url = `/api/events?userId=${user.id}`;
      if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }
      es = new window.EventSource(url);
      setEventSource(es);

      es.onopen = () => {
        console.log('[SSE] Connection opened');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0; // Reset attempts on success
      };
      es.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        setError(err);
        setIsConnected(false);
        es.close();
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const attempt = reconnectAttempts.current + 1;
        reconnectAttempts.current = attempt;
        if (attempt <= 5) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          console.log(`[SSE] Attempting reconnect #${attempt} in ${delay / 1000}s`);
          reconnectTimeout.current = setTimeout(connect, delay);
        } else {
          setError(new Error('Unable to reconnect to real-time server. Please refresh the page.'));
        }
      };
      es.onmessage = (event) => {
        console.log('[SSE] Raw event:', event);
        try {
          const parsed = JSON.parse(event.data);
          console.log('[SSE] Parsed event data:', parsed);
          // Dispatch a custom event for listeners
          if (parsed.type) {
            window.dispatchEvent(new CustomEvent(parsed.type, { detail: parsed }));
          }
        } catch (e) {
          console.warn('[SSE] Could not parse event data:', event.data);
        }
        setLastEvent(event);
      };
    };

    connect();

    return () => {
      stopped = true;
      cleanup();
    };
  }, [user]);

  const addEventListener = useCallback((event, callback) => {
    const handler = (e) => callback(e.detail);
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, []);

  const value = useMemo(() => ({
    eventSource,
    isConnected,
    lastEvent,
    error,
    addEventListener,
  }), [eventSource, isConnected, lastEvent, error, addEventListener]);

  return (
    <EventSourceContext.Provider value={value}>
      {children}
    </EventSourceContext.Provider>
  );
};

export default EventSourceContext;