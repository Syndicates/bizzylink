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
 * @param {string} props.crop - Crop type for the avatar
 * @param {number} props.size - Size in pixels
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether to add hover animations
 * @param {boolean} props.showUsername - Whether to show username below avatar
 * @param {Function} props.onClick - Click handler
 */
const MinecraftAvatar = ({
  username = '',
  uuid = null,
  type = 'face', // default, head, bust, full, isometric, etc.
  crop = null,   // face, bust, full, etc.
  size = 64,
  className = '',
  animate = true,
  showUsername = false,
  onClick = null
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Always use username (mcUsername) for the playerIdentifier, never uuid
  const playerIdentifier = username || 'MHF_Steve';

  // Map your type/crop to API
  let renderType = 'default';
  let renderCrop = 'face';

  if (type === 'head') {
    renderType = 'head';
    renderCrop = 'full';
  } else if (type === 'bust') {
    renderType = 'default';
    renderCrop = 'bust';
  } else if (type === 'full') {
    renderType = 'default';
    renderCrop = 'full';
  } else if (type === 'isometric') {
    renderType = 'isometric';
    renderCrop = 'head';
  } else if (type === 'profile') {
    renderType = 'profile';
    renderCrop = 'face';
  } else if (type === 'face') {
    renderType = 'default';
    renderCrop = 'face';
  }

  // Allow override via crop prop
  if (crop) renderCrop = crop;

  // Compose the URL
  const starlightUrl = `https://starlightskins.lunareclipse.studio/render/${renderType}/${playerIdentifier}/${renderCrop}?scale=${size}`;

  // Fallbacks (as before)
  const fallbackUrls = [
    `https://visage.surgeplay.com/face/${size}/${playerIdentifier}`,
    `https://mc-heads.net/avatar/${playerIdentifier}/${size}`,
    `https://minotar.net/avatar/${playerIdentifier}/${size}.png`
  ];

  const [imgSrc, setImgSrc] = React.useState(starlightUrl);
  const [fallbackIndex, setFallbackIndex] = React.useState(0);

  const handleError = () => {
    if (fallbackIndex < fallbackUrls.length) {
      setImgSrc(fallbackUrls[fallbackIndex]);
      setFallbackIndex(fallbackIndex + 1);
    } else {
      setImgSrc('/minecraft-assets/steve.png');
    }
  };

  React.useEffect(() => {
    setImgSrc(starlightUrl);
    setFallbackIndex(0);
  }, [starlightUrl]);

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
          src={imgSrc}
          alt={username || 'Minecraft Player'}
          className={`w-full h-full rounded-md ${hasError ? 'opacity-70' : ''}`}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'contain' 
          }}
          onError={handleError}
          onLoad={() => { setIsLoading(false); setHasError(false); }}
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