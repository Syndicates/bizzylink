/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file TitleSystem.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Title System Component
 * 
 * This component provides a comprehensive title management system for players.
 * Titles are unlocked through achievements, special events, or other gameplay milestones.
 * Players can select an active title that is displayed next to their name.
 */
const TitleSystem = ({ 
  playerData, 
  onChange, 
  showSelection = true, 
  selectedTitle = null,
  compact = false 
}) => {
  const [titles, setTitles] = useState([]);
  const [activeTitle, setActiveTitle] = useState(selectedTitle);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Process player data to extract title information
  useEffect(() => {
    if (!playerData) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Extract titles from player data or use default titles
    const availableTitles = processTitles(playerData);
    setTitles(availableTitles);
    
    // Set active title based on player preference or first available
    const selectedPlayerTitle = playerData.active_title || selectedTitle;
    if (selectedPlayerTitle && availableTitles.find(t => t.id === selectedPlayerTitle)) {
      setActiveTitle(selectedPlayerTitle);
    } else if (availableTitles.length > 0) {
      setActiveTitle(availableTitles[0].id);
    }
    
    setIsLoading(false);
  }, [playerData, selectedTitle]);

  // Process titles from player data
  const processTitles = (data) => {
    // Default empty array if no data
    if (!data) return [];
    
    // Extract titles from player data
    const playerTitles = data.titles || [];
    const unlockedTitles = [];
    
    // Always available default titles
    unlockedTitles.push({
      id: 'default',
      name: 'Adventurer',
      description: 'The default title for all players',
      rarity: 'common',
      textColor: 'text-white',
      unlocked: true,
      category: 'default'
    });
    
    // Process player level for level-based titles
    if (data.level) {
      // Level-based titles
      const levelTitles = [
        { level: 10, id: 'level_10', name: 'Novice', rarity: 'common', textColor: 'text-gray-200' },
        { level: 25, id: 'level_25', name: 'Journeyman', rarity: 'uncommon', textColor: 'text-green-400' },
        { level: 50, id: 'level_50', name: 'Expert', rarity: 'rare', textColor: 'text-blue-400' },
        { level: 75, id: 'level_75', name: 'Master', rarity: 'epic', textColor: 'text-purple-400' },
        { level: 100, id: 'level_100', name: 'Grandmaster', rarity: 'legendary', textColor: 'text-yellow-300' },
        { level: 150, id: 'level_150', name: 'Legendary', rarity: 'mythic', textColor: 'text-red-400' },
        { level: 200, id: 'level_200', name: 'Mythical', rarity: 'mythic', textColor: 'text-pink-400' },
        { level: 300, id: 'level_300', name: 'Godlike', rarity: 'godly', textColor: 'text-amber-300' },
        { level: 400, id: 'level_400', name: 'Transcendent', rarity: 'godly', textColor: 'text-teal-300' },
        { level: 500, id: 'level_500', name: 'Divine', rarity: 'divine', textColor: 'text-blue-300' }
      ];
      
      // Add unlocked level titles
      levelTitles.forEach(title => {
        if (data.level >= title.level) {
          unlockedTitles.push({
            ...title,
            description: `Reached level ${title.level}`,
            unlocked: true,
            category: 'level'
          });
        }
      });
    }
    
    // Process achievements for achievement-based titles
    if (data.advancements) {
      // Map specific achievements to titles
      const achievementTitles = [
        { 
          achievement: 'minecraft:story/enter_the_nether', 
          id: 'nether_explorer', 
          name: 'Nether Explorer', 
          description: 'Entered the Nether dimension',
          rarity: 'uncommon',
          textColor: 'text-red-400'
        },
        { 
          achievement: 'minecraft:story/enter_the_end', 
          id: 'ender', 
          name: 'Ender', 
          description: 'Entered the End dimension',
          rarity: 'rare',
          textColor: 'text-purple-400'
        },
        { 
          achievement: 'minecraft:end/kill_dragon', 
          id: 'dragon_slayer', 
          name: 'Dragon Slayer', 
          description: 'Defeated the Ender Dragon',
          rarity: 'epic',
          textColor: 'text-violet-400'
        },
        { 
          achievement: 'minecraft:end/elytra', 
          id: 'aviator', 
          name: 'Aviator', 
          description: 'Found an Elytra',
          rarity: 'epic',
          textColor: 'text-sky-300'
        }
      ];
      
      // Add unlocked achievement titles
      achievementTitles.forEach(title => {
        if (data.advancements.includes(title.achievement)) {
          unlockedTitles.push({
            ...title,
            unlocked: true,
            category: 'achievement'
          });
        }
      });
    }
    
    // Process custom server statistics
    if (data.server_stats) {
      // Voting titles
      if (data.server_stats.total_votes >= 100) {
        unlockedTitles.push({
          id: 'voting_champion',
          name: 'Voting Champion',
          description: 'Voted for the server 100+ times',
          rarity: 'rare',
          textColor: 'text-emerald-400',
          unlocked: true,
          category: 'server'
        });
      } else if (data.server_stats.total_votes >= 50) {
        unlockedTitles.push({
          id: 'voting_supporter',
          name: 'Server Supporter',
          description: 'Voted for the server 50+ times',
          rarity: 'uncommon',
          textColor: 'text-green-400',
          unlocked: true,
          category: 'server'
        });
      }
      
      // Quest titles
      if (data.server_stats.quests_completed >= 50) {
        unlockedTitles.push({
          id: 'quest_master',
          name: 'Quest Master',
          description: 'Completed 50+ server quests',
          rarity: 'rare',
          textColor: 'text-yellow-400',
          unlocked: true,
          category: 'quests'
        });
      } else if (data.server_stats.quests_completed >= 25) {
        unlockedTitles.push({
          id: 'quest_hunter',
          name: 'Quest Hunter',
          description: 'Completed 25+ server quests',
          rarity: 'uncommon',
          textColor: 'text-amber-400',
          unlocked: true,
          category: 'quests'
        });
      }
      
      // Minigame titles
      if (data.server_stats.minigame_stats) {
        const totalWins = Object.values(data.server_stats.minigame_stats)
          .reduce((sum, game) => sum + (game.wins || 0), 0);
          
        if (totalWins >= 50) {
          unlockedTitles.push({
            id: 'minigame_champion',
            name: 'Champion',
            description: 'Won 50+ minigames',
            rarity: 'epic',
            textColor: 'text-yellow-300',
            unlocked: true,
            category: 'minigames'
          });
        } else if (totalWins >= 25) {
          unlockedTitles.push({
            id: 'minigame_competitor',
            name: 'Competitor',
            description: 'Won 25+ minigames',
            rarity: 'rare',
            textColor: 'text-blue-300',
            unlocked: true,
            category: 'minigames'
          });
        }
        
        // Individual minigame titles
        Object.entries(data.server_stats.minigame_stats).forEach(([game, stats]) => {
          if (stats.rank === 'Diamond' || stats.wins >= 20) {
            unlockedTitles.push({
              id: `${game.toLowerCase()}_master`.replace(/\s+/g, '_'),
              name: `${game} Master`,
              description: `Achieved Diamond rank in ${game}`,
              rarity: 'rare',
              textColor: 'text-blue-300',
              unlocked: true,
              category: 'minigames'
            });
          }
        });
      }
    }
    
    // Add economy titles
    if (data.economy_data && data.economy_data.balance) {
      if (data.economy_data.balance >= 1000000) {
        unlockedTitles.push({
          id: 'millionaire',
          name: 'Millionaire',
          description: 'Accumulated 1,000,000+ in-game currency',
          rarity: 'legendary',
          textColor: 'text-yellow-300',
          unlocked: true,
          category: 'economy'
        });
      } else if (data.economy_data.balance >= 500000) {
        unlockedTitles.push({
          id: 'wealthy',
          name: 'Wealthy',
          description: 'Accumulated 500,000+ in-game currency',
          rarity: 'epic',
          textColor: 'text-amber-400',
          unlocked: true,
          category: 'economy'
        });
      } else if (data.economy_data.balance >= 100000) {
        unlockedTitles.push({
          id: 'affluent',
          name: 'Affluent',
          description: 'Accumulated 100,000+ in-game currency',
          rarity: 'rare',
          textColor: 'text-green-400',
          unlocked: true,
          category: 'economy'
        });
      }
    }
    
    // Process playtime
    if (data.playtime_minutes || data.time_played) {
      const minutesPlayed = data.playtime_minutes || data.time_played || 0;
      
      if (minutesPlayed >= 30000) { // 500 hours
        unlockedTitles.push({
          id: 'veteran',
          name: 'Veteran',
          description: 'Played for 500+ hours',
          rarity: 'legendary',
          textColor: 'text-purple-300',
          unlocked: true,
          category: 'playtime'
        });
      } else if (minutesPlayed >= 12000) { // 200 hours
        unlockedTitles.push({
          id: 'dedicated',
          name: 'Dedicated',
          description: 'Played for 200+ hours',
          rarity: 'epic',
          textColor: 'text-blue-300',
          unlocked: true,
          category: 'playtime'
        });
      } else if (minutesPlayed >= 6000) { // 100 hours
        unlockedTitles.push({
          id: 'enthusiast',
          name: 'Enthusiast',
          description: 'Played for 100+ hours',
          rarity: 'rare',
          textColor: 'text-cyan-400',
          unlocked: true,
          category: 'playtime'
        });
      }
    }
    
    // Add titles from player data
    if (playerTitles && playerTitles.length > 0) {
      playerTitles.forEach(title => {
        // Only add if not already included
        if (!unlockedTitles.find(t => t.id === title.id)) {
          unlockedTitles.push({
            ...title,
            unlocked: true
          });
        }
      });
    }
    
    // Sort titles by rarity
    return unlockedTitles.sort((a, b) => {
      const rarityOrder = {
        'common': 1,
        'uncommon': 2,
        'rare': 3,
        'epic': 4,
        'legendary': 5,
        'mythic': 6,
        'godly': 7,
        'divine': 8
      };
      
      return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    });
  };

  // Handle title selection
  const handleTitleSelect = (titleId) => {
    setActiveTitle(titleId);
    setShowModal(false);
    
    // Notify parent component of title change
    if (onChange) {
      onChange(titleId);
    }
  };

  // Get title display component
  const getTitleDisplay = (titleId, size = 'normal') => {
    const title = titles.find(t => t.id === titleId);
    
    if (!title) {
      return null;
    }
    
    // Background colors based on rarity
    const bgColors = {
      'common': 'bg-gray-700',
      'uncommon': 'bg-green-900',
      'rare': 'bg-blue-900',
      'epic': 'bg-purple-900',
      'legendary': 'bg-amber-900',
      'mythic': 'bg-pink-900',
      'godly': 'bg-gradient-to-r from-blue-900 to-purple-900',
      'divine': 'bg-gradient-to-r from-yellow-900 to-amber-900'
    };
    
    // Size classes
    const sizeClasses = {
      'small': 'px-1.5 py-0.5 text-xs',
      'normal': 'px-2 py-1 text-sm',
      'large': 'px-3 py-1.5 text-base'
    };
    
    return (
      <span 
        className={`
          inline-block rounded-md ${bgColors[title.rarity] || 'bg-gray-700'} 
          ${title.textColor || 'text-white'} ${sizeClasses[size] || sizeClasses.normal}
          font-semibold tracking-wide
        `}
      >
        {title.name}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse w-24 h-6 bg-gray-700 rounded-md"></div>
    );
  }

  // No titles available
  if (titles.length === 0) {
    return (
      <span className="text-gray-400 text-sm">No titles available</span>
    );
  }

  // Compact display (just the title)
  if (compact) {
    return getTitleDisplay(activeTitle, 'normal');
  }

  return (
    <div className="title-system">
      {/* Active title display */}
      <div className="flex items-center gap-2">
        {activeTitle && getTitleDisplay(activeTitle, 'normal')}
        
        {/* Title selection button */}
        {showSelection && titles.length > 1 && (
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            Change
          </button>
        )}
      </div>
      
      {/* Title selection modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Select Title</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-2">
              {titles.map(title => (
                <motion.div
                  key={title.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTitleSelect(title.id)}
                  className={`
                    p-3 rounded-md cursor-pointer
                    ${activeTitle === title.id ? 'bg-gray-700 ring-2 ring-green-500' : 'bg-gray-700 hover:bg-gray-600'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className={title.textColor || 'text-white'}>
                      {title.name}
                    </span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded
                      ${title.rarity === 'common' ? 'bg-gray-600 text-gray-300' :
                        title.rarity === 'uncommon' ? 'bg-green-800 text-green-200' :
                        title.rarity === 'rare' ? 'bg-blue-800 text-blue-200' :
                        title.rarity === 'epic' ? 'bg-purple-800 text-purple-200' :
                        title.rarity === 'legendary' ? 'bg-amber-800 text-amber-200' :
                        title.rarity === 'mythic' ? 'bg-pink-800 text-pink-200' :
                        title.rarity === 'godly' ? 'bg-indigo-800 text-indigo-200' :
                        'bg-yellow-800 text-yellow-200'}
                    `}>
                      {title.rarity.charAt(0).toUpperCase() + title.rarity.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{title.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TitleSystem;