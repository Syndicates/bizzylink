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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MinecraftSkinViewer3D from './MinecraftSkinViewer3D';
import MinecraftAvatarError from './MinecraftAvatarError';

/**
 * MinecraftAvatar component - displays a Minecraft player avatar
 * 
 * @param {Object} props
 * @param {string} props.username - Minecraft username
 * @param {string} props.uuid - Minecraft UUID (takes precedence over username)
 * @param {string} props.type - Type of avatar ('head', 'bust', 'full', '3d', '3d-walking', '3d-running', '3d-flying')
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
  const [imgSrc, setImgSrc] = useState(`https://mc-heads.net/avatar/${username || 'MHF_Steve'}/${size}`);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Always use username (mcUsername) for the playerIdentifier, never uuid
  const playerIdentifier = username || 'MHF_Steve';
  
  // Check if we should use 3D renderer
  const is3D = type.startsWith('3d');
  
  // If using 3D renderer, determine the pose
  let pose = 'idle';
  if (is3D) {
    if (type === '3d-walking') pose = 'walking';
    if (type === '3d-running') pose = 'running';
    if (type === '3d-flying') pose = 'flying';
  }
  
  // Compose the URL with our proxy as primary source, then fallbacks
  const proxyUrl = `/api/minecraft/skin/${playerIdentifier}`;
  
  // Fallbacks (in order of preference)
  const fallbackUrls = [
    `https://mineskin.eu/avatar/${playerIdentifier}/${size}`,
    `https://mc-heads.net/avatar/${playerIdentifier}/${size}`,
    `https://minotar.net/avatar/${playerIdentifier}/${size}.png`,
    `/minecraft-assets/steve.png` // Local fallback
  ];

  // Handle image load errors
  const handleError = () => {
    console.log(`Avatar load failed for ${playerIdentifier}, trying fallback ${fallbackIndex}`);
    if (fallbackIndex < fallbackUrls.length) {
      setImgSrc(fallbackUrls[fallbackIndex]);
      setFallbackIndex(fallbackIndex + 1);
    } else {
      console.log(`All fallbacks failed for ${playerIdentifier}, using local Steve skin`);
      setImgSrc('/minecraft-assets/steve.png');
      setHasError(true);
    }
  };

  // Update image source when username or properties change
  useEffect(() => {
    if (!is3D) {
      // Use a reliable direct service instead of proxy
      setImgSrc(`https://mineskin.eu/avatar/${playerIdentifier}/${size}`);
      setFallbackIndex(0);
      setHasError(false);
    }
  }, [proxyUrl, is3D, playerIdentifier, size]);

  // Animation variants
  const avatarVariants = animate ? {
    hover: { 
      y: -5, 
      scale: 1.05,
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  } : {};

  // For 3D avatars, render the 3D component
  if (is3D) {
    return (
      <div className={`relative inline-block ${className}`}>
        <MinecraftSkinViewer3D 
          username={playerIdentifier}
          width={size}
          height={size}
          pose={pose.replace('3d-', '')}
          rotate={animate}
          className={className}
          onClick={onClick}
        />
        {showUsername && playerIdentifier && (
          <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-white font-minecraft">
            {playerIdentifier}
          </div>
        )}
      </div>
    );
  }

  // For 2D avatars, render the image
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
          alt={playerIdentifier || 'Minecraft Player'}
          className={`w-full h-full rounded-md ${hasError ? 'opacity-70' : ''}`}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'contain' 
          }}
          onError={handleError}
          onLoad={() => { setIsLoading(false); setHasError(false); }}
        />
        
        {/* Show error component when image fails to load */}
        {hasError && !isLoading && (
          <div className="absolute inset-0">
            <MinecraftAvatarError 
              size={size}
              username={playerIdentifier}
            />
          </div>
        )}
        
        {/* Username if requested */}
        {showUsername && playerIdentifier && (
          <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-white font-minecraft">
            {playerIdentifier}
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