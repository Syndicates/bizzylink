/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file WallTab.jsx
 * @description Wall posts tab component with repost system integration
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { PaperAirplaneIcon, TrashIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import WallPost from './WallPost';
import RepostModal from './RepostModal';
import LoadingSpinner from '../LoadingSpinner';
import { useWallPosts } from '../../hooks/profile/useWallPosts';
import wallService from '../../services/wallService';

const WallTab = ({
  isOwnProfile,
  wallPosts,
  wallLoading,
  wallError,
  newWallPost,
  setNewWallPost,
  postLoading,
  postError,
  onCreatePost,
  onDeletePost,
  onLikePost,
  onUnlikePost,
  onAddComment,
  onDeleteComment,
  expandedComments,
  onToggleComments,
  showBulkDeleteModal,
  onShowBulkDeleteModal,
  
  // Repost functionality
  repostStatuses = {},
  repostLoading = {},
  onRepost,
  onUnrepost,
  onOpenRepostModal,
  onConfirmRepost,
  onCancelRepost,
  showRepostModal = false,
  
  // View tracking
  onTrackView,
  viewCounts = {},
  
  // Add props for pagination
  page = 1,
  totalPages = 1,
  onLoadMorePosts,
  
  className = '',
  profileUser,
  setWallPosts,
  likeAnimStates = {},
  viewedRef
}) => {
  // Local notification state
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Add state for emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Add common emojis for quick selection
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];

  // Add handler for emoji insertion
  const handleEmojiSelect = (emoji) => {
    setNewWallPost(newWallPost + emoji);
    setShowEmojiPicker(false);
  };

  // Handle repost with notification
  const handleRepostWithNotification = async () => {
    const result = await onConfirmRepost();
    
    if (result?.success) {
      setNotification({
        show: true,
        type: 'success',
        message: result.message || 'Post reposted successfully!'
      });
    } else if (result?.error) {
      setNotification({
        show: true,
        type: 'error',
        message: result.error
      });
    }

    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Handle unrepost with notification
  const handleUnrepostWithNotification = async (postId) => {
    const result = await onUnrepost(postId);
    
    if (result?.success) {
      setNotification({
        show: true,
        type: 'success',
        message: result.message || 'Repost removed successfully!'
      });
    } else if (result?.error) {
      setNotification({
        show: true,
        type: 'error',
        message: result.error
      });
    }

    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleFadeInEnd = (postId) => {
    setWallPosts(prev => prev.map(post =>
      post._id === postId ? { ...post, fadeIn: false } : post
    ));
  };

  // Callback to clear fadeIn for a comment after animation
  const handleCommentFadeInEnd = (postId, commentId) => {
    setWallPosts(prev => prev.map(post =>
      post._id === postId
        ? {
            ...post,
            comments: (post.comments || []).map(comment =>
              comment && comment._id === commentId
                ? { ...comment, fadeIn: false }
                : comment
            )
          }
        : post
    ));
  };

  const handleAddComment = async (postId, commentText) => {
    // Optimistic comment
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      content: commentText,
      author: { ...profileUser },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setWallPosts(prev => prev.map(post =>
      post._id === postId
        ? { ...post, comments: [...(post.comments || []), optimisticComment] }
        : post
    ));
    try {
      const response = await wallService.addComment(postId, commentText);
      if (response && response.comments) {
        setWallPosts(prev => prev.map(post =>
          post._id === postId
            ? { ...post, comments: response.comments }
            : post
        ));
      }
    } catch (err) {
      setWallPosts(prev => prev.map(post =>
        post._id === postId
          ? { ...post, comments: (post.comments || []).filter(c => !c.isOptimistic) }
          : post
      ));
      // Optionally show error
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Post Creation Form - Show for all authenticated users */}
      <div className="habbo-card p-6 rounded-md">
        <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4">
          {isOwnProfile ? "Update Your Status" : `Write on ${profileUser?.username || 'User'}'s Wall`}
        </h3>
        <form onSubmit={onCreatePost} className="space-y-4">
          <div className="relative">
            <textarea
              value={newWallPost}
              onChange={(e) => setNewWallPost(e.target.value)}
              placeholder={isOwnProfile ? "What's on your mind?" : `Write something to ${profileUser?.username || 'this user'}...`}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-minecraft-habbo-blue resize-none"
              rows="3"
              disabled={postLoading}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg">
                <div className="grid grid-cols-3 gap-1">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-xl p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {postError && (
            <div className="text-red-400 text-sm">{postError}</div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Show delete all only for own profile with posts */}
              {isOwnProfile && wallPosts.length > 0 && (
                <button
                  type="button"
                  onClick={onShowBulkDeleteModal}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete All Posts</span>
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!newWallPost.trim() || postLoading}
              className="px-6 py-2 bg-minecraft-habbo-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md transition-colors flex items-center space-x-2"
            >
              {postLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
              <span>{postLoading ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Wall Posts */}
      <div className="space-y-4">
        {wallLoading && !wallPosts.length ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : wallError ? (
          <div className="text-red-500 text-center">{wallError}</div>
        ) : wallPosts.length === 0 ? (
          <div className="text-center text-gray-500">No posts yet</div>
        ) : (
          wallPosts.map((post) => {
            // For reposts, use the original post's ID for comment state
            const isRepostWithOriginal = post.isRepost && post.originalPost && post.originalPost._id;
            const commentKey = isRepostWithOriginal ? post.originalPost._id : post._id;
            return (
              <WallPost
                key={post._id}
                post={post}
                isOwnProfile={isOwnProfile}
                onDelete={onDeletePost}
                onLike={onLikePost}
                onUnlike={onUnlikePost}
                onAddComment={handleAddComment}
                onDeleteComment={onDeleteComment}
                isExpanded={expandedComments.has(post._id)}
                onToggleComments={() => onToggleComments(post._id)}
                // Repost functionality
                onRepost={onRepost}
                onUnrepost={handleUnrepostWithNotification}
                onOpenRepostModal={onOpenRepostModal}
                repostStatus={repostStatuses[post._id]}
                repostLoading={repostLoading[post._id] || false}
                // View tracking
                onTrackView={onTrackView}
                viewCount={viewCounts[post._id] || 0}
                onFadeInEnd={handleFadeInEnd}
                onCommentFadeInEnd={handleCommentFadeInEnd}
                viewedRef={viewedRef}
                likeAnimating={likeAnimStates[post._id]}
              />
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {wallPosts.length > 0 && !wallLoading && page < totalPages && (
        <div className="text-center">
          <button
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
            onClick={onLoadMorePosts}
          >
            Load More Posts
          </button>
        </div>
      )}

      {/* Repost Modal */}
      <RepostModal
        isOpen={showRepostModal}
        onConfirm={handleRepostWithNotification}
        onCancel={onCancelRepost}
        loading={false} // Add repost loading state if needed
      />
    </div>
  );
};

export default WallTab; 