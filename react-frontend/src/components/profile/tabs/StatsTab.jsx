/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 */

import React from 'react';
import { ClockIcon, TrophyIcon, CurrencyDollarIcon, HeartIcon, ChartBarIcon, CheckIcon } from '@heroicons/react/24/outline';

const StatCard = ({ icon, label, value, className = "" }) => (
  <div className={`bg-minecraft-navy-light p-3 rounded-md text-center ${className}`}>
    <div className="flex items-center justify-center mb-2">{icon}</div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

const StatsTab = ({ profileUser, playerStats }) => {
  if (!playerStats) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-400">No stats available</p>
      </div>
    );
  }

  // Economy fields with fallback
  const balance = playerStats.balance || 0;
  const earnedToday = playerStats.money_earned_today || 0;
  const spentToday = playerStats.money_spent_today || 0;

  return (
    <div className="space-y-6">
      {/* Player Statistics Overview */}
      <div className="habbo-card p-5 rounded-md">
        <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
          Player Statistics Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<ClockIcon className="h-5 w-5" />} label="Playtime" value={playerStats.playtime || "0h"} />
          <StatCard icon={<TrophyIcon className="h-5 w-5" />} label="Level" value={playerStats.level || 0} />
          <StatCard icon={<CurrencyDollarIcon className="h-5 w-5" />} label="Balance" value={`$${balance.toLocaleString()}`} />
          <StatCard icon={<HeartIcon className="h-5 w-5" />} label="Health" value={`${playerStats.health || 20}/20`} />
        </div>
      </div>

      {/* Core Game Statistics */}
      <div className="habbo-card p-5 rounded-md">
        <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Core Game Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mining & Building */}
          <div>
            <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">Mining & Building</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Blocks Mined:</span><span>{(playerStats.blocksMined || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Items Crafted:</span><span>{(playerStats.itemsCrafted || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Distance Traveled:</span><span>{playerStats.distanceTraveled || "0km"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Jumps:</span><span>{(playerStats.jumps || 0).toLocaleString()}</span></div>
            </div>
          </div>
          {/* Combat & Survival */}
          <div>
            <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">Combat & Survival</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Mobs Killed:</span><span>{(playerStats.mobsKilled || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Player Kills:</span><span>{(playerStats.playerKills || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Deaths:</span><span>{(playerStats.deaths || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Damage Dealt:</span><span>{(playerStats.damageDealt || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Damage Taken:</span><span>{(playerStats.damageTaken || 0).toLocaleString()}</span></div>
            </div>
          </div>
          {/* Exploration & Activities */}
          <div>
            <h4 className="text-sm font-minecraft text-minecraft-habbo-yellow mb-3">Exploration & Activities</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fish Caught:</span><span>{(playerStats.fishCaught || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Animals Bred:</span><span>{(playerStats.animalsBred || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Raids Won:</span><span>{(playerStats.raidsWon || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Experience:</span><span>{(playerStats.experience || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Achievements:</span><span>{playerStats.achievements || 0}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Economy Statistics */}
      <div className="habbo-card p-5 rounded-md">
        <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          Economy Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-minecraft-navy-light rounded flex flex-col items-center justify-center min-h-[90px]">
            <div className="font-minecraft mb-2 text-green-400 text-2xl md:text-3xl lg:text-4xl font-bold whitespace-nowrap" style={{ letterSpacing: '0.03em' }}>${balance.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Current Balance</div>
          </div>
          <div className="text-center p-4 bg-minecraft-navy-light rounded flex flex-col items-center justify-center min-h-[90px]">
            <div className="font-minecraft mb-2 text-blue-400 text-2xl md:text-3xl lg:text-4xl font-bold whitespace-nowrap" style={{ letterSpacing: '0.03em' }}>${earnedToday.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Earned Today</div>
          </div>
          <div className="text-center p-4 bg-minecraft-navy-light rounded flex flex-col items-center justify-center min-h-[90px]">
            <div className="font-minecraft mb-2 text-red-400 text-2xl md:text-3xl lg:text-4xl font-bold whitespace-nowrap" style={{ letterSpacing: '0.03em' }}>${spentToday.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Spent Today</div>
          </div>
        </div>
      </div>

      {/* Progress & Achievements */}
      <div className="habbo-card p-5 rounded-md">
        <h3 className="text-lg font-minecraft text-minecraft-habbo-green mb-4 flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          Progress & Achievements
        </h3>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-2 mb-2">
          <div
            className="bg-minecraft-habbo-green h-4 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, playerStats.achievements || 0)}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-400">
          Achievement Progress {playerStats.achievements || 0}%
        </div>
      </div>
    </div>
  );
};

export default StatsTab; 