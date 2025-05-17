/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumTopicList.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * ForumTopicList component
 * 
 * Displays a topic item in the forum with statistics and last post info
 */
const ForumTopicList = ({ topic, onClick }) => {
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
      className="bg-gray-700 rounded-md border border-gray-600 hover:border-green-600 transition-colors duration-200 overflow-hidden flex flex-col sm:flex-row cursor-pointer"
    >
      <div className="flex items-center p-4 flex-1">
        <div className="w-10 h-10 bg-gray-800 rounded-md flex items-center justify-center mr-3 shrink-0">
          <img
            src={topic.icon || '/minecraft-assets/grass_block.svg'}
            alt={topic.name}
            className="w-7 h-7"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate">{topic.name}</h3>
          <p className="text-gray-400 text-sm truncate">{topic.description}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end text-sm text-gray-400 ml-4 shrink-0">
          <div className="flex space-x-4">
            <span>{topic.threads} threads</span>
            <span>{topic.posts} posts</span>
          </div>
        </div>
      </div>
      
      {topic.lastPost && (
        <div className="bg-gray-800 p-3 sm:w-52 border-t sm:border-t-0 sm:border-l border-gray-600 flex flex-row sm:flex-col justify-between sm:justify-center shrink-0">
          <div className="text-xs">
            <div className="text-green-400 font-semibold truncate">{topic.lastPost.title}</div>
            <div className="text-gray-400">by <span className="text-gray-300">{topic.lastPost.author}</span></div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap sm:mt-1">
            {formatDate(topic.lastPost.date)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ForumTopicList;