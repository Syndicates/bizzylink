/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file SocialContext.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// src/contexts/SocialContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import FriendService from '../services/friendService';
import { clearApiCache } from '../services/api';

// Create the Social context
const SocialContext = createContext();

// Custom hook to use the social context
export function useSocial() {
  return useContext(SocialContext);
}

// Provider component for social functionality
export function SocialProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Friend data
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  
  // Following data
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  
  // Notification data
  const [notifications, setNotifications] = useState([]);
  
  // Settings
  const [settings, setSettings] = useState({
    notifications: {
      friendRequests: true,
      newFollowers: true,
      friendActivity: true,
      inGame: true
    },
    privacy: {
      profileVisibility: 'public',
      allowFriendRequests: true,
      allowFollowers: true
    }
  });
  
  // Calculate unreadCount from notifications
  const unreadCount = useMemo(() =>
    Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0,
    [notifications]
  );
  
  // Ensure all social arrays are initialized properly
  useEffect(() => {
    if (!Array.isArray(friends)) setFriends([]);
    if (!Array.isArray(friendRequests)) setFriendRequests([]);
    if (!Array.isArray(following)) setFollowing([]);
    if (!Array.isArray(followers)) setFollowers([]);
    if (!Array.isArray(notifications)) setNotifications([]);
  }, [friends, friendRequests, following, followers, notifications]);
  
  // Helper to merge notifications arrays, avoiding duplicates
  function mergeNotifications(existing, incoming) {
    const map = new Map();
    // Add existing notifications
    for (const n of existing) {
      if (n._id) {
        map.set(n._id, n);
      } else {
        map.set(`${n.subtype}_${n.postId}_${n.sender?._id}`, n);
      }
    }
    // Add/overwrite with incoming notifications
    for (const n of incoming) {
      if (n._id) {
        map.set(n._id, n);
      } else {
        map.set(`${n.subtype}_${n.postId}_${n.sender?._id}`, n);
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Load initial data when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    // Load all social data
    const loadSocialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load friends and friend requests
        const friendsRes = await FriendService.getFriends();
        setFriends(friendsRes.data?.friends ?? friendsRes.friends ?? []);
        
        // Load friend requests
        const requestsRes = await FriendService.getFriendRequests();
        console.log('Setting friend requests from initial load:', requestsRes.data ?? requestsRes);
        setFriendRequests(requestsRes.data?.friendRequests ?? requestsRes.friendRequests ?? []);
        setSentRequests(requestsRes.data?.sent ?? requestsRes.sent ?? []);
        setReceivedRequests(requestsRes.data?.received ?? requestsRes.received ?? []);
        
        // Load following/followers
        const followingRes = await FriendService.getFollowing();
        setFollowing(followingRes.data?.following ?? followingRes.following ?? []);
        setFollowers(followingRes.data?.followers ?? followingRes.followers ?? []);
        
        // Load notifications
        const notificationsRes = await FriendService.getNotifications(1, 5, true);
        setNotifications(prev => mergeNotifications(prev, notificationsRes.data?.notifications ?? notificationsRes.notifications ?? []));
        
        // Load settings
        const settingsRes = await FriendService.getSettings();
        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }
      } catch (err) {
        console.error('Error loading social data:', err);
        setError('Failed to load social data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSocialData();
    
    // Set up less frequent refresh for notifications
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        FriendService.getNotifications(1, 5, true)
          .then(res => {
            setNotifications(prev => mergeNotifications(prev, res.data.notifications || []));
          })
          .catch(err => console.error('Error refreshing notifications:', err));
      }
    }, 120000); // Refresh every 2 minutes to reduce API load
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user]);
  
  // Send a friend request - uses same pattern as followUser
  const sendFriendRequest = async (username, mcUsername) => {
    try {
      console.debug('[SocialContext] sendFriendRequest called', { username, mcUsername });
      // Only pass username to FriendService
      const res = await FriendService.sendFriendRequest(username);
      console.debug('[SocialContext] sendFriendRequest response', res);
      
      // Always update local state if request was successful or already sent
      if (res.data?.success !== false) {
        try {
          const targetUserData = { 
            username,
            mcUsername 
          };
          
          // Update the combined friendRequests array
          setFriendRequests(prevRequests => {
            if (!Array.isArray(prevRequests)) {
              prevRequests = [];
            }
            
            // Check if user is already in requests - check both username and mcUsername
            const alreadyRequested = prevRequests.some(req => 
              req.username === username || 
              req.mcUsername === mcUsername ||
              req.username === mcUsername ||
              req.mcUsername === username
            );
            
            if (alreadyRequested) {
              console.log(`User ${username} already in friend requests, not adding again`);
              return prevRequests;
            }
            
            console.log(`Adding ${username} to friend requests`);
            return [...prevRequests, targetUserData];
          });
          
          // Also update the sentRequests array specifically
          setSentRequests(prevRequests => {
            if (!Array.isArray(prevRequests)) {
              prevRequests = [];
            }
            
            // Check if user is already in sent requests - check both username and mcUsername
            const alreadySent = prevRequests.some(req => 
              req.username === username || 
              req.mcUsername === mcUsername ||
              req.username === mcUsername ||
              req.mcUsername === username
            );
            
            if (alreadySent) {
              console.log(`User ${username} already in sent requests, not adding again`);
              return prevRequests;
            }
            
            console.log(`Adding ${username} to sent requests`);
            return [...prevRequests, targetUserData];
          });
          
          // Dispatch an event to notify components about the status change
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('friendStatusChanged', { 
              detail: { 
                username, 
                mcUsername,
                newStatus: 'request_sent' 
              } 
            }));
          }
          
        } catch (error) {
          console.error('Error updating local friend requests:', error);
        }
      }
      
      // Refresh friend requests from server
      try {
        const requestsRes = await FriendService.getFriendRequests();
        console.log('Updated friend requests after sending request:', requestsRes.data);
        
        // Update all request arrays
        setFriendRequests(requestsRes.data.friendRequests || []);
        setSentRequests(requestsRes.data.sent || []);
        setReceivedRequests(requestsRes.data.received || []);
      } catch (refreshError) {
        console.error('Error refreshing friend requests:', refreshError);
      }
      
      // Even if we get an error from the server related to "already sent",
      // we want to return a successful response to update the UI
      return res.data.alreadySent 
        ? { success: true, message: 'Request already sent', alreadySent: true } 
        : res.data;
    } catch (err) {
      console.error('[SocialContext] sendFriendRequest error', err, err?.response?.data);
      
      // Check for specific error: "Friend request already sent"
      if (err.response?.data?.error === 'Friend request already sent') {
        console.log('Friend request was already sent, returning success to update UI');
        
        // Update local state for immediate UI feedback
        try {
          // Update combined friendRequests array
          setFriendRequests(prevRequests => {
            if (!Array.isArray(prevRequests)) {
              prevRequests = [];
            }
            
            // Only add if not already in the list - check both username and mcUsername
            const alreadyRequested = prevRequests.some(req => 
              req.username === username || 
              req.mcUsername === mcUsername ||
              req.username === mcUsername ||
              req.mcUsername === username
            );
            
            if (alreadyRequested) {
              return prevRequests;
            }
            
            return [...prevRequests, { 
              username,
              mcUsername
            }];
          });
          
          // Also update sentRequests array
          setSentRequests(prevRequests => {
            if (!Array.isArray(prevRequests)) {
              prevRequests = [];
            }
            
            // Only add if not already in the list
            const alreadySent = prevRequests.some(req => 
              req.username === username || 
              req.mcUsername === mcUsername ||
              req.username === mcUsername ||
              req.mcUsername === username
            );
            
            if (alreadySent) {
              return prevRequests;
            }
            
            return [...prevRequests, { 
              username,
              mcUsername
            }];
          });
          
          // Dispatch event to notify components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('friendStatusChanged', { 
              detail: { 
                username, 
                mcUsername,
                newStatus: 'request_sent' 
              } 
            }));
          }
        } catch (stateError) {
          console.error('Error updating state for already sent request:', stateError);
        }
        
        // Return success object to trigger UI update
        return { success: true, message: 'Request already sent', alreadySent: true };
      }
      
      throw err;
    }
  };
  
  // Accept a friend request
  const acceptFriendRequest = async (userId) => {
    try {
      console.debug('[SocialContext] acceptFriendRequest called', { userId });
      const res = await FriendService.acceptFriendRequest(userId);
      
      // Refresh friends list and requests
      const [friendsRes, requestsRes] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendRequests()
      ]);
      
      setFriends(friendsRes.data.friends || []);
      setFriendRequests(requestsRes.data.friendRequests || []);
      
      return res.data;
    } catch (err) {
      console.error('[SocialContext] acceptFriendRequest error', err, err?.response?.data);
      throw err;
    }
  };
  
  // Reject a friend request
  const rejectFriendRequest = async (userId) => {
    try {
      console.debug('[SocialContext] rejectFriendRequest called', { userId });
      const res = await FriendService.rejectFriendRequest(userId);
      
      // Refresh requests
      const requestsRes = await FriendService.getFriendRequests();
      setFriendRequests(requestsRes.data.friendRequests || []);
      
      return res.data;
    } catch (err) {
      console.error('[SocialContext] rejectFriendRequest error', err, err?.response?.data);
      throw err;
    }
  };
  
  // Remove a friend
  const removeFriend = async (userId) => {
    try {
      console.debug('[SocialContext] removeFriend called', { userId });
      const res = await FriendService.removeFriend(userId);
      
      // Refresh friends list
      const friendsRes = await FriendService.getFriends();
      setFriends(friendsRes.data.friends || []);
      
      return res.data;
    } catch (err) {
      console.error('[SocialContext] removeFriend error', err, err?.response?.data);
      throw err;
    }
  };
  
  // Follow a user - Updated to support both username types
  const followUser = async (username, mcUsername) => {
    try {
      console.debug('[SocialContext] followUser called', { username, mcUsername });
      // Optimistically update local state
      setFollowing(prev => {
        if (prev.some(u => u.username === username || u.mcUsername === mcUsername)) return prev;
        return [...prev, { username, mcUsername: mcUsername || username }];
      });
      // Clear cache for sensitive endpoints
      clearApiCache('/api/friends/relationship');
      clearApiCache('/api/following');
      // Call backend
      const res = await FriendService.followUser(username);
      // Refetch following and relationship state
      const [followingRes, relationshipRes] = await Promise.all([
        FriendService.getFollowing(),
        FriendService.getRelationshipStatus(username, mcUsername)
      ]);
      setFollowing(followingRes.data.following || []);
      // Optionally update relationship state in your context if tracked
      return res.data;
    } catch (err) {
      console.error('[SocialContext] followUser error', err, err?.response?.data);
      throw err;
    }
  };
  
  // Unfollow a user - Updated to support both username types
  const unfollowUser = async (username, mcUsername) => {
    try {
      console.debug('[SocialContext] unfollowUser called', { username, mcUsername });
      // Optimistically update local state
      setFollowing(prev => prev.filter(user => !(user.username === username || user.mcUsername === mcUsername)));
      // Clear cache for sensitive endpoints
      clearApiCache('/api/friends/relationship');
      clearApiCache('/api/following');
      // Call backend
      const res = await FriendService.unfollowUser(username);
      // Refetch following and relationship state
      const [followingRes, relationshipRes] = await Promise.all([
        FriendService.getFollowing(),
        FriendService.getRelationshipStatus(username, mcUsername)
      ]);
      setFollowing(followingRes.data.following || []);
      // Optionally update relationship state in your context if tracked
      return res.data;
    } catch (err) {
      console.error('[SocialContext] unfollowUser error', err, err?.response?.data);
      throw err;
    }
  };
  
  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      await FriendService.markNotificationRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await FriendService.markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // Get more notifications
  const loadMoreNotifications = async (page = 1, limit = 10) => {
    try {
      const res = await FriendService.getNotifications(page, limit);
      return res.data.notifications || [];
    } catch (err) {
      console.error('Error loading more notifications:', err);
      throw err;
    }
  };
  
  // Get relationship with user - prioritizes Minecraft username
  const getRelationship = async (username, mcUsername) => {
    try {
      // Validate username
      if (!username) {
        console.error('getRelationship called without username');
        return { status: 'not_friends', following: false };
      }
      
      // Handle special case for bizzy/n0t_awake
      let accountUsername = username;
      if (username === 'n0t_awake') {
        accountUsername = 'bizzy';
        console.log('Special case: Using account username bizzy for n0t_awake in getRelationship');
      }
      
      // Determine relationship from local state for immediate response
      const followingUser = isFollowing(accountUsername, mcUsername);
      
      // Check friend status - has priority over request status
      if (isFriend(accountUsername, mcUsername)) {
        console.log(`Found existing friendship with ${accountUsername} (MC: ${mcUsername}) in local state`);
        return { 
          status: 'friends', 
          following: followingUser 
        };
      }
      
      // Check if we have received a request from this user
      if (hasReceivedRequestFrom(accountUsername, mcUsername)) {
        console.log(`Found received request from ${accountUsername} (MC: ${mcUsername}) in local state`);
        return { 
          status: 'request_received', 
          following: followingUser 
        };
      }
      
      // Check if we have sent a request to this user
      if (hasSentRequestTo(accountUsername, mcUsername)) {
        console.log(`Found sent request to ${accountUsername} (MC: ${mcUsername}) in local state`);
        return { 
          status: 'request_sent', 
          following: followingUser 
        };
      }
      
      // If no local state matches, check via API
      console.log(`No relationship found in local state, checking API for ${accountUsername} (MC: ${mcUsername})`);
      const res = await FriendService.getRelationshipStatus(accountUsername, mcUsername);
      
      // Update local state if API found a relationship we didn't have
      if (res.data.status === 'request_sent') {
        // Add to sent requests if not already there
        const alreadySent = hasSentRequestTo(accountUsername, mcUsername);
        if (!alreadySent) {
          console.log(`API found sent request to ${accountUsername} (MC: ${mcUsername}), updating local state`);
          setSentRequests(prev => [...prev, { username: accountUsername, mcUsername }]);
        }
      } else if (res.data.status === 'request_received') {
        // Add to received requests if not already there
        const alreadyReceived = hasReceivedRequestFrom(accountUsername, mcUsername);
        if (!alreadyReceived) {
          console.log(`API found received request from ${accountUsername} (MC: ${mcUsername}), updating local state`);
          setReceivedRequests(prev => [...prev, { username: accountUsername, mcUsername }]);
        }
      } else if (res.data.status === 'friends') {
        // Add to friends if not already there
        const alreadyFriend = isFriend(accountUsername, mcUsername);
        if (!alreadyFriend) {
          console.log(`API found friendship with ${accountUsername} (MC: ${mcUsername}), updating local state`);
          setFriends(prev => [...prev, { username: accountUsername, mcUsername }]);
        }
      }
      
      // Include following status from local state if API doesn't have it
      if (res.data.following === undefined && followingUser) {
        res.data.following = followingUser;
      }
      
      return res.data;
    } catch (err) {
      console.error('Error getting relationship status:', err);
      // Return a safe default instead of throwing
      return { 
        status: 'not_friends', 
        following: isFollowing(username, mcUsername) 
      };
    }
  };
  
  // Update user settings
  const updateSettings = async (newSettings) => {
    try {
      console.debug('[SocialContext] updateSettings called', { newSettings });
      const res = await FriendService.updateSettings(newSettings);
      setSettings(res.data.settings);
      return res.data;
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };
  
  // Check if user is following another user by username
  const isFollowing = (username, mcUsername) => {
    if (!Array.isArray(following) || following.length === 0) return false;
    
    // Try to find by either account username or Minecraft username
    return following.some(user => 
      // Match by account username
      (user.username && user.username.toLowerCase() === username.toLowerCase()) ||
      // Match by Minecraft username
      (user.mcUsername && user.mcUsername.toLowerCase() === (mcUsername || username).toLowerCase()) ||
      // Special case for n0t_awake / bizzy
      (username === 'n0t_awake' && user.username === 'bizzy') ||
      (username === 'bizzy' && user.mcUsername === 'n0t_awake')
    );
  };
  
  // Check if we have sent a friend request to the user
  const hasSentRequestTo = (username, mcUsername) => {
    if (!Array.isArray(sentRequests) || sentRequests.length === 0) return false;
    
    // Try to find by either account username or Minecraft username
    return sentRequests.some(user => 
      // Match by account username
      (user.username && user.username.toLowerCase() === username.toLowerCase()) ||
      // Match by Minecraft username
      (user.mcUsername && user.mcUsername.toLowerCase() === (mcUsername || username).toLowerCase()) ||
      // Special case for n0t_awake / bizzy
      (username === 'n0t_awake' && user.username === 'bizzy') ||
      (username === 'bizzy' && user.mcUsername === 'n0t_awake')
    );
  };
  
  // Check if we have received a friend request from the user
  const hasReceivedRequestFrom = (username, mcUsername) => {
    if (!Array.isArray(receivedRequests) || receivedRequests.length === 0) return false;
    
    // Try to find by either account username or Minecraft username
    return receivedRequests.some(user => 
      // Match by account username
      (user.username && user.username.toLowerCase() === username.toLowerCase()) ||
      // Match by Minecraft username
      (user.mcUsername && user.mcUsername.toLowerCase() === (mcUsername || username).toLowerCase()) ||
      // Special case for n0t_awake / bizzy
      (username === 'n0t_awake' && user.username === 'bizzy') ||
      (username === 'bizzy' && user.mcUsername === 'n0t_awake')
    );
  };
  
  // Check if the user is a friend
  const isFriend = (username, mcUsername) => {
    if (!Array.isArray(friends) || friends.length === 0) return false;
    
    // Try to find by either account username or Minecraft username
    return friends.some(user => 
      // Match by account username
      (user.username && user.username.toLowerCase() === username.toLowerCase()) ||
      // Match by Minecraft username
      (user.mcUsername && user.mcUsername.toLowerCase() === (mcUsername || username).toLowerCase()) ||
      // Special case for n0t_awake / bizzy
      (username === 'n0t_awake' && user.username === 'bizzy') ||
      (username === 'bizzy' && user.mcUsername === 'n0t_awake')
    );
  };
  
  // AddNotification function for real-time events
  const addNotification = useCallback((notification) => {
    console.log('[addNotification] Called with:', notification);
    setNotifications(prev => {
      // Avoid duplicates (by postId + subtype + sender)
      const exists = prev.some(item =>
        item.subtype === notification.subtype &&
        item.postId === notification.postId &&
        item.sender?._id === notification.sender?._id &&
        Math.abs(new Date(item.createdAt) - new Date(notification.createdAt)) < 10000 // 10s window
      );
      if (exists) return prev;
      return [notification, ...prev];
    });
    // Play sound
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }, []);
  
  // When setting notifications, always default to an array
  const safeSetNotifications = (value) => {
    setNotifications(Array.isArray(value) ? value : []);
  };
  
  // Fetch friends (for manual refresh or skip cache)
  const fetchFriends = useCallback(async (forceRefresh = false) => {
    try {
      console.debug('[SocialContext] fetchFriends called', { forceRefresh });
      const friendsRes = await FriendService.getFriends();
      setFriends(friendsRes.data?.friends ?? friendsRes.friends ?? []);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  }, []);

  // Fetch following (for manual refresh or skip cache)
  const fetchFollowing = useCallback(async (forceRefresh = false) => {
    try {
      console.debug('[SocialContext] fetchFollowing called', { forceRefresh });
      const followingRes = await FriendService.getFollowing();
      setFollowing(followingRes.data?.following ?? followingRes.following ?? []);
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  }, []);
  
  // Fetch followers (for manual refresh or skip cache)
  const fetchFollowers = useCallback(async (forceRefresh = false) => {
    try {
      console.debug('[SocialContext] fetchFollowers called', { forceRefresh });
      const followersRes = await FriendService.getFollowers();
      setFollowers(followersRes.data?.followers ?? followersRes.followers ?? []);
    } catch (err) {
      console.error('Error fetching followers:', err);
    }
  }, []);
  
  // Context value
  const value = {
    // State
    loading,
    error,
    friends,
    friendRequests,
    sentRequests,
    receivedRequests,
    following,
    followers,
    notifications: Array.isArray(notifications) ? notifications : [],
    unreadCount,
    settings,
    
    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    followUser,
    unfollowUser,
    markNotificationRead,
    markAllNotificationsRead,
    loadMoreNotifications,
    getRelationship,
    updateSettings,
    
    // Helpers
    friendsCount: Array.isArray(friends) ? friends.length : 0,
    requestsCount: Array.isArray(friendRequests) ? friendRequests.length : 0,
    sentRequestsCount: Array.isArray(sentRequests) ? sentRequests.length : 0,
    receivedRequestsCount: Array.isArray(receivedRequests) ? receivedRequests.length : 0,
    followingCount: Array.isArray(following) ? following.length : 0,
    followersCount: Array.isArray(followers) ? followers.length : 0,
    hasUnreadNotifications: unreadCount > 0,
    
    // Social relationship status checkers
    isFollowing,     // Check if following a user
    isFriend,        // Check if friends with a user
    hasSentRequestTo,     // Check if sent a request to a user
    hasReceivedRequestFrom,  // Check if received a request from a user
    hasSentFriendRequest: hasSentRequestTo,
    hasReceivedFriendRequest: hasReceivedRequestFrom,

    // Manual refreshers
    fetchFriends,
    fetchFollowing,
    fetchFollowers
  };
  
  useEffect(() => {
    if (!window.addEventListener) return;
    const handler = (event) => {
      const data = event.detail;
      console.log('[FRONTEND SSE][SocialContext] Received notification event:', data);
      if (data && data.type === 'notification') {
        console.log('[FRONTEND SSE][SocialContext] Notification subtype:', data.subtype);
      }
      addNotification(data);
      // Real-time follow/unfollow: clear cache and refetch
      if (data && (data.subtype === 'FOLLOW' || data.subtype === 'UNFOLLOW')) {
        clearApiCache('/api/following');
        clearApiCache('/api/followers');
        clearApiCache('/api/friends/relationship');
        fetchFollowing();
        fetchFollowers();
        // Optionally, trigger a relationship refetch if on a profile page
        // (handled in Profile page if needed)
      }
    };
    window.addEventListener('notification', handler);
    return () => window.removeEventListener('notification', handler);
  }, [addNotification, fetchFollowing, fetchFollowers]);
  
  useEffect(() => {
    console.log('[SocialContext] notifications:', notifications, 'unreadCount:', unreadCount);
  }, [notifications, unreadCount]);
  
  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export default SocialContext;