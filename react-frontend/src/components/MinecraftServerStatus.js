/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftServerStatus.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MinecraftAPI from '../utils/minecraft-api';

/**
 * MinecraftServerStatus - Displays information about a Minecraft server
 * 
 * @param {Object} props
 * @param {string} props.serverIP - The server IP address
 * @param {string} props.className - Additional CSS classes
 */
const MinecraftServerStatus = ({
  serverIP = 'play.bizzynation.co.uk',
  className = ''
}) => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [serverMetrics, setServerMetrics] = useState({
    tps: 20.0,
    ramUsage: 68,
    cpuLoad: 42,
    uptime: '12d 5h 32m'
  });
  
  useEffect(() => {
    const fetchServerStatus = async () => {
      setLoading(true);
      
      try {
        // Fetch server status
        const status = await MinecraftAPI.getServerStatus(serverIP)
          .catch(error => {
            console.error('Error fetching server status:', error);
            // Return a default offline status
            return { 
              online: false, 
              playerCount: 0, 
              maxPlayers: 100,
              version: 'Unknown',
              motd: 'Server may be offline'
            };
          });
        
        setServerStatus(status);
        
        // Try to fetch online players or generate sample data
        if (status && status.online) {
          try {
            const players = await MinecraftAPI.getOnlinePlayers(serverIP);
            setOnlinePlayers(players);
          } catch (playerError) {
            console.error('Error fetching players:', playerError);
            // Generate placeholder data
            setOnlinePlayers(generateSamplePlayers(status.playerCount || 5));
          }
        } else {
          setOnlinePlayers([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in server status component:', err);
        setError('Failed to connect to server');
        setServerStatus({ 
          online: false, 
          playerCount: 0, 
          maxPlayers: 100,
          version: 'Unknown'
        });
        setOnlinePlayers([]);
        setLoading(false);
      }
    };
    
    fetchServerStatus();
    
    // Set up polling to update server status every 60 seconds
    const interval = setInterval(fetchServerStatus, 60000);
    
    return () => clearInterval(interval);
  }, [serverIP]);
  
  // Generate sample players if real data isn't available
  const generateSamplePlayers = (count) => {
    const sampleNames = [
      'MinerSteve', 'DiamondDigger', 'CreeperSlayer', 'RedstoneWizard', 
      'PixelBuilder', 'EnderDragon', 'NetherExplorer', 'StoneMiner',
      'EmeraldHunter', 'ZombieKiller', 'VillagerFriend', 'PiglinTrader'
    ];
    
    return Array.from({ length: Math.min(count, 12) }, (_, index) => ({
      username: sampleNames[index],
      rank: getRandomRank(),
      joinTime: Date.now() - Math.floor(Math.random() * 3600000),
      avatar: MinecraftAPI.getPlayerAvatar(sampleNames[index], 100)
    }));
  };
  
  // Get random rank for demo players
  const getRandomRank = () => {
    const ranks = ['Member', 'VIP', 'VIP+', 'MVP', 'MVP+', 'Admin'];
    const weights = [60, 20, 10, 5, 3, 2]; // Probabilities as percentages
    
    // Get random number between 0 and sum of weights
    const random = Math.random() * weights.reduce((a, b) => a + b, 0);
    
    // Find which range the random number falls into
    let sum = 0;
    for (let i = 0; i < ranks.length; i++) {
      sum += weights[i];
      if (random < sum) return ranks[i];
    }
    
    return ranks[0];
  };
  
  // Generate rank color class
  const getRankColor = (rank) => {
    switch (rank?.toLowerCase()) {
      case 'admin': return 'text-red-400';
      case 'mod': case 'moderator': return 'text-blue-400';
      case 'mvp+': return 'text-fuchsia-400';
      case 'mvp': return 'text-purple-400';
      case 'vip+': return 'text-amber-400';
      case 'vip': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };
  
  // Format player time online
  const formatTimeOnline = (joinTime) => {
    if (!joinTime) return 'Unknown';
    
    const milliseconds = Date.now() - joinTime;
    const seconds = Math.floor(milliseconds / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };
  
  if (loading) {
    return (
      <div className={`server-status ${className} bg-white/5 p-4 rounded-md text-center`}>
        <p className="text-gray-400">Loading server status...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`server-status ${className} bg-white/5 p-4 rounded-md text-center`}>
        <div className="text-red-400 mb-2">⚠️ {error}</div>
        <p className="text-gray-400">The server may be offline or unreachable</p>
      </div>
    );
  }
  
  return (
    <div className={`server-status ${className}`}>
      {/* Server Status Card */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/5 shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <ServerStatusIndicator online={serverStatus?.online} />
            {serverIP}
          </h3>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">
              {serverStatus?.online ? 'Online' : 'Offline'}
            </span>
            
            <button 
              className="text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded-full"
              onClick={() => {
                // Copy server IP to clipboard
                navigator.clipboard.writeText(serverIP);
                // Could show a notification here
              }}
            >
              Copy IP
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <ServerMetricCard 
            icon="👥"
            label="Players"
            value={`${serverStatus?.playerCount || 0}/${serverStatus?.maxPlayers || 0}`}
            color="bg-blue-500/20"
          />
          <ServerMetricCard 
            icon="⚡"
            label="TPS"
            value={serverMetrics?.tps.toFixed(1)}
            color="bg-green-500/20"
          />
          <ServerMetricCard 
            icon="💻"
            label="RAM Usage"
            value={`${serverMetrics?.ramUsage}%`}
            color="bg-purple-500/20"
          />
          <ServerMetricCard 
            icon="⏱️"
            label="Uptime"
            value={serverMetrics?.uptime}
            color="bg-amber-500/20"
          />
        </div>
        
        {serverStatus?.motd && (
          <div className="bg-black/30 p-3 rounded-lg mb-4">
            <h4 className="text-sm font-medium mb-1 text-gray-300">Server Message</h4>
            <p className="text-sm">{serverStatus.motd}</p>
          </div>
        )}
        
        <div className="bg-black/30 p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-1 text-gray-300">Server Version</h4>
          <p className="text-sm">{serverStatus?.version || 'Unknown'}</p>
        </div>
      </div>
      
      {/* Online Players */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Online Players ({serverStatus?.playerCount || 0})
        </h3>
        
        {onlinePlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {onlinePlayers.map((player, index) => (
              <motion.div 
                key={index}
                className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="h-10 w-10 rounded-md mr-3 overflow-hidden">
                  <img 
                    src={player.avatar}
                    alt={player.username}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback if avatar fails to load
                      e.target.src = `https://via.placeholder.com/40?text=${player.username.charAt(0)}`;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {player.username}
                    </h4>
                    <span className={`text-xs ${getRankColor(player.rank)}`}>
                      {player.rank}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Online for {formatTimeOnline(player.joinTime)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <p className="text-gray-400">No players online</p>
          </div>
        )}
      </div>
      
      {/* Server Stats */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Server Stats</h3>
        
        <div className="bg-white/5 p-4 rounded-lg border border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Total Players"
              value="12,428"
              trend="up"
            />
            <StatCard
              label="Peak Players"
              value="187"
              trend="up"
            />
            <StatCard
              label="Avg. Daily Players"
              value="42"
              trend="down"
            />
            <StatCard
              label="Avg. Session"
              value="48m"
              trend={null}
            />
          </div>
          
          {/* Chart placeholder */}
          <div className="bg-black/30 p-3 rounded-lg h-36 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Player count over time chart would go here</p>
          </div>
        </div>
      </div>
      
      {/* Server Resources */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Server Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">RAM Usage</h4>
            <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${serverMetrics.ramUsage}%` }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">
                {Math.round(serverMetrics.ramUsage * 0.04 * 10) / 10}GB
              </span>
              <span className="text-xs text-gray-400">4GB</span>
            </div>
          </div>
          
          <div className="bg-white/5 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">CPU Load</h4>
            <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${
                  serverMetrics.cpuLoad > 80 ? 'bg-red-500' : 
                  serverMetrics.cpuLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${serverMetrics.cpuLoad}%` }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">
                {serverMetrics.cpuLoad}%
              </span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

// Server status indicator component
const ServerStatusIndicator = ({ online = false }) => (
  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
);

// Server metric card component
const ServerMetricCard = ({ icon, label, value, color }) => (
  <div className={`${color} p-3 rounded-lg text-center`}>
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

// Stat card component
const StatCard = ({ label, value, trend = null }) => (
  <div className="bg-black/20 p-3 rounded-lg">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <div className="flex items-center justify-between">
      <p className="font-semibold">{value}</p>
      {trend && (
        <span className={`${trend === 'up' ? 'text-green-400' : 'text-red-400'} text-sm`}>
          {trend === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  </div>
);

export default MinecraftServerStatus;