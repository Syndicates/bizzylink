/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Profile.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import VerificationCelebration from '../components/VerificationCelebration';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { MinecraftService, SocialService } from '../services/api';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import MinecraftAvatar from '../components/MinecraftAvatar';
import MinecraftInventory from '../components/MinecraftInventory';
import MinecraftAchievements from '../components/MinecraftAchievements';
import MinecraftPluginIntegrations from '../components/MinecraftPluginIntegrations';
import LevelProgressBar from '../components/LevelProgressBar';
import TitleSystem from '../components/TitleSystem';
import MinecraftPlayerModel3D from '../components/MinecraftPlayerModel3D';
import FriendButton from '../components/social/FriendButton';
import FollowButton from '../components/social/FollowButton';
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PhotoIcon,
  PencilIcon,
  MapPinIcon,
  BriefcaseIcon,
  BookmarkIcon,
  GiftIcon,
  HeartIcon,
  HandThumbUpIcon,
  ChatBubbleOvalLeftIcon,
  HomeIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import AnimatedPlayerStats from '../components/AnimatedPlayerStats';

// Convert timestamp to Facebook-style time format
const timeAgo = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  
  // Convert to seconds
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  
  // Convert to minutes
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  
  // Convert to hours
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  // Convert to days
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  // For older dates, use a more formal format
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Activity feed item component
const ActivityItem = ({ icon, title, description, time, children, type = 'default' }) => {
  return (
    <div className="bg-white/10 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 
          ${type === 'achievement' ? 'bg-yellow-600/50' : 
          type === 'kill' ? 'bg-red-600/50' : 
          type === 'build' ? 'bg-blue-600/50' :
          type === 'mine' ? 'bg-green-600/50' :
          'bg-gray-600/50'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-minecraft">{title}</h3>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
          {children && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {children}
            </div>
          )}
          <div className="flex items-center mt-3 text-sm text-gray-400">
            <button className="flex items-center hover:text-white mr-4">
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Like
            </button>
            <button className="flex items-center hover:text-white">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Friend component
const FriendItem = ({ username, avatar, status, online }) => {
  return (
    <div className="flex items-center mb-3">
      <div className="relative">
        <MinecraftAvatar 
          username={username}
          size={40}
          className="mr-3"
          type="head"
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{username}</p>
        <p className="text-xs text-gray-400">{status}</p>
      </div>
    </div>
  );
};

// Generate inventory items from player data
const generateInventoryItems = (inventoryData) => {
  if (!inventoryData) return [];
  
  const items = [];
  
  // Add main hand item if available
  if (inventoryData.main_hand && inventoryData.main_hand.name) {
    items.push({
      name: inventoryData.main_hand.name,
      count: inventoryData.main_hand.amount || 1,
      durability: inventoryData.main_hand.durability,
      label: inventoryData.main_hand.name.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    });
  }
  
  // Add hotbar and inventory items if available
  if (inventoryData.contents && Array.isArray(inventoryData.contents)) {
    inventoryData.contents.forEach(item => {
      if (item && item.name) {
        items.push({
          name: item.name,
          count: item.amount || 1,
          durability: item.durability,
          label: item.name.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        });
      }
    });
  }
  
  // Add valuables as items if available and not already added
  if (inventoryData.valuables) {
    if (inventoryData.valuables.diamond > 0) {
      items.push({
        name: 'diamond',
        count: inventoryData.valuables.diamond,
        label: 'Diamond'
      });
    }
    
    if (inventoryData.valuables.emerald > 0) {
      items.push({
        name: 'emerald',
        count: inventoryData.valuables.emerald,
        label: 'Emerald'
      });
    }
    
    if (inventoryData.valuables.gold > 0) {
      items.push({
        name: 'gold_ingot',
        count: inventoryData.valuables.gold,
        label: 'Gold Ingot'
      });
    }
    
    if (inventoryData.valuables.netherite > 0) {
      items.push({
        name: 'netherite_ingot',
        count: inventoryData.valuables.netherite,
        label: 'Netherite Ingot'
      });
    }
  }
  
  return items;
};

// Main Profile Component
const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  // Get context with fallbacks
  const socialContext = useSocial() || {};
  
  // Provide default values
  const { 
    getRelationship = async () => ({ status: 'not_friends', following: false }),
    friendRequests = [] 
  } = socialContext;
  const [profileUser, setProfileUser] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [selectedTab, setSelectedTab] = useState('wall');
  const [coverImage, setCoverImage] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [wallPosts, setWallPosts] = useState([]);
  const [newWallPost, setNewWallPost] = useState('');
  const [friends, setFriends] = useState([]);
  const [viewMode, setViewMode] = useState('avatar');
  const [relationship, setRelationship] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false); // Add state for celebration
  const [mcUsername, setMcUsername] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  // Add state for wallpaper loading
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
  // Add state to track available wallpapers
  const [availableWallpapers, setAvailableWallpapers] = useState([]);
  // Add state for wallpaper confirmation modal
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [pendingWallpaperId, setPendingWallpaperId] = useState(null);
  
  // Predefined cover banner options
  const coverOptions = [];
  
  // Predefined wallpaper options (id, label)
const WALLPAPERS = [
  { id: 'herobrine_hill', label: 'Herobrine Hill' },
  { id: 'quick_hide', label: 'Quick Hide' },
  { id: 'malevolent', label: 'Malevolent' },
  { id: 'sunset_lake', label: 'Sunset Lake', custom: true },
  { id: 'pink_sky', label: 'Pink Sky', custom: true },
  { id: 'night_adventure', label: 'Night Adventure', custom: true },
  { id: 'wallpaper_1', label: 'Forest View', custom: true, extension: 'jpg' },
  { id: 'wallpaper_2', label: 'Mountain Sunset', custom: true, extension: 'jpg' },
  { id: 'wallpaper_3', label: 'Night Sky', custom: true, extension: 'png' }
];
  
  // Check which wallpapers are available
useEffect(() => {
  const checkWallpaperAvailability = async () => {
    // First detect which local wallpapers actually exist
    const localWallpapers = WALLPAPERS.filter(wp => wp.custom);
    const availableLocalWallpapers = [];
    
    // Reset available wallpapers array to start fresh
    setAvailableWallpapers([]);
    
    // Check each local wallpaper and add it if it exists
    for (const wallpaper of localWallpapers) {
      const img = new Image();
      const src = getWallpaperUrl(wallpaper.id, 'Steve');
      console.log(`Checking wallpaper: ${wallpaper.id} at ${src}`);
      img.onload = () => {
        console.log(`Wallpaper ${wallpaper.id} loaded successfully`);
        setAvailableWallpapers(prev => {
          if (!prev.some(wp => wp.id === wallpaper.id)) {
            return [...prev, wallpaper];
          }
          return prev;
        });
      };
      img.onerror = () => {
        console.warn(`Wallpaper ${wallpaper.id} failed to load`);
      };
      img.src = src;
    }
    
    // In parallel, check external wallpapers
    const checkExternalWallpapers = async () => {
      const externalWallpapers = WALLPAPERS.filter(wp => !wp.custom);
      if (externalWallpapers.length === 0) return;
      
      try {
        const testUrl = getWallpaperUrl(externalWallpapers[0].id, 'Steve');
        const response = await fetch(testUrl, { method: 'HEAD', timeout: 3000 });
        
        if (response.ok) {
          // Add external wallpapers to the available list
          setAvailableWallpapers(prev => [...prev, ...externalWallpapers]);
        }
      } catch (error) {
        console.warn('External wallpapers not available:', error);
      }
    };
    
    // Start checking external wallpapers without awaiting
    checkExternalWallpapers();
  };
  
  checkWallpaperAvailability();
}, []);
  
  // Helper to get wallpaper URL for a given id and username
const getWallpaperUrl = (id, username) => {
  // Check if this is one of our custom wallpapers
  const wallpaper = WALLPAPERS.find(wp => wp.id === id);
  if (wallpaper && wallpaper.custom) {
    // Use the specified extension if available, otherwise default to jpg
    const extension = wallpaper.extension || 'jpg';
    return `/minecraft-assets/wallpapers/${id}.${extension}`;
  }
  // Use the external service for standard wallpapers
  return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${username}`;
};
  
  // Helper to get thumbnail (use a default player for preview)
const getWallpaperThumb = (id) => {
  // Check if this is one of our custom wallpapers
  const wallpaper = WALLPAPERS.find(wp => wp.id === id);
  if (wallpaper && wallpaper.custom) {
    // Use the specified extension if available, otherwise default to jpg
    const extension = wallpaper.extension || 'jpg';
    return `/minecraft-assets/wallpapers/${id}.${extension}`;
  }
  // Use the external service for standard wallpapers
  return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/Steve?thumb=1`;
};
  
  // Map usernames to default covers to make each profile feel unique
  const getDefaultCover = (username) => {
    // Always use a valid wallpaperId and username
    return getWallpaperUrl('herobrine_hill', username || 'Steve');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch profile data
  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController(); // For cleanup of fetch requests
    const signal = controller.signal;
    
    // Cache mechanism 
    const CACHE_DURATION = 60000; // 60 seconds
    const profileCacheKey = `profile_${username || 'me'}`;
    const cachedData = sessionStorage.getItem(profileCacheKey);
    const cachedTimestamp = sessionStorage.getItem(`${profileCacheKey}_timestamp`);
    const now = Date.now();
    const isCacheValid = cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp, 10) < CACHE_DURATION);
    
    const fetchProfileData = async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setNotFound(false);
        // Check if viewing own profile
        const isOwn = user && (user.username === username || (!username && user));
        setIsOwnProfile(isOwn);
        // Use currently logged in user for "me" profile
        const targetUsername = username || (user ? user.username : null);
        if (!targetUsername) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Try to fetch user by website username first
        let websiteUser = null;
        try {
          const userRes = await API.get(`/api/user/by-username/${targetUsername}`);
          websiteUser = userRes.data && userRes.data.user ? userRes.data.user : null;
        } catch (e) {
          websiteUser = null;
        }
        let mcUsernameToUse = targetUsername;
        if (websiteUser && websiteUser.minecraftUsername) {
          mcUsernameToUse = websiteUser.minecraftUsername;
        }
        // Now fetch player stats using the correct Minecraft username
        let completeStats = {
          playtime: '0h', lastSeen: 'Never', balance: 0, blocksMined: 0, mobsKilled: 0, deaths: 0, joinDate: websiteUser ? formatDate(websiteUser.createdAt) : 'N/A', achievements: 0, level: 1, experience: 0, rank: 'Member', group: 'default', groups: ['default'], world: 'world', gamemode: 'SURVIVAL', online: false
        };
        try {
          const playerStatsRes = await MinecraftService.getPlayerStats(mcUsernameToUse);
          console.log('Player Stats API Response:', playerStatsRes.data);
          // Merge API data, prioritizing API values
          completeStats = {
            ...completeStats,
            ...playerStatsRes.data.data, // Access the nested 'data' object
            // Ensure specific fields are handled correctly after merge if needed
            // Example: playtime might need specific formatting
          };
          console.log('Using completeStats:', completeStats);
          if (isMounted) {
            setPlayerStats(completeStats);
          }
        } catch (playerStatsError) {
          console.error('Failed to fetch player stats:', playerStatsError);
          // Use fallback stats if API fails
          if (isMounted) {
            setPlayerStats({
              playtime: '0h', lastSeen: 'Never', balance: 0, blocksMined: 0, mobsKilled: 0, deaths: 0, joinDate: websiteUser ? formatDate(websiteUser.createdAt) : 'N/A', achievements: 0, level: 1, experience: 0, rank: 'Member', group: 'default'
            });
          }
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Set profile user data
        let userProfileData;
        if (isOwn && user) {
          userProfileData = user;
          setProfileUser(user);
        } else if (websiteUser) {
          userProfileData = websiteUser;
          setProfileUser(websiteUser);
        } else {
          userProfileData = { username: mcUsernameToUse, mcUsername: mcUsernameToUse, createdAt: completeStats.joinDate, role: completeStats.rank || 'Member', titles: completeStats.titles || [], activeTitle: completeStats.activeTitle, _id: completeStats.userId || 'user-' + Math.random().toString(36).substr(2, 9) };
          setProfileUser(userProfileData);
        }
        // Prevent excessive API calls for relationship status
        let relationshipData = { status: 'not_friends', following: false };
        
        if (!isOwn && isMounted) {
          try {
            // Only fetch relationship data if we're viewing someone else's profile and component is still mounted
            // Remove all special-case logic for n0t_awake and bizzy
            const userAccountName = userProfileData.username;
            const userMinecraftName = userProfileData.mcUsername;
            console.log(`Getting relationship for user ${userAccountName} (MC: ${userMinecraftName})`);
            // Use a rate-limited API call with cache
            const cacheKey = `relationship_${userAccountName}_${Date.now() - (Date.now() % 300000)}`; // Cache key with 5-minute granularity
            const cachedRelationship = sessionStorage.getItem(cacheKey);
            if (cachedRelationship) {
              relationshipData = JSON.parse(cachedRelationship);
              console.log('Using cached relationship data:', relationshipData);
            } else {
              try {
                // Fetch relationship with timeout
                const fetchRelationshipPromise = getRelationship(userAccountName, userMinecraftName);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Relationship fetch timeout')), 3000)
                );
                const relationshipResponse = await Promise.race([fetchRelationshipPromise, timeoutPromise]);
                console.log('API relationship response:', relationshipResponse);
                if (relationshipResponse) {
                  relationshipData = {
                    status: relationshipResponse.status || 'not_friends',
                    following: relationshipResponse.following || false
                  };
                  // Cache the relationship data
                  sessionStorage.setItem(cacheKey, JSON.stringify(relationshipData));
                }
              } catch (err) {
                console.warn('Error fetching relationship, using default');
              }
            }
            if (isMounted) {
              setRelationship(relationshipData);
            }
          } catch (relationshipError) {
            console.error('Error fetching relationship status:', relationshipError);
            if (isMounted) {
              setRelationship({ status: 'not_friends', following: false });
            }
          }
        }
        
        // Fetch or generate friend data
        let friendsList = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          friendsList = await fetchFriends(targetUsername);
          if (isMounted) {
            setFriends(friendsList);
          }
        } catch (err) {
          console.warn('Error with friends, using defaults');
          // Use generic fallback but don't re-fetch
        }
        
        // Generate or fetch wall posts
        let posts = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          posts = await generateWallPosts(targetUsername, completeStats);
          if (isMounted) {
            setWallPosts(posts);
          }
        } catch (err) {
          console.warn('Error with wall posts, using defaults:', err);
          // Use generic fallback but don't re-fetch
          if (isMounted) {
            setWallPosts([]);
          }
        }
        
        // Cache the full profile data to prevent repeated API calls
        if (isMounted) {
          try {
            // Convert wall posts to a cacheable format
            const cachablePosts = posts.map(post => {
              let iconType = 'UserIcon';
              if (post.icon && post.icon.type && post.icon.type.name) {
                iconType = post.icon.type.name;
              }
              
              return {
                ...post,
                icon: iconType
              };
            });
            
            const cacheData = {
              profileUser: userProfileData,
              playerStats: completeStats,
              relationship: relationshipData,
              friends: friendsList,
              wallPosts: cachablePosts
            };
            
            sessionStorage.setItem(profileCacheKey, JSON.stringify(cacheData));
            sessionStorage.setItem(`${profileCacheKey}_timestamp`, now.toString());
          } catch (err) {
            console.warn('Failed to cache profile data:', err);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in profile data fetch:', error);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };
    
    // Only fetch if component is mounted
    if (isMounted) {
      fetchProfileData();
    }
    
    return () => { 
      isMounted = false; 
      controller.abort();
    };
    // We specifically exclude getRelationship because it can change
    // between renders and cause infinite loops
  }, [user, username]);

  // Fetch real friends with memoization to prevent re-renders
  const fetchFriends = async (username) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `friends_${username}`;
    const cachedFriends = sessionStorage.getItem(cacheKey);
    
    if (cachedFriends) {
      try {
        return JSON.parse(cachedFriends);
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }
    
    try {
      // Try to get real friends data first
      const response = await SocialService.getFriends(username);
      if (response && response.data && Array.isArray(response.data.friends)) {
        // Cache the response
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data.friends));
        } catch (e) {
          // Failed to cache, but we can still use the data
        }
        return response.data.friends;
      }
    } catch (error) {
      console.warn('Error fetching friends, using fallback:', error);
    }
    
    // Fallback with reasonable data if API fails
    const fallbackFriends = [
      { username: 'DiamondDigger', status: 'Mining diamonds', online: true },
      { username: 'CreeperSlayer', status: 'Fighting mobs', online: true },
      { username: 'RedstoneWizard', status: 'Building circuits', online: false },
      { username: 'MinerSteve', status: 'Last seen 2 hours ago', online: false },
    ];
    
    // Cache the fallback data to prevent repeated API calls
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(fallbackFriends));
    } catch (e) {
      // Failed to cache, but we can still use the data
    }
    
    return fallbackFriends;
  };
  
  // Generate wall posts with memoization to prevent re-renders
  const generateWallPosts = async (username, stats) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `wall_posts_${username}`;
    const cachedPosts = sessionStorage.getItem(cacheKey);
    
    if (cachedPosts) {
      try {
        // When loading from cache, we need to convert any stored icon objects back to React elements
        const parsedPosts = JSON.parse(cachedPosts);
        return parsedPosts.map(post => ({
          ...post,
          // Recreate the icon element if it was stringified
          icon: typeof post.icon === 'object' ? 
            <UserIcon className="h-5 w-5 text-white" /> : post.icon
        }));
      } catch (e) {
        // Invalid cache, continue to fetch
        console.warn("Error parsing cached wall posts:", e);
      }
    }
    
    try {
      // Try to get real wall posts first
      const response = await SocialService.getWallPosts(username);
      if (response && response.data && Array.isArray(response.data.posts)) {
        // Store simplified version without React elements for caching
        const cachablePosts = response.data.posts.map(post => ({
          ...post,
          // Convert icon to string representation for storage
          icon: 'UserIcon'
        }));
        
        // Cache the simplified posts
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cachablePosts));
        } catch (e) {
          // Failed to cache, but we can still use the data
          console.warn("Failed to cache wall posts:", e);
        }
        
        return response.data.posts;
      }
    } catch (error) {
      console.warn('Error fetching wall posts, using fallbacks:', error);
    }
    
    // Create reasonable fallback posts based on user data
    const defaultIcon = <UserIcon className="h-5 w-5 text-white" />;
    
    const posts = [
      {
        id: Date.now(),
        type: 'default',
        title: `${username}'s Profile`,
        description: 'Welcome to my Minecraft profile!',
        time: 'Just now',
        icon: defaultIcon
      }
    ];
    
    // Cache simplified version for storage
    const cachablePosts = [
      {
        id: Date.now(),
        type: 'default',
        title: `${username}'s Profile`,
        description: 'Welcome to my Minecraft profile!',
        time: 'Just now',
        icon: 'UserIcon'
      }
    ];
    
    // Cache the fallback data to prevent repeated API calls
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cachablePosts));
    } catch (e) {
      // Failed to cache, but we can still use the data
      console.warn("Failed to cache default wall posts:", e);
    }
    
    return posts;
  };
  
  // Listen for minecraft_linked events to refresh the profile
  useEffect(() => {
    const handleMinecraftLinked = (event) => {
      console.log('🎮 Minecraft account linked event received:', event.detail);
      // Show celebration notification
      setNotification({
        show: true,
        type: 'success',
        message: `Your Minecraft account (${event.detail.mcUsername}) has been successfully linked!`
      });
      // Enable celebration animation
      setShowCelebration(true);
      setMcUsername(event.detail.mcUsername);
      // Force the celebration to show with a slight delay to ensure DOM is ready
      setTimeout(() => {
        console.log('Showing celebration modal...');
        // Make sure the modal is visible in the DOM
        const modal = document.querySelector('.celebration-container');
        if (modal) {
          console.log('Modal found in DOM, ensuring visibility');
          modal.style.display = 'block';
          modal.style.opacity = '1';
          modal.style.zIndex = '9999';
        } else {
          console.log('Modal not found in DOM');
        }
        // Play a sound effect
        try {
          const audio = new Audio('/sounds/level-up.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
        } catch (e) {
          console.log('Audio not supported', e);
        }
      }, 500);
      // Refresh profile data
      if (user && (user.username === username || !username)) {
        // Use direct state updates instead
        setPlayerStats(prevStats => ({
          ...prevStats,
          mcUsername: event.detail.mcUsername,
          linked: true,
          balance: prevStats?.balance || 500,
          playtime: prevStats?.playtime || '10h',
          achievements: prevStats?.achievements || 42
        }));
        setProfileUser(prevUser => ({
          ...prevUser,
          mcUsername: event.detail.mcUsername,
          minecraft: {
            ...prevUser?.minecraft,
            linked: true,
            mcUsername: event.detail.mcUsername
          }
        }));
      }
      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
    };
    // Add event listener
    window.addEventListener('minecraft_linked', handleMinecraftLinked);
    // Cleanup
    return () => {
      window.removeEventListener('minecraft_linked', handleMinecraftLinked);
    };
  }, [user, username]);
  
  // Handle posting to wall
  const handleWallPost = (e) => {
    e.preventDefault();
    if (!newWallPost.trim()) return;
    
    // Add new post to the wall
    const newPost = {
      id: Date.now(),
      type: 'default',
      title: `${user.username} posted on ${profileUser.username === user.username ? 'their' : profileUser.username + "'s"} wall`,
      description: newWallPost,
      time: 'Just now',
      icon: <ChatBubbleLeftIcon className="h-5 w-5 text-white" />,
    };
    
    setWallPosts([newPost, ...wallPosts]);
    
    // Update cache with the new post
    try {
      const profileCacheKey = `profile_${username || 'me'}`;
      const cachedData = sessionStorage.getItem(profileCacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Convert the new post for caching
        const cacheablePost = {
          ...newPost,
          icon: 'ChatBubbleLeftIcon'
        };
        
        // Update cached wall posts
        parsedData.wallPosts = [cacheablePost, ...(parsedData.wallPosts || [])];
        
        // Update cache
        sessionStorage.setItem(profileCacheKey, JSON.stringify(parsedData));
        sessionStorage.setItem(`${profileCacheKey}_timestamp`, Date.now().toString());
      }
    } catch (e) {
      console.warn("Failed to update wall posts cache:", e);
    }
    
    setNewWallPost('');
    
    setNotification({
      show: true,
      type: 'success',
      message: 'Posted to wall!'
    });
  };
  
  // Toggle between 3D model and regular avatar
  const toggleViewMode = () => {
    console.log('Toggling view mode from', viewMode, 'to', viewMode === '3d' ? 'avatar' : '3d');
    setViewMode(prevMode => prevMode === '3d' ? 'avatar' : '3d');
  };
  
  // Change cover image
  const handleCoverChange = (imagePath) => {
    setCoverImage(imagePath);
    
    setNotification({
      show: true,
      type: 'success',
      message: 'Cover image updated!'
    });
  };
  
  // Force celebration for testing
  /*useEffect(() => {
    console.log('Setting up forced celebration test');
    const timer = setTimeout(() => {
      console.log('Forcing celebration to show for testing');
      setShowCelebration(true);
      setMcUsername('n0t_awake');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);*/
  
  // On profileUser or wallpaperId change, update cover image
  useEffect(() => {
    if (profileUser && (profileUser.wallpaperId || wallpaperId)) {
      const id = profileUser.wallpaperId || wallpaperId || WALLPAPERS[0].id;
      const uname = profileUser.mcUsername || profileUser.username || 'Steve';
      setWallpaperId(id);
      setCoverImage(getWallpaperUrl(id, uname));
    } else if (profileUser) {
      setWallpaperId(null);
      setCoverImage(getWallpaperUrl(WALLPAPERS[0].id, profileUser.mcUsername || profileUser.username || 'Steve'));
    }
  }, [profileUser]);
  
  // Change wallpaper handler
  const handleWallpaperSelect = async (id) => {
    if (savingWallpaper || wallpaperId === id) return;
    
    // Show confirmation dialog instead of immediately changing
    setPendingWallpaperId(id);
    setShowWallpaperModal(true);
  };
  
  // Confirm wallpaper change
  const confirmWallpaperChange = async () => {
    const id = pendingWallpaperId;
    setShowWallpaperModal(false);
    
    if (!id) return;
    
    setWallpaperId(id);
    const uname = profileUser.mcUsername || profileUser.username || 'Steve';
    setCoverImage(getWallpaperUrl(id, uname));
    setSavingWallpaper(true);
    
    try {
      await API.put('/api/user/profile', { wallpaperId: id });
      
             // Play sound effect on successful change
       try {
         const audio = new Audio('/sounds/level-up.mp3');
         audio.volume = 0.3; // Lower volume for this sound
         audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
       } catch (e) {
         console.log('Audio not supported', e);
       }
      
      setNotification({ show: true, type: 'success', message: 'Wallpaper updated!' });
    } catch (err) {
      setNotification({ show: true, type: 'error', message: 'Failed to update wallpaper.' });
      // Revert to previous
      setWallpaperId(profileUser.wallpaperId || null);
      setCoverImage(getWallpaperUrl(profileUser.wallpaperId || WALLPAPERS[0].id, uname));
    } finally {
      setSavingWallpaper(false);
      setPendingWallpaperId(null);
    }
  };
  
  // Preload wallpaper image when coverImage changes
  useEffect(() => {
    if (!coverImage) return;
    setWallpaperLoaded(false);
    const img = new window.Image();
    img.src = coverImage;
    img.onload = () => setWallpaperLoaded(true);
  }, [coverImage]);
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (notFound) {
    return (
      <div className="min-h-screen pt-24 py-20 minecraft-grid-bg bg-habbo-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-6">User Not Found</h1>
          <p className="text-gray-300 mb-8">The user profile you are looking for does not exist.</p>
          <Link to="/" className="habbo-btn text-center px-6 py-2">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return <LoadingSpinner fullScreen />;
  }
  
  // Custom skull icon
  const SkullIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  
  return (
    <div className="relative min-h-screen ...">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
          <div className="celebration-container relative z-50">
            <div className="celebration-title text-4xl font-bold text-green-500 mb-4 animate-bounce">
              🎮 Minecraft Account Linked! 🎉
            </div>
            <div className="celebration-subtitle text-2xl font-semibold text-white mb-6">
              {profileUser?.minecraft?.mcUsername ? `Welcome, ${profileUser.minecraft.mcUsername}!` : 'Welcome, Minecrafter!'}
            </div>
            <div className="celebration-items flex justify-center space-x-4">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="celebration-item"
                  style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `fall ${3 + Math.random() * 5}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 2 + 1}rem`,
                    opacity: 0.7
                  }}
                >
                  {['🎮', '⛏️', '🗡️', '🏹', '🧪', '🌳', '💎', '🏆', '🧱', '🔥'][Math.floor(Math.random() * 10)]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Add celebration CSS */}
      {showCelebration && (
        <style jsx="true">{`
          @keyframes fall {
            0% {
              transform: translateY(-20vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .celebration-container {
            text-align: center;
            z-index: 9999;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 2rem;
            border-radius: 1rem;
            animation: pulse 2s infinite;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            border: 2px solid #4ade80;
            max-width: 90%;
            width: 600px;
            pointer-events: auto;
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 255, 0, 0.8); }
            100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
          }
        `}</style>
      )}
      
      {/* Notification system */}
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      
      <div className="min-h-screen ...">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cover Banner with 3D Model */}
          <div className="relative rounded-t-md overflow-hidden mb-0 h-64 bg-cover bg-center" 
            style={{ backgroundImage: wallpaperLoaded ? `url(${coverImage})` : 'none', backgroundColor: '#222' }}>
            {/* Skeleton/blurred overlay while loading */}
            {!wallpaperLoaded && (
              <div className="absolute inset-0 bg-gray-900 animate-pulse blur-sm z-10" />
            )}
            
            {/* Cover change button (only for own profile) */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4 z-10">
                <div className="dropdown dropdown-end">
                  <button className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-md flex items-center" disabled={savingWallpaper}>
                    <PhotoIcon className="h-5 w-5 mr-2" />
                    <span>Change Cover</span>
                  </button>
                  <div className="dropdown-menu mt-2 bg-minecraft-navy-dark border border-white/20 p-3 rounded-md w-72 z-50 shadow-xl">
                    <div className="grid grid-cols-3 gap-2">
                      {availableWallpapers.length > 0 ? (
                        availableWallpapers.map((wp) => (
                          <button 
                            key={wp.id}
                            className={`block w-full h-16 bg-cover bg-center rounded border-2 transition-all duration-150 ${wallpaperId === wp.id ? 'border-green-400 ring-2 ring-green-400' : 'border-transparent'} ${savingWallpaper ? 'opacity-50 pointer-events-none' : 'hover:border-white'}`}
                            style={{ backgroundImage: `url(${getWallpaperThumb(wp.id)})` }}
                            onClick={() => handleWallpaperSelect(wp.id)}
                            aria-label={`Select ${wp.label} wallpaper`}
                            disabled={savingWallpaper}
                            title={wp.label}
                          />
                        ))
                      ) : (
                        <p className="text-gray-400 col-span-3 text-center py-4">Loading available wallpapers...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 3D Model or Avatar */}
            <div className="absolute bottom-0 left-12 transform translate-y-1/3 w-48 h-48">
              <div className="relative">
                {viewMode === '3d' ? (
                  <div className="w-48 h-48 border-4 border-white bg-minecraft-navy-dark rounded-lg shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="minecraft-3d-model relative w-full h-full">
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                          <div className="w-32 h-32 transform rotate-animation">
                            <MinecraftAvatar 
                              username={profileUser.mcUsername}
                              uuid={profileUser.mcUUID}
                              type="head"
                              size={128}
                              animate={false}
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-minecraft-navy-dark to-transparent z-0"></div>
                        <div className="absolute inset-0 bg-black/10 z-0"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 border-4 border-white bg-minecraft-navy-dark rounded-lg shadow-2xl overflow-hidden">
                    {playerStats ? (
                      <MinecraftPlayerModel3D
                        playerData={playerStats}
                        username={profileUser.mcUsername || profileUser.username}
                        initialView="model"
                        size="small"
                      />
                    ) : (
                      <MinecraftAvatar 
                        username={profileUser.mcUsername}
                        uuid={profileUser.mcUUID}
                        type="full"
                        size={192}
                        animate={false}
                      />
                    )}
                  </div>
                )}
                
                {/* Add custom CSS for 3D model animation */}
                <style jsx>{`
                  @keyframes rotate {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                  }
                  .rotate-animation {
                    animation: rotate 10s linear infinite;
                    transform-style: preserve-3d;
                  }
                `}</style>
                
                {/* Toggle view button */}
                <button 
                  className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80"
                  onClick={toggleViewMode}
                  type="button"
                  title={viewMode === '3d' ? 'Switch to regular view' : 'Switch to 3D view'}
                >
                  {viewMode === '3d' ? (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Profile Header */}
          <div className="bg-minecraft-navy-dark pt-20 pb-4 px-6 rounded-b-md border-b border-white/20 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
              <div>
                <div className="flex items-center gap-2">
                  {profileUser.activeTitle && playerStats && (
                    <TitleSystem 
                      playerData={playerStats} 
                      compact={true} 
                      selectedTitle={profileUser.activeTitle}
                    />
                  )}
                  <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">
                    {profileUser.username}
                    {profileUser.mcUsername && profileUser.mcUsername !== profileUser.username && (
                      <span className="text-sm text-gray-400 ml-2">({profileUser.mcUsername})</span>
                    )}
                  </h1>
                </div>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span className="mr-4">{profileUser.role || 'Member'}</span>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Joined: {formatDate(profileUser.createdAt)}</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                {!isOwnProfile && (
                  <>
                    <FriendButton 
                      username={profileUser.username}
                      mcUsername={profileUser.mcUsername} 
                      userId={profileUser._id} 
                      key={`friend-button-${relationship?.status}-${Date.now()}`}
                      initialStatus={relationship?.status}
                    />
                    
                    {relationship?.status !== 'friends' && (
                      <FollowButton 
                        username={profileUser.username} 
                        mcUsername={profileUser.mcUsername} 
                        userId={profileUser._id} 
                        key={`follow-button-${relationship?.following}-${Date.now()}`}
                        initialFollowing={relationship?.following || false}
                      />
                    )}
                  </>
                )}
                
                <button className="minecraft-btn flex items-center">
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  {isOwnProfile ? 'Update Status' : 'Send Message'}
                </button>
                
                {isOwnProfile && (
                  <Link to="/edit-profile" className="bg-minecraft-navy-light px-4 py-2 rounded-md text-sm text-white hover:bg-minecraft-navy flex items-center">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
            
            {/* Profile Tabs */}
            <div className="flex mt-6 border-b border-white/10 overflow-x-auto pb-px">
              <button
                onClick={() => setSelectedTab('wall')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'wall' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setSelectedTab('info')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'info' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setSelectedTab('stats')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'stats' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setSelectedTab('inventory')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'inventory' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setSelectedTab('achievements')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'achievements' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Achievements
              </button>
              <button
                onClick={() => setSelectedTab('photos')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'photos' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Screenshots
              </button>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Information
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Location:</p>
                      <p>{playerStats?.world || 'Overworld'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Rank:</p>
                      <p>{playerStats?.rank || profileUser.role || 'Member'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Gamemode:</p>
                      <p>{playerStats?.gamemode || 'SURVIVAL'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Playtime:</p>
                      <p>{playerStats?.playtime || '0h'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Balance:</p>
                      <p className="text-minecraft-habbo-yellow">${playerStats?.balance || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Social Stats Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Social
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <UserIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Friends:</p>
                      <p>{friends.length || playerStats?.friendsCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <UsersIcon className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Followers:</p>
                      <p>{playerStats?.followersCount || 7}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <HeartIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Following:</p>
                      <p>{playerStats?.followingCount || 5}</p>
                    </div>
                  </div>
                  
                  <Link to="/friends" className="block text-center text-minecraft-habbo-blue hover:text-minecraft-habbo-green mt-3 text-xs">
                    View all social connections
                  </Link>
                </div>
              </div>
              
              {/* Level Display Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Level
                </h2>
                
                <LevelProgressBar 
                  level={playerStats?.level || 1} 
                  experience={playerStats?.experience || 0} 
                />
                
                <div className="mt-3 text-center">
                  <span className="text-xl font-minecraft">Level {playerStats?.level || 1}</span>
                </div>
              </div>
              
              {/* Friends Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>Friends ({friends.length})</span>
                  <Link to="#" className="text-sm text-minecraft-habbo-green hover:underline">
                    See All
                  </Link>
                </h2>
                
                <div className="space-y-1">
                  {friends.map((friend, index) => (
                    <FriendItem 
                      key={index}
                      username={friend.username}
                      status={friend.status}
                      online={friend.online}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Wall Tab */}
              {selectedTab === 'wall' && (
                <div>
                  {/* Post to Wall Form */}
                  <div className="habbo-card p-5 rounded-md mb-6">
                    <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4">
                      {isOwnProfile ? 'Update Your Status' : `Write on ${profileUser.username}'s Wall`}
                    </h2>
                    
                    <form onSubmit={handleWallPost}>
                      <textarea
                        value={newWallPost}
                        onChange={(e) => setNewWallPost(e.target.value)}
                        className="w-full p-3 bg-minecraft-navy-light border border-white/10 rounded-md text-white placeholder-gray-500 focus:border-minecraft-habbo-blue focus:ring focus:ring-minecraft-habbo-blue focus:ring-opacity-50"
                        placeholder={isOwnProfile ? "What's on your mind?" : `Write something to ${profileUser.username}...`}
                        rows={3}
                      ></textarea>
                      <div className="flex justify-end mt-3">
                        <button 
                          type="submit"
                          className="habbo-btn px-4 py-2"
                          disabled={!newWallPost.trim()}
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {/* Activity Feed */}
                  <div className="space-y-4">
                    {wallPosts.map((post) => (
                      <ActivityItem
                        key={post.id}
                        icon={post.icon}
                        title={post.title}
                        description={post.description}
                        time={post.time}
                        type={post.type}
                      >
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="w-full h-auto rounded-md object-cover"
                          />
                        )}
                      </ActivityItem>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Info Tab */}
              {selectedTab === 'info' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Player Info
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-2">
                        Basic Information
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Username:</span>
                          <span>{profileUser.username}</span>
                        </div>
                        
                        {profileUser.mcUsername && profileUser.mcUsername !== profileUser.username && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Minecraft Username:</span>
                            <span>{profileUser.mcUsername}</span>
                          </div>
                        )}
                        
                        {profileUser.mcUUID && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">UUID:</span>
                            <span className="font-mono text-xs">{profileUser.mcUUID}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rank:</span>
                          <span>{playerStats?.rank || profileUser.role || 'Member'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Joined:</span>
                          <span>{formatDate(profileUser.createdAt)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Seen:</span>
                          <span>{playerStats?.lastSeen || 'Never'}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mt-6 mb-2">
                        Game Status
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">World:</span>
                          <span>{playerStats?.world || 'Overworld'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gamemode:</span>
                          <span>{playerStats?.gamemode || 'SURVIVAL'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Level:</span>
                          <span>{playerStats?.level || 1}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playtime:</span>
                          <span>{playerStats?.playtime || '0h'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-2">
                        External Links
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        <a 
                          href={`https://namemc.com/profile/${profileUser.mcUsername || profileUser.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          View on NameMC
                        </a>
                        
                        <a 
                          href={`https://mc-heads.net/body/${profileUser.mcUsername || profileUser.username}/right`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          View Full Skin
                        </a>
                      </div>
                      
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mt-6 mb-2">
                        Plugin Data
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        {playerStats?.mcmmo_data ? (
                          <div className="bg-minecraft-navy-light p-3 rounded-md">
                            <p className="font-medium mb-1">mcMMO Stats</p>
                            <p className="text-gray-400">Power Level: {playerStats.mcmmo_data.power_level || 0}</p>
                          </div>
                        ) : (
                          <div className="bg-minecraft-navy-light p-3 rounded-md text-gray-400">
                            No mcMMO data available
                          </div>
                        )}
                        
                        {playerStats?.jobs_data ? (
                          <div className="bg-minecraft-navy-light p-3 rounded-md">
                            <p className="font-medium mb-1">Jobs</p>
                            <p className="text-gray-400">Active Jobs: {Object.keys(playerStats.jobs_data).length}</p>
                          </div>
                        ) : (
                          <div className="bg-minecraft-navy-light p-3 rounded-md text-gray-400">
                            No Jobs data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats Tab */}
              {selectedTab === 'stats' && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Player Statistics</h3>
                        
                        {playerStats && (
                          <AnimatedPlayerStats 
                            initialStats={playerStats}
                            className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner"
                            showTitle={false}
                            disablePolling={true}
                          />
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Game Progress</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          <div className="mb-4">
                            <LevelProgressBar 
                              level={playerStats?.level || 1}
                              experience={playerStats?.experience || 0}
                              nextLevelExperience={playerStats?.next_level_experience || 100}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <StatCard
                              icon={<TrophyIcon className="h-5 w-5 text-yellow-400" />}
                              label="Level"
                              value={playerStats?.level || 1}
                            />
                            <StatCard
                              icon={<ChartBarIcon className="h-5 w-5 text-green-400" />}
                              label="Experience"
                              value={playerStats?.experience || 0}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Player Titles</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          {playerStats && (
                            <TitleSystem 
                              playerData={playerStats}
                              compact={false}
                              selectedTitle={profileUser?.activeTitle}
                              readOnly={!isOwnProfile}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Inventory</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          {playerStats?.inventory ? (
                            <MinecraftInventory 
                              items={generateInventoryItems(playerStats.inventory)}
                              username={profileUser.mcUsername}
                            />
                          ) : (
                            <div className="text-center text-gray-400 py-4">
                              Inventory data not available
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Achievements</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          <MinecraftAchievements 
                            achievements={playerStats?.achievements || []}
                            totalAchievements={playerStats?.total_achievements || 0}
                            username={profileUser.mcUsername}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Plugin Statistics</h3>
                    <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                      <MinecraftPluginIntegrations playerData={playerStats} username={profileUser.mcUsername} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Inventory Tab */}
              {selectedTab === 'inventory' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Player Inventory
                  </h2>
                  
                  {playerStats?.inventory ? (
                    <div>
                      {/* Main hand callout */}
                      {playerStats.inventory.main_hand && playerStats.inventory.main_hand.name && (
                        <div className="mb-4 bg-minecraft-navy-light p-3 rounded-md flex items-center">
                          <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center mr-4">
                            <img 
                              src={`https://minecraft-api.com/api/items/${playerStats.inventory.main_hand.name.replace(/_/g, '')}/image`} 
                              alt=""
                              className="w-10 h-10"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=MC' }}
                            />
                          </div>
                          <div>
                            <div className="text-md font-medium">Main Hand</div>
                            <div className="text-sm text-gray-400">
                              {playerStats.inventory.main_hand.name.replace(/_/g, ' ')
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                              {playerStats.inventory.main_hand.amount > 1 && (
                                <span className="ml-1">×{playerStats.inventory.main_hand.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Inventory grid */}
                      <MinecraftInventory 
                        items={generateInventoryItems(playerStats.inventory)}
                        columns={9}
                        slotSize={50}
                        className="mx-auto"
                        showLabels={true}
                      />
                      
                      {/* Armor display */}
                      {playerStats.inventory.armor && Object.values(playerStats.inventory.armor).some(item => item) && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <h3 className="text-md font-medium mb-4">Equipped Armor</h3>
                          <div className="flex justify-center space-x-4">
                            {['helmet', 'chestplate', 'leggings', 'boots'].map(piece => (
                              playerStats.inventory.armor[piece] ? (
                                <div key={piece} className="bg-minecraft-navy-light p-2 rounded-md text-center">
                                  <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center mx-auto">
                                    <img 
                                      src={`https://minecraft-api.com/api/items/${playerStats.inventory.armor[piece].name.replace(/_/g, '')}/image`}
                                      alt={piece}
                                      className="w-10 h-10"
                                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=MC' }}
                                    />
                                  </div>
                                  <p className="text-xs mt-1 capitalize">{piece}</p>
                                </div>
                              ) : (
                                <div key={piece} className="bg-minecraft-navy-light p-2 rounded-md text-center">
                                  <div className="w-12 h-12 bg-gray-800/50 rounded-md flex items-center justify-center mx-auto opacity-50">
                                    <span className="text-gray-500">✖</span>
                                  </div>
                                  <p className="text-xs mt-1 text-gray-500 capitalize">{piece}</p>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Valuables summary */}
                      {playerStats.inventory.valuables && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <h3 className="text-md font-medium mb-4">Valuable Resources</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-blue-400">Diamonds</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.diamond || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-green-500">Emeralds</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.emerald || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-yellow-500">Gold</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.gold || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-gray-500">Iron</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.iron || 0}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <p className="text-lg text-gray-400">No inventory data available</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                        Player inventory data is updated when they are online or manually sync their data.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Achievements Tab */}
              {selectedTab === 'achievements' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                    <span>Player Achievements</span>
                    <span className="text-minecraft-habbo-yellow">
                      {playerStats?.achievement_percentage ? 
                        `${playerStats.achievements}/${playerStats.advancements?.total || 30} (${playerStats.achievement_percentage}%)` : 
                        `${playerStats?.achievements || 0}/30 Completed`}
                    </span>
                  </h2>
                  
                  {/* Progress bar */}
                  <div className="habbo-progress-bar mb-6">
                    <div style={{ 
                      width: `${playerStats?.achievement_percentage || ((playerStats?.achievements || 0) / 30) * 100}%`,
                      background: 'linear-gradient(to right, #54AA54, #9C44DC)'
                    }}></div>
                  </div>
                  
                  {/* Advancement list */}
                  {playerStats?.advancements && playerStats.advancements.list && playerStats.advancements.list.length > 0 ? (
                    <MinecraftAchievements 
                      advancements={playerStats.advancements.list}
                      count={playerStats.achievements || 0}
                      total={playerStats.advancements.total || 30}
                      percentage={playerStats.achievement_percentage || 0}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="text-lg text-gray-400">No achievement data available</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                        Achievement data will be displayed here once the player has earned some achievements.
                      </p>
                    </div>
                  )}
                  
                  {/* Recent achievements */}
                  {playerStats?.recent_achievements && playerStats.recent_achievements.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <h3 className="text-md font-medium mb-4">Recently Earned</h3>
                      <div className="space-y-3">
                        {playerStats.recent_achievements.map((achievement, idx) => (
                          <div key={idx} className="bg-minecraft-navy-light p-3 rounded-md flex items-center">
                            <div className="w-10 h-10 bg-yellow-600/30 rounded-md flex items-center justify-center mr-3">
                              <GiftIcon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium">{achievement.name}</p>
                              <p className="text-xs text-gray-400">{timeAgo(achievement.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Photos/Screenshots Tab */}
              {selectedTab === 'photos' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                    <span>Screenshots</span>
                    <button className="text-sm text-minecraft-habbo-green hover:underline">
                      Upload New
                    </button>
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      'https://i.imgur.com/dfDOOu3.jpg',
                      'https://i.imgur.com/LSJzTH9.jpg',
                      'https://i.imgur.com/XlsCkd5.jpg',
                      'https://i.imgur.com/5Kh7LI1.jpg',
                      'https://i.imgur.com/pHRUbFI.jpg',
                      'https://i.imgur.com/rEKwsGZ.jpg'
                    ].map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imageUrl}
                          alt={`Minecraft Screenshot ${index+1}`}
                          className="w-full h-40 object-cover rounded-md group-hover:brightness-75 transition-all duration-200"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                            View
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(Date.now() - ((index+1) * 86400000))}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty state (commented out) */}
                  {/*
                  <div className="text-center py-12">
                    <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-400">No screenshots yet</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                      Upload some screenshots of your Minecraft adventures to show them off here!
                    </p>
                    <button className="habbo-btn mt-4 px-4 py-2">
                      Upload Screenshot
                    </button>
                  </div>
                  */}
                </div>
              )}
            </div>
            
            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Quick Stats
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span>{playerStats?.level || 1}</span>
                  </div>
                  
                  {/* Show active title if available */}
                  {profileUser.activeTitle && playerStats && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Title:</span>
                      <TitleSystem 
                        playerData={playerStats} 
                        compact={true}
                        selectedTitle={profileUser.activeTitle}
                      />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-minecraft-habbo-yellow">${playerStats?.balance || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blocks Mined:</span>
                    <span>{(playerStats?.blocks_mined || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mobs Killed:</span>
                    <span>{(playerStats?.mobs_killed || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deaths:</span>
                    <span>{(playerStats?.deaths || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Achievements:</span>
                    <span>{(playerStats?.achievements || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Online Status */}
              <div className="habbo-card p-5 rounded-md">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${playerStats?.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue">
                    Status
                  </h2>
                </div>
                <p className="text-sm">
                  {playerStats?.online ? (
                    <span className="text-green-400">Online Now</span>
                  ) : (
                    <span className="text-gray-400">
                      Last seen: {playerStats?.lastSeen || 'Never'}
                    </span>
                  )}
                </p>
                
                {playerStats?.online && playerStats?.world && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current World:</span>
                      <span>{playerStats.world}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Gamemode:</span>
                      <span>{playerStats.gamemode}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Plugin Integrations */}
              {(playerStats?.mcmmo_data || playerStats?.jobs_data || playerStats?.towny_data) && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Plugin Data
                  </h2>
                  
                  <MinecraftPluginIntegrations 
                    integrationData={{
                      mcmmo_data: playerStats.mcmmo_data,
                      jobs_data: playerStats.jobs_data,
                      towny_data: playerStats.towny_data
                    }}
                  />
                </div>
              )}
              
              {/* Links to other profiles */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Other Players
                </h2>
                
                <div className="space-y-3">
                  {friends.map((friend, index) => (
                    <Link 
                      key={index}
                      to={`/profile/${friend.username}`}
                      className="flex items-center p-2 rounded-md hover:bg-minecraft-navy-light"
                    >
                      <MinecraftAvatar 
                        username={friend.username}
                        size={32}
                        className="mr-3"
                        type="head"
                      />
                      <span>{friend.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Celebration Button - Only visible for admins or in development */}
      {(process.env.NODE_ENV === 'development' || (user && user.role === 'admin')) && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Test celebration button removed to ensure it only shows when verified on Minecraft */}
        </div>
      )}
      
      {/* Wallpaper Confirmation Modal */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">Change Wallpaper?</h3>
            <p className="text-gray-300 mb-4">
              This will change your profile wallpaper and also affect how your posts appear in forums.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmWallpaperChange}
                className="habbo-btn px-4 py-2"
              >
                Change Wallpaper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
    <div className="flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default Profile;