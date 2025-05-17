/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Leaderboard.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MinecraftService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChartBarIcon, ArrowTopRightOnSquareIcon, TrophyIcon, ArrowPathIcon, UserCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [activeCategory, setActiveCategory] = useState('playtime');
  const [topPlayers, setTopPlayers] = useState({
    playtime: [],
    economy: [],
    mcmmo: [],
    kills: [],
    mining: [],
    achievements: []
  });
  const [timeFrame, setTimeFrame] = useState('all');
  const [error, setError] = useState(null);

  // Simple debounce utility function 
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Function to fetch leaderboard data
  useEffect(() => {
    // Use debounce to prevent too many concurrent requests
    const debouncedFetch = debounce(async () => {
      try {
        setLoadingPlayers(true);
        setError(null);
        
        // Add retry and debounce logic with improved exponential backoff
        const retryLeaderboardFetch = async (retries = 2, delay = 2000) => {
          try {
            return await MinecraftService.getLeaderboard(activeCategory, timeFrame, 50);
          } catch (err) {
            if (retries <= 0) {
              console.error("Leaderboard fetch failed after all retries", err);
              setError("Failed to load leaderboard data. Please try again later.");
              throw err;
            }
            
            console.log(`Leaderboard fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryLeaderboardFetch(retries - 1, delay * 2);
          }
        };
        
        // Fetch real data from the API based on active category and time frame with retry
        const response = await retryLeaderboardFetch();
        
        if (response.data && response.data.players) {
          // Set all players
          setPlayers(response.data.players);
          
          // Sort and group players by categories for different leaderboards
          // First, create copies for each category since we have all the data
          const allPlayers = [...response.data.players];
          
          // We don't need to re-sort by the active category since the API already did that
          // But we'll need to sort for other categories
          const topPlayersData = {};
          
          // Create sorted list for the active category
          topPlayersData[activeCategory] = allPlayers.slice(0, 10);
          
          // Create sorted lists for all other categories
          const categories = ['playtime', 'economy', 'mcmmo', 'kills', 'mining', 'achievements'];
          
          // Just use client-side sorting instead of making multiple API calls
          // This will prevent rate limiting issues
          if (allPlayers.length > 0) {
            for (const category of categories) {
              if (category !== activeCategory) {
                // Use local sorting based on the data we already have
                switch (category) {
                  case 'playtime':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => b.playtime_minutes - a.playtime_minutes).slice(0, 10);
                    break;
                  case 'economy':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 10);
                    break;
                  case 'mcmmo':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => (b.mcmmo_power_level || 0) - (a.mcmmo_power_level || 0)).slice(0, 10);
                    break;
                  case 'kills':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => (b.mobs_killed || 0) - (a.mobs_killed || 0)).slice(0, 10);
                    break;
                  case 'mining':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => (b.blocks_mined || 0) - (a.blocks_mined || 0)).slice(0, 10);
                    break;
                  case 'achievements':
                    topPlayersData[category] = [...allPlayers].sort((a, b) => (b.achievements || 0) - (a.achievements || 0)).slice(0, 10);
                    break;
                }
              }
            }
          } else {
            // Fallback to empty arrays for each category if no players
            categories.forEach(category => {
              if (category !== activeCategory) {
                topPlayersData[category] = [];
              }
            });
          }
          
          setTopPlayers(topPlayersData);
        } else {
          // If no players in response, show an empty state
          console.warn('No players returned from API');
          setPlayers([]);
          
          // Set empty arrays for categories
          setTopPlayers({
            playtime: [],
            economy: [],
            mcmmo: [],
            kills: [],
            mining: [],
            achievements: []
          });
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        
        // Check if this is a rate limit error
        if (error.response && error.response.status === 429) {
          setError('Rate limit exceeded. Please wait a moment before trying again.');
        } else {
          setError(`Failed to load leaderboard data. ${error.message || 'Please try again later.'}`);
        }
        
        // Use cached data if available
        try {
          // Try to use previously loaded data if any
          if (topPlayers[activeCategory] && topPlayers[activeCategory].length > 0) {
            console.log('Using cached leaderboard data');
            setPlayers(topPlayers[activeCategory]);
          } else {
            // Show empty state if API fails and no cache
            console.warn('API failed, showing empty state');
            setPlayers([]);
            
            // Set empty arrays for each category
            setTopPlayers({
              playtime: [],
              economy: [],
              mcmmo: [],
              kills: [],
              mining: [],
              achievements: []
            });
          }
        } catch (cacheError) {
          console.error('Error using cached data:', cacheError);
          // Reset all data
          setPlayers([]);
          setTopPlayers({
            playtime: [],
            economy: [],
            mcmmo: [],
            kills: [],
            mining: [],
            achievements: []
          });
        }
      } finally {
        setLoadingPlayers(false);
      }
    }, 500); // Increase debounce time from 300ms to 500ms to reduce API calls
    
    // Execute the debounced function
    debouncedFetch();
    
    // Cleanup function to cancel pending requests
    return () => clearTimeout(debouncedFetch);
  }, [activeCategory, timeFrame]);
  
  // Generate mock player data for demonstration
  const generateMockPlayers = (count) => {
    const players = [];
    const names = ['MinerSteve', 'DiamondDigger', 'RedstoneWizard', 'CreeperSlayer', 'PixelBuilder', 
                  'EnderDragon', 'IronGolem', 'ZombieHunter', 'WitchCrafter', 'NetherExplorer',
                  'BlazeMaster', 'GhastBuster', 'WitherKiller', 'VillagerTrader', 'PillagerRaider',
                  'FarmingPro', 'BuildingMaster', 'CommandGuru', 'RedstoneEngineer', 'PvPChampion'];
    
    for (let i = 0; i < count; i++) {
      const name = i < names.length ? names[i] : `Player${i + 1}`;
      const player = {
        username: name,
        uuid: `player-${i}-uuid`,
        playtime_minutes: Math.floor(Math.random() * 50000) + 1000,
        balance: Math.floor(Math.random() * 100000) + 1000,
        kills: Math.floor(Math.random() * 5000) + 10,
        deaths: Math.floor(Math.random() * 1000) + 5,
        blocks_mined: Math.floor(Math.random() * 1000000) + 10000,
        mcmmo_power_level: Math.floor(Math.random() * 2000) + 100,
        achievements: Math.floor(Math.random() * 30) + 1,
        last_login: new Date(Date.now() - Math.random() * 10000000000),
        rank: getRandom(['Member', 'VIP', 'VIP+', 'MVP', 'MVP+', 'Admin']),
        // mcMMO skills
        skills: {
          mining: Math.floor(Math.random() * 1000) + 1,
          woodcutting: Math.floor(Math.random() * 1000) + 1,
          herbalism: Math.floor(Math.random() * 1000) + 1,
          fishing: Math.floor(Math.random() * 1000) + 1,
          excavation: Math.floor(Math.random() * 1000) + 1,
          repair: Math.floor(Math.random() * 1000) + 1,
          alchemy: Math.floor(Math.random() * 1000) + 1,
          archery: Math.floor(Math.random() * 1000) + 1,
          swords: Math.floor(Math.random() * 1000) + 1,
          axes: Math.floor(Math.random() * 1000) + 1,
          acrobatics: Math.floor(Math.random() * 1000) + 1,
          unarmed: Math.floor(Math.random() * 1000) + 1,
        },
        // For kills category, include PvP and PvE kills
        player_kills: Math.floor(Math.random() * 1000),
        mob_kills: Math.floor(Math.random() * 4000) + 10,
        // For money earned today
        money_earned_today: Math.floor(Math.random() * 1000) + 10,
        money_spent_today: Math.floor(Math.random() * 500) + 5,
      };
      
      // Calculate total kills
      player.kills = player.player_kills + player.mob_kills;
      
      players.push(player);
    }
    
    return players;
  };
  
  // Helper function to get random item from array
  const getRandom = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  };
  
  // Format playtime to display in a readable format
  const formatPlaytime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  if (loadingPlayers) {
    return (
      <div className="min-h-screen py-12 minecraft-grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-8">
            Leaderboards
          </h1>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 minecraft-grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">
              Server Leaderboards
            </h1>
            
            {/* Time frame selector and refresh button */}
            <div className="flex items-center space-x-4">
              <button 
                className="bg-white/10 rounded-lg px-3 py-1 text-white flex items-center hover:bg-white/20 transition-colors"
                onClick={() => {
                  setLoadingPlayers(true);
                  // Force reload with current settings
                  setTimeout(() => {
                    window.location.reload();
                  }, 300);
                }}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>
          
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-white mb-4">{error}</p>
            <p className="text-gray-300 mb-6">
              The leaderboard appears to be empty. This could be because there are no linked players yet, 
              or because the server needs to be restarted to register the leaderboard API endpoint.
            </p>
            <button 
              className="px-4 py-2 bg-minecraft-habbo-blue rounded-lg text-white hover:bg-minecraft-habbo-blue/80 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 minecraft-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">
            Server Leaderboards
          </h1>
          
          {/* Time frame selector and refresh button */}
          <div className="flex items-center space-x-4">
            <button 
              className="bg-white/10 rounded-lg px-3 py-1 text-white flex items-center hover:bg-white/20 transition-colors"
              onClick={() => {
                setLoadingPlayers(true);
                // Force reload with current settings
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              }}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              <span>Refresh</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Time frame:</span>
              <select 
                className="bg-white/10 rounded-lg px-3 py-1 text-white"
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
                <option value="day">Today</option>
              </select>
            </div>
          </div>
        </motion.div>
        
        {/* Category tabs */}
        <motion.div
          className="flex flex-wrap border-b border-white/10 mb-8 overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            onClick={() => setActiveCategory('playtime')}
            className={`dashboard-tab ${activeCategory === 'playtime' ? 'active' : ''}`}
          >
            <span>Playtime</span>
          </button>
          <button
            onClick={() => setActiveCategory('economy')}
            className={`dashboard-tab ${activeCategory === 'economy' ? 'active' : ''}`}
          >
            <span>Economy</span>
          </button>
          <button
            onClick={() => setActiveCategory('mcmmo')}
            className={`dashboard-tab ${activeCategory === 'mcmmo' ? 'active' : ''}`}
          >
            <span>McMMO</span>
          </button>
          <button
            onClick={() => setActiveCategory('kills')}
            className={`dashboard-tab ${activeCategory === 'kills' ? 'active' : ''}`}
          >
            <span>Kills</span>
          </button>
          <button
            onClick={() => setActiveCategory('mining')}
            className={`dashboard-tab ${activeCategory === 'mining' ? 'active' : ''}`}
          >
            <span>Mining</span>
          </button>
          <button
            onClick={() => setActiveCategory('achievements')}
            className={`dashboard-tab ${activeCategory === 'achievements' ? 'active' : ''}`}
          >
            <span>Achievements</span>
          </button>
        </motion.div>
        
        {/* Top 3 Players (Featured with larger display) */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-minecraft text-minecraft-habbo-blue mb-6 flex items-center">
            <TrophyIcon className="h-6 w-6 mr-2" />
            <span>Top Players - {getCategoryName(activeCategory)}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPlayers[activeCategory].slice(0, 3).map((player, index) => (
              <PlayerPodiumCard 
                key={player.uuid}
                player={player}
                rank={index + 1}
                category={activeCategory}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Full Leaderboard Table */}
        <motion.div
          className="habbo-card p-6 rounded-habbo overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-minecraft mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            <span>{getCategoryName(activeCategory)} Leaderboard</span>
          </h2>
          
          <div className="overflow-x-auto">
            {topPlayers[activeCategory].length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">Player</th>
                    {activeCategory === 'playtime' && (
                      <th className="text-left py-3 px-4">Playtime</th>
                    )}
                    {activeCategory === 'economy' && (
                      <>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Earned Today</th>
                      </>
                    )}
                    {activeCategory === 'mcmmo' && (
                      <>
                        <th className="text-left py-3 px-4">Power Level</th>
                        <th className="text-left py-3 px-4">Top Skill</th>
                      </>
                    )}
                    {activeCategory === 'kills' && (
                      <>
                        <th className="text-left py-3 px-4">Total Kills</th>
                        <th className="text-left py-3 px-4">Player Kills</th>
                        <th className="text-left py-3 px-4">Mob Kills</th>
                      </>
                    )}
                    {activeCategory === 'mining' && (
                      <th className="text-left py-3 px-4">Blocks Mined</th>
                    )}
                    {activeCategory === 'achievements' && (
                      <th className="text-left py-3 px-4">Achievements</th>
                    )}
                    <th className="text-left py-3 px-4">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers[activeCategory].map((player, index) => (
                    <tr key={player.uuid} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-bold">#{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Link 
                            to={`/profile/${player.username}`}
                            title={`View ${player.username}'s profile`}
                            className="h-8 w-8 mr-2 relative transition-transform hover:scale-110"
                          >
                            <img 
                              src={`https://mc-heads.net/avatar/${player.username}/32`}
                              alt={player.username}
                              className="rounded-sm"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/32?text=MC';
                              }}
                            />
                            {/* Rank badge */}
                            {getPlayerRankBadge(player.rank)}
                          </Link>
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center gap-2">
                              {player.username}
                            </div>
                            <div className="text-xs text-gray-400">{player.rank}</div>
                          </div>
                        </div>
                      </td>
                      {activeCategory === 'playtime' && (
                        <td className="py-3 px-4">{formatPlaytime(player.playtime_minutes)}</td>
                      )}
                      {activeCategory === 'economy' && (
                        <>
                          <td className="py-3 px-4 text-minecraft-habbo-yellow">${player.balance.toLocaleString()}</td>
                          <td className="py-3 px-4 text-green-400">+${player.money_earned_today ? player.money_earned_today.toLocaleString() : '0'}</td>
                        </>
                      )}
                      {activeCategory === 'mcmmo' && (
                        <>
                          <td className="py-3 px-4">{player.mcmmo_power_level.toLocaleString()}</td>
                          <td className="py-3 px-4">{getTopMcMMOSkill(player)}</td>
                        </>
                      )}
                      {activeCategory === 'kills' && (
                        <>
                          <td className="py-3 px-4">{player.kills.toLocaleString()}</td>
                          <td className="py-3 px-4 text-red-400">{player.player_kills ? player.player_kills.toLocaleString() : '0'}</td>
                          <td className="py-3 px-4 text-gray-400">{player.mob_kills ? player.mob_kills.toLocaleString() : '0'}</td>
                        </>
                      )}
                      {activeCategory === 'mining' && (
                        <td className="py-3 px-4">{player.blocks_mined.toLocaleString()}</td>
                      )}
                      {activeCategory === 'achievements' && (
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="mr-2">{player.achievements}/30</span>
                            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-minecraft-habbo-blue"
                                style={{ width: `${(player.achievements / 30) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-gray-400">
                        {formatLastSeen(player.last_login)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 bg-white/5 rounded-md">
                <p className="text-gray-400">No players found for this category.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Players will appear here once they link their Minecraft accounts to the website.
                </p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Additional Statistics */}
        {activeCategory === 'mcmmo' && (
          <McMMOTopSkills players={players} />
        )}
        
        {activeCategory === 'economy' && (
          <EconomyStats players={players} />
        )}
      </div>
    </div>
  );
};

// Helper function to get category name for display
const getCategoryName = (category) => {
  switch (category) {
    case 'playtime':
      return 'Playtime';
    case 'economy':
      return 'Economy';
    case 'mcmmo':
      return 'McMMO';
    case 'kills':
      return 'Kills';
    case 'mining':
      return 'Mining';
    case 'achievements':
      return 'Achievements';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
};

// Helper function to get player rank badge
const getPlayerRankBadge = (rank) => {
  let badgeColor = 'bg-gray-400';
  
  if (rank === 'Admin') {
    badgeColor = 'bg-red-500';
  } else if (rank === 'MVP+') {
    badgeColor = 'bg-blue-400';
  } else if (rank === 'MVP') {
    badgeColor = 'bg-blue-500';
  } else if (rank === 'VIP+') {
    badgeColor = 'bg-green-400';
  } else if (rank === 'VIP') {
    badgeColor = 'bg-green-500';
  }
  
  return (
    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${badgeColor} border border-black`}></div>
  );
};

// Helper function to get top McMMO skill
const getTopMcMMOSkill = (player) => {
  if (!player.skills) return 'None';
  
  const skills = player.skills;
  let topSkill = 'None';
  let topLevel = 0;
  
  Object.entries(skills).forEach(([skill, level]) => {
    if (level > topLevel) {
      topLevel = level;
      topSkill = skill;
    }
  });
  
  return (
    <div>
      <span className="capitalize">{topSkill}</span>
      <span className="text-xs text-gray-400 ml-1">Lv. {topLevel}</span>
    </div>
  );
};

// Helper function to format last seen
const formatLastSeen = (date) => {
  const now = new Date();
  const lastSeen = new Date(date);
  const diff = now - lastSeen;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

// Player Podium Card Component
const PlayerPodiumCard = ({ player, rank, category }) => {
  let statValue = '';
  let statLabel = '';
  let statColor = 'text-white';
  
  // Determine what to display based on category
  switch (category) {
    case 'playtime':
      const hours = Math.floor(player.playtime_minutes / 60);
      const mins = player.playtime_minutes % 60;
      statValue = `${hours}h ${mins}m`;
      statLabel = 'Playtime';
      break;
    case 'economy':
      statValue = `$${player.balance.toLocaleString()}`;
      statLabel = 'Balance';
      statColor = 'text-minecraft-habbo-yellow';
      break;
    case 'mcmmo':
      statValue = player.mcmmo_power_level.toLocaleString();
      statLabel = 'Power Level';
      statColor = 'text-purple-400';
      break;
    case 'kills':
      statValue = player.kills.toLocaleString();
      statLabel = 'Kills';
      statColor = 'text-red-400';
      break;
    case 'mining':
      statValue = player.blocks_mined.toLocaleString();
      statLabel = 'Blocks Mined';
      statColor = 'text-blue-400';
      break;
    case 'achievements':
      statValue = `${player.achievements}/30`;
      statLabel = 'Achievements';
      statColor = 'text-green-400';
      break;
    default:
      statValue = '—';
      statLabel = 'Stat';
  }
  
  // Trophy colors
  let trophyColor = 'text-zinc-400'; // Bronze
  if (rank === 1) trophyColor = 'text-yellow-300'; // Gold
  else if (rank === 2) trophyColor = 'text-gray-300'; // Silver
  
  // Determine podium position classes
  let podiumClasses = 'h-full';
  if (rank === 1) {
    podiumClasses = 'scale-110 shadow-xl z-10 h-full';
  } else if (rank === 3) {
    podiumClasses = 'scale-95 h-full';
  }
  
  return (
    <motion.div
      className={`habbo-card p-6 rounded-habbo ${podiumClasses}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`${trophyColor} font-minecraft text-3xl`}>#{rank}</div>
        <div className="bg-white/10 px-2 py-1 rounded text-xs">{player.rank}</div>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="mr-4 relative">
          <img
            src={`https://mc-heads.net/avatar/${player.username}/64`}
            alt={player.username}
            className="rounded-md shadow-lg border-2 border-white/20"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/64?text=MC';
            }}
          />
          {getPlayerRankBadge(player.rank)}
        </div>
        <div>
          <h3 className="font-minecraft text-lg">{player.username}</h3>
          <p className="text-gray-400 text-sm">Last seen {formatLastSeen(player.last_login)}</p>
        </div>
      </div>
      
      <div className="bg-white/5 p-4 rounded-md">
        <div className="text-center">
          <div className={`text-2xl font-minecraft ${statColor}`}>{statValue}</div>
          <div className="text-gray-400 text-sm">{statLabel}</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <Link 
          to={`/profile/${player.username}`} 
          className="minecraft-btn px-5 py-2 text-sm font-medium inline-flex items-center"
        >
          <UserIcon className="h-4 w-4 mr-1" />
          <span>View Profile</span>
        </Link>
      </div>
    </motion.div>
  );
};

// McMMO Top Skills Component
const McMMOTopSkills = ({ players }) => {
  // Get the top 5 players for each mcMMO skill
  const getTopPlayersForSkill = (skill) => {
    return [...players]
      .filter(player => player.skills && player.skills[skill])
      .sort((a, b) => b.skills[skill] - a.skills[skill])
      .slice(0, 5);
  };
  
  // List of main mcMMO skills
  const mainSkills = ['mining', 'woodcutting', 'herbalism', 'fishing', 'excavation', 'repair'];
  
  return (
    <motion.div
      className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {mainSkills.map(skill => (
        <div key={skill} className="habbo-card p-6 rounded-habbo">
          <h3 className="text-lg font-minecraft mb-4 capitalize">{skill}</h3>
          
          <div className="space-y-3">
            {getTopPlayersForSkill(skill).map((player, index) => (
              <div key={`${skill}-${player.uuid}`} className="flex items-center bg-white/5 p-3 rounded-md">
                <div className="w-6 text-center font-bold mr-2">#{index + 1}</div>
                <div className="h-7 w-7 mr-2">
                  <Link to={`/profile/${player.username}`} title={`View ${player.username}'s profile`}>
                    <img 
                      src={`https://mc-heads.net/avatar/${player.username}/28`}
                      alt={player.username}
                      className="rounded-sm hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/28?text=MC';
                      }}
                    />
                  </Link>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{player.username}</div>
                </div>
                <div className="text-sm font-minecraft">Lv. {player.skills[skill]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// Economy Stats Component
const EconomyStats = ({ players }) => {
  // Calculate economy statistics
  const totalMoney = players.reduce((sum, player) => sum + player.balance, 0);
  const avgMoney = totalMoney / players.length;
  const todayEarned = players.reduce((sum, player) => sum + player.money_earned_today, 0);
  const todaySpent = players.reduce((sum, player) => sum + player.money_spent_today, 0);
  
  return (
    <motion.div
      className="mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-xl font-minecraft text-minecraft-habbo-blue mb-6">Economy Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Money Card */}
        <div className="habbo-card p-6 rounded-habbo">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Total Money in Circulation</div>
            <div className="text-2xl font-minecraft text-minecraft-habbo-yellow">${totalMoney.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Average Balance Card */}
        <div className="habbo-card p-6 rounded-habbo">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Average Player Balance</div>
            <div className="text-2xl font-minecraft text-minecraft-habbo-yellow">${Math.floor(avgMoney).toLocaleString()}</div>
          </div>
        </div>
        
        {/* Today's Earnings Card */}
        <div className="habbo-card p-6 rounded-habbo">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Today's Earnings</div>
            <div className="text-2xl font-minecraft text-green-400">+${todayEarned.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Today's Spending Card */}
        <div className="habbo-card p-6 rounded-habbo">
          <div className="text-center">
            <div className="text-gray-400 mb-2">Today's Spending</div>
            <div className="text-2xl font-minecraft text-red-400">-${todaySpent.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {/* Economy Trends */}
      <div className="mt-6 habbo-card p-6 rounded-habbo">
        <h3 className="text-lg font-minecraft mb-4">Economy Trends</h3>
        
        <div className="text-center py-10 text-gray-400">
          <p>Economy trend charts will be available in a future update.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Leaderboard;