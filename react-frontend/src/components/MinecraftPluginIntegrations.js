/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftPluginIntegrations.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * MinecraftPluginIntegrations - Displays data from integrated Minecraft plugins
 * 
 * @param {Object} props
 * @param {Object} props.integrationData - Data from various Minecraft plugins
 * @param {string} props.className - Additional CSS classes
 */
const MinecraftPluginIntegrations = ({
  integrationData = {},
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('mcmmo');
  
  const hasMcMMO = integrationData.mcmmo_data && Object.keys(integrationData.mcmmo_data).length > 0;
  const hasJobs = integrationData.jobs_data && Object.keys(integrationData.jobs_data).length > 0;
  const hasTowny = integrationData.towny_data && Object.keys(integrationData.towny_data).length > 0;
  
  // Determine which tab to show as default
  React.useEffect(() => {
    if (hasMcMMO) {
      setActiveTab('mcmmo');
    } else if (hasJobs) {
      setActiveTab('jobs');
    } else if (hasTowny) {
      setActiveTab('towny');
    }
  }, [hasMcMMO, hasJobs, hasTowny]);
  
  // Add town data flag
  const hasTown = integrationData.town_data && Object.keys(integrationData.town_data).length > 0;
  
  // If no plugin data available
  if (!hasMcMMO && !hasJobs && !hasTowny && !hasTown) {
    return (
      <div className={`minecraft-plugin-integrations ${className} bg-white/5 p-4 rounded-md`}>
        <p className="text-center text-gray-400">No plugin integration data available</p>
      </div>
    );
  }
  
  return (
    <div className={`minecraft-plugin-integrations ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4 overflow-x-auto pb-1">
        {hasMcMMO && (
          <Tab 
            name="mcmmo" 
            label="McMMO Skills"
            active={activeTab === 'mcmmo'}
            onClick={() => setActiveTab('mcmmo')}
          />
        )}
        
        {hasJobs && (
          <Tab 
            name="jobs" 
            label="Jobs"
            active={activeTab === 'jobs'}
            onClick={() => setActiveTab('jobs')}
          />
        )}
        
        {hasTowny && (
          <Tab 
            name="towny" 
            label="Town"
            active={activeTab === 'towny'}
            onClick={() => setActiveTab('towny')}
          />
        )}
        
        {hasTown && (
          <Tab 
            name="town" 
            label="Town"
            active={activeTab === 'town'}
            onClick={() => setActiveTab('town')}
          />
        )}
        
        {integrationData.server_stats && (
          <Tab 
            name="server" 
            label="Server Stats"
            active={activeTab === 'server'}
            onClick={() => setActiveTab('server')}
          />
        )}
      </div>
      
      {/* Content based on active tab */}
      <div className="pt-2">
        {activeTab === 'mcmmo' && hasMcMMO && (
          <McMMOPanel data={integrationData.mcmmo_data} />
        )}
        
        {activeTab === 'jobs' && hasJobs && (
          <JobsPanel data={integrationData.jobs_data} />
        )}
        
        {activeTab === 'towny' && hasTowny && (
          <TownyPanel data={integrationData.towny_data} />
        )}
        
        {activeTab === 'town' && hasTown && (
          <TownPanel data={integrationData.town_data} />
        )}
        
        {activeTab === 'server' && integrationData.server_stats && (
          <ServerStatsPanel data={integrationData.server_stats} />
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

// McMMO Skills panel
const McMMOPanel = ({ data = {} }) => {
  const { power_level = 0, skills = {} } = data;
  
  // McMMO skill colors and icons
  const skillInfo = {
    mining: { 
      color: 'bg-gray-500', 
      icon: '⛏️',
      description: 'Dig faster and get bonus items'
    },
    woodcutting: { 
      color: 'bg-amber-700', 
      icon: '🪓',
      description: 'Faster wood cutting and increased drops'
    },
    herbalism: { 
      color: 'bg-green-600', 
      icon: '🌿',
      description: 'Plant expertise and better harvests'
    },
    excavation: { 
      color: 'bg-orange-700', 
      icon: '🔍',
      description: 'Find treasures while digging'
    },
    fishing: { 
      color: 'bg-blue-500', 
      icon: '🎣',
      description: 'Better fishing loot and magic items'
    },
    repair: { 
      color: 'bg-zinc-400', 
      icon: '🔧',
      description: 'Fix items with less resources'
    },
    unarmed: { 
      color: 'bg-red-600', 
      icon: '👊',
      description: 'Fighting with bare hands'
    },
    archery: { 
      color: 'bg-purple-500', 
      icon: '🏹',
      description: 'Improved bow damage and special shots'
    },
    swords: { 
      color: 'bg-indigo-500', 
      icon: '⚔️',
      description: 'Sword combat mastery'
    },
    axes: { 
      color: 'bg-cyan-600', 
      icon: '🔪',
      description: 'Axe combat expertise'
    },
    acrobatics: { 
      color: 'bg-teal-500', 
      icon: '🤸',
      description: 'Dodge and reduce fall damage'
    },
    taming: { 
      color: 'bg-yellow-500', 
      icon: '🐺',
      description: 'Enhanced pet abilities'
    },
    alchemy: { 
      color: 'bg-violet-500', 
      icon: '⚗️',
      description: 'Potion brewing mastery'
    }
  };
  
  // Calculate total skill levels for the radar chart
  const totalSkillsValue = Object.values(skills).reduce((sum, level) => sum + level, 0);
  const maxSkillLevel = Math.max(...Object.values(skills), 100);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="minecraft-icon mr-2">⚒️</span>
          McMMO Skills
        </h3>
        <div className="bg-white/10 rounded-full px-4 py-1 text-minecraft-habbo-blue font-medium">
          Power Level: {power_level}
        </div>
      </div>
      
      {/* Visual Power Level Display */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Power Progress</span>
          <span className="text-minecraft-habbo-blue">{totalSkillsValue} / {power_level * 13}</span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-minecraft-habbo-blue"
            style={{ width: `${Math.min((totalSkillsValue / (power_level * 13)) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="mt-2 text-xs text-center text-gray-400">
          Level up your skills to increase your power level!
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(skills).map(([skill, level]) => (
          <motion.div 
            key={skill} 
            className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">{skillInfo[skill]?.icon || '🔮'}</span>
              <div>
                <h4 className="font-medium">{formatSkillName(skill)}</h4>
                <p className="text-xs text-gray-400">{skillInfo[skill]?.description || 'Skill mastery'}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-1">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full ${
                      i < Math.floor(level / 200) 
                        ? skillInfo[skill]?.color || 'bg-blue-500' 
                        : 'bg-gray-700'
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-lg font-semibold">{level}</span>
            </div>
            
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${skillInfo[skill]?.color || 'bg-blue-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((level / 1000) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              ></motion.div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-400">Level {level}</span>
              <span className="text-minecraft-habbo-blue">Next: {Math.ceil(level/100)*100}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Command Tips */}
      <div className="mt-6 bg-black/30 p-3 rounded-lg border border-white/10">
        <p className="text-sm text-gray-300 mb-2">Useful McMMO Commands:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/mcstats</code>
            <span className="text-gray-400 text-xs ml-2">View all your skills</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/mcrank</code>
            <span className="text-gray-400 text-xs ml-2">See server rankings</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Jobs panel
const JobsPanel = ({ data = {} }) => {
  const { points = 0, jobs = [], total_money_earned = 0 } = data;
  
  // Job icons and colors
  const jobInfo = {
    miner: { icon: '⛏️', color: 'from-gray-500 to-blue-500', banner: 'pickaxe.png', bgClass: 'bg-gradient-to-br from-stone-700 to-stone-900' },
    farmer: { icon: '🌾', color: 'from-green-500 to-yellow-500', banner: 'wheat.png', bgClass: 'bg-gradient-to-br from-green-800 to-yellow-900' },
    hunter: { icon: '🏹', color: 'from-red-500 to-amber-500', banner: 'bow.png', bgClass: 'bg-gradient-to-br from-red-900 to-orange-900' },
    fisherman: { icon: '🎣', color: 'from-blue-400 to-cyan-600', banner: 'fishing_rod.png', bgClass: 'bg-gradient-to-br from-blue-900 to-cyan-900' },
    woodcutter: { icon: '🪓', color: 'from-amber-600 to-amber-800', banner: 'axe.png', bgClass: 'bg-gradient-to-br from-amber-900 to-brown-900' },
    builder: { icon: '🏗️', color: 'from-amber-300 to-amber-600', banner: 'brick.png', bgClass: 'bg-gradient-to-br from-amber-800 to-red-900' },
    explorer: { icon: '🧭', color: 'from-emerald-400 to-teal-600', banner: 'map.png', bgClass: 'bg-gradient-to-br from-emerald-900 to-teal-900' },
    enchanter: { icon: '✨', color: 'from-purple-500 to-violet-700', banner: 'enchanted_book.png', bgClass: 'bg-gradient-to-br from-purple-900 to-violet-900' },
    brewer: { icon: '⚗️', color: 'from-pink-400 to-fuchsia-600', banner: 'potion.png', bgClass: 'bg-gradient-to-br from-pink-900 to-fuchsia-900' },
    blacksmith: { icon: '🔨', color: 'from-gray-500 to-slate-700', banner: 'anvil.png', bgClass: 'bg-gradient-to-br from-gray-800 to-slate-900' }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="minecraft-icon mr-2">💼</span>
          Jobs
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-xs mr-1">💰</span>
            <span className="text-minecraft-habbo-yellow font-medium">${total_money_earned?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
            <span className="text-blue-400 text-xs mr-1">⭐</span>
            <span className="text-minecraft-habbo-blue font-medium">{points} points</span>
          </div>
        </div>
      </div>
      
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, index) => {
            const jobKey = job.name.toLowerCase();
            const info = jobInfo[jobKey] || { 
              icon: '💼', 
              color: 'from-blue-500 to-purple-500', 
              bgClass: 'bg-gradient-to-br from-blue-900 to-purple-900' 
            };
            
            return (
              <motion.div 
                key={index}
                className={`p-4 rounded-lg ${info.bgClass} shadow-lg border border-white/10`}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-black/30 flex items-center justify-center text-2xl mr-3">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{job.name}</h4>
                      <div className="flex items-center">
                        <span className="text-yellow-300 mr-1">★</span>
                        <span className="text-gray-200">Level {job.level}</span>
                      </div>
                    </div>
                  </div>
                  {job.quest_progress && (
                    <div className="bg-black/30 px-2 py-1 rounded text-xs">
                      <span className="text-gray-300">Quest: </span>
                      <span className="text-green-400">{job.quest_progress}%</span>
                    </div>
                  )}
                </div>
                
                <div className="relative mt-4">
                  <div className="absolute inset-0 bg-black/30 rounded-full"></div>
                  <div className="relative w-full h-4 bg-black/50 rounded-full overflow-hidden mb-1">
                    <motion.div 
                      className={`h-full bg-gradient-to-r ${info.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${job.exp}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                    ></motion.div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-white">XP: {job.exp}%</span>
                  <span className="text-gray-300">Next: {100 - job.exp}%</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
                  {job.daily_income && (
                    <div className="text-gray-300">
                      Daily: <span className="text-minecraft-habbo-yellow">${job.daily_income}</span>
                    </div>
                  )}
                  {job.bonus && (
                    <div className="text-gray-300">
                      Bonus: <span className="text-minecraft-habbo-blue">+{job.bonus}%</span>
                    </div>
                  )}
                  {!job.daily_income && !job.bonus && (
                    <div className="text-gray-300">
                      Complete tasks to earn money and XP
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 p-6 rounded-lg text-center">
          <div className="text-4xl mb-4">💼</div>
          <p className="text-gray-300 mb-3">No active jobs</p>
          <p className="text-sm text-gray-400">Join a job to earn money while playing!</p>
          <button className="mt-4 px-4 py-2 bg-minecraft-habbo-blue rounded-md text-white font-medium hover:bg-blue-600 transition-colors">
            Browse Available Jobs
          </button>
        </div>
      )}
      
      {/* Command Tips */}
      <div className="mt-6 bg-black/30 p-3 rounded-lg border border-white/10">
        <p className="text-sm text-gray-300 mb-2">Useful Jobs Commands:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/jobs browse</code>
            <span className="text-gray-400 text-xs ml-2">View available jobs</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/jobs join [job]</code>
            <span className="text-gray-400 text-xs ml-2">Join a new job</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/jobs stats</code>
            <span className="text-gray-400 text-xs ml-2">View your job stats</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/jobs quests</code>
            <span className="text-gray-400 text-xs ml-2">See available quests</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Towny panel
const TownyPanel = ({ data = {} }) => {
  const { town_name, nation_name, has_town, has_nation, status, role, town_board, residents_count } = data;
  
  // Flags (these would come from API, but using placeholders for demo)
  const townFlags = {
    pvp: false,
    explosion: false,
    fire: false,
    mob_spawning: true,
    public: true,
    taxes: true
  };
  
  if (!has_town) {
    return (
      <motion.div 
        className="text-center py-8 bg-white/5 rounded-lg border border-dashed border-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-5xl mb-4">🏘️</div>
        <h3 className="text-xl font-semibold mb-2">No Town Membership</h3>
        <p className="text-gray-400 mb-6 mx-auto max-w-md">
          You are not currently a member of any town. Join a town to access community features and protection.
        </p>
        <div className="flex justify-center space-x-3">
          <button className="px-4 py-2 bg-minecraft-habbo-green rounded-md text-white font-medium hover:bg-green-600 transition-colors">
            Join a Town
          </button>
          <button className="px-4 py-2 bg-minecraft-habbo-purple rounded-md text-white font-medium hover:bg-purple-700 transition-colors">
            Create New Town
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Use <code className="bg-black/20 px-1 rounded">/town</code> in-game for more information
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Town Header */}
      <div className="relative mb-6">
        <div className="h-24 w-full bg-gradient-to-r from-minecraft-habbo-blue to-minecraft-habbo-purple rounded-t-lg"></div>
        <div className="absolute -bottom-8 left-6 h-16 w-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
          <div className="text-3xl">🏙️</div>
        </div>
        <div className="absolute bottom-2 left-24 text-white">
          <h3 className="text-2xl font-bold drop-shadow-md">{town_name}</h3>
          {has_nation && (
            <div className="flex items-center">
              <span className="text-sm opacity-90">Nation: {nation_name}</span>
              <span className="mx-2 text-white/50">•</span>
              <span className="text-sm opacity-90">{status || 'Peaceful'}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Town Message Board */}
      <div className="bg-white/5 p-4 rounded-lg mb-4 mt-8 border border-white/10">
        <h4 className="text-lg font-semibold mb-3">Town Board</h4>
        <div className="bg-black/30 p-3 rounded min-h-16 italic text-gray-300">
          {town_board || "Welcome to our town! Remember to pay your taxes and help expand our territory."}
        </div>
      </div>
      
      {/* Town Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <InfoCard 
          icon="👥" 
          label="Residents" 
          value={residents_count || "12"}
          color="bg-green-500"
        />
        <InfoCard 
          icon="👑" 
          label="Your Role" 
          value={role || "Resident"}
          color="bg-yellow-500"
        />
        <InfoCard 
          icon="🏦" 
          label="Town Bank" 
          value="$3,250"
          color="bg-blue-500"
        />
        <InfoCard 
          icon="📏" 
          label="Town Size" 
          value="24 Chunks"
          color="bg-purple-500"
        />
        <InfoCard 
          icon="💰" 
          label="Daily Tax" 
          value="$25"
          color="bg-red-500"
        />
        <InfoCard 
          icon="📅" 
          label="Founded" 
          value="30 days ago"
          color="bg-amber-500"
        />
      </div>
      
      {/* Town Settings/Flags */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
        <h4 className="text-lg font-semibold mb-3">Town Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SettingToggle label="PvP" enabled={townFlags.pvp} />
          <SettingToggle label="Explosions" enabled={townFlags.explosion} />
          <SettingToggle label="Fire Spread" enabled={townFlags.fire} />
          <SettingToggle label="Mob Spawning" enabled={townFlags.mob_spawning} />
          <SettingToggle label="Public" enabled={townFlags.public} />
          <SettingToggle label="Tax Enabled" enabled={townFlags.taxes} />
        </div>
      </div>
      
      {/* Town Map (Placeholder) */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-4">
        <h4 className="text-lg font-semibold mb-3 flex items-center">
          <span className="mr-2">🗺️</span>
          Town Map
        </h4>
        <div className="bg-black/30 p-1 rounded overflow-hidden">
          <div className="h-48 w-full bg-minecraft-habbo-navy-dark flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🧭</div>
              <p className="text-gray-400">Interactive town map coming soon</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Command Tips */}
      <div className="mt-6 bg-black/30 p-3 rounded-lg border border-white/10">
        <p className="text-sm text-gray-300 mb-2">Useful Town Commands:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/town</code>
            <span className="text-gray-400 text-xs ml-2">Town information</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/town spawn</code>
            <span className="text-gray-400 text-xs ml-2">Teleport to town</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/town deposit [amount]</code>
            <span className="text-gray-400 text-xs ml-2">Add money to bank</span>
          </div>
          <div className="bg-black/50 p-2 rounded font-mono text-sm">
            <code className="text-green-400">/plot claim</code>
            <span className="text-gray-400 text-xs ml-2">Claim current plot</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Info card component for town panel
const InfoCard = ({ icon, label, value, color }) => (
  <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
    <div className={`h-1 w-full ${color}`}></div>
    <div className="p-3">
      <div className="flex items-center mb-1">
        <span className="text-lg mr-2">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-bold ml-7">{value}</div>
    </div>
  </div>
);

// Setting toggle component for town panel
const SettingToggle = ({ label, enabled }) => (
  <div className="flex items-center justify-between bg-black/20 p-2 rounded">
    <span className="text-sm">{label}</span>
    <div className={`h-5 w-10 rounded-full relative ${enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
      <div className={`h-4 w-4 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`}></div>
    </div>
  </div>
);

// Helper function to format skill names
const formatSkillName = (skill) => {
  return skill
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Town panel
const TownPanel = ({ data = {} }) => {
  const { 
    name, 
    rank, 
    nation, 
    mayor, 
    residents, 
    founded, 
    chunks, 
    balance, 
    taxes 
  } = data;
  
  if (!name) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">Not a member of any town</p>
        <button className="mt-3 text-sm text-minecraft-habbo-blue hover:underline">
          Learn how to join a town
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-white/5 p-4 rounded-md mb-4">
        <h3 className="text-lg font-semibold mb-2">{name}</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Rank:</span>
              <span className="font-medium">{rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nation:</span>
              <span className="font-medium">{nation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mayor:</span>
              <span className="font-medium">{mayor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Founded:</span>
              <span className="font-medium">{new Date(founded).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Residents:</span>
              <span className="font-medium">{residents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Land:</span>
              <span className="font-medium">{chunks} chunks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="font-medium text-minecraft-habbo-yellow">${balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Tax:</span>
              <span className="font-medium">${taxes?.daily || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Server stats panel
const ServerStatsPanel = ({ data = {} }) => {
  const { 
    server_first_join, 
    total_votes, 
    reward_points, 
    quests_completed, 
    custom_enchants,
    ability_cooldowns,
    pet_collection,
    minigame_stats
  } = data;
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Server Progress</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBlock label="First Join" value={new Date(server_first_join).toLocaleDateString()} />
          <StatBlock label="Total Votes" value={total_votes} />
          <StatBlock label="Reward Points" value={reward_points} color="text-yellow-400" />
          <StatBlock label="Quests Completed" value={quests_completed} />
        </div>
      </div>
      
      {custom_enchants && custom_enchants.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Custom Enchants</h3>
          <div className="flex flex-wrap gap-2">
            {custom_enchants.map((enchant, index) => (
              <div key={index} className="bg-purple-900/40 px-3 py-1 rounded-full text-sm">
                {enchant}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {ability_cooldowns && Object.keys(ability_cooldowns).length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Abilities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(ability_cooldowns).map(([ability, cooldown], index) => (
              <div key={index} className="bg-white/5 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{ability}</span>
                  <span className={`text-sm ${cooldown === 'Ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {cooldown}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {minigame_stats && Object.keys(minigame_stats).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Minigames</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(minigame_stats).map(([game, stats], index) => (
              <div key={index} className="bg-white/5 p-3 rounded-md">
                <h4 className="font-medium mb-1">{game}</h4>
                <div className="space-y-1">
                  {Object.entries(stats).map(([stat, value], i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{formatStatName(stat)}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat block component for server stats
const StatBlock = ({ label, value, color = "text-white" }) => (
  <div className="bg-white/5 p-3 rounded-md text-center">
    <p className="text-gray-400 text-xs">{label}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
);

// Helper function to format stat names
const formatStatName = (stat) => {
  return stat
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default MinecraftPluginIntegrations;