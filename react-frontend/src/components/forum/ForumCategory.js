/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumCategory.js
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
 * ForumCategory component
 * 
 * Displays a Minecraft-styled forum category card with stats and last post info
 */
const ForumCategory = ({ category, onClick }) => {
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-600 hover:border-green-600 transition-colors duration-200"
    >
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-gray-800 rounded-md mr-3 flex items-center justify-center p-1">
            <img
              src={category.icon || '/minecraft-assets/grass_block.svg'}
              alt={category.name}
              className="w-8 h-8"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{category.name}</h3>
          </div>
        </div>
        
        <p className="text-gray-300 text-sm mb-3">{category.description}</p>
        
        <div className="flex justify-between text-xs text-gray-400">
          <div className="space-x-3">
            <span className="inline-block">{category.threadCount || 0} threads</span>
            <span className="inline-block">{category.postCount || 0} posts</span>
          </div>
        </div>
      </div>
      
      {category.lastPost && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-600">
          <div className="flex justify-between items-center text-xs">
            <div className="flex-1">
              <div className="text-green-400 font-semibold truncate">{category.lastPost.title}</div>
              <div className="text-gray-400 flex items-center gap-1 truncate">
                <span>by</span>
                <span className="text-gray-300">{category.lastPost.author}</span>
              </div>
            </div>
            <div className="text-gray-500 whitespace-nowrap ml-2">
              {formatDate(category.lastPost.date)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ForumCategory;