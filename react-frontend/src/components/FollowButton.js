import React, { useState, useEffect, useRef } from 'react';
import { useSocial } from '../contexts/SocialContext';
import LoadingSpinner from './LoadingSpinner';

const FollowButton = ({ username, mcUsername, className = '', variant = 'default', showText = true }) => {
  const { isFollowing, followUser, unfollowUser } = useSocial();
  
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const actionCooldown = useRef(false);
  const cooldownTime = 5000; // 5 seconds cooldown
  
  // Force update anytime isFollowing changes to ensure we're always showing correct state
  useEffect(() => {
    if (!username) return;
    
    // Make sure we have a valid username before checking
    const validUsername = username.trim();
    if (validUsername === '') return;
    
    const currentFollowingStatus = isFollowing ? isFollowing(validUsername, mcUsername) : false;
    
    // Check using both username and mcUsername (if available)
    setFollowing(currentFollowingStatus);
    
    // Log for debugging
    console.log(`FollowButton initialized for ${validUsername}/${mcUsername}, following status:`, currentFollowingStatus);
  }, [username, mcUsername, isFollowing]);
  
  // Handle follow/unfollow with cooldown to prevent API spam
  const handleToggleFollow = async () => {
    // Prevent spamming the follow/unfollow button
    if (actionCooldown.current || loading) {
      console.log('Follow action on cooldown, please wait...');
      return;
    }
    
    // Extra validation for username
    if (!username || username.trim() === '') {
      console.error('Invalid username in FollowButton:', username);
      setError('Invalid username');
      return;
    }
    
    console.log(`FollowButton: Handling ${following ? 'unfollow' : 'follow'} for user: ${username}`);
    
    // Set cooldown immediately to prevent double-clicks
    actionCooldown.current = true;
    setLoading(true);
    setError(null);
    
    try {
      if (following) {
        console.log(`FollowButton: Unfollowing ${username}`);
        // For special case handling of known usernames
        let accountUsername = username;
        let minecraftUsername = mcUsername || username;
        
        // Special case for n0t_awake who is actually bizzy
        if (username === 'n0t_awake' || minecraftUsername === 'n0t_awake') {
          accountUsername = 'bizzy';
          console.log('Special case: Using account username bizzy for n0t_awake');
        }
        
        const success = await unfollowUser(accountUsername.trim(), minecraftUsername);
        console.log(`FollowButton: Unfollow result for ${username}:`, success);
        if (success) {
          setFollowing(false);
        }
      } else {
        console.log(`FollowButton: Following ${username}`);
        // For special case handling of known usernames
        let accountUsername = username;
        let minecraftUsername = mcUsername || username;
        
        // Special case for n0t_awake who is actually bizzy
        if (username === 'n0t_awake' || minecraftUsername === 'n0t_awake') {
          accountUsername = 'bizzy';
          console.log('Special case: Using account username bizzy for n0t_awake');
        }
        
        const success = await followUser(accountUsername.trim(), minecraftUsername);
        console.log(`FollowButton: Follow result for ${username}:`, success);
        if (success) {
          setFollowing(true);
        }
      }
    } catch (err) {
      console.error('Follow action error:', err);
      setError(err.response?.data?.error || 'Failed to update follow status');
    } finally {
      setLoading(false);
      
      // Set a timeout to reset the cooldown
      setTimeout(() => {
        actionCooldown.current = false;
      }, cooldownTime);
    }
  };
  
  // Determine button appearance based on following status
  const getButtonProps = () => {
    if (following) {
      return {
        text: isHovering ? 'Unfollow' : 'Following',
        onClick: handleToggleFollow,
        color: isHovering 
          ? 'bg-red-600 text-white font-bold transition-colors duration-300'
          : 'bg-blue-500 hover:bg-red-600 font-bold transition-colors duration-300',
        icon: isHovering 
          ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
      };
    } else {
      return {
        text: 'Follow',
        onClick: handleToggleFollow,
        color: 'bg-purple-600 hover:bg-purple-700 transition-colors duration-300',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      };
    }
  };
  
  const buttonProps = getButtonProps();
  
  return (
    <button
      className={`flex items-center justify-center py-2 px-4 ${buttonProps.color} text-white rounded-md ${className}`}
      onClick={buttonProps.onClick}
      disabled={loading}
      title={buttonProps.hoverText || buttonProps.text}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {buttonProps.icon && buttonProps.icon}
          {showText && <span className="ml-1">{buttonProps.text}</span>}
        </>
      )}
    </button>
  );
};

export default FollowButton;