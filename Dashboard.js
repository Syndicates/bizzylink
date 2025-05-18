/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Dashboard.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { MinecraftService } from '../services/api';
import useLinkVerification from '../hooks/useLinkVerification';
import useVerificationCelebration from '../hooks/useVerificationCelebration';
import useGuidedTour from '../hooks/useGuidedTour';
import { useEventSource } from '../contexts/EventSourceContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import Changelog from '../components/Changelog';
import MinecraftAPI from '../utils/minecraft-api';
import MinecraftPluginIntegrations from '../components/MinecraftPluginIntegrations';
import MinecraftAchievements from '../components/MinecraftAchievements';
import MinecraftDetailedStats from '../components/MinecraftDetailedStats';
import MinecraftActivity from '../components/MinecraftActivity';
import MinecraftServerStatus from '../components/MinecraftServerStatus';
import AnimatedPlayerStats from '../components/AnimatedPlayerStats';
import VerificationCelebration from '../components/VerificationCelebration';
import GuidedTour from '../components/GuidedTour';
import '../dashboard-styles.css';
import { 
  UserIcon, 
  LinkIcon, 
  ClockIcon, 
  CubeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  DocumentDuplicateIcon,
  ChatBubbleLeftIcon as ChatAltIcon,
  UsersIcon,
  PuzzlePieceIcon as PuzzleIcon,
  StarIcon,
  BellIcon,
  MapIcon,
  ShoppingBagIcon,
  GlobeAltIcon as GlobeIcon,
  ChartBarIcon,
  BookOpenIcon as BookIcon,
  QuestionMarkCircleIcon,
  ChatBubbleBottomCenterIcon as ChatIcon,
  GiftIcon,
  CommandLineIcon,
  SignalIcon,
  ServerIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  HeartIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  IdentificationIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

// Debug flag - can be disabled in production
const DEBUG = false; // Set to false to reduce console spam

// EMERGENCY FIX: Disable auto-refresh to prevent excessive API calls
const DISABLE_AUTO_REFRESH = true;

// Debugging helper for state updates
function debugSetState(setter, value, name) {
  if (DEBUG) {
    console.log(`[Dashboard Debug] Setting state: ${name}`, typeof value === 'function' ? 'Function update' : value);
  }
  setter(value);
}

const Dashboard = () => {
  const { user, updateUserProfile, refreshUserData, forceDataRefresh } = useAuth();
  const { eventSource } = useEventSource();
  const { isConnected: wsConnected } = useWebSocket();
  const [showManualCelebration, setShowManualCelebration] = useState(false);
  const [linkedUsername, setLinkedUsername] = useState('');
  
  // Initialize the SSE connection for link verification
  useLinkVerification();
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [mcUsername, setMcUsername] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkExpiry, setLinkExpiry] = useState(null);
  const [linkExpiryDate, setLinkExpiryDate] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [playerStats, setPlayerStats] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [serverStatus, setServerStatus] = useState({ online: true, playerCount: 24, maxPlayers: 100 });
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  
  // Add these new hooks
  const { verifying } = useLinkVerification();
  const { tourActive, startTour, endTour } = useGuidedTour();
  const { 
    showCelebration, 
    mcUsername: linkedMcUsername, 
    handleCloseCelebration, 
    triggerCelebration,
    setShowCelebration // Add this to fix the missing reference
  } = useVerificationCelebration();
  
  // Create our own function to start the tour
  const startGuidedTour = useCallback(() => {
    console.log('Starting guided tour via wrapper...');
    startTour();
  }, [startTour]);
  
  // React hooks to control data fetching and loading states
  const [dataRefreshTimestamps, setDataRefreshTimestamps] = useState({
    account: 0,
    skills: 0,
    community: 0,
    achievements: 0
  });
  
  // Create ref for refresh timestamps to avoid render loops
  const dataRefreshTimestampsRef = useRef(dataRefreshTimestamps);
  
  // Update ref when state changes
  useEffect(() => {
    dataRefreshTimestampsRef.current = dataRefreshTimestamps;
  }, [dataRefreshTimestamps]);

  // Function to manage data refresh timestamps to prevent excessive fetching
  const shouldRefreshData = useCallback((tabName, minInterval = 60000) => {
    const now = Date.now();
    const lastRefresh = dataRefreshTimestampsRef.current[tabName] || 0;
    const timeSinceLastRefresh = now - lastRefresh;
    const shouldRefresh = timeSinceLastRefresh > minInterval;
    
    // Limit refreshes to once per minute minimum
    if (shouldRefresh) {
      // Update the timestamp for this tab
      setDataRefreshTimestamps(prev => ({
        ...prev,
        [tabName]: now
      }));
    }
    
    return shouldRefresh;
  }, []);

  // Create ref to track previous active tab to avoid redundant fetches
  const prevActiveTabRef = useRef(null);
  
  // Manual force refresh function
  const forceRefreshData = useCallback((tabName) => {
    console.log(`Forcing refresh for ${tabName} tab`);
    
    setDataRefreshTimestamps(prev => ({
      ...prev,
      [tabName]: 0 // Set to 0 to force refresh
    }));
  }, []);
  
  // Direct event source listener for account_linked events
  // Add a reference to track if we've already set up the event listener
  const accountLinkedHandlerRef = useRef(null);
  
  useEffect(() => {
    // Skip if eventSource isn't available or DEBUG is disabled
    if (!eventSource || !user || !DEBUG) return;
    
    // Only set up the listener once
    if (accountLinkedHandlerRef.current) {
      return;
    }
    
    console.log('Setting up direct event listener for account_linked events in Dashboard');
    
    const handleAccountLinked = (event) => {
      console.log('Dashboard received account_linked event directly');
      
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is for the current user
        if (data.userId === user._id || data.userId === user.id) {
          console.log('Account linked event is for current user!');
          
          // Set the linked username
          setLinkedUsername(data.mcUsername || 'n0t_awake');
          
          // Show the celebration
          setShowManualCelebration(true);
          
          // Play sound
          try {
            const audio = new Audio('/sounds/level-up.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
          } catch (e) {
            console.log('Audio not supported', e);
          }
          
          // Force refresh user data and UI - with timeout to reduce risk of loop
          setTimeout(() => {
            if (forceDataRefresh) {
              forceDataRefresh().catch(err => console.error('Error refreshing user data:', err));
            } else if (refreshUserData) {
              refreshUserData().catch(err => console.error('Error refreshing user data:', err));
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling account_linked event:', error);
      }
    };
    
    // Store the handler in the ref
    accountLinkedHandlerRef.current = handleAccountLinked;
    
    // Add the event listener
    eventSource.addEventListener('account_linked', handleAccountLinked);
    
    // Clean up
    return () => {
      if (eventSource && accountLinkedHandlerRef.current) {
        eventSource.removeEventListener('account_linked', accountLinkedHandlerRef.current);
      }
    };
  }, [eventSource, user, refreshUserData, forceDataRefresh]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format timestamp or Unix timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    
    // Check if it's a Unix timestamp (seconds or milliseconds)
    let date;
    if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
      // Convert to number if it's a string
      const timestampNum = parseInt(timestamp, 10);
      // Check if it's seconds (Unix timestamp) or milliseconds
      date = timestampNum > 20000000000 
        ? new Date(timestampNum) // milliseconds
        : new Date(timestampNum * 1000); // seconds
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Get current time to calculate relative time
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Return relative time
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    // If more than a week ago, return the date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check and update time remaining on link code
  useEffect(() => {
    if (!linkExpiryDate) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiryTime = new Date(linkExpiryDate);
      
      if (now >= expiryTime) {
        setLinkCode('');
        setLinkExpiry(null);
        setLinkExpiryDate(null);
        setTimeRemaining('');
        return;
      }
      
      const diffMs = expiryTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      setTimeRemaining(`${diffMins}:${diffSecs < 10 ? '0' : ''}${diffSecs}`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [linkExpiryDate]);

  // Format UUID with dashes if needed (some APIs require this format)
  const formatUUID = (uuid) => {
    if (!uuid) return '';
    // If already has dashes, return as is
    if (uuid.includes('-')) return uuid;
    // Add dashes in standard UUID format
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  };

  // Debug - log user object when it changes and store UUID for API calls
  useEffect(() => {
    if (user) {
      console.log('Current user data:', {
        username: user.username,
        linked: user.linked,
        mcUsername: user.mcUsername,
        mcUUID: user.mcUUID,
        formattedUUID: formatUUID(user.mcUUID)
      });
      
      // Store UUID in local storage for API calls
      if (user.mcUUID) {
        try {
          localStorage.setItem('mcUUID', user.mcUUID);
          localStorage.setItem('mcUsername', user.mcUsername);
          localStorage.setItem('testMode', 'false'); // Ensure test mode is disabled
          console.log('Stored Minecraft UUID and username in localStorage for API calls');
        } catch (e) {
          console.error('Failed to store player data in localStorage:', e);
        }
      }
    }
  }, [user]);

  // Track when we last checked the link code to prevent excessive API calls
  const lastLinkCodeCheckRef = useRef(0);
  
  // Check for active link code on load and when user changes
  useEffect(() => {
    const checkActiveLinkCode = async () => {
      // Don't run if user isn't authenticated or already has a linked account
      if (!user || user.linked || user.minecraft?.linked) {
        return;
      }
      
      // Add throttling to prevent excessive API calls
      const now = Date.now();
      const MIN_CHECK_INTERVAL = 60000; // 1 minute
      
      if (now - lastLinkCodeCheckRef.current < MIN_CHECK_INTERVAL) {
        // Skip if we checked recently
        return;
      }
      
      // Update check timestamp
      lastLinkCodeCheckRef.current = now;
      
      try {
        // First check if user already has linkCode in profile
        if (user.linkCode && user.linkCodeExpiry) {
          const expiryDate = new Date(user.linkCodeExpiry);
          if (expiryDate > new Date()) {
            console.log('Found active link code in user profile');
            setLinkCode(user.linkCode);
            setLinkExpiryDate(expiryDate);
            setMcUsername(user.mcUsername || user.minecraft?.mcUsername || '');
            return;
          }
        }
        
        // If not, try to get from the API
        const response = await MinecraftService.getActiveLinkCode();
        console.log('Active link code response:', response.data);
        
        setLinkCode(response.data.code);
        setLinkExpiry('30 minutes'); // Hardcoded since the API returns date, not duration
        setLinkExpiryDate(new Date(response.data.expires));
        setMcUsername(response.data.mcUsername || '');
        
      } catch (error) {
        console.log('No active link code found', error);
        // No active link code, that's ok
      }
    };
    
    checkActiveLinkCode();
  }, [user]);

  // Memoize player stats update to prevent unnecessary re-renders
  const updatePlayerStats = useCallback((newStats) => {
    if (!newStats) return;
    
    // Use the debug wrapper with simpler equality check
    debugSetState(setPlayerStats, prevStats => {
      // Only update if data actually changed to prevent render loops
      if (!prevStats) return newStats;
      
      // Simple equality check
      if (prevStats === newStats) return prevStats;
      
      // Skip update if the data hasn't meaningfully changed
      // We'll do a shallow check of important values but ignore large arrays
      try {
        const keysToCompare = ['online', 'lastSeen', 'playTime', 'blocksBroken', 'deaths', 'mobKills'];
        const hasChanges = keysToCompare.some(key => prevStats[key] !== newStats[key]);
        
        if (!hasChanges) {
          return prevStats; // No meaningful changes, keep previous state
        }
      } catch (e) {
        // Ignore errors in comparison
      }
      
      // Data has changed, update it
      return newStats;
    }, 'playerStats');
  }, []);

  // Replace direct setPlayerStats calls with the memoized function
  const handleStatsChange = useCallback((newStats) => {
    // Update the playerStats state when AnimatedPlayerStats updates
    updatePlayerStats(newStats);
  }, [updatePlayerStats]);

  // Create refs to track the latest state values without triggering re-renders
  const playerStatsRef = useRef(playerStats);
  
  // Update ref whenever playerStats changes
  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

  // Fetch player stats when user loads and when tab changes
  useEffect(() => {
    // Compare with previous tab to detect real changes
    const tabChanged = prevActiveTabRef.current !== activeTab;
    prevActiveTabRef.current = activeTab;
    
    // Only fetch if tab actually changed or this is first load
    if (!tabChanged && prevActiveTabRef.current !== null) {
      return;
    }
    
    // If auto-refresh is disabled, only fetch if we don't have data yet
    if (DISABLE_AUTO_REFRESH && playerStatsRef.current && prevActiveTabRef.current !== null) {
      return;
    }
    
    const fetchPlayerStats = async () => {
      // Only proceed if we have a valid user object
      if (!user || !user.id) {
        return;
      }
      
      // Check for linked account in both possible data structures
      const isLinked = user?.linked || user?.minecraft?.linked;
      const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
      
      if (!isLinked || !mcUsername) {
        return;
      }
      
      if (activeTab === 'account') {
        // Check if we should refresh data (once per minute max)
        const shouldFetch = shouldRefreshData('account', 60000);
        
        // Get the current playerStats safely from the ref
        const currentPlayerStats = playerStatsRef.current;
        
        // If we already have stats and aren't due for a refresh, skip the fetch
        if (currentPlayerStats && !shouldFetch) {
          return;
        }
        
        setIsUpdatingStats(true);
        
        try {
          // Use API call to get player stats
          const response = await MinecraftService.getPlayerStats(mcUsername, true);
          
          if (response && response.data) {
            updatePlayerStats(response.data);
          }
        } catch (error) {
          console.error('Error fetching player stats:', error);
          // Show a notification about the error
          setNotification({
            show: true,
            type: 'error',
            message: 'Failed to fetch player stats. Please try again later.'
          });
        } finally {
          setIsUpdatingStats(false);
        }
      }
    };
    
    // Add a small delay to ensure auth state is fully initialized
    const timer = setTimeout(() => {
      fetchPlayerStats();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, activeTab, shouldRefreshData, updatePlayerStats]);
  
  // No longer need this import as it's moved to the top
  /* Minecraft API already imported at the top */

  // Handle skills tab activation with proper dependency array
  useEffect(() => {
    // Compare with previous tab to detect real changes
    const tabChanged = prevActiveTabRef.current !== activeTab;
    
    // Only fetch if tab actually changed to skills
    if (!tabChanged || activeTab !== 'skills') {
      return;
    }
    
    const fetchSkillsData = async () => {
      // Skip if auto-refresh is disabled and we already have data
      if (DISABLE_AUTO_REFRESH && playerStatsRef.current?.mcmmo_data) {
        return;
      }
      
      // Check for linked account in both possible data structures
      const isLinked = user?.linked || user?.minecraft?.linked;
          const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
      
      if (!isLinked || !mcUsername) {
        return;
      }
      
      // Check if we should refresh data (once per minute max)
      const shouldFetch = shouldRefreshData('skills', 60000);
      
      // Get the current playerStats safely from the ref
      const currentPlayerStats = playerStatsRef.current;
      
      // Skip if we already have mcmmo_data and aren't due for a refresh
      if (currentPlayerStats?.mcmmo_data && !shouldFetch) {
        return;
      }
      
      setIsUpdatingStats(true);
      
      try {
        const response = await MinecraftService.getPlayerStats(mcUsername, true);
        
        if (response && response.data) {
          // Create a safely merged object with the new mcmmo data
          const updatedStats = {
            ...(currentPlayerStats || {}),
            mcmmo_data: response.data.mcmmo_data || {
              power_level: 0,
              skills: {
                mining: 0,
                woodcutting: 0,
                herbalism: 0,
                excavation: 0,
                fishing: 0,
                repair: 0,
                unarmed: 0,
                archery: 0,
                swords: 0,
                axes: 0,
                acrobatics: 0,
                taming: 0,
                alchemy: 0
              }
            }
          };
          
          // Use the memoized update function
          updatePlayerStats(updatedStats);
        }
        } catch (error) {
          console.error('Failed to fetch skills data:', error);
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to fetch skills data. Please try again later.'
        });
        } finally {
          setIsUpdatingStats(false);
      }
    };
    
    fetchSkillsData();
  }, [activeTab, user, shouldRefreshData, updatePlayerStats]);

  // Fetch server status and online players for the community tab
  useEffect(() => {
    // Compare with previous tab to detect real changes
    const tabChanged = prevActiveTabRef.current !== activeTab;
    
    // Only fetch if tab actually changed to community
    if (!tabChanged || activeTab !== 'community') {
      return;
    }
    
    const fetchServerData = async () => {
      try {
        // Fetch real server data instead of mock data
        const serverData = await MinecraftAPI.getServerStatus('play.bizzynation.co.uk');
        
        setServerStatus({
          online: serverData.online,
          playerCount: serverData.playerCount,
          maxPlayers: serverData.maxPlayers
        });
        
        // Try to fetch real online players, but fall back to placeholder data
        setOnlinePlayers([
          { username: 'MinerSteve', rank: 'VIP', playTime: '3h 24m', 
            avatar: MinecraftAPI.getPlayerAvatar('MinerSteve', 100) },
          { username: 'DiamondDigger', rank: 'Admin', playTime: '1h 12m',
            avatar: MinecraftAPI.getPlayerAvatar('DiamondDigger', 100) },
          { username: 'CreeperSlayer', rank: 'Member', playTime: '45m', 
            avatar: MinecraftAPI.getPlayerAvatar('CreeperSlayer', 100) },
          { username: 'RedstoneWizard', rank: 'VIP+', playTime: '2h 53m', 
            avatar: MinecraftAPI.getPlayerAvatar('RedstoneWizard', 100) },
          { username: 'PixelBuilder', rank: 'Member', playTime: '16m', 
            avatar: MinecraftAPI.getPlayerAvatar('PixelBuilder', 100) },
        ]);
      } catch (error) {
        console.error('Error fetching server status:', error);
        setServerStatus({ 
          online: false, 
          playerCount: 0, 
          maxPlayers: 100,
          error: 'Could not connect to server'
        });
      }
    };
    
    fetchServerData();
    
    // Set up polling for server status while on community tab
    let intervalId;
    intervalId = setInterval(() => {
      fetchServerData();
    }, 60000); // Check every minute
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);
  
  // Handle achievements tab activation
  useEffect(() => {
    // Compare with previous tab to detect real changes
    const tabChanged = prevActiveTabRef.current !== activeTab;
    
    // Only fetch if tab actually changed to achievements
    if (!tabChanged || activeTab !== 'achievements') {
      return;
    }
    
    const fetchAchievementData = async () => {
      // Skip if auto-refresh is disabled and we already have data
      if (DISABLE_AUTO_REFRESH && playerStatsRef.current?.advancements) {
        return;
      }
      
      if (user?.linked || user?.minecraft?.linked) {
        const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
        
        if (!mcUsername) return;
        
        // Get the current playerStats safely from the ref
        const currentPlayerStats = playerStatsRef.current;
        
        if (!currentPlayerStats?.advancements) {
          setIsUpdatingStats(true);
        }
        
        try {
          // Check if we should refresh data (once per minute max)
          const shouldFetch = shouldRefreshData('achievements', 60000);
          
          // Skip if we already have achievement data and aren't due for a refresh
          if (currentPlayerStats?.advancements && !shouldFetch) {
            return;
          }
          
          // Force cache refresh with skipCache=true to avoid excessive requests
          const response = await MinecraftService.getPlayerStats(mcUsername, true);
          
          // Create a complete data object by merging API response with defaults for missing fields
          const completeStats = {
            ...(currentPlayerStats || {}),
            ...response.data,
            
            // Add default achievements data if missing
            advancements: response.data.advancements || [
              'minecraft:story/root',
              'minecraft:story/mine_stone',
              'minecraft:adventure/root'
            ],
            advancements_count: response.data.advancements_count || 
              response.data.achievements || 
              (response.data.advancements ? response.data.advancements.length : 3),
            advancements_total: response.data.advancements_total || 100,
            advancements_percentage: response.data.advancements_percentage || 
              Math.round(((response.data.advancements ? response.data.advancements.length : 3) / 100) * 100)
          };
          
          // Use the memoized update function
          updatePlayerStats(completeStats);
        } catch (error) {
          console.error('Failed to fetch achievement data:', error);
        } finally {
          setIsUpdatingStats(false);
        }
      }
    };
    
    fetchAchievementData();
  }, [activeTab, user, shouldRefreshData, updatePlayerStats]);
  
  // Generate link code
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    
    if (!mcUsername) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please enter your Minecraft username'
      });
      return;
    }
    
    // Check if user is already linked
    const isUserLinked = user?.linked || user?.isLinked || user?.minecraft?.linked;
    const currentMcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
    
    if (isUserLinked) {
      console.log('User is already linked to:', currentMcUsername);
      
      // Special case for the "linked to null" bug
      if (!currentMcUsername || currentMcUsername === "null") {
        console.log('Found "linked to null" bug, automatically unlinking first');
        
        try {
          setLinkLoading(true);
          // Unlink silently first
          await MinecraftService.unlinkAccount();
          
          // Clear link data from localStorage
          localStorage.removeItem('pendingLinkCode');
          localStorage.removeItem('pendingLinkExpires');
          localStorage.removeItem('pendingLinkUsername');
          localStorage.removeItem('pollForUsername');
          
          // Stop any polling
          const pollIntervalId = localStorage.getItem('linkPollIntervalId');
          if (pollIntervalId) {
            clearInterval(parseInt(pollIntervalId));
            localStorage.removeItem('linkPollIntervalId');
          }
          
          // Refresh user data
          await refreshUserData();
          
          // Now we should be unlinked and can continue with code generation
          console.log('Successfully fixed "linked to null" state, continuing to generate link code');
        } catch (error) {
          console.error('Error fixing "linked to null" bug:', error);
          setNotification({
            show: true,
            type: 'error',
            message: 'There was an issue with your account status. Please try again.'
          });
          setLinkLoading(false);
          return;
        }
      } else if (currentMcUsername && currentMcUsername.toLowerCase() === mcUsername.toLowerCase()) {
        // If they're already linked to this username, show a notification
        setNotification({
          show: true,
          type: 'info',
          message: `You are already linked to ${currentMcUsername}. Please unlink first if you want to generate a new code.`
        });
        return;
      } else if (currentMcUsername) {
        // If trying to link to a different username, ask for confirmation
        if (!window.confirm(`You are already linked to ${currentMcUsername}. Do you want to unlink and generate a new code for ${mcUsername}?`)) {
          return;
        }
        
        // Unlink first
        try {
          setLinkLoading(true);
          console.log('Unlinking current account before generating new code');
          await MinecraftService.unlinkAccount();
          
          // Clear link data
          localStorage.removeItem('pendingLinkCode');
          localStorage.removeItem('pendingLinkExpires');
          localStorage.removeItem('pendingLinkUsername');
          localStorage.removeItem('pollForUsername');
          
          // Stop polling
          const pollIntervalId = localStorage.getItem('linkPollIntervalId');
          if (pollIntervalId) {
            clearInterval(parseInt(pollIntervalId));
            localStorage.removeItem('linkPollIntervalId');
          }
          
          // Refresh data
          await refreshUserData();
        } catch (error) {
          console.error('Error unlinking account:', error);
          setNotification({
            show: true,
            type: 'error',
            message: 'Failed to unlink current account. Please try again.'
          });
          setLinkLoading(false);
          return;
        }
      }
    }
    
    setLinkLoading(true);
    console.log('Generating link code for:', mcUsername);
    
    try {
      // Make the API call
      console.log('Calling linkAccount API...');
      const response = await MinecraftService.linkAccount(mcUsername);
      console.log('Link account API response:', response);
      
      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Store the link code in local storage for backup
      try {
        localStorage.setItem('pendingLinkCode', response.data.code);
        localStorage.setItem('pendingLinkExpires', response.data.expires);
        localStorage.setItem('pendingLinkUsername', mcUsername);
        console.log('Saved link code to localStorage:', response.data.code);
      } catch (storageError) {
        console.error('Failed to save link code to localStorage:', storageError);
      }
      
      // Update state with new link code data
      setLinkCode(response.data.code);
      setLinkExpiryDate(new Date(response.data.expires));
      setLinkExpiry('24 hours'); // Updated to match our extended expiry
      
      // Update user profile with the new link code information
      const updatedUser = {
        ...user,
        linkCode: response.data.code,
        linkCodeExpiry: response.data.expires,
        mcUsername: mcUsername
      };
      
      updateUserProfile(updatedUser);
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Link code generated successfully!'
      });
      
      // Start polling for link status changes
      startLinkStatusPolling(mcUsername);
    } catch (error) {
      console.error('Error generating link code:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || error.message || 'Failed to generate link code'
      });
    } finally {
      setLinkLoading(false);
    }
  };
  
  // Poll for link status after generating a code
  const startLinkStatusPolling = (username) => {
    console.log('Starting link status polling for:', username);
    
    // First check if user is already linked to this username
    const currentUser = user;
    const isAlreadyLinked = currentUser?.linked || currentUser?.isLinked || currentUser?.minecraft?.linked;
    const currentMcUsername = currentUser?.mcUsername || currentUser?.minecraft?.mcUsername;
    
    console.log('Checking if already linked:', {
      username,
      isAlreadyLinked,
      currentMcUsername,
      linked: currentUser?.linked,
      isLinked: currentUser?.isLinked,
      minecraftLinked: currentUser?.minecraft?.linked
    });
    
    // If already linked to this username, don't start polling
    if (isAlreadyLinked && currentMcUsername && currentMcUsername.toLowerCase() === username.toLowerCase()) {
      console.log('User is already linked to this username, not starting polling');
      return;
    }
    
    // Store the username we're polling for
    localStorage.setItem('pollForUsername', username);
    
    // Define polling function
    const checkLinkStatus = async () => {
      console.log('Checking link status for:', username);
      
      try {
        // Force refresh user data from server
        await refreshUserData();
        
        // Get latest user data
        const currentUser = user;
        console.log('Current user data:', currentUser);
        
        // Check if user is now linked
        const isLinked = currentUser?.linked || currentUser?.isLinked || currentUser?.minecraft?.linked;
        const linkedUsername = currentUser?.mcUsername || currentUser?.minecraft?.mcUsername;
        
        console.log('Link status check:', {
          username,
          isLinked,
          linkedUsername,
          linked: currentUser?.linked,
          isLinked: currentUser?.isLinked,
          minecraftLinked: currentUser?.minecraft?.linked
        });
        
        // Only celebrate if linked AND the username matches what we're polling for
        if (isLinked && linkedUsername && linkedUsername.toLowerCase() === username.toLowerCase()) {
          console.log('User is now linked to the correct username! Showing celebration...');
          
          // Set linked username
          setLinkedUsername(username);
          
          // Show manual celebration
          setShowManualCelebration(true);
          
          // Play celebration sound
          try {
            const audio = new Audio('/sounds/level-up.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
          } catch (e) {
            console.log('Audio not supported', e);
          }
          
          // Clear polling related data
          localStorage.removeItem('pollForUsername');
          return true; // Successfully linked
        }
        
        return false; // Not linked yet
      } catch (error) {
        console.error('Error checking link status:', error);
        return false;
      }
    };
    
    // Execute immediately once
    checkLinkStatus();
    
    // Then set interval to check every 5 seconds
    const pollInterval = setInterval(async () => {
      // Check if we should stop polling (user navigated away or polling was cancelled)
      const pollUsername = localStorage.getItem('pollForUsername');
      if (!pollUsername || pollUsername !== username) {
        console.log('Stopping link status polling: conditions changed');
        clearInterval(pollInterval);
        return;
      }
      
      // Run the check
      const isLinked = await checkLinkStatus();
      
      // If user is linked, stop polling
      if (isLinked) {
        console.log('User is now linked, stopping polling');
        clearInterval(pollInterval);
      }
    }, 5000); // Check every 5 seconds
    
    // Store interval ID to clear it later if needed
    localStorage.setItem('linkPollIntervalId', pollInterval.toString());
    
    // Auto-stop polling after 5 minutes (prevent indefinite polling)
    setTimeout(() => {
      console.log('Auto-stopping link status polling after 5 minutes');
      clearInterval(pollInterval);
      localStorage.removeItem('pollForUsername');
      localStorage.removeItem('linkPollIntervalId');
    }, 5 * 60 * 1000);
  };
  
  // Unlink account
  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink your Minecraft account?')) {
      return;
    }
    
    setUnlinkLoading(true);
    
    try {
      console.log('Starting Minecraft account unlink process...');
      
      // Check if we have a token before proceeding
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found! Cannot unlink account.');
        setNotification({
          show: true,
          type: 'error',
          message: 'Authentication error. Please try logging in again.'
        });
        return;
      }
      
      console.log('Calling MinecraftService.unlinkAccount()...');
      const response = await MinecraftService.unlinkAccount();
      console.log('Unlink account API response:', response);
      
      if (response.data.success) {
        // Clear any pending link codes and polling
        localStorage.removeItem('pendingLinkCode');
        localStorage.removeItem('pendingLinkExpires');
        localStorage.removeItem('pendingLinkUsername');
        localStorage.removeItem('pollForUsername');
        
        // Stop any running link status polling
        const pollIntervalId = localStorage.getItem('linkPollIntervalId');
        if (pollIntervalId) {
          clearInterval(parseInt(pollIntervalId));
          localStorage.removeItem('linkPollIntervalId');
        }
        
        // Reset local state
        setLinkCode('');
        setLinkExpiryDate(null);
        setMcUsername('');
        setShowManualCelebration(false);
        
        // Update user state
        const updatedUser = {
          ...user,
          linked: false,
          isLinked: false,
          mcUsername: null,
          mcUUID: null,
          linkCode: null,
          linkCodeExpiry: null,
          minecraft: {
            ...user.minecraft,
            linked: false,
            mcUsername: null,
            mcUUID: null,
            linkCode: null,
            linkCodeExpires: null
          }
        };
        updateUserProfile(updatedUser);
        
        // Clear player stats
        updatePlayerStats({
          online: false,
          lastSeen: null,
          playTime: 0,
          blocksBroken: 0,
          blocksPlaced: 0,
          deaths: 0,
          mobKills: 0,
          playerKills: 0,
          achievements: [],
          achievements_count: 0,
          achievements_total: 100,
          achievements_percentage: 0,
          advancements: [],
          advancements_count: 0,
          advancements_total: 100,
          advancements_percentage: 0
        });
        
        // Set notification for success
        setNotification({
          show: true,
          type: 'success',
          message: 'Your Minecraft account has been unlinked successfully!'
        });
        
        // Use the existing refreshUserData function from context
        refreshUserData();
        
      } else {
        throw new Error(response.data.message || 'Failed to unlink account');
      }
    } catch (error) {
      console.error('Error unlinking account:', error);
      
      // Show detailed error message
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Failed to unlink your Minecraft account. Please try again.'
      });
    } finally {
      setUnlinkLoading(false);
    }
  };
  
  // Copy link command to clipboard
  const copyLinkCommand = () => {
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setNotification({
      show: true,
      type: 'success',
      message: 'Command copied to clipboard!'
    });
  };
  
  // Reset all timers and state when component unmounts
  useEffect(() => {
    return () => {
      console.log('Dashboard component unmounting, cleaning up timers and state');
      
      // Clear any stored intervals
      const pollIntervalId = localStorage.getItem('linkPollIntervalId');
      if (pollIntervalId) {
        clearInterval(parseInt(pollIntervalId));
        localStorage.removeItem('linkPollIntervalId');
      }
      
      // Clean localStorage entries related to linking
      localStorage.removeItem('pendingLinkCode');
      localStorage.removeItem('pendingLinkExpires');
      localStorage.removeItem('pendingLinkUsername');
      localStorage.removeItem('pollForUsername');
      
      // Reset loading states
      setLoading(false);
      setLinkLoading(false);
      setUnlinkLoading(false);
      setIsUpdatingStats(false);
    };
  }, []);
  
  // Main component return
  return (
    <div className="dashboard-container">
      {/* Show loading spinner while authentication is being checked */}
      {!user && (
        <div className="flex justify-center items-center h-screen bg-black/50">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-white text-lg">Loading dashboard...</p>
          </div>
        </div>
      )}
      
      {/* Show celebration modal when account is linked */}
      {showManualCelebration && user && (
        <VerificationCelebration 
          show={showManualCelebration} 
          mcUsername={linkedUsername || user?.mcUsername || user?.minecraft?.mcUsername} 
          onClose={() => setShowManualCelebration(false)}
          onStartTour={startGuidedTour}
        />
      )}
      
      {/* Also handle the context-based celebration */}
      {showCelebration && (
        <VerificationCelebration 
          show={showCelebration} 
          mcUsername={linkedMcUsername} 
          onClose={handleCloseCelebration}
          onStartTour={startGuidedTour}
        />
      )}
      
      {/* Show guided tour */}
      {tourActive && <GuidedTour />}
      
      {/* Only render dashboard content when user is loaded */}
      {user && (
        <>
          <motion.div
            className="dashboard-content p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Dashboard header */}
            <div className="dashboard-header mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">
                Welcome back, <span className="text-minecraft-habbo-blue font-medium">{user.username}</span>!
                {user?.linked && user?.mcUsername && (
                  <> Your Minecraft account <span className="text-minecraft-habbo-yellow font-medium">{user.mcUsername}</span> is linked.</>
                )}
              </p>
            </div>
            
            {/* Dashboard tabs */}
            <div className="flex overflow-x-auto pb-4 space-x-2 mb-6 scrollbar-hide">
              <button
                className={`px-4 py-2 rounded-habbo font-medium whitespace-nowrap transition ${
                  activeTab === 'account' ? 'bg-minecraft-habbo-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                onClick={() => setActiveTab('account')}
              >
                <UserIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                Account
              </button>
              
              <button
                className={`px-4 py-2 rounded-habbo font-medium whitespace-nowrap transition ${
                  activeTab === 'skills' ? 'bg-minecraft-habbo-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                onClick={() => setActiveTab('skills')}
              >
                <StarIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                Skills
              </button>
              
              <button
                className={`px-4 py-2 rounded-habbo font-medium whitespace-nowrap transition ${
                  activeTab === 'achievements' ? 'bg-minecraft-habbo-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                onClick={() => setActiveTab('achievements')}
              >
                <TrophyIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                Achievements
              </button>
              
              <button
                className={`px-4 py-2 rounded-habbo font-medium whitespace-nowrap transition ${
                  activeTab === 'community' ? 'bg-minecraft-habbo-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                onClick={() => setActiveTab('community')}
              >
                <UserGroupIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                Community
              </button>
              
              <button
                className={`px-4 py-2 rounded-habbo font-medium whitespace-nowrap transition ${
                  activeTab === 'news' ? 'bg-minecraft-habbo-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                onClick={() => setActiveTab('news')}
              >
                <BellIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                News & Updates
              </button>
            </div>
            
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Account Content */}
                <div className="lg:col-span-8 space-y-6">
                  {user?.linked ? (
                    <motion.div
                      className="habbo-card p-6 rounded-habbo"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-white">Your Minecraft Account</h2>
                          <p className="text-gray-400">Linked to {user.mcUsername}</p>
                        </div>
                        <button
                          onClick={handleUnlink}
                          className="habbo-btn-secondary"
                          disabled={unlinkLoading}
                        >
                          {unlinkLoading ? 'Unlinking...' : 'Unlink Account'}
                        </button>
                      </div>
                      
                      <AnimatedPlayerStats 
                        playerStats={playerStats} 
                        onStatsChange={handleStatsChange}
                        isUpdating={isUpdatingStats}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      className="habbo-card p-6 rounded-habbo"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-xl font-bold text-white mb-4">Link Your Minecraft Account</h2>
                      
                      {linkCode ? (
                        <div className="mb-6">
                          <p className="text-green-400 mb-2">Your link code has been generated!</p>
                          <div className="flex items-center mb-4">
                            <div className="bg-white/10 text-center p-3 rounded-habbo flex-1">
                              <p className="text-gray-400 text-sm mb-1">Command</p>
                              <code className="text-xl font-mono text-minecraft-habbo-yellow">/link {linkCode}</code>
                            </div>
                            <button
                              onClick={copyLinkCommand}
                              className="habbo-btn-action ml-3 h-full"
                              aria-label="Copy link command"
                            >
                              <DocumentDuplicateIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-400">
                            Enter this command on our Minecraft server to link your account.
                            This code will expire in {timeRemaining}.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleGenerateLink} className="mb-6">
                          <div className="mb-4">
                            <label htmlFor="mcUsername" className="block text-gray-300 mb-2">
                              Minecraft Username
                            </label>
                            <input
                              type="text"
                              id="mcUsername"
                              value={mcUsername}
                              onChange={(e) => setMcUsername(e.target.value)}
                              className="minecraft-input w-full"
                              placeholder="Enter your Minecraft username"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            className="habbo-btn w-full"
                            disabled={linkLoading}
                          >
                            {linkLoading ? 'Generating...' : 'Generate Link Code'}
                          </button>
                        </form>
                      )}
                      
                      <div className="bg-white/5 p-4 rounded-habbo">
                        <h3 className="font-bold text-white mb-2">How to Link Your Account</h3>
                        <ol className="list-decimal list-inside text-gray-300 space-y-2">
                          <li>Enter your Minecraft username above</li>
                          <li>Generate a link code</li>
                          <li>Join our Minecraft server at <span className="text-minecraft-habbo-yellow font-mono">play.bizzynation.co.uk</span></li>
                          <li>Run the command <span className="text-minecraft-habbo-yellow font-mono">/link [code]</span> in the game</li>
                          <li>Your accounts will be linked automatically!</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div
                    className="habbo-card p-6 rounded-habbo"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <QuickActionButton 
                        icon={<ShoppingBagIcon className="w-6 h-6" />}
                        title="Shop"
                        description="Browse and purchase in-game items"
                        path="/shop"
                        color="bg-gradient-to-br from-purple-600 to-pink-500"
                      />
                      
                      <QuickActionButton 
                        icon={<MapIcon className="w-6 h-6" />}
                        title="Server Map"
                        description="Explore the dynamic server map"
                        path="/map"
                        color="bg-gradient-to-br from-green-600 to-teal-500"
                      />
                      
                      <QuickActionButton 
                        icon={<ChartBarIcon className="w-6 h-6" />}
                        title="Leaderboards"
                        description="See the top players on the server"
                        path="/leaderboards"
                        color="bg-gradient-to-br from-yellow-500 to-orange-500"
                      />
                      
                      <QuickActionButton 
                        icon={<ChatIcon className="w-6 h-6" />}
                        title="Forum"
                        description="Join the community discussions"
                        path="/forum"
                        color="bg-gradient-to-br from-blue-600 to-indigo-500"
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Sidebar Content */}
                <div className="lg:col-span-4 space-y-6">
                  <MinecraftServerStatus
                    serverStatus={serverStatus}
                  />
                  
                  <motion.div
                    className="habbo-card p-6 rounded-habbo"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <QuickLink icon={<BookIcon className="w-5 h-5" />} label="Wiki" />
                      <QuickLink icon={<MapIcon className="w-5 h-5" />} label="Dynmap" />
                      <QuickLink icon={<PuzzleIcon className="w-5 h-5" />} label="Plugins" />
                      <QuickLink icon={<GiftIcon className="w-5 h-5" />} label="Vote" />
                      <QuickLink icon={<QuestionMarkCircleIcon className="w-5 h-5" />} label="Help" />
                      <QuickLink icon={<ChatAltIcon className="w-5 h-5" />} label="Discord" />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="habbo-card p-6 rounded-habbo"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Server Connection</h2>
                    
                    <div className="bg-white/5 p-4 rounded-habbo mb-4">
                      <h3 className="font-medium text-white mb-2">Connection Info</h3>
                      <p className="text-sm text-gray-300 mb-1">Server Address:</p>
                      <div className="flex items-center">
                        <input 
                          type="text" 
                          value="play.bizzynation.co.uk" 
                          className="minecraft-input text-sm flex-1" 
                          readOnly 
                        />
                        <button className="habbo-btn-action ml-2" onClick={() => {
                          navigator.clipboard.writeText("play.bizzynation.co.uk");
                          setNotification({
                            show: true,
                            type: 'success',
                            message: 'Server address copied to clipboard!'
                          });
                        }}>
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      className="habbo-btn w-full mb-2"
                      onClick={() => {
                        window.open('minecraft://connect/play.bizzynation.co.uk', '_blank');
                      }}
                    >
                      <CommandLineIcon className="w-5 h-5 inline-block mr-2" />
                      Launch Minecraft
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Minecraft 1.21+ required
                    </p>
                  </motion.div>
                </div>
              </div>
            )}
            
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <MinecraftPluginIntegrations 
                    playerStats={playerStats}
                    mcUsername={user?.mcUsername || user?.minecraft?.mcUsername}
                    isUpdating={isUpdatingStats}
                  />
                </div>
                
                <div className="lg:col-span-4 space-y-6">
                  <MinecraftServerStatus
                    serverStatus={serverStatus}
                  />
                  
                  <motion.div
                    className="habbo-card p-6 rounded-habbo"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Skills Guide</h2>
                    
                    <div className="space-y-4">
                      <div className="bg-white/5 p-3 rounded-habbo">
                        <h3 className="font-medium text-minecraft-habbo-yellow">Mining</h3>
                        <p className="text-sm text-gray-300">
                          Break ores and stone to level up. Higher levels give you better drop rates.
                        </p>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-habbo">
                        <h3 className="font-medium text-minecraft-habbo-yellow">Woodcutting</h3>
                        <p className="text-sm text-gray-300">
                          Chop trees to level up. Higher levels give you faster cutting and more logs.
                        </p>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-habbo">
                        <h3 className="font-medium text-minecraft-habbo-yellow">Fishing</h3>
                        <p className="text-sm text-gray-300">
                          Catch fish to level up. Higher levels give you better and rarer catches.
                        </p>
                      </div>
                      
                      <div className="text-center mt-2">
                        <a href="#" className="text-minecraft-habbo-blue hover:underline text-sm">
                          View Full Skills Guide
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
            
            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <MinecraftAchievements
                    playerStats={playerStats}
                    mcUsername={user?.mcUsername || user?.minecraft?.mcUsername}
                    isUpdating={isUpdatingStats}
                  />
                </div>
                
                <div className="lg:col-span-4 space-y-6">
                  <MinecraftDetailedStats
                    playerStats={playerStats}
                    isUpdating={isUpdatingStats}
                  />
                  
                  <MinecraftActivity 
                    playerStats={playerStats}
                    isUpdating={isUpdatingStats}
                  />
                </div>
              </div>
            )}
            
            {/* Show Notification component */}
            <Notification
              show={notification.show}
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification({ ...notification, show: false })}
            />
          </motion.div>
        </>
      )}
    </div>
  );
};

// Helper components
const QuickActionButton = ({ icon, title, description, path, color, external = false }) => {
  return (
    <a 
      href={path} 
      target={external ? "_blank" : "_self"} 
      rel={external ? "noopener noreferrer" : ""}
      className={`p-4 rounded-habbo flex items-center transition hover:translate-y-[-2px] hover:shadow-xl ${color}`}
    >
      <div className="bg-white/20 p-3 rounded-habbo mr-4">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </a>
  );
};

const QuickLink = ({ icon, label }) => (
  <a href="#" className="flex items-center p-3 bg-white/5 rounded-habbo hover:bg-white/10 transition">
    <span className="mr-2 text-minecraft-habbo-blue">
      {icon}
    </span>
    <span>{label}</span>
  </a>
);

export default Dashboard;