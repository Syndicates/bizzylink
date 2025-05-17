import React, { useState } from 'react';
import { motion } from 'framer-motion';
import minecraftApi from '../services/minecraft-api';

/**
 * MinecraftItem component - displays Minecraft items with proper fallbacks
 * 
 * @param {Object} props
 * @param {string} props.name - Item name (e.g. "diamond_sword", "grass_block")
 * @param {number} props.size - Size of item in pixels (default: 64)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether item should have hover animation
 * @param {boolean} props.showTooltip - Whether to show item name on hover
 * @param {string} props.tooltipText - Custom tooltip text (defaults to item name)
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.pixelated - Whether to apply pixelated rendering
 * @param {string} props.source - API source ('mineapi', 'mcStatic', or 'local')
 */
const MinecraftItem = ({
  name,
  size = 64,
  className = '',
  animate = true,
  showTooltip = false,
  tooltipText = '',
  onClick = null,
  pixelated = true,
  source = 'mineapi'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSource, setCurrentSource] = useState(source);
  const [showingTooltip, setShowingTooltip] = useState(false);
  
  // Format the item name for display
  const formattedName = name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
  
  // Get image URL based on source and handle fallbacks
  const getImageUrl = () => {
    return minecraftApi.getItemImageUrl(name, size, currentSource);
  };
  
  // Handle image loading error with fallbacks
  const handleError = () => {
    setHasError(true);
    
    // Try fallback sources in sequence
    if (currentSource === 'mineapi') {
      setCurrentSource('mcStatic');
    } else if (currentSource === 'mcStatic') {
      setCurrentSource('local');
    }
  };
  
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  // Animation variants for hover effect
  const itemVariants = animate ? {
    hover: { 
      y: -5, 
      scale: 1.1,
      rotate: [0, 1, 0, -1, 0],
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  } : {};
  
  return (
    <div className="relative inline-block">
      <motion.div
        className={`minecraft-item-container ${className}`}
        whileHover={animate ? "hover" : undefined}
        whileTap={animate ? "tap" : undefined}
        variants={itemVariants}
        onHoverStart={() => showTooltip && setShowingTooltip(true)}
        onHoverEnd={() => showTooltip && setShowingTooltip(false)}
        onClick={onClick}
        style={{ width: size, height: size }}
      >
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-md"
            style={{ width: size, height: size }}
          >
            <div className="h-1/3 w-1/3 rounded-full border-2 border-transparent border-t-minecraft-green animate-spin"></div>
          </div>
        )}
        
        <img
          src={getImageUrl()}
          alt={formattedName}
          className={`w-full h-full ${pixelated ? 'pixel-art' : ''} ${hasError ? 'opacity-70' : ''}`}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'contain'
          }}
          onError={handleError}
          onLoad={handleLoad}
        />
        
        {/* Add shadow effect under item */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-2 bg-black/20 blur-sm rounded-full"></div>
        
        {/* Tooltip */}
        {showingTooltip && (
          <motion.div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-8px] z-50 bg-gray-900/90 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {tooltipText || formattedName}
            <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/90"></div>
          </motion.div>
        )}
        
      </motion.div>
    </div>
  );
};

export default MinecraftItem;