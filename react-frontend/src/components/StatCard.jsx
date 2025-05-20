/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 * 
 * @file StatCard.jsx
 * @description Enhanced stat card component with animations for changing values
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState, useRef } from 'react';
import '../dashboard-stat-update.css';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * An enhanced stat card component that animates when values change
 * @param {Object} props Component props
 * @param {React.ReactNode} props.icon Icon element to display
 * @param {String} props.label Label for the stat
 * @param {String|Number} props.value Current value of the stat
 * @param {Boolean} props.changed Whether the value has just changed (for external animations)
 * @param {Boolean} props.increased Whether the value has increased (for direction-specific animations)
 * @param {String} props.highlightColor Optional color to use for highlighting changes (defaults to "text-minecraft-habbo-blue")
 * @param {String} props.statType Optional stat type identifier (e.g. 'level', 'balance') for direct DOM targeting
 */
const StatCard = ({ 
  icon, 
  label, 
  value, 
  changed = false,
  increased = false,
  highlightColor = "text-minecraft-habbo-blue",
  statType = null
}) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isHighlighted, setIsHighlighted] = useState(changed);
  const timeoutRef = useRef(null);
  
  // Extract stat type from label if not provided
  const derivedStatType = statType || label.toLowerCase().replace(/\s+/g, '_');
  
  // Check for value changes to trigger animation
  useEffect(() => {
    // If value has changed, trigger animation
    if ((value !== prevValue && prevValue !== undefined) || changed) {
      // Cancel any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set highlighted state
      setIsHighlighted(true);
      
      // Clear highlighted state after animation
      timeoutRef.current = setTimeout(() => {
        setIsHighlighted(false);
      }, 2000); // Duration of highlight effect in ms
    }
    
    // Update previous value for next comparison
    setPrevValue(value);
    
    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, prevValue, changed, derivedStatType]);
  
  // Generate a unique ID based on the label for DOM targeting
  const statId = `player-stat-${derivedStatType}`;
  
  // Determine appropriate animation class based on the stat type
  const getAnimationClass = () => {
    if (derivedStatType === 'level' || label.toLowerCase().includes('level')) {
      return 'stat-level-updated';
    }
    return 'stat-updated';
  };

  return (
    <div 
      id={statId}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col justify-between transition-all duration-300 ${isHighlighted ? getAnimationClass() : ''}`}
      data-stat={derivedStatType}
      data-stat-id={statId}
    >
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-full ${highlightColor} bg-opacity-10`}>
          {icon}
        </div>
        <h3 
          className="ml-3 text-gray-600 dark:text-gray-300 text-sm font-medium stat-label"
          data-stat-label={derivedStatType}
        >
          {label}
        </h3>
      </div>
      
      <div className="flex justify-between items-end">
        <AnimatePresence mode="wait">
          <motion.div 
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isHighlighted ? [1, 1.1, 1] : 1
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              duration: 0.3,
              scale: { duration: 0.5, ease: "easeInOut" }
            }}
            className={`text-2xl font-bold stat-value ${isHighlighted ? highlightColor : 'text-gray-800 dark:text-white'}`}
            data-stat-value={derivedStatType}
            data-stat-type={derivedStatType}
          >
            {value || '0'}
          </motion.div>
        </AnimatePresence>
        
        {/* Show increase amount when value changes */}
        {isHighlighted && typeof value === 'number' && typeof prevValue === 'number' && value > prevValue && (
          <motion.div 
            className="absolute -top-4 right-2 text-xs text-green-400 font-bold bg-green-100 dark:bg-green-900 rounded-full px-1.5 py-0.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            +{(value - prevValue).toFixed(prevValue % 1 === 0 ? 0 : 2)}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StatCard;