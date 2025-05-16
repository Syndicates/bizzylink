import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Comprehensive achievement/badge system component
 * This component handles displaying, managing and showcasing player achievements
 */
const AchievementSystem = ({ playerData, display = 'grid', size = 'medium', initialLimit = 16 }) => {
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(null);
  const [limit, setLimit] = useState(initialLimit);

  // Size mapping for badges
  const sizeMap = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  };

  // Layout settings based on display mode
  const layoutClasses = {
    grid: 'grid grid-cols-4 md:grid-cols-8 gap-2',
    list: 'flex flex-col space-y-2',
    showcase: 'flex flex-wrap justify-center gap-4',
    compact: 'flex flex-wrap gap-1'
  };

  // Process player achievement data
  useEffect(() => {
    if (!playerData) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Extract achievement data from player data
    const extractedAchievements = processAchievements(playerData);
    
    // Extract unique categories
    const uniqueCategories = [...new Set(extractedAchievements.map(a => a.category))];
    
    setAchievements(extractedAchievements);
    setCategories(['all', ...uniqueCategories]);
    setIsLoading(false);
  }, [playerData]);

  // Process achievements from player data
  const processAchievements = (data) => {
    // Default achievements (if none available in playerData)
    const defaultAchievements = [];
    
    // If no player data is available
    if (!data) return defaultAchievements;

    // Extract vanilla Minecraft achievements from advancements
    const minecraftAchievements = (data.advancements || []).map(advancement => {
      // Parse the advancement name from path (e.g., minecraft:story/enter_the_nether)
      const parts = advancement.split('/');
      const category = parts[0].split(':')[1] || 'minecraft';
      const name = formatAchievementName(parts[1] || parts[0].split(':')[1] || advancement);
      
      return {
        id: advancement,
        name,
        description: getAchievementDescription(advancement),
        category,
        icon: getAchievementIcon(advancement),
        rarity: getAchievementRarity(advancement),
        obtained: true,
        obtainedDate: data.server_first_join || 'Unknown',
        progress: 100
      };
    });

    // Parse custom achievements from playerData
    const customAchievements = parseCustomAchievements(data);

    // Combine all achievements
    return [...minecraftAchievements, ...customAchievements];
  };

  // Format achievement name to be more readable
  const formatAchievementName = (rawName) => {
    if (!rawName) return 'Unknown Achievement';
    
    return rawName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get description for known achievements
  const getAchievementDescription = (id) => {
    const descriptions = {
      'minecraft:story/root': 'The beginning of your adventure',
      'minecraft:story/mine_stone': 'Mine stone with your new pickaxe',
      'minecraft:story/upgrade_tools': 'Construct a better pickaxe',
      'minecraft:story/smelt_iron': 'Smelt an iron ingot',
      'minecraft:story/obtain_armor': 'Protect yourself with a piece of iron armor',
      'minecraft:story/lava_bucket': 'Fill a bucket with lava',
      'minecraft:story/iron_tools': 'Upgrade your pickaxe',
      'minecraft:story/deflect_arrow': 'Deflect an arrow with a shield',
      'minecraft:story/enter_the_nether': 'Build, light and enter a Nether Portal',
      'minecraft:story/follow_ender_eye': 'Follow an Eye of Ender',
      'minecraft:story/enter_the_end': 'Enter the End dimension',
      'minecraft:nether/root': 'Bring summer clothes',
      'minecraft:nether/find_fortress': 'A terrible fortress',
      'minecraft:nether/obtain_blaze_rod': 'Into fire',
      'minecraft:nether/obtain_ancient_debris': 'Hidden in the depths',
      'minecraft:nether/find_bastion': 'Those were the days',
      'minecraft:end/kill_dragon': 'Free the End',
      'minecraft:end/enter_end_gateway': 'Remote getaway',
      'minecraft:end/find_end_city': 'The city at the end of the game',
      'minecraft:end/elytra': 'Sky\'s the limit',
      'minecraft:adventure/root': 'Adventure awaits',
      'minecraft:adventure/kill_a_mob': 'Monster hunter',
      'minecraft:adventure/trade': 'What a deal!',
      'minecraft:adventure/sleep_in_bed': 'Sweet dreams',
      'minecraft:husbandry/root': 'The beginning of your farming journey',
      'minecraft:husbandry/plant_seed': 'Plant a seed and watch it grow',
      'minecraft:husbandry/breed_an_animal': 'The pairing season',
    };
    
    return descriptions[id] || 'Complete this achievement to unlock its description';
  };

  // Get icon for achievements
  const getAchievementIcon = (id) => {
    // Map achievement IDs to appropriate icons
    const iconMap = {
      // Story achievements
      'minecraft:story/root': '/minecraft-assets/grass_block.svg',
      'minecraft:story/mine_stone': '/minecraft-assets/pickaxe.svg',
      'minecraft:story/upgrade_tools': '/minecraft-assets/pickaxe.svg',
      'minecraft:story/smelt_iron': '/minecraft-assets/iron-ingot.svg',
      'minecraft:story/obtain_armor': '/minecraft-assets/iron-ingot.svg',
      'minecraft:story/enter_the_nether': '/minecraft-assets/gold-ingot.svg',
      'minecraft:story/enter_the_end': '/minecraft-assets/xp-orb.svg',
      
      // Nether achievements
      'minecraft:nether/root': '/minecraft-assets/gold-ingot.svg',
      'minecraft:nether/find_fortress': '/minecraft-assets/sword.svg',
      
      // End achievements
      'minecraft:end/kill_dragon': '/minecraft-assets/xp-orb.svg',
      'minecraft:end/elytra': '/minecraft-assets/xp-orb.svg',
      
      // Adventure achievements
      'minecraft:adventure/root': '/minecraft-assets/sword.svg',
      'minecraft:adventure/kill_a_mob': '/minecraft-assets/sword.svg',
      'minecraft:adventure/trade': '/minecraft-assets/emerald.svg',
      
      // Husbandry achievements
      'minecraft:husbandry/root': '/minecraft-assets/grass_block.svg',
    };
    
    return iconMap[id] || '/minecraft-assets/chest.svg';
  };

  // Determine achievement rarity
  const getAchievementRarity = (id) => {
    // End and late game achievements are rare
    if (id.includes('end/') || id.includes('elytra') || id.includes('kill_dragon')) {
      return 'legendary';
    }
    
    // Nether achievements are epic
    if (id.includes('nether/')) {
      return 'epic';
    }
    
    // Adventure achievements are rare
    if (id.includes('adventure/') && !id.includes('root')) {
      return 'rare';
    }
    
    // Story achievements beyond the basics are uncommon
    if (id.includes('story/') && !id.includes('root') && !id.includes('mine_stone')) {
      return 'uncommon';
    }
    
    // Default to common
    return 'common';
  };

  // Parse custom achievements from player data
  const parseCustomAchievements = (data) => {
    const customAchievements = [];
    
    // If server stats exist, add custom achievements based on player stats
    if (data.server_stats) {
      // Voting achievements
      if (data.server_stats.total_votes >= 50) {
        customAchievements.push({
          id: 'custom:voting/supporter',
          name: 'Server Supporter',
          description: 'Vote for the server 50 times or more',
          category: 'server',
          icon: '/minecraft-assets/emerald.svg',
          rarity: 'rare',
          obtained: true,
          obtainedDate: new Date().toISOString(),
          progress: 100
        });
      } else if (data.server_stats.total_votes > 0) {
        const progress = Math.min(100, Math.round((data.server_stats.total_votes / 50) * 100));
        customAchievements.push({
          id: 'custom:voting/supporter',
          name: 'Server Supporter',
          description: 'Vote for the server 50 times',
          category: 'server',
          icon: '/minecraft-assets/emerald.svg',
          rarity: 'rare',
          obtained: false,
          progress
        });
      }
      
      // Quest achievements
      if (data.server_stats.quests_completed >= 30) {
        customAchievements.push({
          id: 'custom:quests/master',
          name: 'Quest Master',
          description: 'Complete 30 or more server quests',
          category: 'quests',
          icon: '/minecraft-assets/chest.svg',
          rarity: 'epic',
          obtained: true,
          obtainedDate: new Date().toISOString(),
          progress: 100
        });
      } else if (data.server_stats.quests_completed > 0) {
        const progress = Math.min(100, Math.round((data.server_stats.quests_completed / 30) * 100));
        customAchievements.push({
          id: 'custom:quests/master',
          name: 'Quest Master',
          description: 'Complete 30 server quests',
          category: 'quests',
          icon: '/minecraft-assets/chest.svg',
          rarity: 'epic',
          obtained: false,
          progress
        });
      }
      
      // Pet achievements
      if (data.server_stats.pet_collection && data.server_stats.pet_collection.length >= 3) {
        customAchievements.push({
          id: 'custom:pets/collector',
          name: 'Pet Collector',
          description: 'Collect 3 or more different pets',
          category: 'pets',
          icon: '/minecraft-assets/xp-orb.svg',
          rarity: 'uncommon',
          obtained: true,
          obtainedDate: new Date().toISOString(),
          progress: 100
        });
      }
      
      // Minigame achievements
      if (data.server_stats.minigame_stats) {
        const totalWins = Object.values(data.server_stats.minigame_stats)
          .reduce((sum, game) => sum + (game.wins || 0), 0);
        
        if (totalWins >= 20) {
          customAchievements.push({
            id: 'custom:minigames/champion',
            name: 'Minigame Champion',
            description: 'Win 20 or more minigames',
            category: 'minigames',
            icon: '/minecraft-assets/gold-ingot.svg',
            rarity: 'rare',
            obtained: true,
            obtainedDate: new Date().toISOString(),
            progress: 100
          });
        } else if (totalWins > 0) {
          const progress = Math.min(100, Math.round((totalWins / 20) * 100));
          customAchievements.push({
            id: 'custom:minigames/champion',
            name: 'Minigame Champion',
            description: 'Win 20 minigames',
            category: 'minigames',
            icon: '/minecraft-assets/gold-ingot.svg',
            rarity: 'rare',
            obtained: false,
            progress
          });
        }
      }
    }
    
    // Add economy-based achievements
    if (data.economy_data && data.economy_data.balance) {
      if (data.economy_data.balance >= 1000000) {
        customAchievements.push({
          id: 'custom:economy/millionaire',
          name: 'Millionaire',
          description: 'Accumulate 1,000,000 or more in-game currency',
          category: 'economy',
          icon: '/minecraft-assets/gold-ingot.svg',
          rarity: 'legendary',
          obtained: true,
          obtainedDate: new Date().toISOString(),
          progress: 100
        });
      } else if (data.economy_data.balance > 0) {
        const progress = Math.min(100, Math.round((data.economy_data.balance / 1000000) * 100));
        customAchievements.push({
          id: 'custom:economy/millionaire',
          name: 'Millionaire',
          description: 'Accumulate 1,000,000 in-game currency',
          category: 'economy',
          icon: '/minecraft-assets/gold-ingot.svg',
          rarity: 'legendary',
          obtained: false,
          progress
        });
      }
    }
    
    // Add playtime achievements
    if (data.playtime_minutes || data.time_played) {
      const minutesPlayed = data.playtime_minutes || data.time_played || 0;
      
      if (minutesPlayed >= 6000) { // 100 hours
        customAchievements.push({
          id: 'custom:time/addict',
          name: 'Game Addict',
          description: 'Play for 100 hours or more',
          category: 'playtime',
          icon: '/minecraft-assets/xp-orb.svg',
          rarity: 'epic',
          obtained: true,
          obtainedDate: new Date().toISOString(),
          progress: 100
        });
      } else if (minutesPlayed > 0) {
        const progress = Math.min(100, Math.round((minutesPlayed / 6000) * 100));
        customAchievements.push({
          id: 'custom:time/addict',
          name: 'Game Addict',
          description: 'Play for 100 hours',
          category: 'playtime',
          icon: '/minecraft-assets/xp-orb.svg',
          rarity: 'epic',
          obtained: false,
          progress
        });
      }
    }
    
    return customAchievements;
  };

  // Get badge background color based on rarity
  const getBadgeColor = (rarity) => {
    switch(rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-500';
      case 'epic':
        return 'bg-gradient-to-br from-indigo-400 via-purple-400 to-purple-600';
      case 'rare':
        return 'bg-gradient-to-br from-blue-300 to-blue-500';
      case 'uncommon':
        return 'bg-gradient-to-br from-green-300 to-green-500';
      default:
        return 'bg-gradient-to-br from-gray-200 to-gray-400';
    }
  };

  // Filter achievements by selected category
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);
  
  // Apply limit if needed
  const displayedAchievements = limit > 0 
    ? filteredAchievements.slice(0, limit) 
    : filteredAchievements;

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className={`${sizeMap.medium} bg-gray-700 rounded-md`}></div>
          <div className={`${sizeMap.medium} bg-gray-700 rounded-md`}></div>
          <div className={`${sizeMap.medium} bg-gray-700 rounded-md`}></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredAchievements.length === 0) {
    return (
      <div className="w-full p-4 bg-gray-800 rounded-md text-center">
        <p className="text-gray-400">No achievements found. Complete in-game achievements to unlock badges!</p>
      </div>
    );
  }

  return (
    <div className="achievement-system w-full">
      {/* Category filters - Don't show for compact display */}
      {display !== 'compact' && categories.length > 2 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedCategory === category 
                  ? 'bg-green-700 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : formatAchievementName(category)}
            </button>
          ))}
        </div>
      )}
      
      {/* Achievement display */}
      <div className={layoutClasses[display] || layoutClasses.grid}>
        {displayedAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowDetails(achievement.id !== showDetails ? achievement.id : null)}
            className={`relative cursor-pointer ${display === 'list' ? 'flex items-center gap-3' : ''}`}
          >
            {/* Achievement icon */}
            <div className={`
              ${sizeMap[size]} rounded-md p-1 flex items-center justify-center
              ${getBadgeColor(achievement.rarity)}
              ${!achievement.obtained ? 'opacity-60 grayscale' : ''}
            `}>
              <img 
                src={achievement.icon}
                alt={achievement.name}
                className={`${achievement.obtained ? '' : 'opacity-70'}`}
              />
              
              {/* Progress indicator for incomplete achievements */}
              {!achievement.obtained && achievement.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-60">
                  <div 
                    className="h-full bg-green-400"
                    style={{ width: `${achievement.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            {/* Show name for list display */}
            {display === 'list' && (
              <div className="flex-1">
                <p className="font-semibold text-white">{achievement.name}</p>
                <p className="text-sm text-gray-400">{achievement.description}</p>
              </div>
            )}
            
            {/* Achievement details popup */}
            {showDetails === achievement.id && (
              <div className="absolute z-10 top-full left-0 mt-2 w-64 bg-gray-800 rounded-md p-3 shadow-lg border border-gray-700">
                <h3 className="font-bold text-white">{achievement.name}</h3>
                <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Rarity: {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}</span>
                  {achievement.obtained ? (
                    <span>Achieved ✓</span>
                  ) : (
                    <span>Progress: {achievement.progress}%</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Show more/less button for large collections */}
      {achievements.length > 16 && limit > 0 && display !== 'compact' && (
        <div className="mt-4 text-center">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => setLimit(limit === 16 ? 0 : 16)}
          >
            {limit === 16 ? 'Show All Achievements' : 'Show Less'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;