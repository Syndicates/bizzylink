/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file index.js
 * @description Main entry point for React frontend application
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Store error message counts to prevent flooding
const errorCounts = {};
const MAX_ERRORS_PER_TYPE = 5;
const ERROR_RESET_INTERVAL = 60000; // Reset error counts after 1 minute

// List of spam messages to filter out
const SPAM_PATTERNS = [
  '[EventSource] Throttling connection attempt',
  'Throttling connection attempt, too soon since last attempt',
  'Maximum update depth exceeded',
  'addEventListener is not a function',
  'Global throttling applied',
  'Auto refresh is disabled',
  'Auto verify state is disabled',
  'Throttling refreshUserData',
  'Skipping verifyAuthState',
  'Getting current user from AuthService',
  'Successfully extracted basic user data from token',
  'Fetching complete user profile from server',
  'Profile API response',
  'Returning normalized user data',
  
  // Add new patterns to filter out Dashboard/Navigation spam
  'Navigation Auth State',
  '🧭 Navigation Auth State',
  '[Link Verification] Setting up listener',
  'Setting up direct event listener for account_linked events',
  '[VerificationCelebration] Not connected to event source',
  'Current user data:',
  'isAuthenticated:',
  'User:',
  'Current path:',
  'Protected Route Check',
  'User is authenticated with data',
  'Auth state changed:',
  'Cache hit for',
  'API Request to',
  'API Response',
  'Active link code response',
  'Rendering head for',
  'Dashboard component unmounting',
  'Image loaded for',
  'Token exists but',
  'Token exists but user object is null',
  'No routes matched location',
  'Account linked event',
  'Failed to get online players',
  'Current message for',
  'Show message state',
  'Setting up message cycle',
  'Cycling message',
  'New message:'
];

// Override console.log to filter out spam messages
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Skip known spam messages
  if (args.length > 0 && typeof args[0] === 'string') {
    const message = args[0];
    
    // Filter out specific spam messages using pattern matching
    if (SPAM_PATTERNS.some(pattern => message.includes(pattern))) {
      return; // Don't log these messages
    }
    
    // Specifically filter API-related messages with more precise matching
    if ((message.startsWith('API Request to GET') || 
         message.startsWith('API Response [') ||
         message.startsWith('Cache hit for') ||
         message.includes('Active link code response'))) {
      return; // Don't log API call messages
    }
    
    // Filter out connection errors
    if (message.includes('net::ERR_CONNECTION_REFUSED') || 
        message.includes('Network Error') ||
        message.includes('Failed to get online players')) {
      return; // Don't log connection errors
    }
  }
  
  // Pass other messages to the original console.log
  return originalConsoleLog.apply(console, args);
};

// Override console.error to add additional context for debugging
const originalConsoleError = console.error;
console.error = function(...args) {
  // Track and filter error messages
  if (args.length > 0) {
    // Create an error key to count similar errors
    const errorKey = args.filter(arg => typeof arg === 'string').join('|').substr(0, 100);
    
    // Count this error
    errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
    
    // Filter out excessive repeated errors
    if (errorCounts[errorKey] > MAX_ERRORS_PER_TYPE) {
      // Only show every 10th occurrence after the threshold
      if (errorCounts[errorKey] % 10 !== 0) {
        return;
      }
      
      // Add count to message
      args.unshift(`[Repeated ${errorCounts[errorKey]} times]`);
    }
    
    // Add a timestamp to error messages
    const timestamp = new Date().toISOString();
    args.unshift(`[${timestamp}]`);
    
    // Check for maximum update depth error which indicates an infinite loop
    if (args.some(arg => arg && typeof arg === 'string' && arg.includes('Maximum update depth exceeded'))) {
      console.trace('Maximum update depth exceeded - stack trace:');
    }
    
    // Check for addEventListener is not a function error
    if (args.some(arg => arg && typeof arg === 'string' && arg.includes('addEventListener is not a function'))) {
      console.warn('addEventListener is not a function - this may be related to the stubbed context implementations');
    }
  }
  
  // Pass to original console.error
  return originalConsoleError.apply(console, args);
};

// Reset error counts periodically to allow errors to be logged again
setInterval(() => {
  for (const key in errorCounts) {
    errorCounts[key] = 0;
  }
}, ERROR_RESET_INTERVAL);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
