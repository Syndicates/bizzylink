/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file CommentItem.jsx
 * @description Comment item component for wall posts
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import MinecraftAvatar from '../MinecraftAvatar';
import { timeAgo } from '../../utils/timeUtils';

// Enhanced CommentItem with animation and fixed avatar/username issues
const CommentItem = ({ comment, postId, onDelete, currentUser }) => {
  // Format the date to display
  const formattedDate = timeAgo(comment.createdAt);

  // Check if the current user is the author of the comment
  const isCommentAuthor =
    currentUser &&
    (currentUser._id === comment.author?._id ||
      currentUser.username === comment.author?.username);

  // Ensure author exists or provide fallback
  const author = comment.author || {
    username: "Unknown User",
    mcUsername: "Steve",
  };

  // Create exact timestamp for hover
  const exactTimestamp = comment.createdAt
    ? new Date(comment.createdAt).toLocaleString()
    : "Unknown date";

  // Log comment author info for debugging
  console.log(`[CommentItem] Comment author data:`, author);

  // Ensure we have a valid username for the avatar
  // Fixed: ensure mcUsername is properly used (in server responses it might be minecraftUsername)
  const avatarUsername =
    author.mcUsername || author.minecraftUsername || author.username;
  console.log(
    `[CommentItem] Using avatar username: ${avatarUsername} for author: ${author.username}`,
  );

  return (
    <motion.div
      className="flex items-start py-2 group hover:bg-minecraft-navy/20 rounded-md px-2 -mx-2 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/profile/${author.username}`} className="flex-shrink-0">
        <MinecraftAvatar
          username={avatarUsername}
          size={28}
          type="head"
          className="rounded-md hover:ring-2 hover:ring-minecraft-habbo-blue transition-all"
        />
      </Link>
      <div className="ml-2 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Link
              to={`/profile/${author.username}`}
              className="font-medium text-sm hover:text-minecraft-habbo-blue transition-colors flex items-center"
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
            <span
              className="text-gray-400 text-xs ml-2 cursor-default"
              title={exactTimestamp}
            >
              {formattedDate}
            </span>
          </div>
          {isCommentAuthor && (
            <button
              onClick={() => onDelete(postId, comment._id)}
              className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200"
              title="Delete comment"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-200 mt-1 break-words">
          {comment.content}
        </p>
      </div>
    </motion.div>
  );
};

export default CommentItem; 