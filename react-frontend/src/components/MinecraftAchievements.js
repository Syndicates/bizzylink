/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftAchievements.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MinecraftAPI from '../utils/minecraft-api';
import AchievementSystem from './AchievementSystem';

/**
 * MinecraftAchievements - Displays Minecraft advancements/achievements
 * 
 * @param {Object} props
 * @param {Array} props.advancements - Array of advancement keys
 * @param {number} props.count - Number of completed advancements
 * @param {number} props.total - Total number of advancements
 * @param {number} props.percentage - Completion percentage
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.playerData - Full player data object (for new AchievementSystem)
 */
const MinecraftAchievements = ({
  advancements = [],
  count = 0,
  total = 30,
  percentage = 0,
  className = '',
  playerData = null
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('all');
  const [useNewSystem, setUseNewSystem] = useState(true);
  
  // If playerData is provided and has advancements, use the new system
  const hasFullPlayerData = playerData && 
    (playerData.advancements || 
    (advancements && advancements.length > 0 && playerData.advancements_percentage));
  
  // If we have playerData but not using it yet, switch to new system
  if (hasFullPlayerData && !useNewSystem) {
    setUseNewSystem(true);
  }
  
  // New system with AchievementSystem component
  if (useNewSystem && hasFullPlayerData) {
    return (
      <div className={`minecraft-achievements ${className}`}>
        {/* Achievement header with count and progress bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <h3 className="text-lg font-bold">Achievements</h3>
            <span className="text-minecraft-habbo-yellow">
              {playerData.advancements_count || count}/{playerData.advancements_total || total} 
              ({playerData.advancements_percentage || percentage}%)
            </span>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBarColor(playerData.advancements_percentage || percentage)}`}
              style={{ width: `${playerData.advancements_percentage || percentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Use the new AchievementSystem component */}
        <AchievementSystem 
          playerData={playerData} 
          display={expanded ? "grid" : "compact"} 
          size="small" 
          initialLimit={expanded ? 0 : 8} 
        />
        
        {/* Expand/collapse button */}
        {playerData.advancements && playerData.advancements.length > 8 && (
          <button
            className="w-full mt-3 py-1 text-sm text-center text-minecraft-habbo-blue hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : `Show all achievements`}
          </button>
        )}
      </div>
    );
  }
  
  // Default categories for Minecraft advancements
  const categories = [
    'story',
    'nether',
    'end',
    'adventure',
    'husbandry',
    'other'
  ];
  
  // Group advancements by category
  const groupedAdvancements = advancements.reduce((groups, advancement) => {
    const category = getCategoryFromAdvancement(advancement);
    if (!groups[category]) groups[category] = [];
    groups[category].push(advancement);
    return groups;
  }, {});
  
  // Filter advancements by selected category
  const filteredAdvancements = filter === 'all' 
    ? advancements 
    : groupedAdvancements[filter] || [];
  
  // Get display advancements - limit if not expanded
  const displayAdvancements = expanded 
    ? filteredAdvancements 
    : filteredAdvancements.slice(0, 5);
  
  // Legacy system (if no playerData available)
  return (
    <div className={`minecraft-achievements ${className}`}>
      {/* Achievement header with count and progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <h3 className="text-lg font-bold">Achievements</h3>
          <span className="text-minecraft-habbo-yellow">{count}/{total} ({percentage}%)</span>
        </div>
        
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <CategoryTab 
          name="all" 
          label="All" 
          active={filter === 'all'}
          count={advancements.length}
          onClick={() => setFilter('all')}
        />
        
        {categories.map(category => {
          const count = (groupedAdvancements[category] || []).length;
          if (count === 0) return null;
          
          return (
            <CategoryTab 
              key={category}
              name={category}
              label={formatCategoryName(category)}
              active={filter === category}
              count={count}
              onClick={() => setFilter(category)}
            />
          );
        })}
      </div>
      
      {/* Achievement list */}
      <div className="space-y-2">
        {displayAdvancements.length > 0 ? (
          displayAdvancements.map((advancement, index) => (
            <Achievement 
              key={index}
              advancement={advancement}
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-400">
            No achievements in this category
          </div>
        )}
      </div>
      
      {/* Expand/collapse button */}
      {filteredAdvancements.length > 5 && (
        <button
          className="w-full mt-3 py-1 text-sm text-center text-minecraft-habbo-blue hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `Show ${filteredAdvancements.length - 5} more`}
        </button>
      )}
    </div>
  );
};

// Category tab component
const CategoryTab = ({ name, label, active, count, onClick }) => (
  <button
    className={`px-3 py-1 text-sm rounded-full transition ${
      active 
        ? 'bg-minecraft-habbo-blue text-white' 
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`}
    onClick={onClick}
  >
    {label} <span className="opacity-70">({count})</span>
  </button>
);

// Individual achievement component
const Achievement = ({ advancement }) => {
  const displayName = MinecraftAPI.formatAdvancementName(advancement);
  
  // Determine icon based on advancement path
  const getIconName = () => {
    if (advancement.includes('story')) return 'book';
    if (advancement.includes('nether')) return 'netherrack';
    if (advancement.includes('end')) return 'end_stone';
    if (advancement.includes('adventure')) return 'compass';
    if (advancement.includes('husbandry')) return 'wheat';
    return 'grass_block';
  };
  
  return (
    <motion.div 
      className="bg-white/5 p-2 rounded-md flex items-center"
      whileHover={{ scale: 1.02 }}
    >
      <div className="w-8 h-8 rounded-md bg-gray-800 mr-3 flex items-center justify-center">
        <img 
          src={MinecraftAPI.getItemImage(getIconName(), 32)}
          alt=""
          className="w-6 h-6 object-contain"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/32?text=✓";
          }}
        />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{displayName}</div>
        <div className="text-xs text-gray-400 truncate max-w-full">
          {advancement.replace('minecraft:', '')}
        </div>
      </div>
    </motion.div>
  );
};

// Helper functions
const getCategoryFromAdvancement = (advancement) => {
  // Extract the first part after "minecraft:"
  const path = advancement.replace('minecraft:', '');
  const parts = path.split('/');
  
  if (parts.length > 0) {
    if (parts[0] === 'story' || parts[0] === 'nether' || 
        parts[0] === 'end' || parts[0] === 'adventure' || 
        parts[0] === 'husbandry') {
      return parts[0];
    }
  }
  
  return 'other';
};

const formatCategoryName = (category) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const getProgressBarColor = (percentage) => {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

export default MinecraftAchievements;