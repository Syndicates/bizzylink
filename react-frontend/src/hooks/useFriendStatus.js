import { useState, useEffect, useCallback } from 'react';
import { useSocial } from '../contexts/SocialContext';

export const useFriendStatus = (username, mcUsername) => {
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    getFriendStatus,
    isFriend,
    hasSentFriendRequest,
    hasReceivedFriendRequest
  } = useSocial();
  
  // Handle username resolution
  const resolveUsernames = useCallback(() => {
    let actualUsername = username;
    let actualMcUsername = mcUsername;
    
    // Only transform usernames for display/lookup, not for the logged-in user
    if (actualUsername === 'bizzy' && !actualMcUsername) {
      actualMcUsername = 'n0t_awake';
    }
    
    // If no MC username provided, use account username
    if (!actualMcUsername) {
      actualMcUsername = actualUsername;
    }
    
    console.log('Resolving usernames:', { 
      input: { username, mcUsername }, 
      resolved: { actualUsername, actualMcUsername } 
    });
    
    // Return object with exact database field names
    return { 
      username: actualUsername, 
      mcUsername: actualMcUsername 
    };
  }, [username, mcUsername]);
  
  // Check relationship status
  const checkStatus = useCallback(async () => {
    if (!username) {
      setStatus('none');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { username: actualUsername, mcUsername: actualMcUsername } = resolveUsernames();
      
      console.log('Checking friend status for:', { 
        username: actualUsername, 
        mcUsername: actualMcUsername 
      });
      
      // First check if they are friends using isFriend
      const areFriends = isFriend(actualUsername, actualMcUsername);
      console.log('Friend check result:', areFriends);
      
      if (areFriends) {
        console.log('Users are friends');
        setStatus('friends');
        setLoading(false);
        return;
      }
      
      // If not friends, check for pending requests
      const [sentRequest, receivedRequest] = await Promise.all([
        hasSentFriendRequest(actualUsername, actualMcUsername),
        hasReceivedFriendRequest(actualUsername, actualMcUsername)
      ]);
      
      console.log('Request checks:', { sentRequest, receivedRequest });
      
      if (sentRequest) {
        setStatus('request_sent');
      } else if (receivedRequest) {
        setStatus('request_received');
      } else {
        // If no relationship exists, try API for final check
        try {
          const response = await getFriendStatus(actualUsername, actualMcUsername);
          console.log('API Response:', response?.data);
          
          if (response?.data?.status === 'friends') {
            setStatus('friends');
          } else {
            setStatus('none');
          }
        } catch (apiError) {
          console.warn('API check failed:', apiError);
          setStatus('none');
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error checking friend status:', err);
      setError(err.message || 'Failed to check friend status');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [username, resolveUsernames, getFriendStatus, isFriend, hasSentFriendRequest, hasReceivedFriendRequest]);
  
  // Effect to check status
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);
  
  // Function to manually refresh status
  const refreshStatus = useCallback(() => {
    return checkStatus();
  }, [checkStatus]);
  
  return {
    status,
    loading,
    error,
    refreshStatus,
    resolveUsernames
  };
}; 