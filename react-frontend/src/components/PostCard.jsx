/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file PostCard.jsx
 * @description Shared post card component for FYP and Profile wall (full WallPost card design)
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import MinecraftAvatar from './MinecraftAvatar';
import { formatRelativeTime } from '../utils/timeUtils';
import LikeButton from './profile/LikeButton';
import RepostButton from './profile/RepostButton';
import { ChatBubbleOvalLeftIcon, TrashIcon, EllipsisHorizontalIcon, EyeIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

const PostCard = ({
  post,
  isOwnProfile = false,
  isOwnOriginalPost = false,
  isOwnRepost = false,
  onDelete,
  onLike,
  onUnlike,
  onRepost,
  onUnrepost,
  repostStatus,
  repostLoading,
  viewCount = 0,
  onMenu,
  onToggleComments,
  commentsSection,
}) => {
  const {
    _id,
    author = {},
    content,
    createdAt,
    likes = [],
    comments = [],
    isRepost = false,
    originalPost,
    repostMessage,
  } = post;

  // For reposts, use original post's data
  const isRepostWithOriginal = isRepost && originalPost;
  const displayAuthor = isRepostWithOriginal && originalPost.author ? originalPost.author : author;
  const displayCreatedAt = isRepostWithOriginal ? originalPost.createdAt : createdAt;
  const displayContent = isRepostWithOriginal ? originalPost.content : content;
  const displayUsername = displayAuthor.username || displayAuthor.displayName || 'Unknown';
  const displayMcUsername = displayAuthor.mcUsername || displayAuthor.minecraftUsername || displayAuthor.username || 'Steve';
  const likeList = isRepostWithOriginal ? originalPost.likes || [] : likes;
  const likeCount = likeList.length;
  const commentCount = isRepostWithOriginal && Array.isArray(post.originalComments)
    ? (post.originalComments?.length || 0)
    : comments.length;
  const hasReposted = (repostStatus?.hasReposted ?? post.hasReposted) || false;
  const repostBtnLoading = repostLoading || false;
  const repostTargetId = isRepostWithOriginal ? originalPost._id : _id;
  const repostCount = isRepostWithOriginal && originalPost.repostCount !== undefined
    ? originalPost.repostCount
    : (repostStatus?.repostCount ?? post.repostCount ?? 0);
  const profileUsername = displayAuthor.username || displayAuthor.displayName || 'Unknown';
  const displayName = displayAuthor.username || displayAuthor.displayName || 'Unknown User';
  const displayVerified = displayAuthor.verified;

  return (
    <div className="habbo-card p-6 rounded-md transition-all duration-300 bg-minecraft-dark border border-white/10 shadow mb-6">
      {/* Repost Attribution */}
      {isRepost && originalPost && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-400">
          <span>
            <Link 
              to={`/profile/${author.username || author.displayName || 'Unknown'}`}
              className="font-medium text-minecraft-habbo-blue hover:text-blue-300"
            >
              {author?.username || author?.displayName || 'Unknown User'}
            </Link> reposted from{' '}
            <Link 
              to={`/profile/${originalPost.author?.username || originalPost.author?.displayName || 'Unknown'}`}
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
                {displayVerified && (
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
                  onClick={() => onDelete && onDelete(_id)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete post"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
              <button className="p-1 text-gray-400 hover:text-white transition-colors" onClick={onMenu}>
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
          <LikeButton
            isLiked={post.isLiked}
            likeCount={likeCount}
            onLike={onLike}
            onUnlike={onUnlike}
            postId={_id}
          />

          {/* Repost Count (Read-only) - Only show for original post authors who haven't reposted */}
          {isOwnOriginalPost && !isOwnRepost && repostCount > 0 && (
            <div className="flex items-center space-x-1 text-minecraft-habbo-green">
              <ArrowPathRoundedSquareIcon className="h-4 w-4" />
              <span>{repostCount}</span>
              <span className="hidden sm:inline">{repostCount === 1 ? 'Repost' : 'Reposts'}</span>
            </div>
          )}

          {/* Comment Button */}
          <button
            className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
            tabIndex={0}
            type="button"
            onClick={onToggleComments}
          >
            <ChatBubbleOvalLeftIcon className="h-4 w-4" />
            <span>{commentCount}</span>
            <span className="hidden sm:inline">Comment{commentCount !== 1 ? 's' : ''}</span>
          </button>

          {/* Repost Button - Show for non-authors OR if they authored this repost wrapper */}
          {(!isOwnOriginalPost || isOwnRepost) && (
            <RepostButton
              hasReposted={hasReposted || isOwnRepost}
              repostCount={repostCount}
              repostLoading={repostBtnLoading}
              onRepost={onRepost}
              onUnrepost={onUnrepost}
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
      {commentsSection && <div className="mt-3">{commentsSection}</div>}
    </div>
  );
};

PostCard.propTypes = {
  post: PropTypes.object.isRequired,
  isOwnProfile: PropTypes.bool,
  isOwnOriginalPost: PropTypes.bool,
  isOwnRepost: PropTypes.bool,
  onDelete: PropTypes.func,
  onLike: PropTypes.func,
  onUnlike: PropTypes.func,
  onRepost: PropTypes.func,
  onUnrepost: PropTypes.func,
  repostStatus: PropTypes.object,
  repostLoading: PropTypes.bool,
  viewCount: PropTypes.number,
  onMenu: PropTypes.func,
  onToggleComments: PropTypes.func,
  commentsSection: PropTypes.node,
};

export default PostCard; 