/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file debugLogger.js
 * @description Debug utility to trace app execution flow and identify performance issues
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// Global settings
const DEBUG = {
  // Master control for all logs
  ENABLED: true,
  
  // Individual component toggles
  AUTH_CONTEXT: true,
  EVENT_SOURCE: true,
  WEBSOCKET: true,
  DASHBOARD: true,
  
  // Feature toggles
  API_CALLS: true,
  RENDER_CYCLES: true,
  STATE_UPDATES: true,
  
  // Frequency controls
  LOG_THROTTLE: 1000, // Minimum ms between repeated identical logs
};

// Store last log timestamps to implement throttling
const lastLogTimes = {};

/**
 * Debug logger with module name, throttling and formatting
 * @param {string} module - The module/component name (e.g., "AuthContext")
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 * @param {boolean} force - Force log even if throttled
 */
const logDebug = (module, message, data = null, force = false) => {
  // Check master toggle
  if (!DEBUG.ENABLED) return;
  
  // Check module specific toggle
  const moduleKey = module.replace(/[^A-Z_]/g, "");
  if (!DEBUG[moduleKey]) return;
  
  // Create a key for this specific log message
  const logKey = `${module}:${message}`;
  
  // Check throttling
  const now = Date.now();
  if (!force && lastLogTimes[logKey] && now - lastLogTimes[logKey] < DEBUG.LOG_THROTTLE) {
    return;
  }
  
  // Update timestamp
  lastLogTimes[logKey] = now;
  
  // Format the log message
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  const formattedMessage = `[${timestamp}] [${module}] ${message}`;
  
  // Log with or without data
  if (data !== null) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
};

/**
 * Creates a logger instance for a specific module
 * @param {string} moduleName - The module/component name
 * @returns {Function} - Logger function tied to that module
 */
const createLogger = (moduleName) => {
  return (message, data = null, force = false) => {
    logDebug(moduleName, message, data, force);
  };
};

/**
 * Tracks function calls for performance debugging
 * @param {string} moduleName - The module name
 * @param {string} functionName - The function name
 * @param {Function} callback - The wrapped function 
 */
const trackFunctionCall = (moduleName, functionName, callback) => {
  return (...args) => {
    const startTime = performance.now();
    logDebug(moduleName, `${functionName} called`, { args: args.length > 0 ? args : 'no args' });
    
    try {
      const result = callback(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result
          .then(res => {
            const duration = performance.now() - startTime;
            logDebug(moduleName, `${functionName} completed in ${duration.toFixed(2)}ms`, { success: true });
            return res;
          })
          .catch(error => {
            const duration = performance.now() - startTime;
            logDebug(moduleName, `${functionName} failed after ${duration.toFixed(2)}ms`, 
              { error: error.message || error }, true);
            throw error;
          });
      }
      
      // Regular return
      const duration = performance.now() - startTime;
      logDebug(moduleName, `${functionName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logDebug(moduleName, `${functionName} failed after ${duration.toFixed(2)}ms`, 
        { error: error.message || error }, true);
      throw error;
    }
  };
};

/**
 * Tracks component renders for performance debugging
 * @param {string} componentName - The React component name
 */
const trackRender = (componentName) => {
  if (!DEBUG.ENABLED || !DEBUG.RENDER_CYCLES) return;
  
  const renderKey = `RENDER:${componentName}`;
  const now = Date.now();
  
  // Skip throttled renders
  if (lastLogTimes[renderKey] && now - lastLogTimes[renderKey] < DEBUG.LOG_THROTTLE) {
    return;
  }
  
  lastLogTimes[renderKey] = now;
  logDebug('RENDER', `Component ${componentName} rendered`);
};

export { createLogger, trackFunctionCall, trackRender, DEBUG }; 