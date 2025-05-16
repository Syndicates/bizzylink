import React from 'react';
import { motion } from 'framer-motion';

const LevelProgressBar = ({ level = 1, experience = 0, className = '' }) => {
  // Determine if level is above max (100)
  const isMaxLevel = level >= 100;
  const isOverpowered = level >= 150;
  const extraLevels = isMaxLevel ? level - 100 : 0;
  
  // Calculate tag based on level
  const getTag = () => {
    if (level >= 500) return "GOD MODE";
    if (level >= 400) return "IMMORTAL";
    if (level >= 350) return "LEGENDARY";
    if (level >= 300) return "MYTHICAL";
    if (level >= 250) return "GODLIKE";
    if (level >= 200) return "UNSTOPPABLE";
    if (level >= 150) return "OVERPOWERED";
    if (level >= 125) return "SUPERHUMAN";
    return null;
  };
  
  // Get tag-specific gradient colors
  const getTagGradient = () => {
    if (level >= 500) return "from-white via-yellow-300 to-yellow-500";
    if (level >= 400) return "from-blue-400 via-purple-500 to-pink-500";
    if (level >= 350) return "from-purple-500 to-pink-500";
    if (level >= 300) return "from-indigo-500 to-purple-500";
    if (level >= 250) return "from-cyan-500 to-blue-500";
    if (level >= 200) return "from-green-500 to-cyan-500";
    if (level >= 150) return "from-yellow-400 to-red-500";
    if (level >= 125) return "from-orange-400 to-amber-500";
    return "from-yellow-400 to-red-500";
  };
  
  const tag = getTag();
  
  // For rainbow animation - use the class instead of inline styles
  const rainbowStyles = {};
  
  // Enable different animations based on level tiers
  const getProgressBarClasses = () => {
    if (level >= 400) return "h-full rainbow-gradient-fast";
    if (level >= 300) return "h-full rainbow-gradient-sparkle";
    if (level >= 200) return "h-full rainbow-gradient-pulse";
    if (level >= 100) return "h-full rainbow-gradient";
    return "h-full";
  };
  
  // Color for standard progress bar based on progression
  const getProgressColor = () => {
    const expPercent = parseInt(experience);
    if (expPercent >= 90) return "bg-red-500";
    if (expPercent >= 75) return "bg-orange-500";
    if (expPercent >= 50) return "bg-yellow-500";
    if (expPercent >= 25) return "bg-green-500";
    return "bg-blue-500";
  };
  
  return (
    <div className={`level-progress-container ${className}`}>
      {/* Level indicator with tag if applicable */}
      <div className="flex justify-between text-sm mb-1">
        <div className="flex items-center">
          <span className="text-gray-400">Level Progress</span>
          {tag && (
            <span 
              className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r ${getTagGradient()} text-white shadow-lg animate-pulse`} 
              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
            >
              {tag}
            </span>
          )}
        </div>
        <span className="text-minecraft-habbo-blue">
          {isMaxLevel ? (
            <span 
              className="font-bold" 
              style={{ 
                color: level >= 200 ? '#ffd700' : undefined, 
                textShadow: level >= 200 ? '0px 0px 5px rgba(255, 215, 0, 0.5)' : undefined 
              }}
            >
              Level 100 (+{extraLevels})
            </span>
          ) : (
            `${experience}%`
          )}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="habbo-progress-bar">
        {isMaxLevel ? (
          <motion.div 
            className={getProgressBarClasses()}
            style={rainbowStyles}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8 }}
          />
        ) : (
          <motion.div 
            className={getProgressColor()}
            style={{ width: `${experience}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${experience}%` }}
            transition={{ duration: 0.8 }}
          />
        )}
      </div>
      
      {/* Maximum level indicator */}
      {isMaxLevel && (
        <div 
          className={`text-center mt-1 text-xs font-bold ${level >= 300 ? 'animate-bounce-slight' : ''}`} 
          style={{ 
            background: level >= 300 ? 
              'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)' : 
              'linear-gradient(to right, #ffcc33, #fff200, #ffcc33)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: level >= 300 ? 'rainbow-shift 2s linear infinite' : 'rainbow-shift 3s linear infinite',
            textShadow: '0px 0px 5px rgba(255, 215, 0, 0.4)'
          }}
        >
          {level >= 300 ? 'MAXIMUM POWER' : 'MAX LEVEL & climbing'}
        </div>
      )}
    </div>
  );
};

export default LevelProgressBar;