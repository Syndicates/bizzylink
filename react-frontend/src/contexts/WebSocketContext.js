/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file WebSocketContext.js
 * @description (DISABLED) Real-time WebSocket communication provider. SSE/EventSource is now the only real-time method.
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext } from 'react';

// Minimal context for compatibility
const WebSocketContext = createContext({
  isConnected: false,
  connectionId: null,
  lastMessage: null,
  connectionError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 0,
  sendMessage: () => false,
  subscribe: () => () => {},
  reconnect: () => {},
  socket: null
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => (
  <WebSocketContext.Provider value={{
    isConnected: false,
    connectionId: null,
    lastMessage: null,
    connectionError: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 0,
    sendMessage: () => false,
    subscribe: () => () => {},
    reconnect: () => {},
    socket: null
  }}>
    {children}
  </WebSocketContext.Provider>
);
