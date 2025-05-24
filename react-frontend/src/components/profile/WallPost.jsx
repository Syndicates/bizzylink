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
  ArrowPathRoundedSquareIcon,
  EyeIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatRelativeTime } from '../../utils/timeUtils';
import { useAuth } from '../../contexts/AuthContext';
import MinecraftAvatar from '../MinecraftAvatar';

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
  onCommentInputChange,
  isExpanded,
  onToggleComments,
  
  // Repost functionality
  onRepost,
  onUnrepost,
  onOpenRepostModal,
  repostStatus,
  repostLoading = false,
  
  // View tracking
  onTrackView,
  viewCount = 0
}) => {
  const { user } = useAuth();
  
  const {
    _id,
    author,
    content,
    createdAt,
    likes = [],
    comments = [],
    isLiked = false,
    isRepost = false,
    originalPost, // Contains the full original post data
    repostMessage
  } = post;

  const safeAuthor = author || { username: "Unknown User", mcUsername: "Steve" };

  const authorName = safeAuthor?.username || safeAuthor?.displayName || 'Unknown User';
  const mcUsername = safeAuthor?.mcUsername || safeAuthor?.username || authorName;
  const likeCount = likes.length;
  const commentCount = comments.length;

  // Repost data
  const hasReposted = repostStatus?.hasReposted || false;
  const repostCount = repostStatus?.repostCount || 0;

  // Check if current user is the author of this post (don't show repost button on own posts)
  const isOwnPost = user && author && (
    user.username === author.username || 
    user._id === author._id ||
    user.id === author.id
  );

  // Track view when post is displayed
  useEffect(() => {
    if (onTrackView && _id) {
      const timer = setTimeout(() => {
        onTrackView(_id);
      }, 1000); // Track view after 1 second

      return () => clearTimeout(timer);
    }
  }, [_id, onTrackView]);

  // Add state for emoji picker visibility for comment input
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Common emojis for quick selection
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];
  // Handler for emoji selection
  const handleEmojiSelect = (emoji) => {
    onCommentInputChange((commentInput || "") + emoji);
    setShowEmojiPicker(false);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentInput?.trim()) {
      onAddComment(_id, commentInput.trim());
    }
  };

  const handleRepostClick = () => {
    if (hasReposted) {
      onUnrepost(_id);
    } else {
      onOpenRepostModal(_id);
    }
  };

  // Profile navigation helpers
  const getProfileUsername = (author) => {
    if (!author) return 'unknown';
    return author.username || author.displayName || 'Unknown';
  };

  // For reposts, determine which data to show
  const isRepostWithOriginal = isRepost && originalPost;
  const displayAuthor = (isRepostWithOriginal ? originalPost.author : author) || { username: "Unknown User", mcUsername: "Steve" };
  const displayContent = isRepostWithOriginal ? originalPost.content : content;
  const displayCreatedAt = isRepostWithOriginal ? originalPost.createdAt : createdAt;
  const profileUsername = displayAuthor.username || displayAuthor.displayName || "Unknown";
  const displayName = displayAuthor.username || displayAuthor.displayName || "Unknown User";
  const displayMcUsername = displayAuthor.mcUsername || displayAuthor.minecraftUsername || displayAuthor.username || "Steve";

  return (
    <div className="habbo-card p-4 rounded-md">
      {/* Repost Attribution */}
      {isRepost && originalPost && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-400">
          <ArrowPathRoundedSquareIcon className="h-4 w-4" />
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
                "{repostMessage}"
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
                className="font-medium text-white hover:text-minecraft-habbo-blue"
              >
                {displayName}
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
            onClick={() => isLiked ? onUnlike(_id) : onLike(_id)}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-red-400' : 'hover:text-red-400'
            }`}
          >
            {isLiked ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
            <span>{likeCount}</span>
            <span className="hidden sm:inline">Like{likeCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={onToggleComments}
            className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
          >
            <ChatBubbleOvalLeftIcon className="h-4 w-4" />
            <span>{commentCount}</span>
            <span className="hidden sm:inline">Comment{commentCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Repost Button - Hide if it's the user's own post */}
          {!isOwnPost && (
            <button
              onClick={handleRepostClick}
              disabled={repostLoading}
              className={`flex items-center space-x-1 transition-colors ${
                hasReposted 
                  ? 'text-minecraft-habbo-green' 
                  : 'hover:text-minecraft-habbo-green'
              } ${repostLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ArrowPathRoundedSquareIcon 
                className={`h-4 w-4 ${repostLoading ? 'animate-spin' : ''}`} 
              />
              <span>{repostCount}</span>
              <span className="hidden sm:inline">
                {hasReposted ? 'Reposted' : 'Repost'}
              </span>
            </button>
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
          {comments.filter(Boolean).map((comment) => {
            // Ensure author exists or provide fallback
            const author = comment.author || {
              username: "Unknown User",
              mcUsername: "Steve",
            };
            // Ensure we have a valid username for the avatar
            const avatarUsername = author.mcUsername || author.minecraftUsername || author.username;

            return (
              <div key={comment._id} className="flex items-start space-x-2 mb-2">
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
                      className="text-sm font-medium text-white hover:text-minecraft-habbo-blue"
                    >
                      {author.username}
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

export default WallPost; 