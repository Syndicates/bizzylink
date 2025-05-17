/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Community.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import our custom components
import ForumSystem from '../components/forum/ForumSystem';
import AchievementSystem from '../components/AchievementSystem';
import TitleSystem from '../components/TitleSystem';
import MinecraftPlayerModel3D from '../components/MinecraftPlayerModel3D';

// API services
import { MinecraftService } from '../services/api';

/**
 * Community Page Component
 * 
 * This page integrates all the community features including:
 * - Forum system with Minecraft-themed styling
 * - Achievement system for tracking player accomplishments
 * - Title system for displaying earned titles
 * - 3D player model and inventory visualization
 */
const Community = () => {
  const { tab = 'forum' } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab);
  const [playerData, setPlayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Set to false to avoid loading state
  const [error, setError] = useState(null);
  const [showModel, setShowModel] = useState(false);

  // Fetch player data on component mount
  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use MinecraftService to fetch player stats
        const username = localStorage.getItem('username');
        if (!username) {
          throw new Error('Please log in to view your profile');
        }
        
        const response = await MinecraftService.getPlayerStats(username);
        setPlayerData(response.data);
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerData();
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/community/${tab}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-700 w-64 rounded mb-6"></div>
        <div className="h-64 bg-gray-700 rounded-lg w-full mb-6"></div>
        <div className="h-64 bg-gray-700 rounded-lg w-full"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900 bg-opacity-50 text-white p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with minecraft-inspired design */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Community Hub</h1>
            
            {playerData && (
              <div className="flex items-center">
                {playerData.mcUsername && !showModel ? (
                  <button 
                    onClick={() => setShowModel(true)}
                    className="mr-4 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md"
                  >
                    View Character
                  </button>
                ) : showModel ? (
                  <button 
                    onClick={() => setShowModel(false)}
                    className="mr-4 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md"
                  >
                    Hide Character
                  </button>
                ) : null}
                
                <div className="flex items-center">
                  <div className="hidden sm:block mr-3">
                    <TitleSystem playerData={playerData} compact={true} />
                  </div>
                  <div className="font-bold">{playerData.mcUsername || playerData.username}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none space-x-1">
            <button
              onClick={() => handleTabChange('forum')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'forum' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Forum
            </button>
            <button
              onClick={() => handleTabChange('achievements')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'achievements' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Achievements
            </button>
            <button
              onClick={() => handleTabChange('titles')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'titles' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Titles
            </button>
            <button
              onClick={() => handleTabChange('leader')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'leader' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="container mx-auto px-4 py-6">
        {/* 3D Player model (when shown) */}
        {showModel && playerData && (
          <div className="mb-8 max-w-md mx-auto">
            <MinecraftPlayerModel3D 
              playerData={playerData}
              username={playerData.mcUsername || playerData.username}
              initialView="combined"
              size="medium"
            />
          </div>
        )}
        
        {/* Tab content */}
        <div className="mt-4">
          {/* Forum tab */}
          {activeTab === 'forum' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ForumSystem />
            </motion.div>
          )}
          
          {/* Achievements tab */}
          {activeTab === 'achievements' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Player Achievements</h2>
              
              {playerData ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-700 rounded-md p-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Achievement Progress</h3>
                      <p className="text-gray-300">Track your progress through the game's achievements</p>
                    </div>
                    <div className="mt-2 md:mt-0 bg-gray-800 rounded-full h-6 w-full md:w-48 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full" 
                        style={{ width: `${playerData.advancements_percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="font-bold text-lg mt-2 md:mt-0 md:ml-4">
                      {playerData.advancements_percentage || 0}%
                    </div>
                  </div>
                  
                  <AchievementSystem playerData={playerData} display="grid" size="medium" />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Link your Minecraft account to track achievements</p>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Titles tab */}
          {activeTab === 'titles' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Player Titles</h2>
              
              {playerData ? (
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-md p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-2">Current Title</h3>
                    <div className="flex items-center">
                      <TitleSystem 
                        playerData={playerData} 
                        onChange={(titleId) => console.log('Title changed:', titleId)}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-4">
                      Titles are special designations that appear next to your name.
                      Unlock new titles by completing achievements and participating in events.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">Available Titles</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Select any unlocked title to display next to your name
                    </p>
                    
                    {/* Title selection grid - shows detailed titles */}
                    <TitleSystem 
                      playerData={playerData}
                      onChange={(titleId) => console.log('Title changed:', titleId)}
                      showSelection={true}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Link your Minecraft account to unlock titles</p>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Leaderboard tab */}
          {activeTab === 'leader' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Server Leaderboards</h2>
              
              {/* Mock leaderboard data */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Miners */}
                <div className="bg-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600">
                    <h3 className="font-bold text-lg">Top Miners</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {[
                        { name: "DiamondDigger42", value: 158432, place: 1 },
                        { name: "MiningMaster99", value: 145621, place: 2 },
                        { name: "StoneBreaker", value: 132845, place: 3 },
                        { name: "PickaxePro", value: 112765, place: 4 },
                        { name: "CaveExplorer", value: 98523, place: 5 }
                      ].map((player, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between items-center p-2 rounded ${
                            player.name === (playerData?.mcUsername || '') ? 'bg-green-900' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-6 h-6 flex items-center justify-center rounded-full mr-2
                              ${player.place === 1 ? 'bg-yellow-800 text-yellow-200' :
                                player.place === 2 ? 'bg-gray-600 text-gray-200' :
                                player.place === 3 ? 'bg-amber-900 text-amber-200' :
                                'bg-gray-700 text-gray-400'}
                            `}>
                              {player.place}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-300">{player.value.toLocaleString()} blocks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Top Combat */}
                <div className="bg-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600">
                    <h3 className="font-bold text-lg">Top Combat</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {[
                        { name: "SlayerSupreme", value: 8942, place: 1 },
                        { name: "DragonHunter", value: 7851, place: 2 },
                        { name: "ZombieKiller", value: 6743, place: 3 },
                        { name: "ArrowMaster", value: 5932, place: 4 },
                        { name: "SwordExpert", value: 5421, place: 5 }
                      ].map((player, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between items-center p-2 rounded ${
                            player.name === (playerData?.mcUsername || '') ? 'bg-green-900' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-6 h-6 flex items-center justify-center rounded-full mr-2
                              ${player.place === 1 ? 'bg-yellow-800 text-yellow-200' :
                                player.place === 2 ? 'bg-gray-600 text-gray-200' :
                                player.place === 3 ? 'bg-amber-900 text-amber-200' :
                                'bg-gray-700 text-gray-400'}
                            `}>
                              {player.place}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-300">{player.value.toLocaleString()} kills</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Top Explorers */}
                <div className="bg-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600">
                    <h3 className="font-bold text-lg">Top Explorers</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {[
                        { name: "WorldTraveler", value: 2543692, place: 1 },
                        { name: "Pathfinder", value: 2123567, place: 2 },
                        { name: "AdventureSeeker", value: 1985421, place: 3 },
                        { name: "JourneyMan", value: 1754832, place: 4 },
                        { name: "Nomad", value: 1632541, place: 5 }
                      ].map((player, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between items-center p-2 rounded ${
                            player.name === (playerData?.mcUsername || '') ? 'bg-green-900' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-6 h-6 flex items-center justify-center rounded-full mr-2
                              ${player.place === 1 ? 'bg-yellow-800 text-yellow-200' :
                                player.place === 2 ? 'bg-gray-600 text-gray-200' :
                                player.place === 3 ? 'bg-amber-900 text-amber-200' :
                                'bg-gray-700 text-gray-400'}
                            `}>
                              {player.place}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-300">{(player.value / 1000).toFixed(1)}k blocks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Top Playtime */}
                <div className="bg-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600">
                    <h3 className="font-bold text-lg">Top Playtime</h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {[
                        { name: "MinecraftAddict", value: 2342, place: 1 },
                        { name: "DedicatedMiner", value: 1987, place: 2 },
                        { name: "ServerVeteran", value: 1853, place: 3 },
                        { name: "24/7Gamer", value: 1752, place: 4 },
                        { name: "PerpetualBuilder", value: 1698, place: 5 }
                      ].map((player, index) => (
                        <div 
                          key={index}
                          className={`flex justify-between items-center p-2 rounded ${
                            player.name === (playerData?.mcUsername || '') ? 'bg-green-900' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-6 h-6 flex items-center justify-center rounded-full mr-2
                              ${player.place === 1 ? 'bg-yellow-800 text-yellow-200' :
                                player.place === 2 ? 'bg-gray-600 text-gray-200' :
                                player.place === 3 ? 'bg-amber-900 text-amber-200' :
                                'bg-gray-700 text-gray-400'}
                            `}>
                              {player.place}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="text-gray-300">{player.value} hours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;