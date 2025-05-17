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

import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Direct event source listener for account_linked events
  useEffect(() => {
    if (!eventSource || !user) return;
    
    console.log('Setting up direct event listener for account_linked events in Dashboard');
    
    const handleAccountLinked = (event) => {
      console.log('Dashboard received account_linked event directly:', event);
      
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed account_linked data:', data);
        
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
          
          // Force refresh user data and UI
          if (forceDataRefresh) {
            console.log('Force refreshing user data and UI from Dashboard...');
            forceDataRefresh().catch(err => console.error('Error refreshing user data:', err));
          } else {
            // Fallback to refreshUserData if forceDataRefresh is not available
            if (refreshUserData) {
              console.log('Refreshing user data from Dashboard...');
              refreshUserData().catch(err => console.error('Error refreshing user data:', err));
              
              // Reload page after celebration
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            }
          }
        }
      } catch (error) {
        console.error('Error handling account_linked event:', error);
      }
    };
    
    // Add the event listener
    eventSource.addEventListener('account_linked', handleAccountLinked);
    
    // Clean up
    return () => {
      eventSource.removeEventListener('account_linked', handleAccountLinked);
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

  // Check for active link code on load and when user changes
  useEffect(() => {
    const checkActiveLinkCode = async () => {
      if (user && !(user.linked || user.minecraft?.linked)) {
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
      }
    };
    
    checkActiveLinkCode();
  }, [user]);

  // Fetch player stats when user loads and when tab changes
  useEffect(() => {
    const fetchPlayerStats = async () => {
      // Check for linked account in both possible data structures
      const isLinked = user?.linked || user?.minecraft?.linked;
      const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
      
      // Force debug info
      console.log('User data:', JSON.stringify(user, null, 2));
      console.log('isLinked:', isLinked, 'mcUsername:', mcUsername);
      
      if (isLinked && mcUsername && activeTab === 'account') {
        // Set loading state regardless to ensure fresh data
        setIsUpdatingStats(true);
        
        try {
          console.log('Fetching player stats for:', mcUsername);
          
          // Use API call to get player data - force fresh data from server
          const response = await MinecraftService.getPlayerStats(mcUsername, true);
          console.log('API Response:', response.data);
          
          // Create a complete data object by merging API response with defaults for missing fields
          const completeStats = {
            // Default values for fields that might be missing
            playtime: '0h',
            lastSeen: 'Never',
            balance: 0,
            blocksMined: 0,
            mobsKilled: 0,
            deaths: 0,
            joinDate: formatDate(user.createdAt) || 'N/A',
            achievements: 0,
            level: 1,
            experience: 0,
            rank: 'Member',
            group: 'default',
            groups: ['default'],
            world: 'world',
            gamemode: 'SURVIVAL',
            online: false,
            
            // Override with actual data from API
            ...response.data,
            
            // Fix lastSeen format if it's a timestamp
            lastSeen: response.data.lastSeen === 'Online now' 
              ? 'Online now' 
              : formatTimestamp(response.data.lastSeen || response.data.last_seen),
            
            // Ensure we have a valid value for experience percentage
            experience: response.data.experience || 0
          };
          
          console.log('Using player stats:', completeStats);
          
          // Always update player stats when we get fresh data
          setPlayerStats(completeStats);
          setIsUpdatingStats(false);
          
        } catch (error) {
          console.error('Failed to fetch player stats:', error);
          // Only use placeholder data if we don't already have stats
          if (!playerStats) {
          setPlayerStats({
            playtime: '0h',
            lastSeen: 'Never',
            balance: 0,
            blocksMined: 0,
            mobsKilled: 0,
            deaths: 0,
            joinDate: 'N/A',
            achievements: 0,
            level: 1,
            experience: 0,
            rank: 'Member',
            group: 'default'
          });
          }
          setIsUpdatingStats(false);
        }
      }
    };
    
    if (user) {
      fetchPlayerStats();
    }
  }, [user, activeTab]); // Remove playerStats from dependency array to avoid loops
  
  // No longer need this import as it's moved to the top
  /* Minecraft API already imported at the top */

  // Handle skills tab activation
  useEffect(() => {
    const fetchSkillsData = async () => {
      if (activeTab === 'skills' && (user?.linked || user?.minecraft?.linked) && (user?.mcUsername || user?.minecraft?.mcUsername)) {
        // Set loading state for skills tab
        if (!playerStats?.mcmmo_data) {
          setIsUpdatingStats(true);
        }
        
        try {
          // Get mcmmo data from the API or use current data
          const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
          console.log('Fetching skills data for:', mcUsername);
          const response = await MinecraftService.getPlayerStats(mcUsername);
          console.log('Skills tab API Response:', response.data);
          
          // Create a complete data object by merging API response with defaults for missing fields
          const completeStats = {
            ...playerStats, // Keep existing stats
            ...response.data,
            
            // Add default mcMMO data if missing
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
          
          setPlayerStats(completeStats);
        } catch (error) {
          console.error('Failed to fetch skills data:', error);
        } finally {
          setIsUpdatingStats(false);
        }
      }
    };
    
    fetchSkillsData();
  }, [activeTab, user, playerStats]);

  // Fetch server status and online players for the community tab
  useEffect(() => {
    const fetchServerData = async () => {
      if (activeTab === 'community') {
        try {
          // Fetch real server data instead of mock data
          const serverData = await MinecraftAPI.getServerStatus('play.bizzynation.co.uk');
          console.log('Server status data:', serverData);
          
          setServerStatus({
            online: serverData.online,
            playerCount: serverData.playerCount,
            maxPlayers: serverData.maxPlayers
          });
          
          // Since we might not have API access to player list,
          // either show placeholder data or fetch from server API if available
          
          // Try to fetch real online players, but fall back to placeholder data
          try {
            // This would be replaced with actual API call when available
            // For now, use placeholder data but with real server status info
            
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
          } catch (playerError) {
            console.error('Error fetching online players:', playerError);
            // Keep default player data if fetching fails
          }
        } catch (error) {
          console.error('Error fetching server status:', error);
          setServerStatus({ 
            online: false, 
            playerCount: 0, 
            maxPlayers: 100,
            error: 'Could not connect to server'
          });
        }
      }
    };
    
    fetchServerData();
    
    // Set up regular polling for server status when on community tab
    let intervalId;
    if (activeTab === 'community') {
      intervalId = setInterval(() => {
        fetchServerData();
      }, 60000); // Check every minute
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);
  
  // Handle achievements tab activation
  useEffect(() => {
    const fetchAchievementData = async () => {
      if (activeTab === 'achievements' && (user?.linked || user?.minecraft?.linked) && (user?.mcUsername || user?.minecraft?.mcUsername)) {
        if (!playerStats?.advancements) {
          setIsUpdatingStats(true);
        }
        
        try {
          // Get achievement data from the API or use current data
          const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
          console.log('Fetching achievement data for:', mcUsername);
          const response = await MinecraftService.getPlayerStats(mcUsername);
          console.log('Achievements tab API Response:', response.data);
          
          // Create a complete data object by merging API response with defaults for missing fields
          const completeStats = {
            ...playerStats, // Keep existing stats
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
          
          setPlayerStats(completeStats);
        } catch (error) {
          console.error('Failed to fetch achievement data:', error);
        } finally {
          setIsUpdatingStats(false);
        }
      }
    };
    
    fetchAchievementData();
  }, [activeTab, user, playerStats]);
  
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
    const isLinked = user?.linked || user?.isLinked || user?.minecraft?.linked;
    const currentMcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
    
    if (isLinked) {
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
        setPlayerStats({
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
  
  const handleStatsChange = (newStats) => {
    // Update the playerStats state when AnimatedPlayerStats updates
    setPlayerStats(newStats);
  };
  
  // Let's add a function to manually test the celebration
  /*const testCelebration = () => {
    console.log('Manually triggering celebration with username:', user?.minecraft?.mcUsername || user?.mcUsername || 'n0t_awake');
    triggerCelebration(user?.minecraft?.mcUsername || user?.mcUsername || 'n0t_awake');
    
    // Show notification
    setNotification({
      show: true,
      type: 'success',
      message: 'Celebration triggered manually!'
    });
  };*/
  
  if (!user) {
    return <LoadingSpinner fullScreen />;
  }
  
  return (
    <div className="dashboard min-h-screen py-8 minecraft-grid-bg bg-habbo-pattern">
      {/* Verification Celebration Modal - both automatic and manual */}
      <AnimatePresence>
        {(showCelebration || showManualCelebration) && (
          <VerificationCelebration 
            mcUsername={linkedUsername || mcUsername}
            onClose={() => {
              // Close both possible celebrations
              setShowManualCelebration(false);
              handleCloseCelebration();
            }}
            onStartTour={startGuidedTour}
          />
        )}
      </AnimatePresence>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header Section */}
        <motion.div 
          className="relative mb-10 rounded-xl bg-[#1F2937] overflow-hidden border-2 border-white/5 shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 minecraft-background"></div>
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Player Welcome */}
            <div className="flex items-center gap-4">
              {user.linked && user.mcUsername ? (
                <div className="relative">
                  <img 
                    src={`https://visage.surgeplay.com/face/128/${user.mcUsername}`}
                    alt="Minecraft Avatar" 
                    className="w-20 h-20 rounded-lg shadow-lg border-2 border-white/20 transform hover:rotate-3 transition-transform"
                    onError={(e) => {
                      e.target.src = `https://mc-heads.net/avatar/${user.mcUsername}/128`;
                    }}
                  />
                  <div className="absolute -bottom-2 -right-2 bg-minecraft-habbo-green text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-white/20">
                    Lvl {playerStats?.level || '?'}
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#54AA54] to-[#458945] flex items-center justify-center text-white text-3xl shadow-lg border-2 border-white/20">
                  <UserIcon className="w-10 h-10" />
                </div>
              )}
              
              <div>
                <h1 className="text-3xl text-white leading-none">
                  <span className="block text-sm text-minecraft-habbo-green opacity-80 mb-1">Welcome back,</span>
                  {user.username}
          </h1>
                {user.linked && (
                  <div className="flex items-center mt-2">
                    <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded font-medium flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                      Account Linked
                    </span>
                    {playerStats?.lastSeen === 'Online now' && (
                      <span className="ml-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-medium">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 animate-pulse"></span>
                        Online Now
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Server Stats */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Server Status */}
              <div className="flex items-center bg-black/30 rounded-xl px-4 py-3 border border-white/10 shadow-md hover:border-white/20 transition">
                <div className="mr-3">
                  <ServerIcon className="h-8 w-8 text-white/70" />
                </div>
                <div>
                  <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${serverStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`font-medium ${serverStatus.online ? 'text-green-300' : 'text-red-300'}`}>
                      {serverStatus.online ? 'Server Online' : 'Server Offline'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                {serverStatus.online ? 
                      `${serverStatus.playerCount}/${serverStatus.maxPlayers} players` : 
                      'Connection unavailable'}
              </span>
                </div>
            </div>
            
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <Link to="/map" className="p-2 bg-black/30 rounded-xl hover:bg-black/50 transition border border-white/10 group">
                  <MapIcon className="h-7 w-7 text-minecraft-habbo-blue group-hover:text-white transition-colors" />
                </Link>
                <Link to="/shop" className="p-2 bg-black/30 rounded-xl hover:bg-black/50 transition border border-white/10 group">
                  <BuildingStorefrontIcon className="h-7 w-7 text-minecraft-habbo-yellow group-hover:text-white transition-colors" />
                </Link>
                <Link to="/vote" className="p-2 bg-black/30 rounded-xl hover:bg-black/50 transition border border-white/10 group">
                  <TrophyIcon className="h-7 w-7 text-minecraft-habbo-purple group-hover:text-white transition-colors" />
                </Link>
                <button className="p-2 bg-black/30 rounded-xl hover:bg-black/50 transition border border-white/10 relative group">
                  <BellIcon className="h-7 w-7 text-minecraft-habbo-red group-hover:text-white transition-colors" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Dashboard Tabs - Minecraft Styled */}
        <motion.div
          className="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, staggerChildren: 0.05 }}
        >
          <TabButton 
            icon={<UserIcon />}
            label="Profile"
            active={activeTab === 'account'}
            onClick={() => setActiveTab('account')}
            color="from-blue-600 to-blue-800"
          />
          <TabButton 
            icon={<UsersIcon />}
            label="Community"
            active={activeTab === 'community'}
            onClick={() => setActiveTab('community')}
            color="from-green-600 to-green-800"
          />
          <TabButton 
            icon={<ChartBarIcon />}
            label="Stats"
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
            color="from-purple-600 to-purple-800"
          />
          <TabButton 
            icon={<ChatAltIcon />}
            label="News"
            active={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
            color="from-amber-600 to-amber-800"
          />
          {user.linked && playerStats?.mcmmo_data && (
            <TabButton 
              icon={<SparklesIcon />}
              label="Skills"
              active={activeTab === 'skills'}
              onClick={() => setActiveTab('skills')}
              color="from-cyan-600 to-cyan-800"
            />
          )}
          {user.linked && playerStats?.town_data && (
            <TabButton 
              icon={<HomeIcon />}
              label="Town"
              active={activeTab === 'town'}
              onClick={() => setActiveTab('town')}
              color="from-red-600 to-red-800"
            />
          )}
          {user.linked && playerStats?.economy_data && (
            <TabButton 
              icon={<CurrencyDollarIcon />}
              label="Economy"
              active={activeTab === 'economy'}
              onClick={() => setActiveTab('economy')}
              color="from-emerald-600 to-emerald-800"
            />
          )}
          {user.linked && playerStats?.advancements && (
            <TabButton 
              icon={<TrophyIcon />}
              label="Achievements"
              active={activeTab === 'achievements'}
              onClick={() => setActiveTab('achievements')}
              color="from-yellow-600 to-yellow-800"
            />
          )}
        </motion.div>
        
        <AnimatePresence mode="wait">
        {/* Account Tab */}
        {activeTab === 'account' && (
            <motion.div 
              key="account-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
            {/* User Profile Card */}
            <motion.div 
                className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5 minecraft-dirt-pattern"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <IdentificationIcon className="w-5 h-5 mr-2 text-minecraft-habbo-blue" />
                      Your Profile
                    </h2>
                    <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                      {user.role || 'Member'}
                    </div>
                  </div>
                  
              <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2d3748] to-[#1a202c] rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.username}</h2>
                      <p className="text-gray-400 text-sm">Member since: {formatDate(user.createdAt)}</p>
                </div>
              </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                      <span className="text-gray-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Last Login:
                      </span> 
                  <span className="text-white">{formatDate(user.lastLogin)}</span>
              </div>
              
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                      <span className="text-gray-400 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Email:
                      </span> 
                      <span className="text-white">{user.email || 'Not provided'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                      <span className="text-gray-400 flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Account Status:
                      </span> 
                      <span className="flex items-center text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/edit-profile" className="btn-minecraft-primary py-2.5 px-4 text-center">
                  Edit Profile
                </Link>
                    <Link to="/change-password" className="btn-minecraft-secondary py-2.5 px-4 text-center">
                  Change Password
                </Link>
                  </div>
              </div>
            </motion.div>

            {/* Minecraft Account Card */}
            <motion.div 
                className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5 minecraft-grass-pattern"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <CubeIcon className="w-5 h-5 mr-2 text-minecraft-habbo-green" />
                      Minecraft Account
                    </h2>
                    <div 
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.linked || user.minecraft?.linked ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {user.linked || user.minecraft?.linked ? 'Linked' : 'Not Linked'}
                    </div>
              </div>

              {user.linked || user.minecraft?.linked ? (
                // Linked account info
                <div>
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="relative group">
                          <img 
                            src={`https://mc-heads.net/avatar/${user.mcUsername || user.minecraft?.mcUsername}/100`}
                            alt="Minecraft Avatar" 
                            className="w-20 h-20 bg-black/30 rounded-lg shadow-lg border-2 border-white/20 transform transition hover:scale-105"
                        onError={(e) => {
                              console.log('Failed to load from MC-Heads, trying minotar');
                              e.target.src = `https://minotar.net/avatar/${user.mcUsername || user.minecraft?.mcUsername}/100.png`;
                          e.target.onerror = (e2) => {
                                console.log('All avatar attempts failed, using placeholder');
                                e2.target.src = 'https://via.placeholder.com/100?text=Skin';
                                e2.target.onerror = null;
                          };
                        }}
                      />
                          
                          {/* 3D Model hover effect */}
                          <div className="absolute opacity-0 group-hover:opacity-100 -top-3 -right-3 transition">
                            <a 
                              href={`https://mc-heads.net/body/${user.mcUsername || user.minecraft?.mcUsername}/right`}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="bg-black/80 p-1 rounded-full"
                              title="View 3D Model"
                            >
                              <SparklesIcon className="h-4 w-4 text-minecraft-habbo-blue" />
                            </a>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{user.mcUsername || user.minecraft?.mcUsername}</h3>
                          <p className="text-gray-400 text-sm mb-2">
                            UUID: <span title={user.mcUUID || user.minecraft?.mcUUID} className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded cursor-help">
                              {(user.mcUUID || user.minecraft?.mcUUID) ? `${(user.mcUUID || user.minecraft?.mcUUID).substring(0, 8)}...` : '--'}
                            </span>
                          </p>
                          
                          <div className="flex space-x-2">
                            <a 
                              href={`https://namemc.com/profile/${user.mcUsername || user.minecraft?.mcUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full text-minecraft-habbo-blue transition"
                            >
                              NameMC Profile
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user.mcUUID || user.minecraft?.mcUUID || '');
                                setNotification({
                                  show: true,
                                  type: 'success',
                                  message: 'UUID copied to clipboard!'
                                });
                              }}
                              className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full text-gray-300 flex items-center transition"
                            >
                              <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                              Copy UUID
                            </button>
                      </div>
                    </div>
                  </div>
                  
                  {isUpdatingStats ? (
                        <div className="flex justify-center items-center h-40 bg-black/20 rounded-lg border border-white/5">
                      <LoadingSpinner />
                    </div>
                  ) : playerStats ? (
                        <div className="space-y-4">
                          {/* Player Level */}
                          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 rounded-lg p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <SparklesIcon className="h-5 w-5 text-minecraft-habbo-yellow mr-2" />
                                <span className="text-white font-bold">Level {playerStats.level}</span>
                        </div>
                              <span className="text-minecraft-habbo-blue">{playerStats.experience}% to next level</span>
                            </div>
                            <div className="relative h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                style={{ width: `${playerStats.experience}%` }}
                              ></div>
                        </div>
                      </div>
                      
                          {/* Player Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <StatTile 
                              icon={<CurrencyDollarIcon className="h-4 w-4 text-minecraft-habbo-yellow" />}
                              label="Balance"
                              value={`$${playerStats.balance?.toLocaleString() || '0'}`}
                              className="bg-yellow-900/30"
                            />
                            <StatTile 
                              icon={<UserGroupIcon className="h-4 w-4 text-green-400" />}
                              label="Rank"
                              value={playerStats.rank || 'Member'}
                              className="bg-green-900/30"
                            />
                            <StatTile 
                              icon={<ClockIcon className="h-4 w-4 text-blue-400" />}
                              label="Playtime"
                              value={playerStats.playtime || '0h'}
                              className="bg-blue-900/30"
                            />
                            <StatTile 
                              icon={<StarIcon className="h-4 w-4 text-purple-400" />}
                              label="Achievements"
                              value={`${playerStats.achievements || 0}/30`}
                              className="bg-purple-900/30"
                            />
                      </div>
                      
                          {/* Location */}
                          {playerStats.coords && (
                            <div className="bg-black/30 rounded-lg border border-white/5 p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm flex items-center">
                                  <MapIcon className="h-4 w-4 mr-1 text-minecraft-habbo-blue" />
                                  Location
                                </span>
                                <span className="text-white text-sm">{playerStats.world || 'Overworld'} {playerStats.biome ? `• ${playerStats.biome}` : ''}</span>
                              </div>
                              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2 font-mono text-center">
                                <code className="text-green-400 text-sm">X: {playerStats.coords.x} Y: {playerStats.coords.y} Z: {playerStats.coords.z}</code>
                          </div>
                        </div>
                      )}
                      
                      {/* Command to sync data */}
                          <div className="bg-blue-900/20 rounded-lg border border-blue-700/30 p-3">
                            <p className="text-gray-300 text-sm mb-2 flex items-center">
                              <CommandLineIcon className="h-4 w-4 mr-1 text-minecraft-habbo-blue" />
                              Sync your latest Minecraft data
                            </p>
                            <div className="bg-black/60 p-2 rounded-lg font-mono flex items-center justify-between">
                            <code className="text-minecraft-green text-sm">/link sync</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText('/link sync');
                                setNotification({
                                  show: true,
                                  type: 'success',
                                  message: 'Command copied to clipboard!'
                                });
                              }}
                                className="text-gray-400 hover:text-gray-300 transition"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          </div>
                          </div>
                          
                          {/* Online Status */}
                          <div className="bg-black/30 rounded-lg border border-white/5 p-3 flex items-center justify-between">
                            <span className="text-gray-400 text-sm flex items-center">
                              <ServerIcon className="h-4 w-4 mr-1 text-gray-500" />
                              Server Status
                            </span>
                            {playerStats.lastSeen === 'Online now' ? (
                              <span className="flex items-center text-green-400 text-sm bg-green-900/30 px-2 py-0.5 rounded-full">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                                Online Now
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">
                            {typeof playerStats.lastSeen === 'number' || /^\d+$/.test(playerStats.lastSeen) 
                              ? formatTimestamp(playerStats.lastSeen) 
                              : playerStats.lastSeen || 'Offline'}
                              </span>
                            )}
                      </div>
                    </div>
                  ) : (
                        <div className="flex justify-center items-center h-40 bg-black/20 rounded-lg border border-white/5">
                          <div className="text-center">
                            <div className="inline-block mb-2">
                              <LoadingSpinner />
                            </div>
                            <p className="text-gray-400">Loading player stats...</p>
                          </div>
                        </div>
                  )}
                  
                  <button
                    onClick={handleUnlink}
                    disabled={unlinkLoading}
                        className="w-full mt-6 bg-gradient-to-br from-red-600 to-red-800 text-white py-2.5 rounded-lg font-medium border border-white/10 hover:brightness-110 transition-all shadow-lg"
                  >
                    {unlinkLoading ? <LoadingSpinner /> : 'Unlink Account'}
                  </button>
                </div>
              ) : (
                // Link form
                    <div>
                      <div className="bg-yellow-900/20 rounded-lg border border-yellow-700/30 p-4 mb-6">
                        <div className="flex items-start">
                          <div className="bg-amber-400/20 p-2 rounded-full mr-3">
                            <LinkIcon className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium mb-1">Link your account</h3>
                            <p className="text-gray-300 text-sm">Connect your Minecraft account to unlock exclusive features, track your stats, and more.</p>
                          </div>
                        </div>
                      </div>
                      
                  <form onSubmit={handleGenerateLink} className="space-y-4">
                    <div>
                          <label htmlFor="mcUsername" className="block mb-2 font-medium text-gray-300 flex items-center">
                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Minecraft Username
                      </label>
                      <input
                        type="text"
                        id="mcUsername"
                        value={mcUsername}
                        onChange={(e) => setMcUsername(e.target.value)}
                        placeholder="Your Minecraft username"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-minecraft-habbo-blue/50"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={linkLoading}
                          className="w-full bg-gradient-to-br from-green-600 to-green-800 text-white py-2.5 rounded-lg font-medium border border-white/10 hover:brightness-110 transition-all shadow-lg"
                    >
                      {linkLoading ? <LoadingSpinner /> : 'Generate Link Code'}
                    </button>
                  </form>

                  {/* Link instructions if code was generated */}
                  {linkCode && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 bg-blue-900/30 p-4 rounded-lg border border-blue-700/30"
                        >
                          <h3 className="text-white font-medium mb-2 flex items-center">
                            <CommandLineIcon className="h-4 w-4 mr-2 text-minecraft-habbo-blue" />
                            Link your account in-game
                          </h3>
                          <p className="text-gray-300 text-sm mb-3">Run this command in Minecraft to complete linking:</p>
                          <div className="bg-black/60 p-3 rounded-lg font-mono flex items-center justify-between mb-3">
                        <code className="text-minecraft-green">/link {linkCode}</code>
                        <button 
                          onClick={copyLinkCommand}
                              className="text-gray-400 hover:text-gray-300 transition focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                      </div>
                          <div className="flex items-center justify-between text-sm bg-black/40 p-2 rounded-lg">
                            <div className="text-yellow-400 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" /> 
                          {timeRemaining ? (
                            <>Expires in: <span className="font-mono ml-1">{timeRemaining}</span></>
                          ) : (
                            <>Code expires in {linkExpiry || '30 minutes'}</>
                          )}
                      </div>
                    </div>
                        </motion.div>
                  )}
                </div>
              )}
                </div>
            </motion.div>

            {/* Quick Actions Card */}
              <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 quick-actions-section dashboard-quick-actions">
                <div className="p-5">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-4 quick-actions-grid">
                    <ActionCard
                  icon={<MapIcon className="h-6 w-6" />}
                  title="Server Map"
                      color="from-blue-600 to-blue-800"
                  path="/map"
                />
                    <ActionCard
                  icon={<ShoppingBagIcon className="h-6 w-6" />}
                  title="Shop"
                      color="from-purple-600 to-purple-800"
                  path="/shop"
                    />
                    <ActionCard
                  icon={<StarIcon className="h-6 w-6" />}
                  title="Vote"
                      color="from-yellow-600 to-yellow-800"
                      path="/vote"
                    />
                    <ActionCard
                      icon={<UserGroupIcon className="h-6 w-6" />}
                      title="Leaderboard"
                      color="from-green-600 to-green-800"
                      path="/leaderboard"
                />
              </div>
              </div>
              </div>

            {/* Player Stats Card - Only visible when user has linked account */}
            {user.linked && playerStats && (
              <motion.div 
                className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative lg:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-6">Player Statistics</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <AnimatedPlayerStats 
                    initialStats={playerStats}
                    onStatsChange={handleStatsChange}
                  />
                </div>
                
                {/* Extended Stats - Server Integration */}
                <div className="mt-6 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Server Data</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard 
                      icon={<MapIcon className="h-5 w-5 text-minecraft-habbo-green" />}
                      label="Current World"
                      value={playerStats.world || "Overworld"}
                    />
                    <StatCard 
                      icon={<GlobeIcon className="h-5 w-5 text-minecraft-habbo-blue" />}
                      label="Gamemode"
                      value={playerStats.gamemode || "Survival"}
                    />
                    <StatCard 
                      icon={<UserIcon className="h-5 w-5 text-minecraft-habbo-yellow" />}
                      label="Rank"
                      value={playerStats.rank || "Member"}
                    />
                    <StatCard 
                      icon={<UserIcon className="h-5 w-5 text-minecraft-habbo-purple" />}
                      label="Permission Group"
                      value={playerStats.group || "default"}
                    />
                  </div>
                </div>
                
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Achievements</h3>
                    <span className="text-minecraft-habbo-yellow">
                      {playerStats.achievements}/30 Completed
                    </span>
                  </div>
                  
                    <div className="habbo-progress-bar">
                    <div style={{ width: `${(playerStats.achievements / 30) * 100}%` }}></div>
                    </div>
                </div>
              </motion.div>
            )}
            </motion.div>
          )}
          {/* Skills Tab */}
          {activeTab === 'skills' && (user?.linked || user?.minecraft?.linked) && playerStats && (
            <div className="grid grid-cols-1 gap-6">
              {/* Skills Overview */}
              <motion.div
                key="skills-overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-6">Skills Overview</h2>
                
                <div className="space-y-4">
                  <div className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 opacity-5 minecraft-dirt-pattern"></div>
                    <div className="relative">
                      <MinecraftPluginIntegrations 
                        integrationData={{
                          mcmmo_data: playerStats.mcmmo_data,
                          jobs_data: playerStats.jobs_data,
                          towny_data: playerStats.towny_data,
                          town_data: playerStats.town_data,
                          server_stats: playerStats.server_stats,
                          economy_data: playerStats.economy_data
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative text-center py-12">
                    <SparklesIcon className="h-12 w-12 mx-auto text-minecraft-habbo-blue mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No Skills Data Available</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Your Minecraft account doesn't have any mcMMO skills data yet. 
                      Play on the server to start earning skill levels and they'll appear here.
                    </p>
                    <button 
                      className="mt-6 habbo-btn bg-minecraft-habbo-blue/30 text-minecraft-habbo-blue border border-minecraft-habbo-blue/20 px-4 py-2 rounded-lg"
                      onClick={() => {
                        navigator.clipboard.writeText('/mcstats');
                        setNotification({
                          show: true,
                          type: 'success',
                          message: 'Command copied to clipboard!'
                        });
                      }}
                    >
                      Copy /mcstats Command
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (user?.linked || user?.minecraft?.linked) && playerStats && (
            <div className="grid grid-cols-1 gap-6">
              {/* Achievement Overview */}
              <motion.div
                key="achievement-overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-6">Achievement Overview</h2>
                
                <div className="space-y-4">
                  <div className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative">
                    <div className="absolute inset-0 opacity-5 minecraft-stone-pattern"></div>
                    <div className="relative">
                      <MinecraftAchievements
                        advancements={playerStats.advancements}
                        count={playerStats.advancements_count || playerStats.advancements.length}
                        total={playerStats.advancements_total || 100}
                        percentage={playerStats.advancements_percentage || Math.round((playerStats.advancements.length / 100) * 100)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#1F2937] p-6 rounded-xl border border-white/5 shadow-xl overflow-hidden relative text-center py-12">
                    <TrophyIcon className="h-12 w-12 mx-auto text-minecraft-habbo-yellow mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">No Achievements Data Available</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Your Minecraft account doesn't have any achievements data yet. 
                      Play on the server to unlock achievements and they'll appear here.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Online Players */}
            <motion.div
              className="habbo-card p-6 rounded-habbo md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Online Players</h2>
              
              <div className="space-y-4">
                {onlinePlayers.map((player, index) => (
                  <div 
                    key={index} 
                    className="flex items-center p-3 bg-white/5 rounded-habbo"
                  >
                    <img 
                      src={player.avatar}
                      alt={player.username} 
                      className="w-10 h-10 rounded-habbo mr-4"
                      onLoad={() => console.log(`Loaded avatar for ${player.username}`)}
                      onError={(e) => {
                        console.log(`Failed to load avatar for ${player.username}, trying mc-heads`);
                        e.target.src = `https://mc-heads.net/avatar/${player.username}/100`;
                        e.target.onerror = (e2) => {
                          console.log(`Failed mc-heads for ${player.username}, trying minotar`);
                          e2.target.src = `https://minotar.net/avatar/${player.username}/100`;
                          e2.target.onerror = (e3) => {
                            console.log(`All avatar attempts failed for ${player.username}`);
                            e3.target.src = 'https://via.placeholder.com/100?text=MC';
                          };
                        };
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-white">{player.username}</h3>
                          <span className={`text-xs ${
                            player.rank === 'Admin' ? 'text-red-400' :
                            player.rank === 'VIP' || player.rank === 'VIP+' ? 'text-minecraft-habbo-yellow' :
                            'text-gray-400'
                          }`}>
                            {player.rank}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {player.playTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between">
                <span className="text-sm text-gray-400">
                  {onlinePlayers.length} players online
                </span>
                <button className="habbo-btn text-sm py-1">
                  View All Players
                </button>
              </div>
            </motion.div>
            
            {/* Server Information */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Server Info</h2>
                
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white font-mono">play.bizzynation.com</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">1.19.2</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-white">{serverStatus.playerCount}/{serverStatus.maxPlayers}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`${serverStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                      {serverStatus.online ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
                
                <button className="habbo-btn w-full mt-4">
                  Copy Server IP
                </button>
              </div>
              
              {/* Recent Updates */}
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Recent Updates</h2>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-minecraft-habbo-blue pl-3">
                    <h3 className="font-medium">New Shop Items</h3>
                    <p className="text-sm text-gray-400">Added new items to the shop</p>
                    <p className="text-xs text-minecraft-habbo-blue">2 hours ago</p>
                  </div>
                  
                  <div className="border-l-4 border-minecraft-habbo-red pl-3">
                    <h3 className="font-medium">Server Restart</h3>
                    <p className="text-sm text-gray-400">Scheduled restart at 8PM EST</p>
                    <p className="text-xs text-minecraft-habbo-blue">1 day ago</p>
                  </div>
                  
                  <div className="border-l-4 border-minecraft-habbo-yellow pl-3">
                    <h3 className="font-medium">Weekend Event</h3>
                    <p className="text-sm text-gray-400">Double XP all weekend</p>
                    <p className="text-xs text-minecraft-habbo-blue">2 days ago</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  <QuickLink icon={<BookIcon />} label="Rules" />
                  <QuickLink icon={<QuestionMarkCircleIcon />} label="Help" />
                  <QuickLink icon={<ChatIcon />} label="Discord" />
                  <QuickLink icon={<GiftIcon />} label="Vote" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Player Details Section */}
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-minecraft-habbo-purple" />
                Detailed Player Statistics
              </h2>
              
              {(user?.linked || user?.minecraft?.linked) && playerStats ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-minecraft-habbo-blue">Stats Overview</h3>
                    <button
                      onClick={async () => {
                        try {
                          setIsUpdatingStats(true);
                          const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
                          console.log('Manually refreshing stats for:', mcUsername);
                          // Force a refresh of the player stats
                          const response = await MinecraftService.getPlayerStats(mcUsername, true);
                          console.log('Refreshed API Response:', response.data);
                          
                          // Create a complete data object
                          const completeStats = {
                            ...playerStats,
                            ...response.data
                          };
                          
                          // Update the player stats
                          setPlayerStats(completeStats);
                          setNotification({
                            show: true,
                            type: 'success',
                            message: 'Player statistics refreshed successfully!'
                          });
                        } catch (error) {
                          console.error('Failed to refresh player stats:', error);
                          setNotification({
                            show: true,
                            type: 'error',
                            message: 'Failed to refresh statistics. Please try again.'
                          });
                        } finally {
                          setIsUpdatingStats(false);
                        }
                      }}
                      className="bg-minecraft-habbo-blue/30 hover:bg-minecraft-habbo-blue/40 text-minecraft-habbo-blue px-3 py-1 rounded-md text-sm flex items-center transition"
                      disabled={isUpdatingStats}
                    >
                      {isUpdatingStats ? (
                        <span className="flex items-center">
                          <LoadingSpinner size="small" />
                          <span className="ml-1">Refreshing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <SignalIcon className="h-4 w-4 mr-1" />
                          Refresh Stats
                        </span>
                      )}
                    </button>
                  </div>
                  <MinecraftDetailedStats playerStats={playerStats} />
                </div>
              ) : (
                <div className="bg-white/5 p-4 rounded-md text-center">
                  <p className="text-gray-400">Link your Minecraft account to view detailed statistics</p>
                  <button
                    onClick={() => setActiveTab('account')}
                    className="mt-4 bg-minecraft-habbo-blue/30 text-minecraft-habbo-blue hover:bg-minecraft-habbo-blue/40 px-4 py-2 rounded-md text-sm transition"
                  >
                    Link Account
                  </button>
                </div>
              )}
            </motion.div>
            
            {/* Player Activity Section */}
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-minecraft-habbo-blue" />
                Player Activity
              </h2>
              
              {(user?.linked || user?.minecraft?.linked) && playerStats ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-minecraft-habbo-blue">Activity Log</h3>
                    <button
                      onClick={async () => {
                        try {
                          setIsUpdatingStats(true);
                          const mcUsername = user?.mcUsername || user?.minecraft?.mcUsername;
                          console.log('Manually refreshing activity for:', mcUsername);
                          // Force a refresh of the player stats
                          const response = await MinecraftService.getPlayerStats(mcUsername, true);
                          
                          // Create a complete data object
                          const completeStats = {
                            ...playerStats,
                            ...response.data
                          };
                          
                          // Update the player stats
                          setPlayerStats(completeStats);
                          setNotification({
                            show: true,
                            type: 'success',
                            message: 'Player activity refreshed successfully!'
                          });
                        } catch (error) {
                          console.error('Failed to refresh player activity:', error);
                          setNotification({
                            show: true,
                            type: 'error',
                            message: 'Failed to refresh activity. Please try again.'
                          });
                        } finally {
                          setIsUpdatingStats(false);
                        }
                      }}
                      className="bg-minecraft-habbo-blue/30 hover:bg-minecraft-habbo-blue/40 text-minecraft-habbo-blue px-3 py-1 rounded-md text-sm flex items-center transition"
                      disabled={isUpdatingStats}
                    >
                      {isUpdatingStats ? (
                        <span className="flex items-center">
                          <LoadingSpinner size="small" />
                          <span className="ml-1">Refreshing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <SignalIcon className="h-4 w-4 mr-1" />
                          Refresh Activity
                        </span>
                      )}
                    </button>
                  </div>
                  <MinecraftActivity playerStats={playerStats} />
                </div>
              ) : (
                <div className="bg-white/5 p-4 rounded-md text-center">
                  <p className="text-gray-400">Link your Minecraft account to track your activity</p>
                </div>
              )}
            </motion.div>
            
            {/* Server Status Section */}
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <ServerIcon className="h-6 w-6 mr-2 text-minecraft-habbo-green" />
                Server Status
              </h2>
              
              <MinecraftServerStatus serverIP="play.bizzynation.co.uk" />
            </motion.div>
            
            {/* Top Players Section */}
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <TrophyIcon className="h-6 w-6 mr-2 text-minecraft-habbo-yellow" />
                Leaderboard
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Player</th>
                      <th className="text-left py-3 px-4">Level</th>
                      <th className="text-left py-3 px-4">Play Time</th>
                      <th className="text-left py-3 px-4">Balance</th>
                      <th className="text-left py-3 px-4">Achievements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: 'DiamondDigger', level: 92, playTime: '342h', balance: '$45,320', achievements: 28 },
                      { rank: 2, name: 'MinerSteve', level: 87, playTime: '310h', balance: '$38,670', achievements: 27 },
                      { rank: 3, name: 'RedstoneWizard', level: 84, playTime: '298h', balance: '$35,140', achievements: 26 },
                      { rank: 4, name: 'CreeperSlayer', level: 79, playTime: '275h', balance: '$29,850', achievements: 24 },
                      { rank: 5, name: 'PixelBuilder', level: 76, playTime: '268h', balance: '$27,490', achievements: 23 }
                    ].map((player, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 font-bold">#{player.rank}</td>
                        <td className="py-3 px-4">{player.name}</td>
                        <td className="py-3 px-4">{player.level}</td>
                        <td className="py-3 px-4">{player.playTime}</td>
                        <td className="py-3 px-4 text-minecraft-habbo-yellow">{player.balance}</td>
                        <td className="py-3 px-4">{player.achievements}/30</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-center">
                <Link to="/leaderboard" className="btn-minecraft-secondary inline-block px-4 py-2">
                  View Full Leaderboard
                </Link>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* News & Events Tab */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="habbo-card p-6 rounded-habbo lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-6">Latest News</h2>
              
              <div className="space-y-6">
                <NewsItem 
                  title="March Update: New Features & Improvements" 
                  date="March 1, 2025"
                  image="https://via.placeholder.com/600x300?text=March+Update"
                  content="We're excited to announce our March update with tons of new features! We've added a brand new shop system, auction house, and server map. Check out all the details in our changelog."
                  link="#"
                />
                
                <NewsItem 
                  title="Weekend Event: Double XP & Special Drops" 
                  date="February 25, 2025"
                  image="https://via.placeholder.com/600x300?text=Weekend+Event"
                  content="This weekend, earn double XP and get special drops from all monsters! Join us for special mini-games and competitions with amazing prizes."
                  link="#"
                />
                
                <NewsItem 
                  title="New Plot World Now Available!" 
                  date="February 15, 2025"
                  image="https://via.placeholder.com/600x300?text=Plot+World"
                  content="We've added a brand new plot world with larger plots and new themes. Reserve your spot now before they're all taken!"
                  link="#"
                />
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <button className="habbo-btn">
                  View All News
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
                
                <div className="space-y-4">
                  <EventItem 
                    title="PvP Tournament"
                    date="March 5, 2025"
                    time="8:00 PM EST"
                    color="bg-red-500"
                  />
                  <EventItem 
                    title="Build Competition"
                    date="March 10, 2025"
                    time="7:00 PM EST"
                    color="bg-blue-500"
                  />
                  <EventItem 
                    title="Treasure Hunt"
                    date="March 15, 2025"
                    time="3:00 PM EST"
                    color="bg-yellow-500"
                  />
                  <EventItem 
                    title="Parkour Challenge"
                    date="March 20, 2025"
                    time="6:00 PM EST"
                    color="bg-green-500"
                  />
                </div>
                
                <button className="habbo-btn w-full mt-4">
                  View Calendar
                </button>
              </div>
              
              <Changelog maxHeight="30rem" />
              
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Poll: Next Feature</h2>
                
                <p className="text-sm text-gray-300 mb-4">
                  What feature would you like to see added next?
                </p>
                
                <div className="space-y-3">
                  <PollOption id="pets" label="Pet System" votes={42} />
                  <PollOption id="quests" label="Daily Quests" votes={37} />
                  <PollOption id="jobs" label="Jobs & Professions" votes={28} />
                  <PollOption id="minigames" label="New Mini-games" votes={18} />
                </div>
                
                <button className="habbo-btn w-full mt-6">
                  Submit Vote
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Dashboard Header */}
      <div className="dashboard-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back, {user?.username || 'Player'}!</p>
        
        {/* Debug controls - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-indigo-900/30 border border-indigo-700/30 rounded text-xs flex space-x-2">
            <button 
              onClick={() => forceDataRefresh && forceDataRefresh()}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
      
      {/* Guided Tour */}
      <GuidedTour 
        isOpen={tourActive} 
        onClose={endTour} 
      />
      
      {/* Admin/Debug Controls - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-lg">
          {/* Test Celebration button removed to ensure it only shows when verified on Minecraft */}
          <button
            onClick={startGuidedTour}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Take a Tour
          </button>
        </div>
      )}
    </div>
  );
};

// Quick Action Button component
const QuickActionButton = ({ icon, title, description, path, color, external = false }) => {
  if (external) {
    return (
      <a 
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-4 rounded-habbo transition-all duration-200 hover:-translate-y-1 ${color}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">{icon}</div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs text-white/80">{description}</p>
        </div>
      </a>
    );
  }
  
  return (
    <Link 
      to={path}
      className={`block p-4 rounded-habbo transition-all duration-200 hover:-translate-y-1 ${color}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-xs text-white/80">{description}</p>
      </div>
    </Link>
  );
};

// Stat Card component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/5 p-3 rounded-habbo text-center">
    <div className="flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

// Quick Link component
const QuickLink = ({ icon, label }) => (
  <div className="bg-white/5 p-3 rounded-habbo flex items-center justify-center space-x-2 cursor-pointer hover:bg-white/10 transition-colors">
    <div className="text-minecraft-habbo-blue h-5 w-5">
      {icon}
    </div>
    <span>{label}</span>
  </div>
);

// News Item component
const NewsItem = ({ title, date, image, content, link }) => (
  <div className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-sm text-gray-400 mb-3">{date}</p>
    
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="md:col-span-2">
        <img src={image} alt={title} className="w-full h-32 object-cover rounded-habbo" />
      </div>
      <div className="md:col-span-3">
        <p className="text-sm text-gray-300 mb-3">{content}</p>
        <a href={link} className="text-minecraft-habbo-blue hover:underline">Read more →</a>
      </div>
    </div>
  </div>
);

// Event Item component
const EventItem = ({ title, date, time, color }) => (
  <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-habbo">
    <div className={`w-3 h-full ${color} rounded-full`}></div>
    <div className="flex-1">
      <h3 className="font-medium">{title}</h3>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{date}</span>
        <span className="text-minecraft-habbo-blue">{time}</span>
      </div>
    </div>
  </div>
);

// Poll Option component
const PollOption = ({ id, label, votes }) => (
  <div>
    <div className="flex items-center mb-1">
      <input 
        type="radio" 
        id={id} 
        name="poll" 
        className="mr-2"
      />
      <label htmlFor={id}>{label}</label>
    </div>
    <div className="habbo-progress-bar">
      <div className="bg-minecraft-habbo-blue" style={{ width: `${(votes / 125) * 100}%` }}></div>
    </div>
    <div className="flex justify-between text-xs mt-1">
      <span className="text-gray-400">{votes} votes</span>
      <span className="text-gray-400">{Math.round((votes / 125) * 100)}%</span>
    </div>
  </div>
);


// Custom icons
const SwordIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const SkullIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// Minecraft-themed tab button with animated hover effects
const TabButton = ({ icon, label, active, onClick, color = "from-gray-600 to-gray-800" }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
        active 
          ? `bg-gradient-to-br ${color} border-white/20 shadow-lg` 
          : 'bg-black/30 border-white/5 hover:border-white/20'
      }`}
      whileHover={{ 
        scale: 1.03, 
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Background texture effect */}
      <div className="absolute inset-0 opacity-10 minecraft-grid-pattern"></div>
      
      <div className="relative p-3 flex flex-col items-center justify-center">
        <div className={`text-2xl mb-1 ${active ? 'text-white' : 'text-white/70'}`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-300'}`}>
          {label}
        </span>
        
        {/* Indicator dot for active tab */}
        {active && (
          <motion.div 
            className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-white"
            layoutId="tabIndicator"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </div>
    </motion.button>
  );
};

// Action card component for quick actions section
const ActionCard = ({ icon, title, color = "from-blue-600 to-blue-800", path }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`bg-gradient-to-br ${color} p-3 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center text-center`}
      onClick={() => navigate(path)}
      data-title={title}
    >
      <div className="text-white mb-2">
        {icon}
      </div>
      <span className="text-white font-medium text-sm">{title}</span>
    </div>
  );
};

// Stat tile component for player stats display
const StatTile = ({ icon, label, value, className = "" }) => {
  return (
    <div className={`bg-black/30 rounded-lg border border-white/10 p-3 ${className}`}>
      <div className="flex items-center mb-1">
        {icon}
        <span className="text-xs text-gray-400 ml-1">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
};

// News update component for quick updates
const NewsUpdate = ({ title, time, category }) => {
  // Get category color
  const getCategoryColor = (cat) => {
    switch(cat.toLowerCase()) {
      case 'event': return 'bg-yellow-600/40 text-yellow-300';
      case 'shop': return 'bg-purple-600/40 text-purple-300';
      case 'maintenance': return 'bg-blue-600/40 text-blue-300';
      case 'update': return 'bg-green-600/40 text-green-300';
      default: return 'bg-gray-600/40 text-gray-300';
    }
  };
  
  return (
    <div className="bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors border border-white/5">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <span className="text-gray-400 text-xs">{time}</span>
        </div>
        <span className={`${getCategoryColor(category)} text-xs px-2 py-0.5 rounded-full`}>
          {category}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;