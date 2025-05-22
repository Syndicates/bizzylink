/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Community.js
 * @description Community hub featuring forums, achievements, titles and leaderboards
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ForumSystem from '../components/forum/ForumSystem';
import Leaderboard from './Leaderboard';
import { useAuth } from '../contexts/AuthContext';

const Community = () => {
  const [activeTab, setActiveTab] = useState('forum');
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [titles, setTitles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // The tabs for the community hub
  const tabs = [
    { id: 'forum', label: 'Forum', icon: 'chat_bubble_outline' },
    { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
    { id: 'titles', label: 'Titles', icon: 'military_tech' },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' }
  ];

  // Placeholder for achievements data
  useEffect(() => {
    // This would fetch real data in production
    setAchievements([
      { id: 1, name: 'First Post', description: 'Create your first forum post', unlocked: true },
      { id: 2, name: 'Popular Topic', description: 'Start a thread with 100+ replies', unlocked: false },
      { id: 3, name: 'Friendly Helper', description: 'Receive 50 thanks on your posts', unlocked: false }
    ]);
    
    setTitles([
      { id: 1, name: 'Newcomer', description: 'Default title for new members', active: true },
      { id: 2, name: 'Veteran', description: 'Been a member for over 1 year', active: false },
      { id: 3, name: 'Master Builder', description: 'Won a building competition', active: false }
    ]);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Community Hub Header */}
      <div className="w-full py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-minecraft text-3xl md:text-4xl bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent mb-2">
            Community Hub
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Connect with fellow players, track achievements, and compete on leaderboards
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="w-full bg-gray-800/70 border-t border-b border-gray-700 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-6 flex items-center transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
              }`}
            >
                <span className="material-icons-outlined text-sm mr-2">
                  {tab.icon}
                </span>
                {tab.label}
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
            </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'forum' && <ForumSystem />}
          
          {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
            <motion.div
                key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-700' 
                    : 'bg-gray-800/40 border border-gray-700'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    achievement.unlocked ? 'bg-green-700' : 'bg-gray-700'
                  }`}>
                    <span className="material-icons-outlined">
                      {achievement.unlocked ? 'check_circle' : 'lock'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{achievement.name}</h3>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
                </div>
          )}
          
        {activeTab === 'titles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {titles.map(title => (
            <motion.div
                key={title.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${
                  title.active 
                    ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700' 
                    : 'bg-gray-800/40 border border-gray-700'
                          }`}
                        >
                <div className="flex items-center mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    title.active ? 'bg-blue-700' : 'bg-gray-700'
                  }`}>
                    <span className="material-icons-outlined">
                      {title.active ? 'star' : 'military_tech'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{title.name}</h3>
                    <p className="text-sm text-gray-400">{title.description}</p>
                  </div>
                </div>
                {!title.active && (
                  <button className="w-full mt-2 py-1 px-3 bg-gray-700 hover:bg-gray-600 text-sm rounded text-white transition-colors">
                    Set Active
                  </button>
                )}
              </motion.div>
                      ))}
                    </div>
        )}
        
        {activeTab === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
};

export default Community;