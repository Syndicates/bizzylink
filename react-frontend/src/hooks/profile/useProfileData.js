/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useProfileData.js
 * @description Custom hook for profile data management and social interactions
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocial } from '../../contexts/SocialContext';
import { MinecraftService } from '../../services/api';
import API, { SocialService } from '../../services/api';
import { formatDate } from '../../utils/timeUtils';

const WALLPAPERS = [
  { id: "herobrine_hill", label: "Herobrine Hill", external: true },
  { id: "quick_hide", label: "Quick Hide", external: true },
  { id: "malevolent", label: "Malevolent", external: true },
  { id: "sunset_lake", label: "Sunset Lake", custom: true },
  { id: "pink_sky", label: "Pink Sky", custom: true },
  { id: "night_adventure", label: "Night Adventure", custom: true },
];

const getWallpaperUrl = (id, username) => {
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);
  if (!wallpaper) return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  if (wallpaper.custom) return `/minecraft-assets/wallpapers/${id}.jpg`;
  if (wallpaper.external) {
    const safeUsername = username || "Steve";
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${safeUsername}`;
  }
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

export default function useProfileData(username, { onWallpaperChangeSuccess } = {}) {
  const { user } = useAuth();
  const socialContext = useSocial() || {};
  const { getRelationship } = socialContext;

  // Core profile state
  const [profileUser, setProfileUser] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Profile customization state
  const [viewMode, setViewMode] = useState("avatar");
  const [coverImage, setCoverImage] = useState(null);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [pendingWallpaperId, setPendingWallpaperId] = useState(null);

  // Social relationships state
  const [relationship, setRelationship] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Social modals state
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [socialModalLoading, setSocialModalLoading] = useState(false);

  // Minecraft data state
  const [achievements, setAchievements] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Computed values
  const shouldDisplayProfile = username || user?.username;

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if (!shouldDisplayProfile) return;

    try {
      setLoading(true);
      setNotFound(false);

      // Check if viewing own profile
      const isOwn = user && (user.username === username || (!username && user));
      setIsOwnProfile(isOwn);

      // Get target username
      const targetUsername = username || (user ? user.username : null);
      if (!targetUsername) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch user data
      let websiteUser = null;
      try {
        if (isOwn) {
          // For own profile, use the current user endpoint to get full profile data
          const userRes = await API.get(`/api/user/profile`);
          websiteUser = userRes.data || null;
        } else {
          // For other users, use the username endpoint
          const userRes = await API.get(`/api/user/profile/${targetUsername}`);
          websiteUser = userRes.data || null;
        }
      } catch (e) {
        websiteUser = null;
      }

      // Get Minecraft username
      let mcUsernameToUse = targetUsername;
      if (websiteUser && websiteUser.minecraftUsername) {
        mcUsernameToUse = websiteUser.minecraftUsername;
      }

      // Fetch player stats with realistic defaults
      let completeStats = {
        playtime: "32h 12m",
        lastSeen: "Online Now",
        balance: 22969,
        blocksMined: 1369,
        mobsKilled: 13,
        deaths: 10,
        joinDate: websiteUser ? formatDate(websiteUser.createdAt) : "N/A",
        achievements: 131,
        level: 1,
        experience: 250,
        rank: "Adventurer",
        group: "default",
        groups: ["default"],
        world: "world",
        gamemode: "SURVIVAL",
        online: true,
        advancements: [
          "story/mine_stone",
          "story/upgrade_tools", 
          "story/smelt_iron",
          "story/obtain_armor",
          "story/lava_bucket"
        ],
        mcmmoSkills: {
          power: { level: 36, experience: 250 },
          repair: { level: 0, experience: 0 },
          herbalism: { level: 8, experience: 120 },
          fishing: { level: 8, experience: 85 },
          mining: { level: 15, experience: 300 },
          woodcutting: { level: 12, experience: 200 }
        }
      };

      try {
        const playerStatsRes = await MinecraftService.getPlayerStats(mcUsernameToUse);
        completeStats = { ...completeStats, ...playerStatsRes.data.data };
        setPlayerStats(completeStats);
        setAchievements(completeStats.advancements || []);
      } catch (playerStatsError) {
        console.error("Failed to fetch player stats:", playerStatsError);
        setPlayerStats(completeStats);
      }

      // Set profile user data
      let userProfileData;
      if (isOwn && user) {
        userProfileData = user;
        setProfileUser(user);
      } else if (websiteUser) {
        userProfileData = websiteUser;
        setProfileUser(websiteUser);
      } else {
        // Do not set a fallback user if the API failed (especially for privacy)
        setProfileUser(null);
      }

      // Fetch relationship data for other users
      if (!isOwn) {
        try {
          const relationshipResponse = await getRelationship(
            userProfileData.username,
            userProfileData.mcUsername,
          );
          setRelationship(relationshipResponse || { status: "not_friends", following: false });
        } catch (err) {
          console.error("Error fetching relationship:", err);
          setRelationship({ status: "not_friends", following: false });
        }
      }

      // Set cover image based on user's saved wallpaper or default
      const savedWallpaperId = userProfileData?.wallpaperId || "herobrine_hill";
      setWallpaperId(savedWallpaperId);
      const coverImageUrl = getWallpaperUrl(savedWallpaperId, targetUsername);
      setCoverImage(coverImageUrl);
      setLoading(false);
    } catch (error) {
      console.error("Error in profile data fetch:", error);
      if (error?.response?.status === 403) {
        setProfileUser(null);
        setError("This profile is private.");
      } else {
        setNotFound(true);
        setError("Profile not found or unavailable.");
      }
      setLoading(false);
    }
  }, [user, username, shouldDisplayProfile, getRelationship]);

  // Social modal handlers
  const handleOpenFollowersModal = useCallback(async () => {
    setShowFollowersModal(true);
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFollowers(profileUser?.username);
      setFollowersData(response?.data?.followers || []);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
      setFollowersData([]);
    } finally {
      setSocialModalLoading(false);
    }
  }, [profileUser?.username]);

  const handleOpenFollowingModal = useCallback(async () => {
    setShowFollowingModal(true);
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFollowing(profileUser?.username);
      setFollowingData(response?.data?.following || []);
    } catch (err) {
      console.error("Failed to fetch following:", err);
      setFollowingData([]);
    } finally {
      setSocialModalLoading(false);
    }
  }, [profileUser?.username]);

  const handleOpenFriendsModal = useCallback(async () => {
    setShowFriendsModal(true);
    setSocialModalLoading(true);
    try {
      const response = await SocialService.getFriends(profileUser?.username);
      setFriendsData(response?.data?.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
      setFriendsData([]);
    } finally {
      setSocialModalLoading(false);
    }
  }, [profileUser?.username]);

  const closeSocialModals = useCallback(() => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    setShowFriendsModal(false);
    setFollowersData([]);
    setFollowingData([]);
    setFriendsData([]);
  }, []);

  // Wallpaper handlers
  const handleWallpaperSelect = useCallback(async (id) => {
    setPendingWallpaperId(id);
    setShowWallpaperModal(true);
  }, []);

  const confirmWallpaperChange = useCallback(async (id) => {
    // Accept ID parameter like original Profile.js, or use pending if no ID provided
    const wallpaperIdToUse = id || pendingWallpaperId;
    setShowWallpaperModal(false);

    if (!wallpaperIdToUse) {
      return;
    }

    setSavingWallpaper(true);
    const uname = profileUser?.mcUsername || profileUser?.username || "Steve";
    const newWallpaperUrl = getWallpaperUrl(wallpaperIdToUse, uname);
    
    // Preload the new wallpaper image for smooth transition
    const preloadImage = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = newWallpaperUrl;
    });

    // Minimum loading time for smooth animation (1.5 seconds)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Wait for both image preload and minimum loading time
      await Promise.all([preloadImage, minLoadingTime]);
      
      // Save to database
      await API.put("/api/user/profile", { wallpaperId: wallpaperIdToUse });
      
      // Update state after successful save
      setWallpaperId(wallpaperIdToUse);
      setCoverImage(newWallpaperUrl);
      
      // Update the profileUser with the new wallpaper ID so it persists
      setProfileUser(prev => ({
        ...prev,
        wallpaperId: wallpaperIdToUse
      }));
      
      if (onWallpaperChangeSuccess) onWallpaperChangeSuccess();
    } catch (err) {
      console.error("Failed to update wallpaper:", err);
      // Revert to previous
      setWallpaperId(profileUser?.wallpaperId || null);
      setCoverImage(getWallpaperUrl(profileUser?.wallpaperId || WALLPAPERS[0].id, uname));
    } finally {
      // Add a small delay before hiding loading to ensure smooth transition
      setTimeout(() => {
        setSavingWallpaper(false);
        setPendingWallpaperId(null);
      }, 300);
    }
  }, [pendingWallpaperId, profileUser, onWallpaperChangeSuccess]);

  // Friend request handlers
  const handleSendFriendRequest = useCallback(async (username) => {
    const { sendFriendRequest } = socialContext;
    try {
      await sendFriendRequest(username);
      const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
      setRelationship(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socialContext, getRelationship, profileUser]);

  const handleAcceptFriendRequest = useCallback(async (username) => {
    const { acceptFriendRequest } = socialContext;
    try {
      await acceptFriendRequest(username);
      const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
      setRelationship(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socialContext, getRelationship, profileUser]);

  const handleRejectFriendRequest = useCallback(async (username) => {
    const { rejectFriendRequest } = socialContext;
    try {
      await rejectFriendRequest(username);
      const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
      setRelationship(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socialContext, getRelationship, profileUser]);

  // Follow handlers
  const handleFollowUser = useCallback(async (username) => {
    const { followUser } = socialContext;
    try {
      await followUser(username);
      setRelationship((prev) => ({ ...prev, following: true }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socialContext]);

  const handleUnfollowUser = useCallback(async (username) => {
    const { unfollowUser } = socialContext;
    try {
      await unfollowUser(username);
      setRelationship((prev) => ({ ...prev, following: false }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [socialContext]);

  // Initialize data
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Update cover image when wallpaper changes
  useEffect(() => {
    if (profileUser && (profileUser.wallpaperId || wallpaperId)) {
      const id = profileUser.wallpaperId || wallpaperId || WALLPAPERS[0].id;
      const uname = profileUser.mcUsername || profileUser.username || "Steve";
      setWallpaperId(id);
      setCoverImage(getWallpaperUrl(id, uname));
    }
  }, [profileUser, wallpaperId]);

  return {
    // Core profile data
    profileUser,
    loading,
    notFound,
    error,
    isOwnProfile,
    shouldDisplayProfile,

    // Profile customization
    viewMode,
    setViewMode,
    coverImage,
    setCoverImage,
    wallpaperId,
    setWallpaperId,
    savingWallpaper,
    showWallpaperModal,
    setShowWallpaperModal,
    pendingWallpaperId,
    handleWallpaperSelect,
    confirmWallpaperChange,

    // Social relationships
    relationship,
    friends,
    friendsLoading,

    // Social modals
    showFollowersModal,
    showFollowingModal,
    showFriendsModal,
    followersData,
    followingData,
    friendsData,
    socialModalLoading,
    handleOpenFollowersModal,
    handleOpenFollowingModal,
    handleOpenFriendsModal,
    closeSocialModals,

    // Minecraft data
    playerStats,
    achievements,
    inventoryItems,

    // Actions
    fetchProfileData,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleFollowUser,
    handleUnfollowUser,
  };
} 