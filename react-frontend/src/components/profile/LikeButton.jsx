/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file LikeButton.jsx
 * @description Reusable button for like/unlike actions with count display and pulse animation
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

/**
 * LikeButton component for handling like/unlike actions with visual feedback
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isLiked - Whether the current user has liked this item
 * @param {number} props.likeCount - Total number of likes
 * @param {boolean} props.likeLoading - Whether a like/unlike request is in progress
 * @param {boolean} props.shouldPulse - Whether to show pulse animation
 * @param {Function} props.onLike - Callback for like action
 * @param {Function} props.onUnlike - Callback for unlike action
 * @param {string|number} props.postId - Unique identifier for the post
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Rendered like button
 */
const LikeButton = memo(({
  isLiked = false,
  likeCount = 0,
  likeLoading = false,
  shouldPulse = false,
  onLike,
  onUnlike,
  postId,
  className = '',
}) => {
  /**
   * Handle click event for like/unlike
   * Determines whether to call onLike or onUnlike based on current state
   */
  const handleClick = () => {
    if (likeLoading) return; // Prevent multiple clicks during loading
    
    if (isLiked) {
      onUnlike(postId);
    } else {
      onLike(postId);
    }
  };

  // Dynamic classes based on state
  const buttonClasses = `
    flex items-center space-x-1 transition-colors
    ${isLiked ? 'text-minecraft-habbo-green' : 'hover:text-minecraft-habbo-green'}
    ${likeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  const iconClasses = `
    h-4 w-4
    ${shouldPulse ? 'animate-like-pulse' : ''}
    ${likeLoading ? 'animate-pulse' : ''}
  `.trim();

  return (
    <button
      onClick={handleClick}
      disabled={likeLoading}
      className={buttonClasses}
      aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
      title={`${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
    >
      {isLiked ? (
        <HeartSolidIcon className={iconClasses} />
      ) : (
        <HeartIcon className={iconClasses} />
      )}
      <span aria-live="polite">{likeCount}</span>
      <span className="hidden sm:inline">
        Like{likeCount !== 1 ? 's' : ''}
      </span>
    </button>
  );
});

// Display name for debugging
LikeButton.displayName = 'LikeButton';

// PropTypes validation for type safety
LikeButton.propTypes = {
  isLiked: PropTypes.bool,
  likeCount: PropTypes.number,
  likeLoading: PropTypes.bool,
  shouldPulse: PropTypes.bool,
  onLike: PropTypes.func.isRequired,
  onUnlike: PropTypes.func.isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string,
};

export default LikeButton; 