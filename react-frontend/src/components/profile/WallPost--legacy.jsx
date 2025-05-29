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
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  TrashIcon, 
  EllipsisHorizontalIcon,
  EyeIcon,
  FaceSmileIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatRelativeTime } from '../../utils/timeUtils';
import { useAuth } from '../../contexts/AuthContext';
import MinecraftAvatar from '../MinecraftAvatar';
import RepostButton from './RepostButton';
import PropTypes from 'prop-types';

const WallPost = ({
  post,
  isOwnProfile,
  onDelete,
  onLike,
  onUnlike,
  onAddComment,
  onDeleteComment,
  commentInput,
  commentLoading,
  likeLoading,
  onCommentInputChange,
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
    onCommentInputChange((commentInput || "") + emoji);
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

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentInput?.trim()) {
      // For reposts, add comment to the original post
      onAddComment(commentTargetId, commentInput.trim());
    }
  };

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

  return (
    <div 
      className={`habbo-card p-6 rounded-md transition-all duration-300 ${
        shouldAnimate ? 'animate-fade-in' : ''
      }${shouldFadeOut ? ' animate-fade-out' : ''}`}
      style={{
        opacity: animationComplete && !shouldFadeOut ? 1 : undefined,
        transform: animationComplete && !shouldFadeOut ? 'none' : undefined,
        filter: animationComplete && !shouldFadeOut ? 'none' : undefined
      }}
    >
      {/* Repost Attribution */}
      {isRepost && originalPost && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-400">
          <span>
            <Link 
              to={`/profile/${getProfileUsername(author)}`}
              className="font-medium text-minecraft-habbo-blue hover:text-blue-300"
            >
              {author?.username || author?.displayName || 'Unknown User'}
            </Link> reposted from{' '}
            <Link 
              to={`/profile/${getProfileUsername(originalPost.author)}`}
              className="font-medium text-minecraft-habbo-green hover:text-green-300"
            >
              {originalPost.author?.username || originalPost.author?.displayName || 'Unknown User'}
            </Link>
            {repostMessage && (
              <div className="mt-1 text-gray-300">
                &quot;{repostMessage}&quot;
              </div>
            )}
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-3">
        {/* User Avatar - Clickable */}
        <Link to={`/profile/${profileUsername}`}>
          <MinecraftAvatar 
            username={displayMcUsername}
            size={40}
            type="head"
            className="shadow-md rounded-md"
          />
        </Link>
        
        {/* Post Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link 
                to={`/profile/${profileUsername}`}
                className="font-medium text-white hover:text-minecraft-habbo-blue flex items-center"
              >
                {displayName}
                {displayAuthor.verified && (
                  <span className="ml-2 text-minecraft-habbo-blue" title="Verified">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </Link>
              <span className="text-gray-400 text-sm">
                {formatRelativeTime(displayCreatedAt)}
              </span>
            </div>
            
            {/* Post Actions Menu */}
            <div className="flex items-center space-x-2">
              {isOwnProfile && (
                <button
                  onClick={() => onDelete(_id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete post"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <button className="p-1 text-gray-400 hover:text-white transition-colors">
                <EllipsisHorizontalIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4 pl-13">
        <p className="text-gray-100 whitespace-pre-wrap">
          {displayContent}
        </p>
      </div>

      {/* Post Stats & Actions */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-3 pl-13">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={() => isLiked ? onUnlike(commentTargetId) : onLike(commentTargetId)}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-minecraft-habbo-green' : 'hover:text-minecraft-habbo-green'
            }`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
            disabled={likeLoading}
          >
            {isLiked ? (
              <HeartSolidIcon className={`h-4 w-4 ${likePulseClass}`} />
            ) : (
              <HeartIcon className={`h-4 w-4 ${likePulseClass}`} />
            )}
            <span>{likeCount}</span>
            <span className="hidden sm:inline">Like{likeCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Show repost count ONLY for original posts (not repost wrappers) */}
          {!isRepostWithOriginal && repostCount > 0 && (
            <div className="flex items-center space-x-1 text-minecraft-habbo-green">
              <ArrowPathRoundedSquareIcon className="h-4 w-4" />
              <span>{repostCount}</span>
              <span className="hidden sm:inline">{repostCount === 1 ? 'Repost' : 'Reposts'}</span>
            </div>
          )}

          {/* Show repost count ONLY for repost wrappers (not inside original post content) */}
          {isRepostWithOriginal && originalPost?.repostCount > 0 && (
            <div className="flex items-center space-x-1 text-minecraft-habbo-green">
              <ArrowPathRoundedSquareIcon className="h-4 w-4" />
              <span>{originalPost.repostCount}</span>
              <span className="hidden sm:inline">{originalPost.repostCount === 1 ? 'Repost' : 'Reposts'}</span>
            </div>
          )}

          {/* Comment Button */}
          <button
            onClick={onToggleComments}
            className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
          >
            <ChatBubbleOvalLeftIcon className="h-4 w-4" />
            <span>{commentCount}</span>
            <span className="hidden sm:inline">Comment{commentCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Repost Button - Hide if it's the original post's author */}
          {!isOwnOriginalPost && (
            <RepostButton
              hasReposted={hasReposted}
              repostCount={repostCount}
              repostLoading={repostBtnLoading}
              onRepost={handleRepost}
              onUnrepost={handleUnrepost}
              postId={repostTargetId}
            />
          )}

          {/* Views */}
          <div className="flex items-center space-x-1">
            <EyeIcon className="h-4 w-4" />
            <span>{viewCount > 0 ? viewCount : 1} view{viewCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
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
                          onClick={() => onDeleteComment(_id, comment._id)}
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
                onChange={(e) => onCommentInputChange(e.target.value)}
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
                aria-label="Add emoji"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>
              {/* Emoji picker grid */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg z-20">
                  <div className="grid grid-cols-3 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl p-1 hover:bg-white/10 rounded transition-colors"
                        tabIndex={0}
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
              className="px-3 py-2 bg-minecraft-habbo-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
            >
              {commentLoading ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

WallPost.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    author: PropTypes.shape({
      username: PropTypes.string,
      displayName: PropTypes.string,
      avatar: PropTypes.string,
      mcUsername: PropTypes.string,
      minecraftUsername: PropTypes.string,
      verified: PropTypes.bool,
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }),
    content: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    likes: PropTypes.array,
    comments: PropTypes.array,
    isRepost: PropTypes.bool,
    originalPost: PropTypes.shape({
      _id: PropTypes.string,
      author: PropTypes.object,
      content: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      likes: PropTypes.array,
      comments: PropTypes.array,
      repostCount: PropTypes.number,
      verified: PropTypes.bool,
      isLiked: PropTypes.bool,
    }),
    repostMessage: PropTypes.string,
    repostCount: PropTypes.number,
    fadeIn: PropTypes.bool,
    removing: PropTypes.bool,
    originalComments: PropTypes.array,
    isLiked: PropTypes.bool,
  }).isRequired,
  isOwnProfile: PropTypes.bool,
  onDelete: PropTypes.func,
  onLike: PropTypes.func,
  onUnlike: PropTypes.func,
  onAddComment: PropTypes.func,
  onDeleteComment: PropTypes.func,
  commentInput: PropTypes.string,
  commentLoading: PropTypes.bool,
  likeLoading: PropTypes.bool,
  onCommentInputChange: PropTypes.func,
  isExpanded: PropTypes.bool,
  onToggleComments: PropTypes.func,
  onUnrepost: PropTypes.func,
  onOpenRepostModal: PropTypes.func,
  repostStatus: PropTypes.object,
  repostLoading: PropTypes.bool,
  onTrackView: PropTypes.func,
  viewCount: PropTypes.number,
  onFadeInEnd: PropTypes.func,
  onCommentFadeInEnd: PropTypes.func,
  viewedRef: PropTypes.object,
};

export default WallPost; 