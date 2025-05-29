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
import { UserIcon, ServerStackIcon, EnvelopeIcon, CheckIcon } from '@heroicons/react/24/outline';

const InfoTab = ({ profileUser, playerStats, isOwnProfile }) => {
  if (!profileUser) return null;

  const joinDate = profileUser.createdAt ? formatDate(profileUser.createdAt) : 'Unknown';
  const role = profileUser.role || playerStats?.rank || 'Member';
  const mcUsername = profileUser.mcUsername || profileUser.username;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <div className="habbo-card p-5 rounded-md bg-minecraft-navy-light shadow-lg">
          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-minecraft-habbo-green" /> Basic Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Username:</span>
              <span className="text-white font-bold flex items-center gap-1">
                {profileUser.username}
                {profileUser.verified && <CheckIcon className="h-4 w-4 text-green-400" title="Verified" />}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Minecraft Username:</span>
              <span className="text-white font-bold">{mcUsername}</span>
            </div>
            <div className="flex justify-between items-center">
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
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Joined:</span>
              <span className="text-white font-medium">{joinDate}</span>
            </div>
            {profileUser.bio && (
              <div className="mt-4 border-l-4 border-minecraft-habbo-green pl-4 bg-white/5 py-2 rounded-md">
                <span className="text-gray-400 block mb-1 font-minecraft">Bio:</span>
                <p className="text-white italic text-base">{profileUser.bio}</p>
              </div>
            )}
          </div>
        </div>
        {/* Server Information Card */}
        {playerStats && (
          <div className="habbo-card p-5 rounded-md bg-minecraft-navy-light shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center gap-2">
              <ServerStackIcon className="h-5 w-5 text-minecraft-habbo-green" /> Server Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  playerStats.online ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {playerStats.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Playtime:</span>
                <span className="text-white font-bold">{playerStats.playtime || '0h'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Seen:</span>
                <span className="text-white font-medium">{playerStats.lastSeen || 'Never'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current World:</span>
                <span className="text-white font-medium">{playerStats.world || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Game Mode:</span>
                <span className="text-white font-medium">{playerStats.gamemode || 'SURVIVAL'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Contact Information Card (if own profile) */}
      {isOwnProfile && profileUser.email && (
        <div className="habbo-card p-5 rounded-md bg-minecraft-navy-light shadow-lg">
          <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5 text-minecraft-habbo-green" /> Contact Information
          </h3>
          <div className="flex items-center gap-3 text-white text-base">
            <span>{profileUser.email}</span>
            {/* Optionally, add a copy-to-clipboard button here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab; 