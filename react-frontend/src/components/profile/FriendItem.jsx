/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendItem.jsx
 * @description Friend item component for profile
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import MinecraftAvatar from '../MinecraftAvatar';

// Friend component
const FriendItem = ({ username, avatar, status, online }) => {
  return (
    <div className="flex items-center mb-3">
      <div className="relative">
        <MinecraftAvatar
          username={username}
          size={40}
          className="mr-3"
          type="head"
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{username}</p>
        <p className="text-xs text-gray-400">{status}</p>
      </div>
    </div>
  );
};

export default FriendItem; 