/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftSkinViewer3D.js
 * @description Static Minecraft skin display using images from mc-heads.net
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';

/**
 * MinecraftSkinViewer3D - renamed for backwards compatibility but now uses static images
 */
const MinecraftSkinViewer3D = ({
  username,
  width = 300,
  height = 300,
  pose = 'idle',
  rotate = true,
  className = '',
  onClick = null
}) => {
  const [isError, setIsError] = useState(false);
  const playerName = username || 'MHF_Steve';
  
  // Different view types based on pose
  let viewType = 'body';
  if (pose === 'flying') {
    viewType = 'bust'; // Different crop for flying pose
  }
  
  // Build image URL from mc-heads.net
  const imageUrl = isError 
    ? '/minecraft-assets/steve.png' 
    : `https://mc-heads.net/${viewType}/${playerName}/${Math.max(width, height)}`;
  
  // Handle image load errors
  const handleError = () => {
    console.error(`Failed to load skin for ${playerName}, using default`);
    setIsError(true);
  };
  
  // Apply a simple CSS animation for rotation if enabled
  const style = {
    width: width,
    height: height,
    animation: rotate ? 'rotate-skin 10s infinite linear' : 'none',
  };
  
  return (
    <div 
      className={`minecraft-skin-static relative ${className}`}
      onClick={onClick}
      style={{
        width: width,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Add a global CSS rule for the rotation animation */}
      {rotate && (
        <style>
          {`
            @keyframes rotate-skin {
              from { transform: rotateY(0deg); }
              to { transform: rotateY(360deg); }
            }
          `}
        </style>
      )}
      
      <img
        src={imageUrl}
        alt={`${playerName}'s Minecraft skin`}
        className="rounded-md"
        style={style}
        onError={handleError}
      />
      
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 rounded text-white text-xs font-bold">
          Using default skin
        </div>
      )}
    </div>
  );
};

export default MinecraftSkinViewer3D; 