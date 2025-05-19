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

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * An enhanced stat card component that animates when values change
 * @param {Object} props Component props
 * @param {React.ReactNode} props.icon Icon element to display
 * @param {String} props.label Label for the stat
 * @param {String|Number} props.value Current value of the stat
 * @param {String} props.highlightColor Optional color to use for highlighting changes (defaults to "text-minecraft-habbo-blue")
 */
const StatCard = ({ icon, label, value, highlightColor = "text-minecraft-habbo-blue" }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const timeoutRef = useRef(null);
  
  // Check for value changes to trigger animation
  useEffect(() => {
    // If value has changed, trigger animation
    if (value !== prevValue && prevValue !== undefined) {
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
  }, [value, prevValue]);
  
  return (
    <div className={`bg-white/5 p-3 rounded-habbo text-center transition-all duration-300 ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      
      <AnimatePresence mode="wait">
        <motion.p
          key={value}
          className={`text-lg font-bold ${isHighlighted ? highlightColor : ''}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.p>
      </AnimatePresence>
      
      {isHighlighted && (
        <motion.div 
          className="relative"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          <motion.div 
            className="absolute bottom-0 left-0 right-0 mx-auto text-xs text-green-400 font-medium"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            transition={{ duration: 1.5 }}
          >
            {typeof value === 'number' && typeof prevValue === 'number' ? 
              `+${(value - prevValue).toFixed(prevValue % 1 === 0 ? 0 : 2)}` : 
              '✓'}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default StatCard; 