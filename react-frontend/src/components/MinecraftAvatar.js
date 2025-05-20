/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftAvatar.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import minecraftApi from '../services/minecraft-api';

/**
 * MinecraftAvatar component - displays a Minecraft player avatar
 * 
 * @param {Object} props
 * @param {string} props.username - Minecraft username
 * @param {string} props.uuid - Minecraft UUID (takes precedence over username)
 * @param {string} props.type - Type of avatar ('head', 'bust', 'full')
 * @param {number} props.size - Size in pixels
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether to add hover animations
 * @param {boolean} props.showUsername - Whether to show username below avatar
 * @param {Function} props.onClick - Click handler
 */
const MinecraftAvatar = ({
  username = '',
  uuid = null,
  type = 'head',
  size = 64,
  className = '',
  animate = true,
  showUsername = false,
  onClick = null
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Get avatar URL based on type with improved fallback
  const getAvatarUrl = () => {
    const playerIdentifier = uuid || username || 'MHF_Steve'; // Use MHF_Steve if no identifier

    // Use Visage as the primary source, adjust endpoint based on type
    switch (type) {
      case 'head':
      case 'face': // Allow 'face' as an alias for 'head' type
        return `https://visage.surgeplay.com/face/${size}/${playerIdentifier}`;
      case 'avatar': // Visage's generic avatar endpoint
        return `https://visage.surgeplay.com/avatar/${size}/${playerIdentifier}`;
      case 'bust':
        return `https://visage.surgeplay.com/bust/${size}/${playerIdentifier}`;
      case 'full':
        return `https://visage.surgeplay.com/full/${size}/${playerIdentifier}`;
      default:
        return `https://visage.surgeplay.com/face/${size}/${playerIdentifier}`; // Default to face
    }
  };
  
  // Handle image errors with consistent fallbacks
  const handleError = (e) => {
    setIsLoading(false); // Stop loading indicator on error
    setHasError(true);

    const currentSrc = e.target.src;
    const playerIdentifier = uuid || username; // Use the actual identifier for fallbacks if available

    if (!playerIdentifier) { // If no identifier, just use a placeholder or Steve directly
      e.target.src = `https://mc-heads.net/avatar/MHF_Steve/${size}`; // Default to Steve if no username/UUID
      e.target.onerror = () => { // Final placeholder if Steve also fails (unlikely for mc-heads)
        e.target.src = `https://via.placeholder.com/${size}?text=MC`;
        e.target.onerror = null;
      };
      return;
    }

    // Fallback chain
    if (currentSrc.includes('visage.surgeplay.com')) {
      console.log('Visage failed, trying PlayerDB for:', playerIdentifier);
      e.target.src = `https://playerdb.co/api/player/minecraft/${playerIdentifier}/avatar?size=${size}`;
    } else if (currentSrc.includes('playerdb.co')) {
      console.log('PlayerDB failed, trying mc-heads for:', playerIdentifier);
      e.target.src = `https://mc-heads.net/avatar/${playerIdentifier}/${size}`;
    } else if (currentSrc.includes('mc-heads.net')) {
      console.log('mc-heads failed, trying Minotar for:', playerIdentifier);
      e.target.src = `https://minotar.net/avatar/${playerIdentifier}/${size}.png`;
    } else if (currentSrc.includes('minotar.net')) {
      console.log('Minotar failed, using placeholder for:', playerIdentifier);
      e.target.src = `https://via.placeholder.com/${size}?text=MC`;
      e.target.onerror = null; // Stop the error loop
    } else {
      // If it's an unknown source or something went wrong, just use placeholder
      console.log('Unknown source failed, using placeholder for:', playerIdentifier);
      e.target.src = `https://via.placeholder.com/${size}?text=MC`;
      e.target.onerror = null;
    }
  };
  
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  // Animation variants
  const avatarVariants = animate ? {
    hover: { 
      y: -5, 
      scale: 1.05,
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  } : {};
  
  return (
    <div className="relative inline-block">
      <motion.div
        className={`minecraft-avatar ${className}`}
        whileHover={animate ? "hover" : undefined}
        whileTap={animate ? "tap" : undefined}
        variants={avatarVariants}
        onClick={onClick}
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
          src={getAvatarUrl()}
          alt={username || 'Minecraft Player'}
          className={`w-full h-full rounded-md ${hasError ? 'opacity-70' : ''}`}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'contain' 
          }}
          onError={handleError}
          onLoad={handleLoad}
        />
        
        {/* Username if requested */}
        {showUsername && username && (
          <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-white font-minecraft">
            {username}
          </div>
        )}
        
        {/* Add glow effect for hover */}
        {animate && (
          <motion.div 
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ boxShadow: '0 0 0 rgba(84, 170, 84, 0)' }}
            whileHover={{ boxShadow: '0 0 10px rgba(84, 170, 84, 0.5)' }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default MinecraftAvatar;