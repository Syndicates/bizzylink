/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useRealTimeStats.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useEventSource } from '../contexts/EventSourceContext';
import { useAuth } from '../contexts/AuthContext';
import { MinecraftService } from '../services/api';

// Global cache mechanism with longer duration
const STATS_CACHE = {
  data: {},  // Now using a map to store multiple player stats
  timestamp: {},
  CACHE_DURATION: 300000 // 5 minutes
};

// A hook that provides real-time Minecraft player stats
// Combines both WebSocket and SSE approaches for maximum compatibility
export default function useRealTimeStats(initialStats = null, options = {}) {
  const { 
    disablePolling = false,        // Option to completely disable polling
    pollInterval = 60000,          // Default: poll every 60 seconds
    cacheData = true,              // Whether to use cached data
    playerName = null,             // Optional specific player to track
  } = options;
  
  const { user } = useAuth();
  const { isConnected: wsConnected, addEventListener: addWsListener, requestStatsUpdate } = useWebSocket();
  const { addEventListener: addEventListener } = useEventSource();
  
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(initialStats === null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Determine if user has a linked account
  const mcUsername = playerName || user?.mcUsername || user?.minecraft?.mcUsername;
  const isLinked = playerName ? true : (user?.linked || user?.minecraft?.linked);
  
  // Get cache key for this player
  const getCacheKey = useCallback(() => {
    return mcUsername || 'default';
  }, [mcUsername]);
  
  // Update stats with validation and animation flags
  const updateStats = useCallback((newStats) => {
    if (!newStats) return;
    
    // Apply updates
    setStats(prevStats => {
      // If we have previous stats, generate change flags
      if (prevStats) {
        const updatedStats = { ...newStats };
        
        // Add change indicators for numeric values that changed
        Object.keys(updatedStats).forEach(key => {
          const prevValue = prevStats[key];
          const newValue = updatedStats[key];
          
          if (typeof newValue === 'number' && typeof prevValue === 'number' && newValue !== prevValue) {
            updatedStats[`${key}_changed`] = true;
            updatedStats[`${key}_old`] = prevValue;
            
            if (newValue > prevValue) {
              updatedStats[`${key}_increased`] = true;
            }
          }
        });
        
        return updatedStats;
      }
      
      return newStats;
    });
    
    // Update timestamp
    setLastUpdated(new Date());
    
    // Update global cache if caching is enabled
    if (cacheData) {
      const cacheKey = getCacheKey();
      STATS_CACHE.data[cacheKey] = newStats;
      STATS_CACHE.timestamp[cacheKey] = Date.now();
      
      // Also store in sessionStorage for persistence between page refreshes
      try {
        const storageKey = `player_stats_${cacheKey}`;
        sessionStorage.setItem(storageKey, JSON.stringify({
          data: newStats,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.warn('Failed to cache stats in sessionStorage:', err);
      }
    }
  }, [cacheData, getCacheKey]);
  
  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    const cacheKey = getCacheKey();
    const now = Date.now();
    
    // Try memory cache first
    const memoryValid = STATS_CACHE.data[cacheKey] && 
                       STATS_CACHE.timestamp[cacheKey] && 
                       (now - STATS_CACHE.timestamp[cacheKey] < STATS_CACHE.CACHE_DURATION);
    
    if (memoryValid) return true;
    
    // Try sessionStorage as fallback
    try {
      const storageKey = `player_stats_${cacheKey}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.timestamp && (now - parsedData.timestamp < STATS_CACHE.CACHE_DURATION)) {
          // Restore to memory cache
          STATS_CACHE.data[cacheKey] = parsedData.data;
          STATS_CACHE.timestamp[cacheKey] = parsedData.timestamp;
          return true;
        }
      }
    } catch (err) {
      console.warn('Error reading from sessionStorage:', err);
    }
    
    return false;
  }, [getCacheKey]);
  
  // Get cached data
  const getCachedData = useCallback(() => {
    const cacheKey = getCacheKey();
    
    // Try memory cache first
    if (STATS_CACHE.data[cacheKey]) {
      return STATS_CACHE.data[cacheKey];
    }
    
    // Try sessionStorage as fallback
    try {
      const storageKey = `player_stats_${cacheKey}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.data) {
          return parsedData.data;
        }
      }
    } catch (err) {
      console.warn('Error reading from sessionStorage:', err);
    }
    
    return null;
  }, [getCacheKey]);
  
  // Fetch initial stats if not provided
  useEffect(() => {
    // Skip if initial stats provided or no linked account
    if (!isLinked || !mcUsername || initialStats !== null) {
      if (initialStats !== null) {
        setStats(initialStats);
        setLoading(false);
      }
      return;
    }
    
    // Check if we have valid cached data
    if (cacheData && isCacheValid()) {
      // Use cached data
      const cachedData = getCachedData();
      console.log('[useRealTimeStats] Using cached data for', mcUsername);
      setStats(cachedData);
      setLastUpdated(new Date(STATS_CACHE.timestamp[getCacheKey()]));
      setLoading(false);
      return;
    }
    
    // No valid cache, need to fetch
    setLoading(true);
    
    // Create an AbortController to cancel request if component unmounts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    MinecraftService.getPlayerStats(mcUsername, false, { signal })
      .then(response => {
        if (signal.aborted) return;
        
        const responseData = response.data;
        updateStats(responseData);
        setLoading(false);
      })
      .catch(err => {
        // Ignore aborted requests (happens on unmount)
        if (err.name === 'AbortError') return;
        
        console.error('Error fetching initial stats:', err);
        setError(err.message || 'Failed to fetch player stats');
        setLoading(false);
      });
    
    return () => {
      // Cancel any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [user, initialStats, isLinked, mcUsername, updateStats, cacheData, isCacheValid, getCachedData, getCacheKey]);
  
  // Handle WebSocket events
  useEffect(() => {
    if (!wsConnected || !mcUsername) return;
    
    // Register listener for stats updates
    const removeListener = addWsListener('stats_update', (data) => {
      if (data && data.type === 'player_stats_update' && data.data) {
        console.log('[useRealTimeStats] WebSocket stats update for', mcUsername);
        
        // Only update if this is for the player we're tracking
        if (!data.player || data.player === mcUsername) {
          updateStats(data.data);
        }
      }
    });
    
    // Also listen for general notifications
    const removeNotificationListener = addWsListener('notification', (data) => {
      if (data && data.type === 'player_stats_update' && data.data) {
        console.log('[useRealTimeStats] WebSocket notification update for', mcUsername);
        
        // Only update if this is for the player we're tracking
        if (!data.player || data.player === mcUsername) {
          updateStats(data.data);
        }
      }
    });
    
    // Request initial stats via WebSocket
    requestStatsUpdate(mcUsername);
    
    return () => {
      removeListener();
      removeNotificationListener();
    };
  }, [wsConnected, mcUsername, addWsListener, requestStatsUpdate, updateStats]);
  
  // Handle SSE events (as backup)
  useEffect(() => {
    if (!mcUsername) return;
    
    // Register SSE listener for player stats
    const removeSseListener = addEventListener('player_stats_update', (data) => {
      try {
        console.log('[useRealTimeStats] SSE stats update for', mcUsername);
        
        // Only update if this is for the player we're tracking
        if (data && data.data && (!data.player || data.player === mcUsername)) {
          updateStats(data.data);
        }
      } catch (err) {
        console.error('[useRealTimeStats] Error processing SSE update:', err);
      }
    });
    
    return () => {
      removeSseListener();
    };
  }, [mcUsername, addEventListener, updateStats]);
  
  // Manual refresh function with safety check
  const refreshStats = useCallback(async () => {
    if (!isLinked || !mcUsername) {
      setError('No Minecraft account linked');
      return;
    }
    
    // If we're already loading, don't start another request
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First try WebSocket if available
      if (wsConnected) {
        requestStatsUpdate(mcUsername);
        // Set loading to false after a reasonable timeout in case WS doesn't respond
        setTimeout(() => {
          if (loading) {
            setLoading(false);
          }
        }, 2000);
      } else {
        // Fall back to REST API
        // Create a new AbortController for this request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        const response = await MinecraftService.getPlayerStats(mcUsername, false, { 
          signal: abortControllerRef.current.signal 
        });
        updateStats(response.data);
        setLoading(false);
      }
    } catch (err) {
      // Ignore aborted requests
      if (err.name === 'AbortError') return;
      
      console.error('Error refreshing stats:', err);
      setError(err.message || 'Failed to refresh player stats');
      setLoading(false);
    }
  }, [isLinked, mcUsername, wsConnected, loading, requestStatsUpdate, updateStats]);
  
  // Check if we're on a profile page
  const isProfilePage = typeof window !== 'undefined' && window.location.pathname.includes('/profile');
  
  // Set up a polling refresh as a last resort fallback
  // Only if WebSockets aren't connected and we have a user
  useEffect(() => {
    // Clean up any existing interval to prevent multiple timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Skip if polling is disabled, WebSockets are connected, or we're on a profile page
    if (disablePolling || wsConnected || !isLinked || !mcUsername || isProfilePage) {
      setIsPolling(false);
      return;
    }
    
    // If we're already polling, don't start another interval
    if (isPolling) {
      return;
    }
    
    console.log('[useRealTimeStats] Starting polling interval for', mcUsername, ':', pollInterval, 'ms');
    setIsPolling(true);
    
    intervalRef.current = setInterval(() => {
      // Check if we still need fresh data
      if (cacheData && isCacheValid()) {
        console.log('[useRealTimeStats] Skipping poll for', mcUsername, ', cache is fresh');
        return;
      }
      
      console.log('[useRealTimeStats] Polling for updates for', mcUsername);
      refreshStats();
    }, pollInterval);
    
    return () => {
      if (intervalRef.current) {
        console.log('[useRealTimeStats] Clearing polling interval for', mcUsername);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPolling(false);
      }
    };
  }, [wsConnected, isLinked, mcUsername, refreshStats, disablePolling, 
      pollInterval, isPolling, cacheData, isCacheValid, isProfilePage]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  return {
    stats,
    loading,
    error,
    lastUpdated,
    refreshStats,
    
    // Helper function to clear animation flags
    clearAnimations: useCallback(() => {
      if (!stats) return;
      
      const cleanStats = { ...stats };
      Object.keys(cleanStats).forEach(key => {
        if (key.endsWith('_changed') || key.endsWith('_old') || key.endsWith('_increased')) {
          delete cleanStats[key];
        }
      });
      
      setStats(cleanStats);
    }, [stats])
  };
} 