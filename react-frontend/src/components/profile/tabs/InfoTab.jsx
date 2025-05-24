/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file InfoTab.jsx
 * @description Profile info tab component
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { formatDate } from '../../../utils/timeUtils';

const InfoTab = ({ profileUser, playerStats, isOwnProfile }) => {
  if (!profileUser) return null;

  const joinDate = profileUser.createdAt ? formatDate(profileUser.createdAt) : 'Unknown';
  const role = profileUser.role || playerStats?.rank || 'Member';
  const mcUsername = profileUser.mcUsername || profileUser.username;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-minecraft text-minecraft-habbo-green">Basic Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="text-white font-medium">{profileUser.username}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Minecraft Username:</span>
              <span className="text-white font-medium">{mcUsername}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                role === 'admin' ? 'bg-red-500 text-white' :
                role === 'moderator' ? 'bg-purple-500 text-white' :
                role === 'premium' ? 'bg-yellow-500 text-black' :
                'bg-gray-600 text-white'
              }`}>
                {role.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Joined:</span>
              <span className="text-white font-medium">{joinDate}</span>
            </div>

            {profileUser.bio && (
              <div>
                <span className="text-gray-400 block mb-2">Bio:</span>
                <p className="text-white bg-white/5 p-3 rounded-md">
                  {profileUser.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Server Information */}
        {playerStats && (
          <div className="space-y-4">
            <h3 className="text-xl font-minecraft text-minecraft-habbo-green">Server Information</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  playerStats.online ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {playerStats.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Playtime:</span>
                <span className="text-white font-medium">{playerStats.playtime || '0h'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Last Seen:</span>
                <span className="text-white font-medium">{playerStats.lastSeen || 'Never'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Current World:</span>
                <span className="text-white font-medium">{playerStats.world || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Game Mode:</span>
                <span className="text-white font-medium">{playerStats.gamemode || 'SURVIVAL'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information (if own profile) */}
      {isOwnProfile && profileUser.email && (
        <div className="space-y-4">
          <h3 className="text-xl font-minecraft text-minecraft-habbo-green">Contact Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white font-medium">{profileUser.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab; 