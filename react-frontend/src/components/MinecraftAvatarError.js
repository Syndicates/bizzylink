/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftAvatarError.js
 * @description Error fallback component for Minecraft avatars
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';

/**
 * Error component shown when a Minecraft avatar fails to load
 * 
 * @param {Object} props
 * @param {number} props.size - Size in pixels
 * @param {string} props.username - Minecraft username
 * @param {string} props.message - Optional custom error message
 */
const MinecraftAvatarError = ({ size = 64, username = '', message = '' }) => {
  return (
    <div 
      className="flex items-center justify-center bg-gray-800 rounded-md relative overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* Show default skin image */}
      <img 
        src="/minecraft-assets/steve.png" 
        alt={username || "Minecraft Player"}
        className="w-full h-full opacity-30"
      />
      
      {/* Error overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/30 p-1">
        <svg 
          className="w-1/3 h-1/3 text-red-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        
        {/* Show username if available */}
        {username && size >= 48 && (
          <div className="text-xs text-white text-center font-minecraft mt-1 truncate">
            {username}
          </div>
        )}
        
        {/* Show custom error message if provided */}
        {message && size >= 64 && (
          <div className="text-xs text-red-300 text-center mt-0.5 truncate">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinecraftAvatarError; 