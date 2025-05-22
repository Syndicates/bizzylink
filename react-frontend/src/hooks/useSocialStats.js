/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file useSocialStats.js
 * @description Custom hook for managing social stats and interactions
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialService } from '../services/api';

const useSocialStats = (username) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Function to fetch social stats
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check for cached data to prevent excessive API calls
      const cacheKey = `social_stats_${username}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
      const now = Date.now();
      const isCacheValid = !forceRefresh && cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp, 10) < 60000); // 1 minute cache
      
      let socialStatsData;
      
      if (isCacheValid) {
        // Use cached data
        socialStatsData = JSON.parse(cachedData);
        console.log('Using cached social stats for', username);
      } else {
        // Fetch fresh data
        console.log('Fetching fresh social stats for', username);
        const response = await SocialService.getUserSocialStats(username);
        socialStatsData = response;
        
        // Cache the data
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(socialStatsData));
          sessionStorage.setItem(`${cacheKey}_timestamp`, now.toString());
        } catch (e) {
          console.warn('Failed to cache social stats:', e);
        }
      }
      
      // Update state with fetched data
      setFriendsCount(socialStatsData.friendsCount || 0);
      setFollowersCount(socialStatsData.followersCount || 0);
      setFollowingCount(socialStatsData.followingCount || 0);
      setFriends(socialStatsData.friends || []);
      setFollowers(socialStatsData.followers || []);
      setFollowing(socialStatsData.following || []);
    } catch (err) {
      console.error('Error fetching social stats:', err);
      setError('Failed to load social stats');
      
      // Set default values on error
      setFriendsCount(0);
      setFollowersCount(0);
      setFollowingCount(0);
      setFriends([]);
      setFollowers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Fetch social stats when username changes
  useEffect(() => {
    fetchStats(false);
  }, [fetchStats]);

  // Function to manually refetch stats
  const refetch = () => {
    console.log('Force refreshing social stats for', username);
    return fetchStats(true);
  };

  return {
    loading,
    error,
    friendsCount,
    followersCount,
    followingCount,
    friends,
    followers,
    following,
    refetch
  };
};

export default useSocialStats; 