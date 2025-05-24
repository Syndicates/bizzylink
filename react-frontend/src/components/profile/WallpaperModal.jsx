/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file WallpaperModal.jsx
 * @description Wallpaper selection modal component for profile cover changes
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Wallpaper definitions matching legacy Profile.js
const WALLPAPERS = [
  { id: "herobrine_hill", name: "Herobrine Hill", external: true },
  { id: "quick_hide", name: "Quick Hide", external: true },
  { id: "malevolent", name: "Malevolent", external: true },
  { id: "sunset_lake", name: "Sunset Lake", custom: true },
  { id: "pink_sky", name: "Pink Sky", custom: true },
  { id: "night_adventure", name: "Night Adventure", custom: true },
];

// Helper functions matching legacy Profile.js
const getWallpaperUrl = (id, username) => {
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  if (wallpaper.external) {
    const safeUsername = username || "Steve";
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${safeUsername}`;
  }

  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

const getWallpaperThumb = (id) => {
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  if (wallpaper.external) {
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/Steve?thumb=1`;
  }

  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

const WallpaperModal = ({ 
  currentWallpaper, 
  onSelect, 
  onConfirm, 
  onClose, 
  saving = false 
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);

  const handleWallpaperSelect = (wallpaperId) => {
    setSelectedWallpaper(wallpaperId);
    // Add a small delay to show the selection feedback
    setTimeout(() => {
      onConfirm?.(wallpaperId);
    }, 200);
  };

  const handleImageLoad = (wallpaperId) => {
    setLoadedImages(prev => new Set([...prev, wallpaperId]));
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(wallpaperId);
      return newSet;
    });
  };

  const handleImageLoadStart = (wallpaperId) => {
    setLoadingImages(prev => new Set([...prev, wallpaperId]));
  };

  // Preload images when modal opens
  useEffect(() => {
    WALLPAPERS.forEach(wallpaper => {
      const img = new Image();
      img.onload = () => handleImageLoad(wallpaper.id);
      img.onerror = () => handleImageLoad(wallpaper.id); // Consider failed loads as "loaded" to show placeholder
      handleImageLoadStart(wallpaper.id);
      img.src = getWallpaperThumb(wallpaper.id);
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            🖼️ Change Cover Image
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={saving}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {WALLPAPERS.map((wallpaper) => {
              const isLoaded = loadedImages.has(wallpaper.id);
              const isLoading = loadingImages.has(wallpaper.id);
              const isSelected = selectedWallpaper === wallpaper.id;
              const isCurrent = currentWallpaper === wallpaper.id;
              
              return (
                <div key={wallpaper.id} className="relative group">
                  <button
                    onClick={() => handleWallpaperSelect(wallpaper.id)}
                    className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 transform ${
                      isSelected 
                        ? 'border-green-500 scale-105 ring-4 ring-green-500/30' 
                        : isCurrent 
                          ? 'border-blue-500' 
                          : 'border-transparent hover:border-blue-500'
                    }`}
                    disabled={saving || isSelected}
                  >
                    {/* Loading skeleton */}
                    {isLoading && (
                      <div className="w-full h-full bg-gray-700 animate-pulse flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                    
                    {/* Wallpaper image */}
                    <img
                      src={getWallpaperThumb(wallpaper.id)}
                      alt={wallpaper.name}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => handleImageLoad(wallpaper.id)}
                      onLoadStart={() => handleImageLoadStart(wallpaper.id)}
                    />
                    
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-black transition-all duration-300 flex items-center justify-center ${
                      isSelected ? 'bg-opacity-50' : 'bg-opacity-0 group-hover:bg-opacity-30'
                    }`}>
                      <span className={`text-white font-medium transition-all duration-300 transform ${
                        isSelected 
                          ? 'opacity-100 scale-110' 
                          : 'opacity-0 group-hover:opacity-100 group-hover:scale-110'
                      }`}>
                        {isSelected ? '✓ Applying...' : wallpaper.name}
                      </span>
                    </div>
                  </button>
                  
                  {/* Current wallpaper indicator */}
                  {isCurrent && !isSelected && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded animate-in slide-in-from-top duration-300">
                      Current
                    </div>
                  )}

                  {/* Selected wallpaper indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded animate-in slide-in-from-top duration-300">
                      <span className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                        Applying
                      </span>
                    </div>
                  )}

                  {/* Loading overlay for saving */}
                  {saving && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-in fade-in duration-200">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {saving && (
            <div className="mt-4 text-center text-gray-400 animate-in slide-in-from-bottom duration-300">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Updating cover image...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WallpaperModal; 