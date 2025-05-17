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
  
  // Get avatar URL based on type with improved fallback - using consistent usernames
  const getAvatarUrl = () => {
    const playerUuid = uuid || username;
    
    // Core set of reliable Minecraft usernames for consistent skin display
    const reliableUsernames = [
      'Notch', 'jeb_', 'Dinnerbone', 'Dream', 'GeorgeNotFound', 
      'Technoblade', 'Ph1LzA', 'TommyInnit', 'Sapnap', 'Skeppy'
    ];
    
    // If no username/uuid provided, use Steve (default skin)
    if (!playerUuid) {
      // Instead of random username which causes flickering, use Steve or a specified default
      return `https://mc-heads.net/avatar/MHF_Steve/${size}`;
    }
    
    // If the provided username is one of our reliable ones, use it directly
    // Otherwise, if it's a generic value like "player_head", use Steve
    const finalUsername = reliableUsernames.includes(playerUuid) ? 
      playerUuid : 
      (playerUuid === 'player_head' ? 'MHF_Steve' : playerUuid);
    
    // Direct URL to better Minecraft skin services
    switch (type) {
      case 'head':
        return `https://mc-heads.net/avatar/${finalUsername}/${size}`;
      case 'bust':
        return `https://mc-heads.net/head/${finalUsername}/${size}`;
      case 'full':
        return `https://mc-heads.net/body/${finalUsername}/${size}`;
      default:
        return `https://mc-heads.net/avatar/${finalUsername}/${size}`;
    }
  };
  
  // Handle image errors with consistent fallbacks
  const handleError = (e) => {
    console.log('Failed to load avatar from primary source, trying fallbacks');
    setHasError(true);
    
    // Directly use Steve skin as main fallback - much more reliable than random usernames
    const DEFAULT_SKIN = 'MHF_Steve';
    
    // Get consistent fallback username - either the one provided or a default
    const getFallbackUsername = () => {
      // If a specific popular username was provided, try to use it
      if (username && ['Notch', 'jeb_', 'Dinnerbone', 'Dream', 'GeorgeNotFound', 
                       'Technoblade', 'Ph1LzA', 'TommyInnit', 'Sapnap', 'Skeppy'].includes(username)) {
        return username;
      }
      
      // Otherwise use the default skin (Steve)
      return DEFAULT_SKIN;
    };
    
    const fallbackUsername = getFallbackUsername();
    
    // Try alternative services in sequence with consistent username
    if (e.target.src.includes('mc-heads.net')) {
      console.log('Trying minotar fallback');
      e.target.src = `https://minotar.net/avatar/${fallbackUsername}/${size}.png`;
      
      e.target.onerror = (e2) => {
        console.log('Trying crafatar fallback');
        e2.target.src = `https://crafatar.com/avatars/${fallbackUsername}?size=${size}&overlay=true`;
        
        e2.target.onerror = (e3) => {
          console.log('Using final skin fallback');
          // Use the default Steve skin as final fallback - most reliable option
          e3.target.src = `https://minotar.net/helm/${DEFAULT_SKIN}/${size}.png`;
        };
      };
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