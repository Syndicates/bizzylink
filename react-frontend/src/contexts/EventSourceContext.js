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

// EMERGENCY FIX: Completely disable EventSource connections until fixed
const DISABLE_EVENT_SOURCE = true;

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
  logger('EventSourceProvider rendered', { disabled: DISABLE_EVENT_SOURCE });
  
  // Track each render
  useEffect(() => {
    trackRender('EventSourceProvider');
  });
  
  // Create a mock event source object
  const mockEventSourceRef = useRef(new MockEventSource());
  
  // Create a proper implementation that handles events consistently
  const value = useMemo(() => ({
    eventSource: mockEventSourceRef.current,
    isConnected: false,
    lastEvent: null,
    error: null,
    reconnect: () => {
      logger('Reconnect called but EventSource is completely disabled');
    },
    addEventListener: (event, callback) => {
      logger(`Adding event listener for ${event} (mock implementation)`);
      mockEventSourceRef.current.addEventListener(event, callback);
      // Return a cleanup function
      return () => mockEventSourceRef.current.removeEventListener(event, callback);
    }
  }), []);
  
  return (
    <EventSourceContext.Provider value={value}>
      {children}
    </EventSourceContext.Provider>
  );
};

export default EventSourceContext;