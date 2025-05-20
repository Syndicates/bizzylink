/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftActivity.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * MinecraftActivity - Displays real-time player activity and history
 * 
 * @param {Object} props
 * @param {Object} props.playerStats - Player statistics data
 * @param {string} props.className - Additional CSS classes
 */
const MinecraftActivity = ({
  playerStats,
  className = ''
}) => {
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  
  useEffect(() => {
    if (!playerStats) return;
    
    console.log('Activity component received player stats:', playerStats);
    
    // Extract activity data from player stats
    const activityData = playerStats.activity || {};
    const lastActivity = activityData.last_activity || {};
    
    // Set current activity
    const current = {
      type: lastActivity.activity || (playerStats.online ? 'idle' : 'offline'),
      location: lastActivity.location || formatLocationString(playerStats),
      timestamp: lastActivity.timestamp || Date.now()
    };
    
    console.log('Setting current activity:', current);
    setCurrentActivity(current);
    
    // Initialize activity history from real data or create from player stats
    let activityList = [];
    
    // Use real activity history if available
    if (playerStats.activity_history && Array.isArray(playerStats.activity_history)) {
      console.log('Using real activity history from API');
      activityList = playerStats.activity_history;
    } 
    // Otherwise, create activity history based on last_seen and other stats
    else {
      console.log('Creating inferred activity history from player stats');
      
      // Add the current activity
      activityList.push(current);
      
      // Use timestamps from other data points to create a history
      const loginTime = playerStats.last_login || (Date.now() - (1000 * 60 * 60)); // 1 hour ago
      const miningTime = playerStats.last_mined || (Date.now() - (1000 * 60 * 30)); // 30 minutes ago
      const combatTime = playerStats.last_combat || (Date.now() - (1000 * 60 * 15)); // 15 minutes ago
      
      // Add login event if known
      if (playerStats.last_login) {
        activityList.push({
          type: 'login',
          location: formatLocationString(playerStats, true),
          timestamp: loginTime
        });
      }
      
      // Only add mining activity if user has mined blocks
      if (playerStats.blocks_mined && playerStats.blocks_mined > 0) {
        activityList.push({
          type: 'mining',
          location: `${playerStats.world || 'world'} at mining location`,
          timestamp: miningTime
        });
      }
      
      // Only add combat activity if user has killed mobs
      if (playerStats.mobs_killed && playerStats.mobs_killed > 0) {
        activityList.push({
          type: 'combat',
          location: `${playerStats.world || 'world'} combat zone`,
          timestamp: combatTime
        });
      }
      
      // Only add crafting activity if user has crafted items
      if (playerStats.items_crafted && playerStats.items_crafted > 0) {
        activityList.push({
          type: 'crafting',
          location: `${playerStats.world || 'world'} crafting area`,
          timestamp: miningTime
        });
      }
      
      // Add any swimming, flying, or sprint activities from flags
      if (activityData.swimming) {
        activityList.push({
          type: 'swimming',
          location: formatLocationString(playerStats),
          timestamp: Date.now() - (1000 * 60 * 5) // 5 minutes ago
        });
      }
      
      if (activityData.flying) {
        activityList.push({
          type: 'flying',
          location: formatLocationString(playerStats),
          timestamp: Date.now() - (1000 * 60 * 10) // 10 minutes ago
        });
      }
      
      if (activityData.sprinting) {
        activityList.push({
          type: 'running',
          location: formatLocationString(playerStats),
          timestamp: Date.now() - (1000 * 60 * 7) // 7 minutes ago
        });
      }
    }
    
    console.log('Setting activities list:', activityList);
    setActivities(activityList);
  }, [playerStats]);
  
  // Helper function to format location string from player data
  const formatLocationString = (playerData, useWorld = false) => {
    if (!playerData) return 'Unknown';
    
    // If location data exists, use it
    if (playerData.location) {
      const loc = playerData.location;
      const world = loc.world || playerData.world || 'world';
      const biome = loc.biome ? ` (${loc.biome})` : '';
      
      // Format coordinates if available
      if (loc.x !== undefined && loc.y !== undefined && loc.z !== undefined) {
        return `${world}${biome} at ${Math.round(loc.x)}, ${Math.round(loc.y)}, ${Math.round(loc.z)}`;
      }
      
      // Use pre-formatted location string if available
      if (typeof loc === 'string') {
        return loc;
      }
    }
    
    // Fall back to just world info
    if (useWorld && playerData.world) {
      return `${playerData.world} world`;
    }
    
    return 'Unknown location';
  };
  
  if (!playerStats) {
    return (
      <div className={`minecraft-activity ${className} bg-white/5 p-4 rounded-md text-center`}>
        <p className="text-gray-400">No player activity available</p>
      </div>
    );
  }
  
  return (
    <div className={`minecraft-activity ${className}`}>
      {/* Current Activity */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <StatusIndicator active={currentActivity?.type !== 'offline'} />
          Current Activity
        </h3>
        
        {currentActivity?.type === 'offline' ? (
          <div className="bg-black/20 p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">😴</div>
            <p className="text-gray-300">Player is currently offline</p>
            <p className="text-sm text-gray-500 mt-1">
              Last seen {playerStats.lastSeen === 'Online now' ? 'Just now' : playerStats.lastSeen}
            </p>
          </div>
        ) : (
          <ActivityCard 
            activity={currentActivity}
            large
            current
          />
        )}
      </div>
      
      {/* Activity History */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Activity History</h3>
        
        <div className="space-y-2">
          {activities && activities.length > 0 
            ? activities
              .filter(a => a && (a.type !== currentActivity?.type || a.timestamp !== currentActivity?.timestamp))
              .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
              .slice(0, 5)
              .map((activity, index) => (
                <ActivityCard 
                  key={index} 
                  activity={activity}
                  index={index}
                />
              ))
            : <div className="bg-white/5 p-3 rounded-lg text-center">
                <p className="text-gray-400">No activity history available</p>
              </div>
          }
          
          {/* Removed duplicate empty state message */}
        </div>
      </div>
      
      {/* Play Patterns */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Play Patterns</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/5 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">📊</span>
              Activity Breakdown
            </h4>
            
            <div className="space-y-2">
              {/* Generate activity bars based on actual player stats */}
              {playerStats.blocks_mined ? (
                <ActivityBar 
                  type="mining" 
                  percentage={Math.min(Math.round((playerStats.blocks_mined / 1000) * 10), 100) || 5} 
                />
              ) : (
                <ActivityBar type="mining" percentage={5} />
              )}
              
              {playerStats.distance_traveled && playerStats.distance_traveled > 0 ? (
                <ActivityBar 
                  type="exploring" 
                  percentage={Math.min(Math.round((playerStats.distance_traveled / 10000) * 20), 100) || 10} 
                />
              ) : (
                <ActivityBar type="exploring" percentage={10} />
              )}
              
              {playerStats.mobs_killed ? (
                <ActivityBar 
                  type="combat" 
                  percentage={Math.min(Math.round((playerStats.mobs_killed / 500) * 15), 100) || 8} 
                />
              ) : (
                <ActivityBar type="combat" percentage={8} />
              )}
              
              {playerStats.items_crafted && playerStats.items_crafted > 0 ? (
                <ActivityBar 
                  type="crafting" 
                  percentage={Math.min(Math.round((playerStats.items_crafted / 200) * 10), 100) || 5} 
                />
              ) : (
                <ActivityBar type="crafting" percentage={5} />
              )}
              
              {/* Calculate fishing percentage if available */}
              {playerStats.fish_caught ? (
                <ActivityBar 
                  type="fishing" 
                  percentage={Math.min(Math.round((playerStats.fish_caught / 100) * 10), 100) || 3} 
                />
              ) : (
                <ActivityBar type="other" percentage={3} />
              )}
            </div>
          </div>
          
          <div className="bg-white/5 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">🕒</span>
              Active Hours
            </h4>
            
            <div className="grid grid-cols-6 gap-1">
              {[0, 1, 2, 3, 4, 5].map(row => (
                <React.Fragment key={row}>
                  {[0, 1, 2, 3].map(col => {
                    const hour = row * 4 + col;
                    // Activity levels: 0 = none, 1 = low, 2 = medium, 3 = high
                    const activityLevel = getActivityLevelForHour(hour);
                    return (
                      <div 
                        key={hour} 
                        className={`aspect-square rounded ${getActivityLevelColor(activityLevel)} flex items-center justify-center`}
                        title={`${hour}:00 - ${hour + 1}:00: ${getActivityLevelText(activityLevel)}`}
                      >
                        <span className="text-xs font-mono">{hour}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Hours shown in 24-hour format (UTC)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status indicator component
const StatusIndicator = ({ active = false }) => (
  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
);

// Activity card component
const ActivityCard = ({ activity, large = false, current = false, index = 0 }) => {
  // Add null check for activity
  if (!activity) {
    return (
      <div className="bg-white/5 p-3 rounded-lg text-center">
        <p className="text-gray-400">No activity data available</p>
      </div>
    );
  }
  
  const { type, location, timestamp } = activity;
  
  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'login': return '🔑';
      case 'logout': return '👋';
      case 'mining': return '⛏️';
      case 'combat': return '⚔️';
      case 'exploring': return '🧭';
      case 'building': return '🏗️';
      case 'crafting': return '🔨';
      case 'fishing': return '🎣';
      case 'farming': return '🌾';
      case 'trading': return '💰';
      case 'enchanting': return '✨';
      case 'brewing': return '⚗️';
      case 'riding': return '🐎';
      case 'flying': return '🦅';
      case 'swimming': return '🏊';
      case 'running': return '🏃';
      case 'walking': return '🚶';
      case 'sneaking': return '🤫';
      case 'jumping': return '🦘';
      case 'falling': return '⬇️';
      case 'gliding': return '🪂';
      case 'boating': return '🚣';
      case 'minecart': return '🚂';
      case 'horse_riding': return '🐎';
      case 'vehicle': return '🚗';
      case 'blocking': return '🛡️';
      default: return '❓';
    }
  };
  
  // Format activity type for display
  const formatActivityType = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get relative time from timestamp
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Get exact time from timestamp
  const getExactTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (error) {
      return '';
    }
  };
  
  return (
    <motion.div 
      className={`bg-white/5 p-3 rounded-lg flex ${large ? 'items-start' : 'items-center'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className={`${large ? 'h-14 w-14 text-3xl' : 'h-10 w-10 text-xl'} bg-black/20 rounded-full flex items-center justify-center mr-3`}>
        {getActivityIcon(type)}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className={`font-medium ${large ? 'text-lg' : 'text-base'}`}>
            {formatActivityType(type)}
            {current && (
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full animate-pulse">
                Now
              </span>
            )}
          </h4>
          <span className="text-sm text-gray-400">{getExactTime(timestamp)}</span>
        </div>
        
        {location && (
          <p className="text-sm text-gray-400">{location}</p>
        )}
        
        {!current && (
          <p className="text-xs text-gray-500 mt-1">{getRelativeTime(timestamp)}</p>
        )}
      </div>
    </motion.div>
  );
};

// Activity bar component
const ActivityBar = ({ type, percentage }) => {
  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'mining': return '⛏️';
      case 'combat': return '⚔️';
      case 'exploring': return '🧭';
      case 'building': return '🏗️';
      case 'crafting': return '🔨';
      default: return '❓';
    }
  };
  
  // Format activity type for display
  const formatActivityType = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <span className="mr-1">{getActivityIcon(type)}</span>
          <span className="text-sm">{formatActivityType(type)}</span>
        </div>
        <span className="text-sm">{percentage}%</span>
      </div>
      
      <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        ></motion.div>
      </div>
    </div>
  );
};

// Helper Functions
const getActivityLevelForHour = (hour) => {
  // This would typically be based on actual player data
  // For demo, we'll use some sample patterns
  
  // Late night (0-6): low activity
  if (hour >= 0 && hour < 6) {
    return hour % 3 === 0 ? 1 : 0;
  }
  
  // Morning (6-12): medium activity
  if (hour >= 6 && hour < 12) {
    return hour % 2 === 0 ? 2 : 1;
  }
  
  // Afternoon (12-18): high activity
  if (hour >= 12 && hour < 18) {
    return hour % 3 === 0 ? 3 : 2;
  }
  
  // Evening (18-24): high to medium activity
  return hour % 2 === 0 ? 3 : 2;
};

const getActivityLevelColor = (level) => {
  switch (level) {
    case 0: return 'bg-gray-800';
    case 1: return 'bg-blue-900/50';
    case 2: return 'bg-blue-700/50';
    case 3: return 'bg-blue-500/50';
    default: return 'bg-gray-800';
  }
};

const getActivityLevelText = (level) => {
  switch (level) {
    case 0: return 'No activity';
    case 1: return 'Low activity';
    case 2: return 'Medium activity';
    case 3: return 'High activity';
    default: return 'Unknown';
  }
};

export default MinecraftActivity;