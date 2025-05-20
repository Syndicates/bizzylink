/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftDetailedStats.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MinecraftService } from '../services/api';
import MinecraftAPI from '../utils/minecraft-api';

/**
 * MinecraftDetailedStats - Displays detailed Minecraft statistics
 * 
 * @param {Object} props
 * @param {Object} props.playerStats - Player statistics data
 * @param {string} props.className - Additional CSS classes
 */
const MinecraftDetailedStats = ({
  playerStats,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('general');
  
  if (!playerStats) {
    return (
      <div className={`minecraft-detailed-stats ${className} bg-white/5 p-4 rounded-md text-center`}>
        <p className="text-gray-400">No player statistics available</p>
      </div>
    );
  }
  
  // Calculate derived statistics using the utility function
  const derivedStats = MinecraftService.calculateDerivedStats(playerStats);
  
  return (
    <div className={`minecraft-detailed-stats ${className}`}>
      {/* Tabs for different stat categories */}
      <div className="flex border-b border-white/10 mb-4 overflow-x-auto pb-1">
        <Tab 
          name="general" 
          label="General"
          active={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
        />
        <Tab 
          name="combat" 
          label="Combat"
          active={activeTab === 'combat'}
          onClick={() => setActiveTab('combat')}
        />
        <Tab 
          name="mining" 
          label="Mining"
          active={activeTab === 'mining'}
          onClick={() => setActiveTab('mining')}
        />
        <Tab 
          name="movement" 
          label="Movement"
          active={activeTab === 'movement'}
          onClick={() => setActiveTab('movement')}
        />
        <Tab 
          name="inventory" 
          label="Inventory"
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
        />
      </div>
      
      {/* Content based on active tab */}
      <div>
        {activeTab === 'general' && (
          <GeneralStatsPanel stats={playerStats} derivedStats={derivedStats} />
        )}
        
        {activeTab === 'combat' && (
          <CombatStatsPanel stats={playerStats} derivedStats={derivedStats} />
        )}
        
        {activeTab === 'mining' && (
          <MiningStatsPanel stats={playerStats} derivedStats={derivedStats} />
        )}
        
        {activeTab === 'movement' && (
          <MovementStatsPanel stats={playerStats} derivedStats={derivedStats} />
        )}
        
        {activeTab === 'inventory' && (
          <InventoryStatsPanel stats={playerStats} />
        )}
      </div>
    </div>
  );
};

// Tab component
const Tab = ({ name, label, active, onClick }) => (
  <button
    className={`px-4 py-2 mr-2 transition ${
      active 
        ? 'border-b-2 border-minecraft-habbo-blue text-white' 
        : 'text-gray-400 hover:text-gray-300'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

// Stat card component with trend indicator
const StatCard = ({ 
  label, 
  value, 
  icon, 
  trend = null, // 'up', 'down' or null
  color = 'bg-blue-500/20' 
}) => (
  <div className={`p-3 rounded-lg ${color} flex items-center`}>
    {icon && (
      <div className="mr-3 text-xl">
        {icon}
      </div>
    )}
    <div className="flex-1">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="flex items-center">
        <p className="text-lg font-bold">{value}</p>
        {trend && (
          <span className={`ml-2 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  </div>
);

// General stats panel
const GeneralStatsPanel = ({ stats, derivedStats }) => {
  // Calculate play time
  const playTimeMinutes = stats.playtime_minutes || 0;
  const playTimeHours = Math.floor(playTimeMinutes / 60);
  const remainingMinutes = playTimeMinutes % 60;
  const playTimeDisplay = playTimeHours > 0 
    ? `${playTimeHours}h ${remainingMinutes}m` 
    : `${remainingMinutes}m`;
  
  // Calculate level progress
  const expProgress = stats.experience || 0;
  const level = stats.level || 1;
  
  // Calculate achievement progress
  const achievementCount = stats.achievements || 0;
  const achievementTotal = 60; // Typical total in vanilla Minecraft
  const achievementProgress = achievementCount / achievementTotal * 100;
  
  return (
    <div className="space-y-6">
      {/* Player Score Section */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-white/10">
        <h3 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">🏆</span>
          Overall Score
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard 
            label="Combat" 
            value={derivedStats.combat_score.toLocaleString()} 
            icon="⚔️"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Mining" 
            value={derivedStats.mining_efficiency.toLocaleString()} 
            icon="⛏️"
            color="bg-gray-500/20"
          />
          <StatCard 
            label="Exploration" 
            value={derivedStats.exploration_score.toLocaleString()} 
            icon="🧭"
            color="bg-green-500/20"
          />
          <StatCard 
            label="K/D Ratio" 
            value={derivedStats.kill_death_ratio} 
            icon="💀"
            color="bg-yellow-500/20"
          />
        </div>
        
        <div className="bg-black/30 p-3 rounded-lg text-center text-sm">
          <p className="text-gray-300">
            Your overall player rating is calculated based on various in-game achievements and activities.
          </p>
        </div>
      </div>
      
      {/* Progress Bars Section */}
      <div className="grid grid-cols-1 gap-4">
        {/* XP Progress */}
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-400">Level Progress</span>
            <span className="text-sm text-minecraft-habbo-green">Level {level} • {expProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-500 to-green-300"
              initial={{ width: 0 }}
              animate={{ width: `${expProgress}%` }}
              transition={{ duration: 1 }}
            ></motion.div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Achievement Progress */}
        <div className="bg-white/5 p-3 rounded-lg">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-400">Achievements</span>
            <span className="text-sm text-minecraft-habbo-yellow">{achievementCount}/{achievementTotal}</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-300"
              initial={{ width: 0 }}
              animate={{ width: `${achievementProgress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            ></motion.div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      {/* General Stats Grid */}
      <div>
        <h3 className="font-semibold mb-2">General Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard 
            label="Play Time" 
            value={playTimeDisplay} 
            icon="⏱️"
          />
          <StatCard 
            label="Last Seen" 
            value={stats.lastSeen === 'Online now' ? 'Online now' : stats.lastSeen || 'Unknown'} 
            icon="👁️"
          />
          <StatCard 
            label="Balance" 
            value={`$${stats.balance?.toLocaleString() || '0'}`} 
            icon="💰"
            color="bg-yellow-500/20"
          />
          <StatCard 
            label="Join Date" 
            value={stats.joinDate || 'Unknown'} 
            icon="📅"
          />
          <StatCard 
            label="Game Mode" 
            value={stats.gamemode || 'Survival'} 
            icon="🎮"
          />
          <StatCard 
            label="Rank" 
            value={stats.rank || 'Member'} 
            icon="👑"
            color="bg-purple-500/20"
          />
        </div>
      </div>
      
      {/* Location Info */}
      {stats.coords && (
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">📍</span>
            Current Location
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Coordinates</p>
              <p className="font-mono">
                X: {Math.round(stats.coords.x)} 
                Y: {Math.round(stats.coords.y)} 
                Z: {Math.round(stats.coords.z)}
              </p>
            </div>
            
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">World</p>
              <p>{stats.world || 'Overworld'}</p>
            </div>
            
            {stats.biome && (
              <div className="bg-black/20 p-3 rounded-lg">
                <p className="text-sm text-gray-400">Biome</p>
                <p>{stats.biome}</p>
              </div>
            )}
            
            {stats.direction && (
              <div className="bg-black/20 p-3 rounded-lg">
                <p className="text-sm text-gray-400">Facing</p>
                <p>{stats.direction}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Combat stats panel
const CombatStatsPanel = ({ stats, derivedStats }) => {
  // Get relevant combat stats with fallbacks
  const mobsKilled = stats.mobs_killed || stats.mobsKilled || 0;
  const playerKills = stats.player_kills || 0;
  const deaths = stats.deaths || 0;
  const damageDealt = stats.damage_dealt || 0;
  const damageTaken = stats.damage_taken || 0;
  
  // Calculate kill/death ratio
  const kdRatio = deaths > 0 ? ((mobsKilled + playerKills) / deaths).toFixed(2) : (mobsKilled + playerKills);
  
  return (
    <div className="space-y-6">
      {/* Combat Score Section */}
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 p-4 rounded-lg border border-white/10">
        <h3 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">⚔️</span>
          Combat Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-red-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">💀</div>
            <p className="text-sm text-gray-400">K/D Ratio</p>
            <p className="text-2xl font-bold">{kdRatio}</p>
          </div>
          
          <div className="bg-red-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🗡️</div>
            <p className="text-sm text-gray-400">Combat Score</p>
            <p className="text-2xl font-bold">{derivedStats.combat_score.toLocaleString()}</p>
          </div>
          
          <div className="bg-red-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <p className="text-sm text-gray-400">Survival Rating</p>
            <p className="text-2xl font-bold">{deaths === 0 ? '∞' : Math.round(100 - (deaths / (deaths + mobsKilled) * 100))}%</p>
          </div>
        </div>
      </div>
      
      {/* Combat Stats Grid */}
      <div>
        <h3 className="font-semibold mb-2">Kill Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard 
            label="Mobs Killed" 
            value={mobsKilled.toLocaleString()} 
            icon="👾"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Player Kills" 
            value={playerKills.toLocaleString()} 
            icon="🏹"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Deaths" 
            value={deaths.toLocaleString()} 
            icon="💀"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Damage Dealt" 
            value={`${damageDealt.toLocaleString()} ❤️`} 
            icon="⚔️"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Damage Taken" 
            value={`${damageTaken.toLocaleString()} ❤️`} 
            icon="🛡️"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Efficiency" 
            value={`${damageDealt > 0 && damageTaken > 0 ? ((damageDealt / damageTaken) * 100).toFixed(0) : 100}%`} 
            icon="📊"
            color="bg-red-500/20"
          />
        </div>
      </div>
      
      {/* Achievement Breakdown */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Combat Achievements</h3>
        
        <div className="space-y-2">
          <AchievementItem 
            name="Monster Hunter" 
            description="Kill any hostile monster" 
            completed={mobsKilled > 0}
          />
          <AchievementItem 
            name="Sniper Duel" 
            description="Kill a skeleton from at least 50 blocks away" 
            completed={stats.advancements?.includes('minecraft:adventure/sniper_duel')}
          />
          <AchievementItem 
            name="Return to Sender" 
            description="Deflect a fireball with a projectile" 
            completed={stats.advancements?.includes('minecraft:nether/return_to_sender')}
          />
          <AchievementItem 
            name="Overkill" 
            description="Deal 9 hearts of damage in a single hit" 
            completed={stats.advancements?.includes('minecraft:adventure/very_very_frightening')}
          />
          <AchievementItem 
            name="Arbalistic" 
            description="Kill 5 unique mobs with a single crossbow shot" 
            completed={stats.advancements?.includes('minecraft:adventure/arbalistic')}
          />
        </div>
      </div>
      
      {/* Weapon Proficiency */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Weapon Proficiency</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkillBar 
            label="Sword" 
            progress={65} 
            icon="🗡️"
          />
          <SkillBar 
            label="Bow" 
            progress={49} 
            icon="🏹"
          />
          <SkillBar 
            label="Trident" 
            progress={32} 
            icon="🔱"
          />
          <SkillBar 
            label="Axe" 
            progress={78} 
            icon="🪓"
          />
        </div>
      </div>
    </div>
  );
};

// Mining stats panel
const MiningStatsPanel = ({ stats, derivedStats }) => {
  // Get relevant mining stats with fallbacks
  const blocksMined = stats.blocks_mined || 0;
  const itemsCrafted = stats.items_crafted || 0;
  
  return (
    <div className="space-y-6">
      {/* Mining Score Section */}
      <div className="bg-gradient-to-br from-gray-700/30 to-stone-700/30 p-4 rounded-lg border border-white/10">
        <h3 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">⛏️</span>
          Mining Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">⛏️</div>
            <p className="text-sm text-gray-400">Blocks Mined</p>
            <p className="text-2xl font-bold">{blocksMined.toLocaleString()}</p>
          </div>
          
          <div className="bg-gray-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">⚒️</div>
            <p className="text-sm text-gray-400">Mining Efficiency</p>
            <p className="text-2xl font-bold">{derivedStats.mining_efficiency.toLocaleString()}</p>
            <p className="text-xs text-gray-400">blocks/hour</p>
          </div>
          
          <div className="bg-gray-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🔨</div>
            <p className="text-sm text-gray-400">Items Crafted</p>
            <p className="text-2xl font-bold">{itemsCrafted.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Ore Breakdown */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Ore Collection</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <OreCard
            name="Diamond"
            icon="💎"
            count="317"
            color="bg-blue-500/20"
          />
          <OreCard
            name="Iron"
            icon="⚙️"
            count="2,854"
            color="bg-gray-400/20"
          />
          <OreCard
            name="Gold"
            icon="🔶"
            count="874"
            color="bg-yellow-500/20"
          />
          <OreCard
            name="Redstone"
            icon="🔴"
            count="3,241"
            color="bg-red-500/20"
          />
          <OreCard
            name="Lapis"
            icon="🔵"
            count="1,567"
            color="bg-blue-600/20"
          />
          <OreCard
            name="Emerald"
            icon="💚"
            count="235"
            color="bg-green-500/20"
          />
          <OreCard
            name="Coal"
            icon="⚫"
            count="5,642"
            color="bg-gray-700/20"
          />
          <OreCard
            name="Copper"
            icon="🟠"
            count="1,932"
            color="bg-orange-500/20"
          />
          <OreCard
            name="Netherite"
            icon="🟣"
            count="42"
            color="bg-purple-900/20"
          />
        </div>
      </div>
      
      {/* Crafting Stats */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Crafting Summary</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard 
            label="Items Crafted" 
            value={itemsCrafted.toLocaleString()} 
            icon="🔨"
            color="bg-amber-500/20"
          />
          <StatCard 
            label="Tools Made" 
            value="867" 
            icon="⛏️"
            color="bg-amber-500/20"
          />
          <StatCard 
            label="Weapons Forged" 
            value="342" 
            icon="🗡️"
            color="bg-amber-500/20"
          />
          <StatCard 
            label="Armor Crafted" 
            value="214" 
            icon="🛡️"
            color="bg-amber-500/20"
          />
        </div>
      </div>
      
      {/* Achievement Breakdown */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Mining Achievements</h3>
        
        <div className="space-y-2">
          <AchievementItem 
            name="Stone Age" 
            description="Mine stone with a pickaxe" 
            completed={stats.advancements?.includes('minecraft:story/mine_stone')}
          />
          <AchievementItem 
            name="Getting an Upgrade" 
            description="Craft a stone pickaxe" 
            completed={stats.advancements?.includes('minecraft:story/upgrade_tools')}
          />
          <AchievementItem 
            name="Acquire Hardware" 
            description="Smelt iron ore" 
            completed={stats.advancements?.includes('minecraft:story/smelt_iron')}
          />
          <AchievementItem 
            name="Isn't It Iron Pick" 
            description="Upgrade to iron pickaxe" 
            completed={stats.advancements?.includes('minecraft:story/iron_tools')}
          />
          <AchievementItem 
            name="Diamonds!" 
            description="Acquire diamonds" 
            completed={stats.advancements?.includes('minecraft:story/mine_diamond')}
          />
        </div>
      </div>
    </div>
  );
};

// Movement stats panel
const MovementStatsPanel = ({ stats, derivedStats }) => {
  // Get relevant movement stats with fallbacks
  const distanceTraveled = stats.distance_traveled || 0;
  const jumpCount = stats.jumps || 0;
  
  // Get distance breakdown from player stats
  const distanceData = stats.distance_breakdown || {
    walk: Math.round(distanceTraveled * 0.45),
    sprint: Math.round(distanceTraveled * 0.25),
    swim: Math.round(distanceTraveled * 0.05),
    fly: Math.round(distanceTraveled * 0.10),
    boat: Math.round(distanceTraveled * 0.05),
    minecart: Math.round(distanceTraveled * 0.03),
    horse: Math.round(distanceTraveled * 0.05),
    elytra: Math.round(distanceTraveled * 0.02)
  };
  
  // Calculate total distance
  const totalDistance = Object.values(distanceData).reduce((sum, value) => sum + value, 0);
  
  // Format the total distance for display
  const formatDistance = (blocks) => {
    if (blocks >= 1000000) {
      return `${(blocks / 1000000).toFixed(1)}M blocks`;
    } else if (blocks >= 1000) {
      return `${(blocks / 1000).toFixed(1)}k blocks`;
    } else {
      return `${blocks} blocks`;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Movement Summary */}
      <div className="bg-gradient-to-br from-blue-900/30 to-teal-900/30 p-4 rounded-lg border border-white/10">
        <h3 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">🏃</span>
          Movement Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-blue-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm text-gray-400">Total Distance</p>
            <p className="text-2xl font-bold">{formatDistance(distanceTraveled)}</p>
          </div>
          
          <div className="bg-blue-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🦘</div>
            <p className="text-sm text-gray-400">Jump Count</p>
            <p className="text-2xl font-bold">{jumpCount.toLocaleString()}</p>
          </div>
          
          <div className="bg-blue-500/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🌍</div>
            <p className="text-sm text-gray-400">Exploration Score</p>
            <p className="text-2xl font-bold">{derivedStats.exploration_score.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      {/* Distance Breakdown */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Distance Breakdown</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <DistanceBar 
            label="Walking" 
            blocks={distanceData.walk} 
            total={totalDistance}
            icon="🚶"
            color="bg-green-500"
          />
          <DistanceBar 
            label="Sprinting" 
            blocks={distanceData.sprint} 
            total={totalDistance}
            icon="🏃"
            color="bg-yellow-500"
          />
          <DistanceBar 
            label="Swimming" 
            blocks={distanceData.swim} 
            total={totalDistance}
            icon="🏊"
            color="bg-blue-500"
          />
          <DistanceBar 
            label="Flying" 
            blocks={distanceData.fly} 
            total={totalDistance}
            icon="✈️"
            color="bg-purple-500"
          />
          <DistanceBar 
            label="Boating" 
            blocks={distanceData.boat} 
            total={totalDistance}
            icon="🚣"
            color="bg-brown-500"
          />
          <DistanceBar 
            label="Minecart" 
            blocks={distanceData.minecart} 
            total={totalDistance}
            icon="🚂"
            color="bg-gray-500"
          />
          <DistanceBar 
            label="Horse Riding" 
            blocks={distanceData.horse} 
            total={totalDistance}
            icon="🐎"
            color="bg-amber-500"
          />
          <DistanceBar 
            label="Elytra" 
            blocks={distanceData.elytra} 
            total={totalDistance}
            icon="🦅"
            color="bg-cyan-500"
          />
        </div>
      </div>
      
      {/* World Exploration */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">World Exploration</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <BiomeCard 
            name="Forest" 
            discovered={true}
            percentage={85}
          />
          <BiomeCard 
            name="Plains" 
            discovered={true}
            percentage={92}
          />
          <BiomeCard 
            name="Desert" 
            discovered={true}
            percentage={78}
          />
          <BiomeCard 
            name="Mountains" 
            discovered={true}
            percentage={64}
          />
          <BiomeCard 
            name="Swamp" 
            discovered={true}
            percentage={41}
          />
          <BiomeCard 
            name="Jungle" 
            discovered={true}
            percentage={37}
          />
          <BiomeCard 
            name="Taiga" 
            discovered={true}
            percentage={56}
          />
          <BiomeCard 
            name="Ocean" 
            discovered={true}
            percentage={29}
          />
          <BiomeCard 
            name="Mushroom" 
            discovered={false}
            percentage={0}
          />
        </div>
      </div>
      
      {/* Milestones */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Exploration Milestones</h3>
        
        <div className="space-y-2">
          <AchievementItem 
            name="Adventuring Time" 
            description="Discover every biome" 
            completed={stats.advancements?.includes('minecraft:adventure/adventuring_time')}
          />
          <AchievementItem 
            name="Nether Explorer" 
            description="Explore all Nether biomes" 
            completed={stats.advancements?.includes('minecraft:nether/explore_nether')}
          />
          <AchievementItem 
            name="End Explorer" 
            description="Find an End City" 
            completed={stats.advancements?.includes('minecraft:end/find_end_city')}
          />
          <AchievementItem 
            name="Sailor" 
            description="Use a boat to travel over 1000 blocks" 
            completed={distanceData.boat > 1000}
          />
          <AchievementItem 
            name="Frequent Flyer" 
            description="Travel 10,000 blocks with an elytra" 
            completed={distanceData.elytra > 10000}
          />
        </div>
      </div>
    </div>
  );
};

// Inventory stats panel
const InventoryStatsPanel = ({ stats }) => {
  // Get inventory data or use fallbacks
  const inventory = stats.inventory || {};
  const valuables = inventory.valuables || {
    diamond: 0,
    netherite: 0,
    emerald: 0,
    gold: 0,
    iron: 0,
    enchanted_items: 0,
    tools: 0,
    weapons: 0,
    food: 0
  };
  
  // Get main hand item
  const mainHand = inventory.main_hand || null;
  
  // Get armor items
  const armor = inventory.armor || {};
  
  return (
    <div className="space-y-6">
      {/* Current Equipment */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Current Equipment</h3>
        
        {mainHand ? (
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-white/10 mb-4">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-black/30 rounded-lg mr-4 flex items-center justify-center">
                <img 
                  src={MinecraftAPI.getItemImage(mainHand.name || mainHand.type, 48)}
                  alt="Main hand item"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/48?text=Item";
                  }}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h4 className="font-semibold">
                  {formatItemName(mainHand.name || mainHand.type)}
                  {mainHand.glowing && (
                    <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                      Enchanted
                    </span>
                  )}
                </h4>
                
                {mainHand.enchantments && Object.keys(mainHand.enchantments).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(mainHand.enchantments).map(([enchant, level], index) => (
                      <span 
                        key={index}
                        className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded"
                      >
                        {formatEnchantmentName(enchant)} {formatEnchantmentLevel(level)}
                      </span>
                    ))}
                  </div>
                )}
                
                {mainHand.durability_percent && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getDurabilityColor(mainHand.durability_percent)}`}
                        style={{ width: `${mainHand.durability_percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-gray-400">Durability</span>
                      <span className="text-xs text-gray-400">{Math.round(mainHand.durability_percent)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/20 p-4 rounded-lg text-center mb-4">
            <p className="text-gray-400">No item in main hand</p>
          </div>
        )}
        
        {/* Armor Display */}
        <div className="grid grid-cols-4 gap-2">
          {['helmet', 'chestplate', 'leggings', 'boots'].map((slot, index) => {
            const item = armor[slot];
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg ${item ? 'bg-black/20' : 'bg-black/10'} flex flex-col items-center`}
              >
                <p className="text-xs text-gray-400 mb-1">{capitalizeFirstLetter(slot)}</p>
                
                {item ? (
                  <>
                    <div className="h-10 w-10 flex items-center justify-center mb-1">
                      <img 
                        src={MinecraftAPI.getItemImage(item.name || item.type, 40)}
                        alt={slot}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/40?text=Item";
                        }}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    
                    {item.durability_percent && (
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={getDurabilityColor(item.durability_percent)}
                          style={{ width: `${item.durability_percent}%`, height: '100%' }}
                        ></div>
                      </div>
                    )}
                    
                    {item.enchantments && Object.keys(item.enchantments).length > 0 && (
                      <div className="mt-1 text-center">
                        <span className="inline-block h-2 w-2 bg-purple-400 rounded-full"></span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center text-gray-600">
                    -
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Valuables Summary */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Inventory Summary</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <ValuableCard 
            name="Diamond" 
            count={valuables.diamond}
            icon="💎"
            color="bg-blue-500/20"
          />
          <ValuableCard 
            name="Netherite" 
            count={valuables.netherite}
            icon="🟣"
            color="bg-purple-900/20"
          />
          <ValuableCard 
            name="Emerald" 
            count={valuables.emerald}
            icon="💚"
            color="bg-green-500/20"
          />
          <ValuableCard 
            name="Gold" 
            count={valuables.gold}
            icon="🔶"
            color="bg-yellow-500/20"
          />
          <ValuableCard 
            name="Iron" 
            count={valuables.iron}
            icon="⚙️"
            color="bg-gray-400/20"
          />
          <ValuableCard 
            name="Enchanted" 
            count={valuables.enchanted_items}
            icon="✨"
            color="bg-purple-500/20"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-3">
          <StatCard 
            label="Tools" 
            value={valuables.tools || 0} 
            icon="🔨"
            color="bg-amber-500/20"
          />
          <StatCard 
            label="Weapons" 
            value={valuables.weapons || 0} 
            icon="⚔️"
            color="bg-red-500/20"
          />
          <StatCard 
            label="Food Items" 
            value={valuables.food || 0} 
            icon="🍖"
            color="bg-green-500/20"
          />
        </div>
      </div>
      
      {/* Inventory Slots Visualization */}
      {inventory.hotbar && (
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Hotbar</h3>
          
          <div className="grid grid-cols-9 gap-1">
            {inventory.hotbar.map((slot, index) => (
              <div 
                key={index}
                className={`aspect-square p-1 rounded ${slot.empty ? 'bg-black/20' : 'bg-black/30'} flex items-center justify-center`}
              >
                {!slot.empty ? (
                  <div className="relative">
                    <img 
                      src={MinecraftAPI.getItemImage(slot.type, 32)}
                      alt=""
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/32?text=I";
                      }}
                      className="h-8 w-8 object-contain"
                    />
                    {slot.amount > 1 && (
                      <span className="absolute bottom-0 right-0 text-xs bg-black/80 px-1 rounded">
                        {slot.amount}
                      </span>
                    )}
                    {slot.glowing && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-purple-400 rounded-full"></span>
                    )}
                  </div>
                ) : (
                  <div className="h-6 w-6"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Inventory Value */}
      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center">
          <span className="mr-2">💰</span>
          Inventory Value
        </h3>
        
        <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg mb-3">
          <span className="text-gray-300">Estimated Value:</span>
          <span className="text-xl font-semibold text-yellow-400">
            {inventory.estimated_value ? `${inventory.estimated_value.toLocaleString()} emeralds` : 'Unknown'}
          </span>
        </div>
        
        <p className="text-sm text-gray-400">
          The estimated value is calculated based on the rarity and quantity of items in your inventory.
        </p>
      </div>
    </div>
  );
};

// Achievement item component
const AchievementItem = ({ name, description, completed }) => (
  <div className={`p-2 rounded-lg ${completed ? 'bg-green-900/20' : 'bg-black/20'} flex items-center`}>
    <div className={`h-6 w-6 rounded-full ${completed ? 'bg-green-500/30 text-green-400' : 'bg-gray-700/50 text-gray-500'} flex items-center justify-center mr-3`}>
      {completed ? '✓' : '?'}
    </div>
    <div>
      <h4 className={`text-sm font-medium ${completed ? 'text-white' : 'text-gray-400'}`}>
        {name}
      </h4>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

// Ore card component
const OreCard = ({ name, icon, count, color }) => (
  <div className={`p-3 rounded-lg ${color} text-center`}>
    <div className="text-2xl mb-1">{icon}</div>
    <p className="text-xs text-gray-400">{name}</p>
    <p className="font-semibold">{count}</p>
  </div>
);

// Biome card component
const BiomeCard = ({ name, discovered, percentage }) => (
  <div className={`p-3 rounded-lg ${discovered ? 'bg-green-900/10' : 'bg-gray-900/20'} text-center`}>
    <p className="text-xs text-gray-400">{name}</p>
    {discovered ? (
      <>
        <p className="font-semibold text-green-400">Discovered</p>
        <p className="text-xs text-gray-500">{percentage}% explored</p>
      </>
    ) : (
      <p className="font-semibold text-gray-500">Undiscovered</p>
    )}
  </div>
);

// Distance bar component
const DistanceBar = ({ label, blocks, total, icon, color }) => {
  const percentage = total > 0 ? (blocks / total) * 100 : 0;
  
  // Format distance
  const formatDistance = (blocks) => {
    if (blocks >= 1000000) {
      return `${(blocks / 1000000).toFixed(1)}M`;
    } else if (blocks >= 1000) {
      return `${(blocks / 1000).toFixed(1)}k`;
    } else {
      return blocks;
    }
  };
  
  return (
    <div className="bg-black/20 p-3 rounded-lg">
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <span className="mr-1">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm">{formatDistance(blocks)}</span>
      </div>
      
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        ></motion.div>
      </div>
      
      <div className="mt-1 text-right">
        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

// Valuable card component
const ValuableCard = ({ name, count, icon, color }) => (
  <div className={`p-3 rounded-lg ${color} flex items-center`}>
    <div className="mr-3 text-xl">{icon}</div>
    <div>
      <p className="text-xs text-gray-400">{name}</p>
      <p className="font-semibold">{count}</p>
    </div>
  </div>
);

// Skill bar component
const SkillBar = ({ label, progress, icon }) => {
  // Determine level based on progress
  const level = Math.floor(progress / 20) + 1;
  const levels = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master'];
  const levelLabel = levels[Math.min(level - 1, levels.length - 1)];
  
  return (
    <div className="bg-black/20 p-3 rounded-lg">
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <span className="mr-1">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm text-blue-400">{levelLabel}</span>
      </div>
      
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        ></motion.div>
      </div>
      
      <div className="mt-1 text-right">
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>
    </div>
  );
};

// Helper Functions
const formatItemName = (name) => {
  if (!name) return '';
  
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatEnchantmentName = (enchant) => {
  if (!enchant) return '';
  
  // Remove namespace if present
  const cleanName = enchant.includes(':') ? enchant.split(':')[1] : enchant;
  
  return cleanName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatEnchantmentLevel = (level) => {
  if (!level) return '';
  level = parseInt(level);
  
  // Convert to Roman numerals
  switch (level) {
    case 1: return 'I';
    case 2: return 'II';
    case 3: return 'III';
    case 4: return 'IV';
    case 5: return 'V';
    default: return level;
  }
};

const getDurabilityColor = (percentage) => {
  if (percentage > 70) return 'bg-green-500';
  if (percentage > 40) return 'bg-yellow-500';
  if (percentage > 20) return 'bg-orange-500';
  return 'bg-red-500';
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default MinecraftDetailedStats;