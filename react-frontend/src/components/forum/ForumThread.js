/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumThread.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import MinecraftAvatar from '../MinecraftAvatar';
import { useNavigate } from 'react-router-dom';

/**
 * ForumThread component
 * 
 * Displays a thread item in the forum with statistics and status indicators
 */
const ForumThread = ({ thread, onClick }) => {
  const navigate = useNavigate();
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        bg-gray-700 rounded-md border border-gray-600 
        hover:border-green-600 transition-colors duration-200 
        overflow-hidden cursor-pointer flex flex-col sm:flex-row
        ${thread.pinned ? 'bg-gradient-to-r from-gray-700 to-gray-700 via-gray-800' : ''}
      `}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            {/* Minecraft avatar that navigates to the user's profile when clicked */}
            <div 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering thread click
                const username = typeof thread.author === 'object' ? thread.author.username : thread.author;
                if (username && username !== 'Unknown') {
                  navigate(`/profile/${username}`);
                }
              }}
              className="cursor-pointer"
            >
              <MinecraftAvatar 
                username={typeof thread.author === 'object' ? thread.author.username || 'Unknown' : thread.author}
                uuid={typeof thread.author === 'object' ? thread.author.mcUUID : null}
                size={40}
                type="head"
                animate={true}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              {thread.pinned && (
                <span className="mr-2 text-amber-400 text-xs bg-amber-900 px-2 py-0.5 rounded">
                  PINNED
                </span>
              )}
              {thread.locked && (
                <span className="mr-2 text-red-400 text-xs bg-red-900 px-2 py-0.5 rounded">
                  LOCKED
                </span>
              )}
              <h3 className="text-white font-semibold">
                {thread.title}
              </h3>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Posted by <span 
                className="text-gray-300 hover:text-white hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering thread click
                  const username = typeof thread.author === 'object' ? thread.author.username : thread.author;
                  if (username && username !== 'Unknown') {
                    navigate(`/profile/${username}`);
                  }
                }}
              >
                {typeof thread.author === 'object' ? thread.author.username || 'Unknown' : thread.author}
              </span> • {formatDate(thread.createdAt || thread.date)}
            </p>
          </div>
        </div>
        
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{thread.replyCount || thread.replies || 0} {(thread.replyCount || thread.replies || 0) === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>{thread.views || 0} {(thread.views || 0) === 1 ? 'view' : 'views'}</span>
          </div>
        </div>
      </div>
      
      {thread.lastPost && (
        <div className="bg-gray-800 p-3 sm:w-48 border-t sm:border-t-0 sm:border-l border-gray-600 flex flex-row sm:flex-col justify-between items-center sm:items-start sm:justify-center shrink-0">
          <div className="flex items-center gap-2">
            <div 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering thread click
                const username = typeof thread.lastPost.author === 'object' 
                  ? thread.lastPost.author.username 
                  : thread.lastPost.author;
                if (username && username !== 'Unknown') {
                  navigate(`/profile/${username}`);
                }
              }}
              className="cursor-pointer"
            >
              <MinecraftAvatar 
                username={typeof thread.lastPost.author === 'object' 
                  ? thread.lastPost.author.username || 'Unknown' 
                  : (thread.lastPost.author || 'Unknown')}
                uuid={typeof thread.lastPost.author === 'object' ? thread.lastPost.author.mcUUID : null}
                size={32}
                type="head"
                animate={true}
              />
            </div>
            <div className="text-xs">
              <div className="text-gray-400">Latest reply by:</div>
              <div 
                className="text-gray-300 hover:text-white hover:underline font-medium cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering thread click
                  const username = typeof thread.lastPost.author === 'object' 
                    ? thread.lastPost.author.username 
                    : thread.lastPost.author;
                  if (username && username !== 'Unknown') {
                    navigate(`/profile/${username}`);
                  }
                }}
              >
                {typeof thread.lastPost.author === 'object' 
                  ? thread.lastPost.author.username || 'Unknown' 
                  : (thread.lastPost.author || 'Unknown')}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap sm:mt-1">
            {formatDate(thread.lastPost.date)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ForumThread;