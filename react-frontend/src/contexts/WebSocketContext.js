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
import { createLogger, trackFunctionCall, trackRender } from '../utils/debugLogger';

// Create logger for this module
const logger = createLogger('WebSocket');

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

// Debug flag - disabled in production to reduce console logs
const DEBUG = false;

// EMERGENCY FIX: Completely disable WebSocket connections until fixed
const DISABLE_WEBSOCKET = true;

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

// Create a mock EventEmitter that can be used as a safe no-op implementation
class MockEventEmitter {
  constructor() {
    this.listeners = {};
  }
  
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.removeEventListener(event, callback);
  }
  
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  emit(event, ...args) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (err) {
        console.error(`Error in WebSocket mock listener for event ${event}:`, err);
      }
    });
  }
}

// EMERGENCY FIX LEVEL 2: Completely replace WebSocketProvider with a stub
export const WebSocketProvider = ({ children }) => {
  logger('WebSocketProvider rendered', { disabled: DISABLE_WEBSOCKET });
  
  // Track each render
  useEffect(() => {
    trackRender('WebSocketProvider');
  });
  
  // Create a mock emitter that safely handles event listeners
  const mockEmitterRef = useRef(new MockEventEmitter());
  
  // Create a bare minimum implementation with proper event handling
  const value = useMemo(() => ({
    socket: mockEmitterRef.current,
    isConnected: false,
    connectionId: null,
    lastMessage: null,
    requestStatsUpdate: () => {
      logger('requestStatsUpdate called but WebSocket is completely disabled');
    },
    sendEvent: () => {
      logger('sendEvent called but WebSocket is completely disabled');
    },
    addEventListener: (event, callback) => {
      logger(`Adding event listener for ${event} (mock implementation)`);
      return mockEmitterRef.current.addEventListener(event, callback);
    }
  }), []);
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;