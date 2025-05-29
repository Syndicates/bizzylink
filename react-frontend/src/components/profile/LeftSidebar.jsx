/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file LeftSidebar.jsx
 * @description Left sidebar component with profile information, level, and friends
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useRef } from 'react';
import { MapPinIcon, UserIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const LeftSidebar = ({ 
  profileUser, 
  playerStats, 
  isOwnProfile, 
  socialStats, 
  onOpenFriendsModal 
}) => {
  if (!profileUser) return null;

  const playtime = playerStats?.playtime || '0h';
  const balance = playerStats?.balance || 0;
  const earnedToday = playerStats?.money_earned_today || 0;
  const spentToday = playerStats?.money_spent_today || 0;
  const world = playerStats?.world || 'world';
  const gamemode = playerStats?.gamemode || 'SURVIVAL';
  const rank = profileUser?.role || playerStats?.rank || 'user';
  const level = playerStats?.level || 1;
  const experience = playerStats?.experience || 0;
  const friendsCount = socialStats?.friends || 0;

  // Calculate level progress (simplified)
  const levelProgress = Math.min((experience % 1000) / 10, 100);

  // Hover state for balance details
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  // 'hint' | 'line' | 'transitioning'
  const [balancePhase, setBalancePhase] = useState('hint');
  const balancePhaseTimeout = useRef(null);

  // Handle hover/focus with staged transition
  const handleBalanceEnter = () => {
    if (balancePhaseTimeout.current) clearTimeout(balancePhaseTimeout.current);
    setShowBalanceDetails(true);
    setBalancePhase('line');
  };
  const handleBalanceLeave = () => {
    setShowBalanceDetails(false);
    setBalancePhase('transitioning');
    balancePhaseTimeout.current = setTimeout(() => {
      setBalancePhase('hint');
    }, 200); // 200ms matches fade duration
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (balancePhaseTimeout.current) clearTimeout(balancePhaseTimeout.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Information Panel */}
      <div className="habbo-card p-6 rounded-md">
        <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-2 flex items-center gap-2">
          <span role="img" aria-label="info">ℹ️</span> Information
        </h3>
        <div className="border-b border-white/10 mb-4"></div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <MapPinIcon className="h-5 w-5 text-gray-400" />
            <div>
              <span className="text-gray-400 text-sm">Location:</span>
              <div className="text-white font-medium">{world}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div>
              <span className="text-gray-400 text-sm">Rank:</span>
              <div className="text-white font-medium">{rank}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 text-gray-400 flex items-center justify-center">⚔️</div>
            <div>
              <span className="text-gray-400 text-sm">Gamemode:</span>
              <div className="text-white font-medium">{gamemode}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <div>
              <span className="text-gray-400 text-sm">Playtime:</span>
              <div className="text-white font-medium">{playtime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Panel */}
      <div
        className="habbo-card p-6 rounded-md group cursor-pointer focus-within:ring-2 focus-within:ring-minecraft-habbo-blue transition-all duration-300"
        tabIndex={0}
        onMouseEnter={handleBalanceEnter}
        onMouseLeave={handleBalanceLeave}
        onFocus={handleBalanceEnter}
        onBlur={handleBalanceLeave}
        aria-label="Balance. Hover or focus to see more."
      >
        <h3 className="text-lg font-minecraft text-minecraft-habbo-yellow mb-2 flex items-center gap-2">
          <span role="img" aria-label="money">💰</span> Balance
        </h3>
        <div className="border-b border-white/10 mb-4"></div>
        <div className="font-minecraft text-green-400 text-base md:text-lg font-bold text-center break-words" style={{ letterSpacing: '0.03em' }}>
          ${balance.toLocaleString()}
        </div>
        {/* Hover/focus hint or line with staged fade */}
        {balancePhase === 'hint' && (
          <div className="text-xs text-gray-400 mt-1 text-center w-full transition-opacity duration-200 opacity-100">Hover or focus to see more</div>
        )}
        {balancePhase === 'line' && (
          <div className="w-full border-b border-white/10 my-2 transition-opacity duration-200 opacity-100"></div>
        )}
        {balancePhase === 'transitioning' && (
          <div className="w-full border-b border-white/10 my-2 transition-opacity duration-200 opacity-0"></div>
        )}
        {/* Details block, pushes Level panel down, with smooth animation */}
        <div
          className={`w-full flex flex-col items-center space-y-2 transition-all duration-300 ${showBalanceDetails ? 'opacity-100 translate-y-0 max-h-40' : 'opacity-0 -translate-y-2 max-h-0 pointer-events-none'}`}
          style={{ willChange: 'opacity, transform, max-height' }}
        >
          <div className="flex flex-col items-center w-full">
            <div className="font-minecraft text-blue-400 text-base font-bold">+${earnedToday.toLocaleString()}</div>
            <div className="text-xs text-gray-400 font-minecraft">Earned Today</div>
          </div>
          <div className="flex flex-col items-center w-full">
            <div className="font-minecraft text-red-400 text-base font-bold">-${spentToday.toLocaleString()}</div>
            <div className="text-xs text-gray-400 font-minecraft">Spent Today</div>
          </div>
        </div>
      </div>

      {/* Level Panel */}
      <div className="habbo-card p-6 rounded-md">
        <div className="mb-2 flex items-center gap-2">
          <span role="img" aria-label="star">⭐</span>
          <span className="font-minecraft text-lg text-minecraft-habbo-blue">Level</span>
        </div>
        <div className="border-b border-white/10 mb-4"></div>
        <div className="flex flex-col items-center">
          <div className="font-minecraft text-3xl text-white mb-1">Level {level}</div>
          <div className="w-full bg-gray-700 h-2 mb-2 mt-1 rounded">
            <div
              className={`h-2 rounded transition-all duration-500 ${levelProgress > 0 ? 'bg-minecraft-habbo-blue' : 'bg-gray-500'}`}
              style={{ width: `${Math.max(levelProgress, 5)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs font-minecraft text-gray-300">
            <span role="img" aria-label="xp">🧪</span>
            <span className="text-minecraft-habbo-blue font-bold">{experience}</span>
            <span className="text-gray-400">/ 1000</span>
            <span className="text-gray-500">({levelProgress.toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Friends Panel */}
      <div className="habbo-card p-6 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-minecraft text-minecraft-habbo-blue flex items-center gap-2">
            <span role="img" aria-label="friends">👥</span> Friends ({friendsCount})
          </h3>
          {friendsCount > 0 && (
            <button
              onClick={onOpenFriendsModal}
              className="text-minecraft-habbo-blue hover:text-blue-300 text-sm font-medium"
            >
              See All
            </button>
          )}
        </div>
        <div className="border-b border-white/10 mb-4"></div>
        
        {friendsCount === 0 ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400 text-sm">No friends yet</p>
            {isOwnProfile && (
              <p className="text-gray-500 text-xs mt-1">
                Connect with other players to build your network!
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {/* Show friend avatars when we have friends data */}
            {Array.from({ length: Math.min(friendsCount, 6) }).map((_, index) => (
              <div key={index} className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">👤</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default LeftSidebar; 