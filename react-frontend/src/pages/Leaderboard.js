/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Leaderboard.js
 * @description Player leaderboards for various Minecraft statistics
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
import { ChartBarIcon, ArrowPathIcon, TrophyIcon, UserIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { getPlayerAvatar } from '../utils/minecraft-api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Helper function to format numbers with commas
const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Sample leaderboard data as fallback
const SAMPLE_LEADERBOARD_DATA = [
  {
    id: 'sample-1',
    username: 'DiamondMiner42',
    mcUsername: 'DiamondMiner42',
    uuid: 'sample-uuid-1',
    rank: 'VIP+',
    playtime_minutes: 9879,
    playtime: '164h 39m',
    balance: 985000,
    blocks_mined: 95700,
    mobs_killed: 4850,
    mcmmo_power_level: 2345,
    achievements: 28,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'sample-2',
    username: 'EmberCraft',
    mcUsername: 'EmberCraft',
    uuid: 'sample-uuid-2',
    rank: 'MVP',
    playtime_minutes: 8950,
    playtime: '149h 10m',
    balance: 875000,
    blocks_mined: 87200,
    mobs_killed: 4200,
    mcmmo_power_level: 2100,
    achievements: 24,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'sample-3',
    username: 'PixelWarrior',
    mcUsername: 'PixelWarrior',
    uuid: 'sample-uuid-3',
    rank: 'Member',
    playtime_minutes: 7840,
    playtime: '130h 40m',
    balance: 750000,
    blocks_mined: 75600,
    mobs_killed: 3680,
    mcmmo_power_level: 1850,
    achievements: 20,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'sample-4',
    username: 'CosmicBuilder',
    mcUsername: 'CosmicBuilder',
    uuid: 'sample-uuid-4',
    rank: 'MVP+',
    playtime_minutes: 7120,
    playtime: '118h 40m',
    balance: 650000,
    blocks_mined: 67900,
    mobs_killed: 3350,
    mcmmo_power_level: 1650,
    achievements: 19,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'sample-5',
    username: 'RubyRaider',
    mcUsername: 'RubyRaider',
    uuid: 'sample-uuid-5',
    rank: 'VIP',
    playtime_minutes: 6580,
    playtime: '109h 40m',
    balance: 580000,
    blocks_mined: 61250,
    mobs_killed: 3100,
    mcmmo_power_level: 1540,
    achievements: 17,
    lastSeen: new Date().toISOString()
  }
];

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
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
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
    const fetchLeaderboardData = async () => {
      setLoadingPlayers(true);
      try {
        console.log('Fetching leaderboard data for', activeCategory, 'timeFrame:', timeFrame);
        const response = await MinecraftService.getLeaderboard(activeCategory, timeFrame, 50);
        console.log('API: Leaderboard response received:', response);
        
        // Check for successful response
        if (response.data && response.data.success && response.data.data) {
          const playersData = response.data.data.players || [];
          console.log(`Received ${playersData.length} players`);
          setLeaderboardData(playersData);
          setPlayers(playersData);
          
          // Update top players by category
          if (playersData.length > 0) {
            // Create a copy of the current top players
            const updatedTopPlayers = { ...topPlayers };
            // Update the current category
            updatedTopPlayers[activeCategory] = playersData.slice(0, 10);
            setTopPlayers(updatedTopPlayers);
          }
          setError(null);
        } else {
          console.error('Invalid leaderboard data structure:', response);
          // If we have sample data, use it as fallback
          if (SAMPLE_LEADERBOARD_DATA && SAMPLE_LEADERBOARD_DATA.length > 0) {
            console.log('Using sample data as fallback');
            setLeaderboardData(SAMPLE_LEADERBOARD_DATA);
            setPlayers(SAMPLE_LEADERBOARD_DATA);
            
            // Update sample top players
            const updatedTopPlayers = { ...topPlayers };
            updatedTopPlayers[activeCategory] = SAMPLE_LEADERBOARD_DATA.slice(0, 10);
            setTopPlayers(updatedTopPlayers);
          }
          setError('Could not load leaderboard data from server. Using sample data instead.');
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        // Use sample data if API fails
        if (SAMPLE_LEADERBOARD_DATA && SAMPLE_LEADERBOARD_DATA.length > 0) {
          console.log('Using sample data due to error');
          setLeaderboardData(SAMPLE_LEADERBOARD_DATA);
          setPlayers(SAMPLE_LEADERBOARD_DATA);
          
          // Update sample top players
          const updatedTopPlayers = { ...topPlayers };
          updatedTopPlayers[activeCategory] = SAMPLE_LEADERBOARD_DATA.slice(0, 10);
          setTopPlayers(updatedTopPlayers);
        }
        setError('Error connecting to leaderboard server. Using sample data instead.');
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchLeaderboardData();
  }, [activeCategory, timeFrame]);
  
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
      <div className="min-h-screen pt-16 ...">
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

  if (error && players.length === 0) {
    return (
      <div className="min-h-screen pt-16 ...">
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

  // Modal component
  const LoginRequiredModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-minecraft-navy-dark p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-white">Login Required</h2>
        <p className="text-gray-300 mb-6">You have to be logged in for the full experience.</p>
        <button
          className="bg-minecraft-green text-white px-4 py-2 rounded hover:bg-minecraft-green/80 transition-colors mb-2 w-full"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
        <button
          className="text-gray-400 hover:text-white text-sm mt-2"
          onClick={() => setShowLoginModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 ...">
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
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-white">{error}</p>
          </div>
        )}
        
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
                key={player.uuid || index}
                player={player}
                rank={index + 1}
                category={activeCategory}
                isAuthenticated={isAuthenticated}
                onProfileClick={(username) => {
                  if (isAuthenticated) {
                    navigate(`/profile/${username}`);
                  } else {
                    setShowLoginModal(true);
                  }
                }}
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
            {leaderboardData.length > 0 ? (
              <>
                <div className="text-xs text-gray-400 italic mb-2 flex items-center" style={{ display: activeCategory === 'economy' ? 'flex' : 'none' }}>
                  <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                  Daily earnings reset at midnight UK time (London).
                </div>
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
                    {leaderboardData.map((player, index) => (
                      <motion.tr 
                        key={player.uuid || index}
                        className={`border-b ${index % 2 === 0 ? 'bg-gray-900/60' : 'bg-gray-800/60'} hover:bg-gray-700/80 transition-colors duration-150`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="relative h-10 w-10 mr-3">
                              <button
                                type="button"
                                className={isAuthenticated ? "focus:outline-none" : "focus:outline-none cursor-pointer"}
                                onClick={() => {
                                  if (isAuthenticated) {
                                    navigate(`/profile/${player.username || player.mcUsername}`);
                                  } else {
                                    setShowLoginModal(true);
                                  }
                                }}
                                title={isAuthenticated ? `View ${player.username || player.mcUsername}'s profile` : "Login required to view profile"}
                              >
                                <img 
                                  src={`https://visage.surgeplay.com/face/128/${player.mcUsername || player.username}`}
                                  alt={player.username || player.mcUsername || 'Unknown'} 
                                  className={isAuthenticated ? "h-10 w-10 rounded-md object-cover" : "h-10 w-10 rounded-md object-cover opacity-70"}
                                  onError={(e) => {
                                    e.target.onerror = (e2) => {
                                      e2.target.onerror = (e3) => {
                                        e3.target.onerror = null;
                                        e3.target.src = 'https://via.placeholder.com/128?text=MC';
                                      };
                                      e2.target.src = `https://minotar.net/avatar/${player.mcUsername || player.username}/128.png`;
                                    };
                                    e.target.src = `https://mc-heads.net/avatar/${player.mcUsername || player.username}/128`;
                                  }}
                                />
                              </button>
                            </div>
                            <div>
                              <button
                                type="button"
                                className={isAuthenticated ? "font-semibold text-white hover:underline focus:outline-none" : "font-semibold text-white hover:underline focus:outline-none opacity-70 cursor-pointer"}
                                onClick={() => {
                                  if (isAuthenticated) {
                                    navigate(`/profile/${player.username || player.mcUsername}`);
                                  } else {
                                    setShowLoginModal(true);
                                  }
                                }}
                                title={isAuthenticated ? `View ${player.username || player.mcUsername}'s profile` : "Login required to view profile"}
                              >
                                {player.username || player.mcUsername || 'Unknown'}
                              </button>
                              <div className="text-xs text-gray-400">{player.mcUsername !== player.username ? player.mcUsername : ''}</div>
                            </div>
                          </div>
                        </td>
                        {activeCategory === 'playtime' && (
                          <td className="px-4 py-3 text-gray-300">{player.playtime || formatPlaytime(player.playtime_minutes || 0)}</td>
                        )}
                        {activeCategory === 'economy' && (
                          <>
                            <td className="px-4 py-3 text-gray-300">${numberWithCommas(player.balance || 0)}</td>
                            <td className="px-4 py-3 text-green-400">+${numberWithCommas(player.money_earned_today || 0)}</td>
                          </>
                        )}
                        {activeCategory === 'mcmmo' && (
                          <>
                            <td className="px-4 py-3 text-gray-300">{numberWithCommas(player.mcmmo_power_level || 0)} PL</td>
                            <td className="px-4 py-3 text-gray-300">{getTopMcMMOSkill(player)}</td>
                          </>
                        )}
                        {activeCategory === 'kills' && (
                          <>
                            <td className="px-4 py-3 text-gray-300">{numberWithCommas(player.mobs_killed || 0)}</td>
                            <td className="px-4 py-3 text-red-400">{numberWithCommas(player.player_kills || 0)}</td>
                            <td className="px-4 py-3 text-gray-400">{numberWithCommas(player.mobs_killed || 0)}</td>
                          </>
                        )}
                        {activeCategory === 'mining' && (
                          <td className="px-4 py-3 text-gray-300">{numberWithCommas(player.blocks_mined || 0)}</td>
                        )}
                        {activeCategory === 'achievements' && (
                          <td className="px-4 py-3 text-gray-300">{numberWithCommas(player.achievements || 0)}</td>
                        )}
                        <td className="px-4 py-3 text-gray-400">
                          {formatLastSeen(player.lastSeen)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </>
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
          <McMMOTopSkills players={players} isAuthenticated={isAuthenticated} onProfileClick={(username) => {
            if (isAuthenticated) {
              navigate(`/profile/${username}`);
            } else {
              setShowLoginModal(true);
            }
          }} />
        )}
        
        {activeCategory === 'economy' && (
          <EconomyStats players={players} />
        )}
      </div>
      {showLoginModal && <LoginRequiredModal />}
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
  if (!date) return 'Unknown';
  
  try {
    if (date === 'Online now') return date;
    
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
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Unknown';
  }
};

// Player Podium Card Component
const PlayerPodiumCard = ({ player, rank, category, isAuthenticated, onProfileClick }) => {
  let statValue = '';
  let statLabel = '';
  let statColor = 'text-white';
  
  // Determine what to display based on category
  switch (category) {
    case 'playtime':
      const hours = Math.floor((player.playtime_minutes || 0) / 60);
      const mins = (player.playtime_minutes || 0) % 60;
      statValue = player.playtime || `${hours}h ${mins}m`;
      statLabel = 'Playtime';
      break;
    case 'economy':
      statValue = `$${(player.balance || 0).toLocaleString()}`;
      statLabel = 'Balance';
      statColor = 'text-minecraft-habbo-yellow';
      break;
    case 'mcmmo':
      statValue = (player.mcmmo_power_level || 0).toLocaleString();
      statLabel = 'Power Level';
      statColor = 'text-purple-400';
      break;
    case 'kills':
      statValue = (player.mobs_killed || 0).toLocaleString();
      statLabel = 'Kills';
      statColor = 'text-red-400';
      break;
    case 'mining':
      statValue = (player.blocks_mined || 0).toLocaleString();
      statLabel = 'Blocks Mined';
      statColor = 'text-blue-400';
      break;
    case 'achievements':
      statValue = `${player.achievements || 0}/30`;
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
        <div className="bg-white/10 px-2 py-1 rounded text-xs">{player.rank || 'Member'}</div>
      </div>
      
      <div className="flex items-center mb-6">
        <div className="mr-4 relative">
          <img
            src={`https://visage.surgeplay.com/face/128/${player.mcUsername || player.username}`}
            alt={player.username || player.mcUsername}
            className="rounded-md shadow-lg border-2 border-white/20"
            onError={(e) => {
              e.target.onerror = (e2) => {
                e2.target.onerror = (e3) => {
                  e3.target.onerror = null;
                  e3.target.src = 'https://via.placeholder.com/128?text=MC';
                };
                e2.target.src = `https://minotar.net/avatar/${player.mcUsername || player.username}/128.png`;
              };
              e.target.src = `https://mc-heads.net/avatar/${player.mcUsername || player.username}/128`;
            }}
          />
          {getPlayerRankBadge(player.rank)}
        </div>
        <div>
          <h3 className="font-minecraft text-lg">{player.username || player.mcUsername}</h3>
          <p className="text-gray-400 text-sm">Last seen {formatLastSeen(player.lastSeen)}</p>
        </div>
      </div>
      
      <div className="bg-white/5 p-4 rounded-md">
        <div className="text-center">
          <div className={`text-2xl font-minecraft ${statColor}`}>{statValue}</div>
          <div className="text-gray-400 text-sm">{statLabel}</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          className="minecraft-btn px-5 py-2 text-sm font-medium inline-flex items-center"
          onClick={() => onProfileClick(player.username || player.mcUsername)}
        >
          <UserIcon className="h-4 w-4 mr-1" />
          <span>View Profile</span>
        </button>
      </div>
    </motion.div>
  );
};

// McMMO Top Skills Component
const McMMOTopSkills = ({ players, isAuthenticated, onProfileClick }) => {
  // Get the top 5 players for each mcMMO skill
  const getTopPlayersForSkill = (skill) => {
    return [...players]
      .filter(player => player.skills && player.skills[skill])
      .sort((a, b) => (b.skills[skill] || 0) - (a.skills[skill] || 0))
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
              <div key={`${skill}-${player.uuid || index}`} className="flex items-center bg-white/5 p-3 rounded-md">
                <div className="w-6 text-center font-bold mr-2">#{index + 1}</div>
                <div className="h-7 w-7 mr-2">
                  <button
                    type="button"
                    onClick={() => onProfileClick(player.username || player.mcUsername)}
                    title={isAuthenticated ? `View ${player.username || player.mcUsername}'s profile` : 'Login required to view profile'}
                    className={isAuthenticated ? '' : 'opacity-70'}
                  >
                    <img 
                      src={`https://visage.surgeplay.com/face/64/${player.mcUsername || player.username}`}
                      alt={player.username || player.mcUsername}
                      className="rounded-sm hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        e.target.onerror = (e2) => {
                          e2.target.onerror = (e3) => {
                            e3.target.onerror = null;
                            e3.target.src = 'https://via.placeholder.com/64?text=MC';
                          };
                          e2.target.src = `https://minotar.net/avatar/${player.mcUsername || player.username}/64.png`;
                        };
                        e.target.src = `https://mc-heads.net/avatar/${player.mcUsername || player.username}/64`;
                      }}
                    />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{player.username || player.mcUsername}</div>
                </div>
                <div className="text-sm font-minecraft">Lv. {player.skills?.[skill] || 0}</div>
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
  const totalMoney = players.reduce((sum, player) => sum + (player.balance || 0), 0);
  const avgMoney = players.length > 0 ? totalMoney / players.length : 0;
  const todayEarned = players.reduce((sum, player) => sum + (player.money_earned_today || 0), 0);
  const todaySpent = players.reduce((sum, player) => sum + (player.money_spent_today || 0), 0);
  
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