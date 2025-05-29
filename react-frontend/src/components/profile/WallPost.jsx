/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file WallPost.jsx
 * @description Wall post component with Minecraft head avatars, repost system, and view tracking
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChatBubbleOvalLeftIcon, 
  TrashIcon, 
  EllipsisHorizontalIcon,
  EyeIcon,
  FaceSmileIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/timeUtils';
import { useAuth } from '../../contexts/AuthContext';
import MinecraftAvatar from '../MinecraftAvatar';
import RepostButton from './RepostButton';
import LikeButton from './LikeButton';
import PropTypes from 'prop-types';
import PostCard from '../PostCard';

const WallPost = ({
  post,
  isOwnProfile,
  onDelete,
  onLike,
  onUnlike,
  onAddComment,
  onDeleteComment,
  likeLoading,
  isExpanded,
  onToggleComments,
  
  // Repost functionality
  onUnrepost,
  onOpenRepostModal,
  repostStatus,
  repostLoading = false,
  
  // View tracking
  onTrackView,
  viewCount = 0,
  onFadeInEnd,
  onCommentFadeInEnd,
  viewedRef
}) => {
  console.log('WallPost render', post._id, 'fadeIn:', post.fadeIn);
  const { user } = useAuth();
  
  const {
    _id,
    author,
    content,
    createdAt,
    likes = [],
    comments = [],
    isRepost = false,
    originalPost, // Contains the full original post data
    repostMessage
  } = post;

  const safeAuthor = author || { username: "Unknown User", mcUsername: "Steve" };

  // Repost data (support both original and repost)
  // For reposts, use originalPost._id and originalPost's repost state if available
  const isRepostWithOriginal = isRepost && originalPost;
  const repostTargetId = isRepostWithOriginal ? originalPost._id : _id;
  const repostState = isRepostWithOriginal ? (originalPost || {}) : post;
  const hasReposted = (repostStatus?.hasReposted ?? repostState.hasReposted) || false;
  // For reposts, always use originalPost.repostCount if available
  const repostCount = isRepostWithOriginal && originalPost.repostCount !== undefined
    ? originalPost.repostCount
    : (repostStatus?.repostCount ?? repostState.repostCount ?? 0);
  // Debug log for repost count
  console.log('[WallPost][RENDER] postId:', _id, 'repostCount:', repostCount, 'isRepostWithOriginal:', isRepostWithOriginal);
  const repostBtnLoading = repostLoading || false;

  // Check if current user is the author of the original post (for reposts) or the post (for originals)
  const isOwnOriginalPost = user && (
    isRepostWithOriginal
      ? (originalPost.author && (
          user.username === originalPost.author.username ||
          user._id === originalPost.author._id ||
          user.id === originalPost.author.id
        ))
      : (author && (
          user.username === author.username ||
          user._id === author._id ||
          user.id === author.id
        ))
  );

  // Check if current user is the author of this repost wrapper
  const isOwnRepost = user && isRepost && author && (
    user.username === author.username || 
    user._id === author._id ||
    user.id === author.id
  );

  // Track view when post is displayed
  useEffect(() => {
    if (onTrackView && _id && viewedRef) {
      if (!viewedRef.current[_id]) {
        viewedRef.current[_id] = true;
        const timer = setTimeout(() => {
          onTrackView(_id);
        }, 1000); // Track view after 1 second
        return () => clearTimeout(timer);
      }
    }
  }, [_id, onTrackView, viewedRef]);

  // Add state for emoji picker visibility for comment input
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Common emojis for quick selection
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];
  // Handler for emoji selection
  const handleEmojiSelect = (emoji) => {
    // No need to update commentInput or onCommentInputChange
    setShowEmojiPicker(false);
  };

  // For reposts, use original post's metadata for all counts and like status
  const isRepostWithOriginalComments = isRepostWithOriginal && Array.isArray(post.originalComments);
  // Always show the original post's content for reposts
  const displayContent = isRepostWithOriginal ? originalPost.content : content;
  // For reposts, show the original comments and use the original post's ID for commenting
  const commentsToShow = isRepostWithOriginalComments ? post.originalComments : comments;
  const commentTargetId = isRepostWithOriginalComments && originalPost?._id ? originalPost._id : _id;
  // For reposts, use original post's likes and like status
  const likeList = isRepostWithOriginal ? originalPost.likes || [] : likes;
  const likeCount = likeList.length;
  const isLiked = isRepostWithOriginal ? originalPost.isLiked : (post.isLiked || false);
  const commentCount = isRepostWithOriginalComments ? (post.originalComments?.length || 0) : comments.length;

  // Helper to get the correct postId for like/comment (original for reposts)
  const getPostId = () => (isRepostWithOriginal && originalPost && originalPost._id) ? originalPost._id : _id;

  // Unified repost/unrepost handlers for button
  const handleRepost = (id) => {
    onOpenRepostModal(id);
  };
  const handleUnrepost = (id) => {
    onUnrepost(id);
  };

  // Profile navigation helpers
  const getProfileUsername = (author) => {
    if (!author) return 'unknown';
    return author.username || author.displayName || 'Unknown';
  };

  // For reposts, determine which data to show
  const displayAuthor = isRepostWithOriginal && originalPost.author ? originalPost.author : (author || { username: "Unknown User", mcUsername: "Steve" });
  const displayCreatedAt = isRepostWithOriginal ? originalPost.createdAt : createdAt;
  const profileUsername = displayAuthor.username || displayAuthor.displayName || "Unknown";
  const displayName = displayAuthor.username || displayAuthor.displayName || "Unknown User";
  const displayMcUsername = displayAuthor.mcUsername || displayAuthor.minecraftUsername || displayAuthor.username || "Steve";

  // Fade-in/fade-out for post
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    if (post.fadeIn && !animationComplete) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
        setAnimationComplete(true);
        if (onFadeInEnd) onFadeInEnd(post._id);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [post.fadeIn, post._id, onFadeInEnd, animationComplete]);

  useEffect(() => {
    if (post.removing) {
      setShouldFadeOut(true);
    }
  }, [post.removing]);

  // Like pulse animation
  const [shouldPulse, setShouldPulse] = useState(false);
  const prevLikeUsernamesRef = React.useRef([]);
  useEffect(() => {
    const currentLikeUsernames = (likes || []).filter(like => like && like.user && like.user.username).map(like => like.user.username).sort();
    const prevLikeUsernames = prevLikeUsernamesRef.current;
    // Compare sets
    if (JSON.stringify(currentLikeUsernames) !== JSON.stringify(prevLikeUsernames)) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 500);
      prevLikeUsernamesRef.current = currentLikeUsernames;
      return () => clearTimeout(timer);
    }
    prevLikeUsernamesRef.current = currentLikeUsernames;
  }, [likes]);
  const likePulseClass = shouldPulse ? 'animate-like-pulse' : '';

  // Comment fade-in/fade-out state
  const [commentAnimStates, setCommentAnimStates] = useState({});

  // Set up fade-in for new comments
  useEffect(() => {
    if (comments) {
      comments.filter(Boolean).forEach(comment => {
        if (comment.fadeIn && !commentAnimStates[comment._id]?.fadeIn) {
          setCommentAnimStates(prev => ({
            ...prev,
            [comment._id]: { ...prev[comment._id], fadeIn: true }
          }));
          setTimeout(() => {
            setCommentAnimStates(prev => ({
              ...prev,
              [comment._id]: { ...prev[comment._id], fadeIn: false }
            }));
            if (onCommentFadeInEnd) onCommentFadeInEnd(_id, comment._id);
          }, 1200);
        }
      });
    }
  }, [comments, commentAnimStates, onCommentFadeInEnd, _id]);

  // Handle fade-out for comment removal
  useEffect(() => {
    if (comments) {
      comments.filter(Boolean).forEach(comment => {
        if (comment.removing && !commentAnimStates[comment._id]?.removing) {
          setCommentAnimStates(prev => ({
            ...prev,
            [comment._id]: { ...prev[comment._id], removing: true }
          }));
        }
      });
    }
  }, [comments, commentAnimStates]);

  // Add local state for comment input
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Local submit handler for comment form
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    await onAddComment(getPostId(), commentInput.trim());
    setCommentInput('');
    setCommentLoading(false);
  };

  // Render the shared PostCard for the main post card
  return (
    <div>
      <PostCard
        post={post}
        isOwnProfile={isOwnProfile}
        isOwnOriginalPost={isOwnOriginalPost}
        isOwnRepost={isOwnRepost}
        onDelete={onDelete}
        onLike={() => onLike(getPostId())}
        onUnlike={() => onUnlike(getPostId())}
        onRepost={handleRepost}
        onUnrepost={handleUnrepost}
        repostStatus={repostStatus}
        repostLoading={repostBtnLoading}
        viewCount={viewCount}
        onMenu={() => {}}
        onToggleComments={onToggleComments}
      />
      {/* WallPost-specific logic: comments, emoji picker, view tracking, etc. */}
      {isExpanded && (
        <div className="border-t border-white/10 pt-3 pl-13">
          {/* Existing Comments */}
          {commentsToShow.filter(Boolean).map((comment) => {
            if (!comment) return null;
            // Ensure author exists or provide fallback
            const author = comment.author || {
              username: "Unknown User",
              mcUsername: "Steve",
            };
            // Ensure we have a valid username for the avatar
            const avatarUsername = author.mcUsername || author.minecraftUsername || author.username;

            const animState = commentAnimStates[comment._id] || {};
            return (
              <div key={comment._id} className={`flex items-start space-x-2 mb-2 ${
                animState.fadeIn ? 'animate-fade-in' : ''
              }${comment.removing || animState.removing ? ' animate-fade-out' : ''}`}>
                <Link to={`/profile/${author.username}`}>
                  <MinecraftAvatar 
                    username={avatarUsername}
                    size={24}
                    type="head"
                    className="mt-1 rounded-md"
                  />
                </Link>
                <div className="flex-1 bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <Link 
                      to={`/profile/${author.username}`}
                      className="text-sm font-medium text-white hover:text-minecraft-habbo-blue flex items-center"
                    >
                      {author.username}
                      {author.verified && (
                        <span className="ml-2 text-minecraft-habbo-blue" title="Verified">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {isOwnProfile && (
                        <button
                          onClick={() => onDeleteComment(getPostId(), comment._id)}
                          className="text-xs text-gray-400 hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-200">{comment.content}</p>
                </div>
              </div>
            );
          })}

          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
            <MinecraftAvatar 
              username={user?.mcUsername || user?.username || "Steve"} 
              size={24}
              type="head"
              className="rounded-md"
            />
            <div className="flex-1 flex items-center space-x-2 relative">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add Comment"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-minecraft-habbo-blue pr-10"
                disabled={commentLoading}
              />
              {/* Emoji picker button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex={0}
              >
                <FaceSmileIcon className="h-4 w-4" />
              </button>
              {/* Emoji picker dropdown */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg z-10">
                  <div className="grid grid-cols-3 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg p-1 hover:bg-white/10 rounded transition-colors"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!commentInput?.trim() || commentLoading}
              className="px-3 py-2 bg-minecraft-habbo-blue hover:bg-minecraft-habbo-blue/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
            >
              {commentLoading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// PropTypes validation
WallPost.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    author: PropTypes.object,
    content: PropTypes.string,
    createdAt: PropTypes.string,
    likes: PropTypes.array,
    comments: PropTypes.array,
    isRepost: PropTypes.bool,
    originalPost: PropTypes.object,
    repostMessage: PropTypes.string,
    fadeIn: PropTypes.bool,
    removing: PropTypes.bool,
    originalComments: PropTypes.array
  }).isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onLike: PropTypes.func.isRequired,
  onUnlike: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  likeLoading: PropTypes.bool,
  isExpanded: PropTypes.bool.isRequired,
  onToggleComments: PropTypes.func.isRequired,
  onUnrepost: PropTypes.func,
  onOpenRepostModal: PropTypes.func,
  repostStatus: PropTypes.object,
  repostLoading: PropTypes.bool,
  onTrackView: PropTypes.func,
  viewCount: PropTypes.number,
  onFadeInEnd: PropTypes.func,
  onCommentFadeInEnd: PropTypes.func,
  viewedRef: PropTypes.object
};

export default WallPost; 