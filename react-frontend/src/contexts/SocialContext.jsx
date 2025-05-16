// src/contexts/SocialContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import FriendService from '../services/friendService';

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
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Ensure all social arrays are initialized properly
  useEffect(() => {
    if (!Array.isArray(friends)) setFriends([]);
    if (!Array.isArray(friendRequests)) setFriendRequests([]);
    if (!Array.isArray(following)) setFollowing([]);
    if (!Array.isArray(followers)) setFollowers([]);
    if (!Array.isArray(notifications)) setNotifications([]);
  }, [friends, friendRequests, following, followers, notifications]);
  
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
        setFriends(friendsRes.data.friends || []);
        
        // Load friend requests
        const requestsRes = await FriendService.getFriendRequests();
        console.log('Setting friend requests from initial load:', requestsRes.data);
        
        // Set all different types of request arrays
        setFriendRequests(requestsRes.data.friendRequests || []);
        setSentRequests(requestsRes.data.sent || []);
        setReceivedRequests(requestsRes.data.received || []);
        
        // Load following/followers
        const followingRes = await FriendService.getFollowing();
        setFollowing(followingRes.data.following || []);
        setFollowers(followingRes.data.followers || []);
        
        // Load notifications
        const notificationsRes = await FriendService.getNotifications(1, 5, true);
        setNotifications(notificationsRes.data.notifications || []);
        setUnreadCount(notificationsRes.data.unreadCount || 0);
        
        // Load settings
        const settingsRes = await FriendService.getSettings();
        if (settingsRes.data.settings) {
          setSettings(settingsRes.data.settings);
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
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
          })
          .catch(err => console.error('Error refreshing notifications:', err));
      }
    }, 120000); // Refresh every 2 minutes to reduce API load
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user]);
  
  // Send a friend request - uses same pattern as followUser
  const sendFriendRequest = async (username, mcUsername) => {
    try {
      // Match the followUser pattern exactly - username first, mcUsername second
      console.log('SocialContext: Sending friend request to:', username, 'mcUsername:', mcUsername);
      const res = await FriendService.sendFriendRequest(username, mcUsername);
      console.log('Send friend request response:', res.data);
      
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
      console.error('Error sending friend request:', err);
      
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
      console.error('Error accepting friend request:', err);
      throw err;
    }
  };
  
  // Reject a friend request
  const rejectFriendRequest = async (userId) => {
    try {
      const res = await FriendService.rejectFriendRequest(userId);
      
      // Refresh requests
      const requestsRes = await FriendService.getFriendRequests();
      setFriendRequests(requestsRes.data.friendRequests || []);
      
      return res.data;
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      throw err;
    }
  };
  
  // Remove a friend
  const removeFriend = async (userId) => {
    try {
      const res = await FriendService.removeFriend(userId);
      
      // Refresh friends list
      const friendsRes = await FriendService.getFriends();
      setFriends(friendsRes.data.friends || []);
      
      return res.data;
    } catch (err) {
      console.error('Error removing friend:', err);
      throw err;
    }
  };
  
  // Follow a user - Updated to support both username types
  const followUser = async (username, mcUsername) => {
    try {
      console.log('SocialContext: Following user:', username, 'mcUsername:', mcUsername);
      const res = await FriendService.followUser(username, mcUsername);
      
      // Refresh following list
      const followingRes = await FriendService.getFollowing();
      
      console.log('Updated following list after follow:', followingRes.data.following);
      setFollowing(followingRes.data.following || []);
      
      // Update the local state immediately for better UX
      if (res.data && res.data.success !== false) {
        // Add the user to our local following list if not already there
        const userExists = following.some(u => 
          u.username === username || 
          u.mcUsername === mcUsername
        );
        
        if (!userExists) {
          setFollowing(prev => [
            ...prev, 
            { 
              username, 
              mcUsername: mcUsername || username 
            }
          ]);
        }
      }
      
      return res.data;
    } catch (err) {
      console.error('Error following user:', err);
      throw err;
    }
  };
  
  // Unfollow a user - Updated to support both username types
  const unfollowUser = async (username, mcUsername) => {
    try {
      console.log('SocialContext: Unfollowing user:', username, 'mcUsername:', mcUsername);
      const res = await FriendService.unfollowUser(username, mcUsername);
      
      // Refresh following list
      const followingRes = await FriendService.getFollowing();
      
      console.log('Updated following list after unfollow:', followingRes.data.following);
      setFollowing(followingRes.data.following || []);
      
      // Update the local state immediately for better UX
      if (res.data && res.data.success !== false) {
        // Remove the user from our local following list
        setFollowing(prev => 
          prev.filter(user => 
            !(user.username === username || user.mcUsername === mcUsername) &&
            !(username === 'bizzy' && user.mcUsername === 'n0t_awake') &&
            !(mcUsername === 'n0t_awake' && user.username === 'bizzy')
          )
        );
      }
      
      return res.data;
    } catch (err) {
      console.error('Error unfollowing user:', err);
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
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      
      // Update unread count
      setUnreadCount(0);
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
    notifications,
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
    hasReceivedRequestFrom  // Check if received a request from a user
  };
  
  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export default SocialContext;