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

const ICONS = {
  follow: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  following: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  unfollow: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  followBack: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

const FollowButton = ({ username, mcUsername, initialFollowing = null, followsYou = false }) => {
  const [following, setFollowing] = useState(initialFollowing);
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

  // Invalidate cache helper
  const invalidateRelationshipCache = (username) => {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(`relationship_${username}_`));
    keys.forEach(k => sessionStorage.removeItem(k));
  };

  useEffect(() => {
    setFollowing(!!initialFollowing);
  }, [initialFollowing, username, mcUsername]);

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (loading || !username) return;
    setLoading(true);
    setError(null);
    try {
      if (following) {
        await unfollowUser(username, mcUsername);
      } else {
        await followUser(username, mcUsername);
      }
      invalidateRelationshipCache(username);
      // Always fetch fresh state after mutation
      const rel = await getRelationship(username, mcUsername);
      setFollowing(!!rel.following);
    } catch (err) {
      setError(`Failed to ${following ? 'unfollow' : 'follow'} user. ${err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  // Modern, pill-shaped, shadowed, animated button
  const getButtonClass = () => {
    if (loading) return "flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow bg-gray-400 text-white text-sm cursor-wait transition-all duration-200";
    if (following) {
      return isHovering
        ? "flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow bg-red-500 text-white text-sm scale-105 transition-all duration-200"
        : "flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow bg-blue-600 text-white text-sm hover:bg-red-500 transition-all duration-200";
    }
    if (followsYou) {
      return "flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition-all duration-200";
    }
    return "flex items-center gap-2 px-5 py-2 rounded-full font-bold shadow bg-neutral-800 text-white text-sm hover:bg-neutral-700 transition-all duration-200";
  };

  return (
    <div>
      <button
        className={getButtonClass()}
        onClick={handleToggleFollow}
        disabled={loading}
        aria-pressed={!!following}
        aria-label={following ? (isHovering ? "Unfollow" : "Following") : (followsYou ? "Follow Back" : "Follow")}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        tabIndex={0}
        style={{ minWidth: 110 }}
      >
        {loading ? (
          <span className="animate-spin mr-2">⏳</span>
        ) : following ? (
          <>
            <span className="mr-1">{isHovering ? ICONS.unfollow : ICONS.following}</span>
            {isHovering ? "Unfollow" : "Following"}
          </>
        ) : followsYou ? (
          <>
            <span className="mr-1">{ICONS.followBack}</span>
            Follow Back
          </>
        ) : (
          <>
            <span className="mr-1">{ICONS.follow}</span>
            Follow
          </>
        )}
      </button>
      {error && (
        <div className="text-red-500 text-xs mt-1 flex items-center">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => {
              setError(null);
              handleToggleFollow();
            }}
            aria-label="Retry follow/unfollow"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowButton;