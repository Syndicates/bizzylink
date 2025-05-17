/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file SocialContext.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import FriendService from '../services/friendService';
import { useAuth } from './AuthContext';

// Create social context
const SocialContext = createContext();

// Custom hook to use the social context
export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

// Social provider component
export const SocialProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Social state
  const [friends, setFriends] = useState({
    list: [],      // List of current friends
    sentRequests: [],      // List of sent friend requests
    receivedRequests: [],  // List of received friend requests
    loading: true,
    error: null,
    lastUpdated: null
  });
  const [following, setFollowing] = useState([]);  // Users we follow
  const [notifications, setNotifications] = useState({ 
    items: [], 
    unreadCount: 0, 
    totalPages: 1, 
    currentPage: 1, 
    total: 0 
  });
  const [loading, setLoading] = useState({
    friends: true,
    following: true,
    notifications: false
  });
  const [error, setError] = useState(null);
  
  // Fetch friends data
  const refreshFriends = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, friends: true }));
    try {
      const data = await FriendService.getFriends();
      setFriends({
        list: data.friends || [],
        sentRequests: data.sentRequests || [],
        receivedRequests: data.receivedRequests || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setError('Failed to load friends. Please try again later.');
      setFriends(prev => ({
        ...prev,
        list: [],
        sentRequests: [],
        receivedRequests: [],
        loading: false,
        error: err.message || 'Failed to load friends'
      }));
    }
  }, [isAuthenticated]);
  
  // Fetch following data
  const refreshFollowing = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, following: true }));
    try {
      const data = await FriendService.getFollowing();
      setFollowing(data.following || []);
    } catch (err) {
      console.error('Failed to fetch following:', err);
      setError('Failed to load following data. Please try again later.');
      setFollowing([]);
    }
  }, [isAuthenticated]);
  
  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20, skipCache = false) => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const response = await FriendService.getNotifications(page, limit, skipCache);
      
      // Validate response data before updating state
      if (response && response.data) {
        // Ensure all required properties exist with fallbacks
        const safeResponse = {
          notifications: Array.isArray(response.data.notifications) ? response.data.notifications : [],
          unreadCount: typeof response.data.unreadCount === 'number' ? response.data.unreadCount : 0,
          totalPages: typeof response.data.totalPages === 'number' ? response.data.totalPages : 1,
          currentPage: typeof response.data.currentPage === 'number' ? response.data.currentPage : 1,
          totalNotifications: typeof response.data.totalNotifications === 'number' ? response.data.totalNotifications : 0
        };
        
        setNotifications({
          items: safeResponse.notifications,
          unreadCount: safeResponse.unreadCount,
          totalPages: safeResponse.totalPages,
          currentPage: safeResponse.currentPage,
          total: safeResponse.totalNotifications
        });
      } else {
        console.warn('Invalid notifications response:', response);
        // Don't update state if response is invalid
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // Don't set error state for background refreshes to avoid disrupting the UI
      if (!skipCache) {
        setError('Failed to load notifications. Please try again later.');
      }
      // Keep existing notifications data instead of clearing it on error
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  }, [isAuthenticated]);
  
  // Load data when authenticated - with improved error handling
  useEffect(() => {
    if (isAuthenticated) {
      // Use individual try/catch for each operation to prevent one failure from stopping others
      Promise.allSettled([
        (async () => {
          try {
            await refreshFriends();
          } catch (err) {
            console.error('Error loading friends data:', err);
          }
        })(),
        (async () => {
          try {
            await refreshFollowing();
          } catch (err) {
            console.error('Error loading following data:', err);
          }
        })(),
        (async () => {
          try {
            await fetchNotifications();
          } catch (err) {
            console.error('Error loading notifications:', err);
          }
        })()
      ]).then(results => {
        console.log('Social data loading complete with results:', 
          results.map(r => r.status === 'fulfilled' ? 'success' : 'failed'));
      });
    }
  }, [isAuthenticated, refreshFriends, refreshFollowing, fetchNotifications]);
  
  // Refresh data periodically while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchNotifications(1, 20, true); // Refresh with skipCache=true
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);
  
  // Send friend request with improved error handling
  const sendFriendRequest = useCallback(async (username) => {
    try {
      await FriendService.sendFriendRequest(username);
      await refreshFriends();
      return true;
    } catch (err) {
      console.error('Failed to send friend request:', err);
      setError(err.message || 'Failed to send friend request.');
      return false;
    }
  }, [refreshFriends]);
  
  // Accept friend request with improved error handling
  const acceptFriendRequest = useCallback(async (username) => {
    try {
      await FriendService.acceptFriendRequest(username);
      await refreshFriends();
      return true;
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      setError(err.message || 'Failed to accept friend request.');
      return false;
    }
  }, [refreshFriends]);
  
  const rejectFriendRequest = useCallback(async (username) => {
    try {
      await FriendService.rejectFriendRequest(username);
      await refreshFriends();
      return true;
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      setError(err.response?.data?.error || 'Failed to reject friend request.');
      return false;
    }
  }, [refreshFriends]);
  
  const cancelFriendRequest = useCallback(async (username) => {
    try {
      await FriendService.cancelFriendRequest(username);
      await refreshFriends();
      return true;
    } catch (err) {
      console.error('Failed to cancel friend request:', err);
      setError(err.response?.data?.error || 'Failed to cancel friend request.');
      return false;
    }
  }, [refreshFriends]);
  
  const removeFriend = useCallback(async (username) => {
    try {
      await FriendService.removeFriend(username);
      await refreshFriends();
      return true;
    } catch (err) {
      console.error('Failed to remove friend:', err);
      setError(err.response?.data?.error || 'Failed to remove friend.');
      return false;
    }
  }, [refreshFriends]);
  
  // Following functions
  const followUser = useCallback(async (username) => {
    try {
      await FriendService.followUser(username);
      await refreshFollowing();
      return true;
    } catch (err) {
      console.error('Failed to follow user:', err);
      setError(err.message || 'Failed to follow user');
      return false;
    }
  }, [refreshFollowing]);
  
  const unfollowUser = useCallback(async (username) => {
    try {
      await FriendService.unfollowUser(username);
      await refreshFollowing();
      return true;
    } catch (err) {
      console.error('Failed to unfollow user:', err);
      setError(err.message || 'Failed to unfollow user');
      return false;
    }
  }, [refreshFollowing]);
  
  // Notification functions
  const markNotificationAsRead = async (notificationId) => {
    try {
      await FriendService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => {
        const updatedItems = prev.items.map(item => 
          item.id === notificationId ? { ...item, read: true } : item
        );
        
        // Recalculate unread count
        const newUnreadCount = updatedItems.filter(item => !item.read).length;
        
        return {
          ...prev,
          items: updatedItems,
          unreadCount: newUnreadCount
        };
      });
      
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  };
  
  const markAllNotificationsAsRead = async () => {
    try {
      await FriendService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => ({
        ...prev,
        items: prev.items.map(item => ({ ...item, read: true })),
        unreadCount: 0
      }));
      
      return true;
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return false;
    }
  };
  
  const deleteNotification = async (notificationId) => {
    try {
      await FriendService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => {
        const wasUnread = prev.items.find(item => item.id === notificationId && !item.read);
        const updatedItems = prev.items.filter(item => item.id !== notificationId);
        
        return {
          ...prev,
          items: updatedItems,
          unreadCount: wasUnread ? prev.unreadCount - 1 : prev.unreadCount,
          total: prev.total - 1
        };
      });
      
      return true;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return false;
    }
  };
  
  // Check if a user is a friend
  const isFriend = useCallback((username) => {
    if (!username) {
      console.warn('isFriend called with no username');
      return false;
    }

    // Ensure friends.list exists and is an array
    if (!friends?.list || !Array.isArray(friends.list)) {
      console.warn('friends.list is not properly initialized:', friends);
      return false;
    }

    // Check for friendship using exact username match
    return friends.list.some(friend => friend?.username === username);
  }, [friends]);
  
  // Check if we've sent a friend request to a user
  const hasSentFriendRequest = useCallback((username) => {
    if (!username) {
      console.warn('hasSentFriendRequest called with no username');
      return false;
    }

    // Ensure friends.sentRequests exists and is an array
    if (!friends?.sentRequests || !Array.isArray(friends.sentRequests)) {
      console.warn('friends.sentRequests is not properly initialized:', friends);
      return false;
    }

    // Special case for n0t_awake/bizzy
    if (username === 'n0t_awake' || username === 'bizzy') {
      return friends.sentRequests.some(request => 
        request?.username === 'bizzy' || 
        request?.mcUsername === 'n0t_awake'
      );
    }

    return friends.sentRequests.some(request => request?.username === username);
  }, [friends]);  // Include entire friends object
  
  // Check if we've received a friend request from a user
  const hasReceivedFriendRequest = useCallback((username) => {
    if (!username) {
      console.warn('hasReceivedFriendRequest called with no username');
      return false;
    }

    // Ensure friends.receivedRequests exists and is an array
    if (!friends?.receivedRequests || !Array.isArray(friends.receivedRequests)) {
      console.warn('friends.receivedRequests is not properly initialized:', friends);
      return false;
    }

    // Special case for n0t_awake/bizzy
    if (username === 'n0t_awake' || username === 'bizzy') {
      return friends.receivedRequests.some(request => 
        request?.username === 'bizzy' || 
        request?.mcUsername === 'n0t_awake'
      );
    }

    return friends.receivedRequests.some(request => request?.username === username);
  }, [friends]);  // Include entire friends object
  
  // Check if we're following a user
  const isFollowing = useCallback((username) => {
    if (!username) {
      console.warn('isFollowing called with no username');
      return false;
    }
    
    if (!Array.isArray(following)) {
      console.warn('following is not an array', following);
      return false;
    }
    
    // Standard check - look for match on username
    const result = following.some(user => {
      // Defensive programming: Check if user exists and has a username before comparing
      if (!user || typeof user !== 'object') return false;
      // Check for a match on username
      return user.username === username;
    });
    
    console.log(`isFollowing check for ${username}: ${result}`);
    return result;
  }, [following]);
  
  // Check if a user is following us
  const isFollower = useCallback((username) => {
    if (!username) {
      console.warn('isFollower called with no username');
      return false;
    }
    
    if (!Array.isArray(following)) {
      console.warn('following is not an array', following);
      return false;
    }
    
    // Ensure we're using the account username for the comparison, not Minecraft username
    const result = following.some(user => {
      // Defensive programming: Check if user exists and has a username before comparing
      if (!user || typeof user !== 'object') return false;
      return user.username === username;
    });
    
    console.log(`isFollower check for ${username}: ${result}`);
    return result;
  }, [following]);
  
  // Get friend relationship with a user
  const getFriendStatus = useCallback((username) => {
    if (isFriend(username)) return 'friends';
    if (hasSentFriendRequest(username)) return 'request_sent';
    if (hasReceivedFriendRequest(username)) return 'request_received';
    return 'none';
  }, [isFriend, hasSentFriendRequest, hasReceivedFriendRequest]);
  
  // Define the context value
  const value = {
    // State
    friends: friends.list,
    sentRequests: friends.sentRequests,
    receivedRequests: friends.receivedRequests,
    following: following,
    loading: friends.loading || loading.following,
    error: friends.error || error,
    notifications,
    
    // Data fetching
    fetchNotifications,
    fetchFriends: refreshFriends,
    fetchFollowing: refreshFollowing,
    
    // Friend request actions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    
    // Following actions
    followUser,
    unfollowUser,
    
    // Notification actions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    
    // Helper functions
    isFriend,
    hasSentFriendRequest,
    hasReceivedFriendRequest,
    isFollowing,
    isFollower,
    getFriendStatus,
    refreshFriends,
    refreshFollowing
  };
  
  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

export default SocialContext;