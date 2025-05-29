/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file RepostButton.jsx
 * @description Reusable button for repost/unrepost actions with count display
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathRoundedSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RepostButton = ({
  hasReposted = false,
  repostCount = 0,
  repostLoading = false,
  onRepost,
  onUnrepost,
  postId,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (hasReposted) {
    return (
      <button
        onClick={() => onUnrepost(postId)}
        disabled={repostLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center space-x-1 transition-colors ${
          isHovered 
            ? 'text-red-400 hover:text-red-600' 
            : 'text-minecraft-habbo-green'
        } ${repostLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={isHovered ? "Unrepost" : `${repostCount} ${repostCount === 1 ? 'Repost' : 'Reposts'}`}
        aria-label={isHovered ? "Unrepost" : `${repostCount} reposts`}
      >
        {isHovered ? (
          <>
            <XMarkIcon className={`h-4 w-4 ${repostLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Unrepost</span>
          </>
        ) : (
          <>
            <ArrowPathRoundedSquareIcon className={`h-4 w-4 ${repostLoading ? 'animate-spin' : ''}`} />
            <span>{repostCount}</span>
            <span className="hidden sm:inline">{repostCount === 1 ? 'Repost' : 'Reposts'}</span>
          </>
        )}
      </button>
    );
  } else {
    return (
      <button
        onClick={() => onRepost(postId)}
        disabled={repostLoading}
        className={`flex items-center space-x-1 hover:text-minecraft-habbo-green transition-colors ${repostLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title="Repost"
        aria-label="Repost"
      >
        <ArrowPathRoundedSquareIcon className={`h-4 w-4 ${repostLoading ? 'animate-spin' : ''}`} />
        <span>{repostCount}</span>
        <span className="hidden sm:inline">Repost</span>
      </button>
    );
  }
};

RepostButton.propTypes = {
  hasReposted: PropTypes.bool,
  repostCount: PropTypes.number,
  repostLoading: PropTypes.bool,
  onRepost: PropTypes.func.isRequired,
  onUnrepost: PropTypes.func.isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string,
};

export default RepostButton; 