/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FollowButton.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// src/components/social/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import { useSocial } from '../../contexts/SocialContext';

const FollowButton = ({ username, mcUsername, userId, initialFollowing = null }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Get context with fallbacks
  const socialContext = useSocial() || {};
  
  // Provide default values
  const { 
    followUser = async () => {}, 
    unfollowUser = async () => {}, 
    getRelationship = async () => ({ following: false }) 
  } = socialContext;

  // Load relationship status if not provided
  useEffect(() => {
    // Always force a value refresh for each render, using the prop
    console.log(`FollowButton.jsx: Using initial following status: ${initialFollowing}`);
    setIsFollowing(!!initialFollowing);
  }, [initialFollowing, username, mcUsername]);

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    // Prevent action if already loading
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a valid username to avoid null/undefined errors
      if (!username) {
        setError("Invalid username");
        return;
      }
      
      console.log(`FollowButton.jsx: ${isFollowing ? 'Unfollowing' : 'Following'} user: ${username}`);
      
      // For special case handling of known usernames
      let accountUsername = username;
      let minecraftUsername = mcUsername || username;
      
      // Special case for n0t_awake who is actually bizzy
      if (username === 'n0t_awake' || minecraftUsername === 'n0t_awake') {
        accountUsername = 'bizzy';
        console.log('Special case: Using account username bizzy for n0t_awake');
      }
      
      if (isFollowing) {
        // Use account username for unfollowing and pass Minecraft username as well
        // This allows the server to find the user by either identifier
        console.log(`Unfollowing with username: ${accountUsername}, mcUsername: ${minecraftUsername}`);
        await unfollowUser(accountUsername, minecraftUsername);
      } else {
        // Use account username for following and pass Minecraft username as well
        // This allows the server to find the user by either identifier
        console.log(`Following with username: ${accountUsername}, mcUsername: ${minecraftUsername}`);
        await followUser(accountUsername, minecraftUsername);
      }
      
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} user:`, err);
      setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. ${err.response?.data?.error || ''}`);
    } finally {
      setLoading(false);
    }
  };

  // Button appearance
  const getButtonClass = () => {
    if (loading) {
      return "px-4 py-2 rounded bg-gray-700 text-white text-sm cursor-wait";
    }
    
    if (isFollowing) {
      return isHovering
        ? "px-4 py-2 rounded bg-red-600 text-white text-sm font-bold transition-colors duration-300"
        : "px-4 py-2 rounded bg-blue-600 hover:bg-red-600 text-white text-sm font-bold transition-colors duration-300";
    }
    
    return "px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors duration-300";
  };

  return (
    <div>
      <button 
        className={getButtonClass()} 
        onClick={handleToggleFollow}
        disabled={loading}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading...
          </>
        ) : isFollowing ? (
          <>
            <i className={isHovering ? "fas fa-user-times mr-2" : "fas fa-user-check mr-2"}></i>
            {isHovering ? "Unfollow" : "Following"}
          </>
        ) : (
          <>
            <i className="fas fa-user-plus mr-2"></i>
            Follow
          </>
        )}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FollowButton;