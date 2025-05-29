/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Profile.refactored.js
 * @description Clean refactored Profile component with modular design
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventSource } from '../contexts/EventSourceContext';
import useProfileData from '../hooks/profile/useProfileData';
import useWallPosts from '../hooks/profile/useWallPosts';
import useSocialStats from '../hooks/useSocialStats';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import MinecraftAvatar from '../components/MinecraftAvatar';
import API from '../services/api';
import { LockClosedIcon } from '@heroicons/react/24/outline';

// Modular components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabNavigation from '../components/profile/ProfileTabNavigation';
import LeftSidebar from '../components/profile/LeftSidebar';
import RightSidebar from '../components/profile/RightSidebar';

// Tab components
import WallTab from '../components/profile/WallTab';
import InfoTab from '../components/profile/tabs/InfoTab';
import StatsTab from '../components/profile/tabs/StatsTab';
import AchievementsTab from '../components/profile/tabs/AchievementsTab';
import InventoryTab from '../components/profile/tabs/InventoryTab';
import RecipesTab from '../components/profile/tabs/RecipesTab';
import PhotosTab from '../components/profile/tabs/PhotosTab';

// Modal components
import WallpaperModal from '../components/profile/WallpaperModal';

// Bulk Delete Modal implementation
const BulkDeleteModal = ({ posts, username, onConfirm, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText.trim().toLowerCase() === "confirm";

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const allPostIds = posts.map((p) => p._id);
      if (allPostIds.length === 0) {
        setError("No posts to delete.");
        setLoading(false);
        return;
      }
      await API.delete(`/api/wall/${username}/bulk-delete`, {
        data: { postIds: allPostIds },
      });
      setLoading(false);
      onConfirm?.();
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete posts.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-minecraft-navy p-8 rounded-lg shadow-lg max-w-md w-full border-2 border-red-500">
        <h2 className="text-xl font-minecraft text-red-400 mb-4">Delete All Posts?</h2>
        <p className="text-gray-200 mb-4">Are you sure you want to delete <b>all</b> your wall posts? This action cannot be undone.</p>
        <p className="text-gray-300 mb-2">Type <span className="font-bold text-red-400">confirm</span> to proceed.</p>
        <input
          type="text"
          className="w-full px-3 py-2 rounded bg-minecraft-navy-light border border-red-400 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Type 'confirm' to enable delete"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isConfirmValid}
          >
            {loading ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { username } = useParams();
  
  // Local UI state management
  const [activeTab, setActiveTab] = useState('wall');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [toast, setToast] = useState({ show: false, message: '' });

  // SSE Integration - matching legacy Profile.js
  const { addEventListener, isConnected } = useEventSource();
  
  // Profile data hook - encapsulates all profile-related state and logic
  const {
    profileUser,
    loading: profileLoading,
    notFound,
    error: profileError,
    isOwnProfile,
    
    // Profile customization
    viewMode,
    setViewMode,
    coverImage,
    wallpaperId,
    savingWallpaper,
    showWallpaperModal,
    setShowWallpaperModal,
    handleWallpaperSelect,
    confirmWallpaperChange,
    
    // Social relationships
    relationship,
    
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
    
    // Social actions
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleFollowUser,
    handleUnfollowUser,
  } = useProfileData(username, {
    onWallpaperChangeSuccess: () => setToast({ show: true, message: 'Cover image updated successfully!' })
  });

  // Wall posts hook with SSE support
  const {
    wallPosts,
    setWallPosts,
    wallLoading,
    wallError,
    newWallPost,
    setNewWallPost,
    postLoading,
    postError,
    commentInputs,
    commentLoading,
    expandedComments,
    handleCreateWallPost,
    handleDeleteWallPost,
    handleLikeWallPost,
    handleUnlikeWallPost,
    handleAddComment,
    handleDeleteComment,
    handleCommentInputChange,
    toggleCommentSection,
    repostStatuses,
    repostLoading,
    handleRepost,
    handleUnrepost,
    handleOpenRepostModal,
    handleConfirmRepost,
    handleCancelRepost,
    showRepostModal,
    trackPostView,
    viewCounts,
    refreshWallPosts,
    wallPage,
    wallTotalPages,
    fetchWallPosts,
  } = useWallPosts(profileUser, isOwnProfile);

  // Social stats hook - real API data
  const rawSocialStats = useSocialStats(profileUser?.username);
  const socialStats = useMemo(() => ({
    friendsCount: rawSocialStats.friendsCount,
    followersCount: rawSocialStats.followersCount,
    followingCount: rawSocialStats.followingCount,
    loading: rawSocialStats.loading,
    error: rawSocialStats.error
  }), [
    rawSocialStats.friendsCount,
    rawSocialStats.followersCount,
    rawSocialStats.followingCount,
    rawSocialStats.loading,
    rawSocialStats.error
  ]);

  // Refs for SSE handlers
  const profileUserRef = useRef();

  // Update refs when data changes
  useEffect(() => {
    profileUserRef.current = profileUser;
  }, [profileUser]);

  // SSE Event Handlers - matching legacy Profile.js exactly
  
  const fetchWallPostsDirectly = useCallback(async () => {
    if (!profileUser?.username) return;
    console.log("[Profile][SSE] Refreshing wall posts for", profileUser.username);
    try {
      await refreshWallPosts();
    } catch (error) {
      console.error("[Profile][SSE] Failed to refresh wall posts:", error);
    }
  }, [profileUser?.username, refreshWallPosts]);

  const handleWallPostEvent = useCallback((event) => {
    const currentProfileUser = profileUserRef.current;
    console.log("[SSE][WALL_POST][DEBUG] Event received:", event);
    
    if (!event) return;
    
    // Check if the event is relevant to the wall currently being viewed
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    console.log(
      "[SSE][WALL_POST][DEBUG] wallOwnerUsername:",
      event.wallOwnerUsername,
      "viewedUsername:",
      viewedUsername,
    );
    
    if (event.wallOwnerUsername === viewedUsername) {
      if (event.type === "new_post") {
        setNotification({
          show: true,
          type: "success",
          message: `New wall post received!`,
        });
      }
      if (event.type === "delete_post") {
        setNotification({
          show: true,
          type: "success",
          message: `A wall post was deleted.`,
        });
      }
      fetchWallPostsDirectly();
    }
  }, [fetchWallPostsDirectly]);

  const handleWallCommentEvent = useCallback((event) => {
    console.log("[DEBUG][SSE] handleWallCommentEvent fired:", event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: "success",
        message: "New comment received!",
      });
      fetchWallPostsDirectly();
    }
  }, [fetchWallPostsDirectly]);

  const handleWallLikeEvent = useCallback((event) => {
    console.log("[DEBUG][SSE] handleWallLikeEvent fired:", event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: "success",
        message: "A post was liked!",
      });
      fetchWallPostsDirectly();
    }
  }, [fetchWallPostsDirectly]);

  // SSE Event Listeners
  useEffect(() => {
    if (!addEventListener) return;
    
    const removeWallPost = addEventListener("wall_post", handleWallPostEvent);
    const removeNewPost = addEventListener("new_post", handleWallPostEvent);
    const removeDeletePost = addEventListener("delete_post", handleWallPostEvent);
    
    return () => {
      if (removeWallPost) removeWallPost();
      if (removeNewPost) removeNewPost();
      if (removeDeletePost) removeDeletePost();
    };
  }, [addEventListener, handleWallPostEvent]);

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    
    const removeWallComment = addEventListener("wall_comment", handleWallCommentEvent);
    const removeCommentAdded = addEventListener("comment_added", handleWallCommentEvent);
    
    return () => {
      if (removeWallComment) removeWallComment();
      if (removeCommentAdded) removeCommentAdded();
    };
  }, [addEventListener, isConnected, handleWallCommentEvent]);

  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    
    const removeWallLike = addEventListener("wall_like", handleWallLikeEvent);
    const removeLikeAdded = addEventListener("like_added", handleWallLikeEvent);
    const removeLikeRemoved = addEventListener("like_removed", handleWallLikeEvent);
    
    return () => {
      if (removeWallLike) removeWallLike();
      if (removeLikeAdded) removeLikeAdded();
      if (removeLikeRemoved) removeLikeRemoved();
    };
  }, [addEventListener, isConnected, handleWallLikeEvent]);

  // Social action handler - centralizes all social operations
  const handleSocialAction = useCallback(async (action, data) => {
    switch (action) {
      case 'sendFriendRequest':
        return await handleSendFriendRequest(data.username);
      case 'acceptFriendRequest':
        return await handleAcceptFriendRequest(data.username);
      case 'rejectFriendRequest':
        return await handleRejectFriendRequest(data.username);
      case 'followUser':
        return await handleFollowUser(data.username);
      case 'unfollowUser':
        return await handleUnfollowUser(data.username);
      case 'openFollowersModal':
        return handleOpenFollowersModal();
      case 'openFollowingModal':
        return handleOpenFollowingModal();
      case 'openFriendsModal':
        return handleOpenFriendsModal();
      default:
        return { success: false, error: 'Unknown action' };
    }
  }, [
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    handleFollowUser,
    handleUnfollowUser,
    handleOpenFollowersModal,
    handleOpenFollowingModal,
    handleOpenFriendsModal,
  ]);

  // Tab change handler
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Handler for loading more wall posts
  const handleLoadMoreWallPosts = () => {
    if (!wallLoading && wallPage < wallTotalPages) {
      fetchWallPosts(wallPage + 1, true); // true = append
    }
  };

  // Render tab content
  const renderTabContent = () => {
    const commonProps = {
      profileUser,
      playerStats,
      isOwnProfile,
      achievements,
    };

    switch (activeTab) {
      case 'wall':
        return (
          <WallTab
            isOwnProfile={isOwnProfile}
            profileUser={profileUser}
            wallPosts={wallPosts}
            setWallPosts={setWallPosts}
            wallLoading={wallLoading}
            wallError={wallError}
            newWallPost={newWallPost}
            setNewWallPost={setNewWallPost}
            postLoading={postLoading}
            postError={postError}
            onCreatePost={handleCreateWallPost}
            onDeletePost={handleDeleteWallPost}
            onLikePost={handleLikeWallPost}
            onUnlikePost={handleUnlikeWallPost}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            commentInputs={commentInputs}
            commentLoading={commentLoading}
            onCommentInputChange={handleCommentInputChange}
            expandedComments={expandedComments}
            onToggleComments={toggleCommentSection}
            showBulkDeleteModal={showBulkDeleteModal}
            onShowBulkDeleteModal={() => setShowBulkDeleteModal(true)}
            repostStatuses={repostStatuses}
            repostLoading={repostLoading}
            onRepost={handleRepost}
            onUnrepost={handleUnrepost}
            onOpenRepostModal={handleOpenRepostModal}
            onConfirmRepost={handleConfirmRepost}
            onCancelRepost={handleCancelRepost}
            showRepostModal={showRepostModal}
            onTrackView={trackPostView}
            viewCounts={viewCounts}
            page={wallPage}
            totalPages={wallTotalPages}
            onLoadMorePosts={handleLoadMoreWallPosts}
          />
        );
      case 'info':
        return <InfoTab {...commonProps} />;
      case 'stats':
        return <StatsTab {...commonProps} />;
      case 'achievements':
        return <AchievementsTab {...commonProps} />;
      case 'inventory':
        return <InventoryTab {...commonProps} />;
      case 'recipes':
        return <RecipesTab {...commonProps} />;
      case 'photos':
        return <PhotosTab {...commonProps} />;
      default:
        return <div>Tab not implemented</div>;
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="text-gray-400 mt-4 font-minecraft">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4">😔</div>
          <h1 className="text-3xl font-minecraft text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-400">
            The profile you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Privacy or other error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-minecraft-navy-dark via-minecraft-navy to-minecraft-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfileHeader
            profileUser={profileUser}
            playerStats={playerStats}
            coverImage={coverImage}
            isOwnProfile={isOwnProfile}
            relationship={relationship}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onWallpaperSelect={() => setShowWallpaperModal(true)}
            onSocialAction={handleSocialAction}
            savingWallpaper={savingWallpaper}
            socialStats={socialStats}
          />
          <div className="mt-8 flex flex-col items-center justify-center py-12 bg-minecraft-navy/50 rounded-lg border-2 border-minecraft-habbo-blue/30">
            <LockClosedIcon className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-minecraft text-red-400 mb-2">Private Profile</h2>
            <p className="text-gray-400 text-center max-w-md">
              This profile is private. Only the owner can view their profile content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-minecraft-navy-dark via-minecraft-navy to-minecraft-navy-dark">
        {/* Real-time notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {notification.message}
          </div>
        )}
        
        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in duration-300 font-semibold">
            {toast.message}
            <button className="ml-4 text-white/80 hover:text-white text-lg" onClick={() => setToast({ show: false, message: '' })}>&times;</button>
          </div>
        )}
        
        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfileHeader
            profileUser={profileUser}
            playerStats={playerStats}
            coverImage={coverImage}
            isOwnProfile={isOwnProfile}
            relationship={relationship}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onWallpaperSelect={() => setShowWallpaperModal(true)}
            onSocialAction={handleSocialAction}
            savingWallpaper={savingWallpaper}
            socialStats={socialStats}
          />

          {/* Show privacy message if profile is private and not own profile */}
          {profileUser?.isPrivate && !isOwnProfile ? (
            <div className="mt-8 flex flex-col items-center justify-center py-12 bg-minecraft-navy/50 rounded-lg border-2 border-minecraft-habbo-blue/30">
              <LockClosedIcon className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-minecraft text-red-400 mb-2">Private Profile</h2>
              <p className="text-gray-400 text-center max-w-md">
                This profile is private. Only the owner can view their profile content.
              </p>
            </div>
          ) : (
            <>
            <ProfileTabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isOwnProfile={isOwnProfile}
              className="mt-6"
            />

            <div className="mt-6 flex gap-6">
              {/* Left Sidebar */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <LeftSidebar
                  profileUser={profileUser}
                  playerStats={playerStats}
                  isOwnProfile={isOwnProfile}
                  socialStats={socialStats}
                  onOpenFriendsModal={() => handleSocialAction('openFriendsModal')}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {renderTabContent()}
              </div>

              {/* Right Sidebar */}
              <div className="hidden xl:block w-80 flex-shrink-0">
                <RightSidebar
                  profileUser={profileUser}
                  playerStats={playerStats}
                  achievements={achievements}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            </div>
            </>
          )}
        </div>

        {/* Wallpaper Modal */}
        {showWallpaperModal && (
          <WallpaperModal
            currentWallpaper={wallpaperId}
            onSelect={handleWallpaperSelect}
            onConfirm={confirmWallpaperChange}
            onClose={() => setShowWallpaperModal(false)}
            saving={savingWallpaper}
          />
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <BulkDeleteModal
            posts={wallPosts}
            username={profileUser?.username}
            onConfirm={() => setShowBulkDeleteModal(false)}
            onClose={() => setShowBulkDeleteModal(false)}
            onSuccess={() => {
              refreshWallPosts();
              setNotification({
                show: true,
                type: 'success',
                message: 'All posts deleted!'
              });
            }}
          />
        )}

        {/* Social Modals */}
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  👥 Followers ({followersData.length})
                </h2>
                <button
                  onClick={closeSocialModals}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {socialModalLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : followersData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No followers yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followersData.map((follower) => (
                      <div key={follower.username} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                        <MinecraftAvatar
                          username={follower.mcUsername || follower.username}
                          size={48}
                          type="head"
                          className="rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{follower.username}</h3>
                          {follower.mcUsername && follower.mcUsername !== follower.username && (
                            <p className="text-gray-400 text-sm truncate">{follower.mcUsername}</p>
                          )}
                        </div>
                        <Link
                          to={`/profile/${follower.username}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={closeSocialModals}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showFollowingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  💚 Following ({followingData.length})
                </h2>
                <button
                  onClick={closeSocialModals}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {socialModalLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : followingData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {followingData.map((following) => (
                      <div key={following.username} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                        <MinecraftAvatar
                          username={following.mcUsername || following.username}
                          size={48}
                          type="head"
                          className="rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{following.username}</h3>
                          {following.mcUsername && following.mcUsername !== following.username && (
                            <p className="text-gray-400 text-sm truncate">{following.mcUsername}</p>
                          )}
                        </div>
                        <Link
                          to={`/profile/${following.username}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={closeSocialModals}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showFriendsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  🤝 Friends ({friendsData.length})
                </h2>
                <button
                  onClick={closeSocialModals}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {socialModalLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : friendsData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No friends yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friendsData.map((friend) => (
                      <div key={friend.username} className="bg-gray-700 rounded-lg p-4 flex items-center space-x-3">
                        <MinecraftAvatar
                          username={friend.mcUsername || friend.username}
                          size={48}
                          type="head"
                          className="rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{friend.username}</h3>
                          {friend.mcUsername && friend.mcUsername !== friend.username && (
                            <p className="text-gray-400 text-sm truncate">{friend.mcUsername}</p>
                          )}
                        </div>
                        <Link
                          to={`/profile/${friend.username}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={closeSocialModals}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Profile; 