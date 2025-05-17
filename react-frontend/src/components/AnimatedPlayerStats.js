/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file AnimatedPlayerStats.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useRealTimeStats from '../hooks/useRealTimeStats';

// Stat card animation settings
const cardVariants = {
  initial: { opacity: 0.8, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0.8, scale: 0.95, transition: { duration: 0.2 } }
};

// Value animation settings
const valueVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
};

const AnimatedPlayerStats = ({ 
  initialStats = null, 
  className = '',
  showTitle = true,
  inline = false,
  compact = false,
  refreshInterval = 0 // 0 means no auto-refresh
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Use our hook with disabled polling and cache enabled to prevent API spam
  const { stats, loading, error, refreshStats, clearAnimations, lastUpdated } = useRealTimeStats(initialStats, {
    disablePolling: true,        // Explicitly disable polling
    cacheData: true              // Use the cache
  });

  // Handle manual refresh
  const handleRefresh = () => {
    refreshStats();
    setLastRefresh(Date.now());
  };

  // Clear animation flags after they've had time to play
  useEffect(() => {
    if (stats && lastUpdated) {
      setAnimationClass('animate');
      
      const timeout = setTimeout(() => {
        setAnimationClass('');
        clearAnimations();
      }, 3000); // Clear animations after 3 seconds
      
      return () => clearTimeout(timeout);
    }
  }, [stats, lastUpdated, clearAnimations]);
  
  // Optional auto-refresh based on props
  useEffect(() => {
    if (refreshInterval <= 0) return; // Disabled
    
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (error) {
    return (
      <div className={`text-red-400 p-2 ${className}`}>
        Error loading player stats: {error}
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-300/20 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-300/20 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-300/20 rounded w-5/6"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-gray-400 p-2 ${className}`}>
        No player statistics available
      </div>
    );
  }

  // Format helper functions 
  const formatTime = (minutes) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  // Choose layout based on props
  if (compact) {
    return (
      <div className={`player-stats-compact ${className} ${animationClass}`}>
        {showTitle && <h3 className="text-lg font-semibold mb-2">Player Stats</h3>}
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatItem 
            label="Playtime" 
            value={formatTime(stats.playtime_minutes || stats.time_played)} 
            changed={stats.playtime_minutes_changed || stats.time_played_changed}
            increased={stats.playtime_minutes_increased || stats.time_played_increased}
          />
          
          <StatItem 
            label="Balance" 
            value={`$${formatNumber(stats.balance)}`} 
            changed={stats.balance_changed}
            increased={stats.balance_increased}
          />
          
          <StatItem 
            label="Blocks Mined" 
            value={formatNumber(stats.blocks_mined)} 
            changed={stats.blocks_mined_changed}
            increased={stats.blocks_mined_increased}
          />
          
          <StatItem 
            label="Mobs Killed" 
            value={formatNumber(stats.mobs_killed)} 
            changed={stats.mobs_killed_changed}
            increased={stats.mobs_killed_increased}
          />
        </div>
        
        <button 
          onClick={handleRefresh} 
          className="text-xs text-gray-400 hover:text-white mt-2 underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Full layout
  return (
    <div className={`player-stats ${className} ${animationClass}`}>
      {showTitle && <h3 className="text-xl font-minecraft text-minecraft-yellow mb-4">Player Statistics</h3>}
      
      <div className={inline ? "flex flex-wrap gap-4" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
        <StatCard 
          label="Playtime" 
          value={formatTime(stats.playtime_minutes || stats.time_played)} 
          icon={<ClockIcon className="w-5 h-5" />}
          changed={stats.playtime_minutes_changed || stats.time_played_changed}
          increased={stats.playtime_minutes_increased || stats.time_played_increased}
        />
        
        <StatCard 
          label="Balance" 
          value={`$${formatNumber(stats.balance)}`} 
          icon={<CoinIcon className="w-5 h-5" />}
          changed={stats.balance_changed}
          increased={stats.balance_increased}
        />
        
        <StatCard 
          label="Blocks Mined" 
          value={formatNumber(stats.blocks_mined)} 
          icon={<PickaxeIcon className="w-5 h-5" />}
          changed={stats.blocks_mined_changed}
          increased={stats.blocks_mined_increased}
        />
        
        <StatCard 
          label="Mobs Killed" 
          value={formatNumber(stats.mobs_killed)} 
          icon={<SwordIcon className="w-5 h-5" />}
          changed={stats.mobs_killed_changed}
          increased={stats.mobs_killed_increased}
        />
        
        <StatCard 
          label="Deaths" 
          value={formatNumber(stats.deaths)} 
          icon={<SkullIcon className="w-5 h-5" />}
          changed={stats.deaths_changed}
          increased={stats.deaths_increased}
        />
        
        <StatCard 
          label="Last Seen" 
          value={stats.lastSeen || 'Now'} 
          icon={<EyeIcon className="w-5 h-5" />}
        />
      </div>
      
      <div className="text-right mt-4">
        <button 
          onClick={handleRefresh} 
          className="text-sm text-minecraft-habbo-blue hover:text-minecraft-habbo-green"
        >
          Refresh Stats
        </button>
        {lastUpdated && (
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

// Statistic Card Component with animations
const StatCard = ({ label, value, icon, changed, increased }) => {
  return (
    <div className={`stat-card p-3 bg-minecraft-navy-dark/50 border border-minecraft-navy rounded-md relative ${changed ? 'changed' : ''}`}>
      {changed && (
        <motion.div 
          className="absolute inset-0 bg-green-500/20 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      <div className="flex items-center mb-2">
        <div className="mr-2 text-minecraft-habbo-blue">
          {icon}
        </div>
        <div className="text-sm text-gray-400">{label}</div>
        
        {changed && increased && (
          <motion.div 
            className="ml-auto text-green-400 text-xs"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            ▲
          </motion.div>
        )}
        
        {changed && !increased && (
          <motion.div 
            className="ml-auto text-red-400 text-xs"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            ▼
          </motion.div>
        )}
      </div>
      
      <div className="text-lg font-medium">
        {changed ? (
          <motion.div
            initial={{ scale: 1.2, color: increased ? '#4ADE80' : '#F87171' }}
            animate={{ scale: 1, color: '#FFFFFF' }}
            transition={{ duration: 1 }}
          >
            {value}
          </motion.div>
        ) : (
          value
        )}
      </div>
    </div>
  );
};

// Simple Stat Item for compact view
const StatItem = ({ label, value, changed, increased }) => {
  return (
    <>
      <div className="text-sm text-gray-400">{label}:</div>
      <div className={`text-sm ${changed ? (increased ? 'text-green-400' : 'text-red-400') : ''}`}>
        {value}
        {changed && increased && <span className="ml-1">▲</span>}
        {changed && !increased && <span className="ml-1">▼</span>}
      </div>
    </>
  );
};

// Icon Components
const ClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CoinIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PickaxeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

const SwordIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SkullIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default AnimatedPlayerStats; 