/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumCategory.js
 * @description Minecraft-styled forum category card component with enhanced visual styling
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftEllipsisIcon, DocumentTextIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

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

  // Get category color based on name or ID to create visual distinction
  const getCategoryColor = () => {
    const colors = [
      'from-purple-600 to-blue-600',
      'from-green-600 to-teal-600',
      'from-red-600 to-yellow-600',
      'from-blue-600 to-indigo-600',
      'from-yellow-600 to-amber-600',
      'from-pink-600 to-rose-600',
      'from-indigo-600 to-purple-600',
      'from-emerald-600 to-green-600'
    ];
    
    // Generate a consistent index based on category name or ID
    const str = category.name || category.id || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get a valid index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 },
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200"
    >
      {/* Category header with gradient background */}
      <div className={`h-16 bg-gradient-to-r ${getCategoryColor()} relative`}>
        <div className="absolute -bottom-8 left-4">
          <div className="p-1 bg-gray-800 rounded-lg inline-block border-2 border-gray-700">
            <div className="w-14 h-14 bg-gray-900 rounded-md flex items-center justify-center">
            <img
              src={category.icon || '/minecraft-assets/grass_block.svg'}
              alt={category.name}
                className="w-10 h-10"
            />
          </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 pt-10">
        <h3 className="text-white font-minecraft text-xl mb-2 mt-1">{category.name}</h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-2 h-10">{category.description}</p>
        
        {/* Stats and counters */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-700/50 rounded-md p-2 flex items-center">
            <div className="bg-blue-600/20 p-1.5 rounded-md mr-2">
              <DocumentTextIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Threads</div>
              <div className="text-sm font-bold text-white">{category.threadCount || 0}</div>
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-md p-2 flex items-center">
            <div className="bg-purple-600/20 p-1.5 rounded-md mr-2">
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Posts</div>
              <div className="text-sm font-bold text-white">{category.postCount || 0}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Latest activity section */}
      {category.lastPost && (
        <div className="bg-gray-700/30 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center text-xs">
            <div className="text-gray-400 mr-2">
              <ClockIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-blue-400 font-semibold truncate">{category.lastPost.title}</div>
              <div className="text-gray-400 flex items-center gap-1 truncate">
                <UsersIcon className="h-3 w-3 mr-0.5" />
                <span className="text-gray-300">{category.lastPost.author}</span>
                <span className="mx-1">•</span>
                <span>{formatDate(category.lastPost.date)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Call-to-action hint */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 px-4 py-2 text-xs text-center text-gray-400">
        Click to browse threads
      </div>
    </motion.div>
  );
};

export default ForumCategory;