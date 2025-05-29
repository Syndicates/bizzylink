/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileCoverImage.jsx
 * @description Profile cover image component with loading states and wallpaper change functionality
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { PhotoIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

// Configuration constants
const IMAGE_LOAD_TIMEOUT = 10000; // 10 seconds timeout
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 second

const ProfileCoverImage = ({
  coverImage,
  username,
  isOwnProfile,
  onWallpaperSelect,
  onOpenSettings,
  savingWallpaper = false,
  children // For social stats overlay
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for cleanup
  const loadTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const imageRef = useRef(null);

  /**
   * Get default cover image if none provided
   * @param {string} username - Username for cover generation
   * @returns {string} Cover image URL
   */
  const getDefaultCover = useCallback((username) => {
    // Use a fast, reliable default image
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/night_adventure/${username || 'Steve'}`;
  }, []);

  /**
   * Handle image load success
   */
  const handleImageLoad = useCallback(() => {
    // Clear any pending timeouts
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setImageLoaded(true);
    setImageError(false);
  }, []);

  /**
   * Handle image load error with retry logic
   */
  const handleImageError = useCallback(() => {
    console.warn('[ProfileCoverImage] Cover image failed to load:', coverImage);
    
    // Clear load timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    // Retry if we haven't exceeded max attempts
    if (retryCount < RETRY_ATTEMPTS) {
      console.log(`[ProfileCoverImage] Retrying image load (${retryCount + 1}/${RETRY_ATTEMPTS})...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Force image reload by clearing and resetting src
        if (imageRef.current) {
          const src = imageRef.current.src;
          imageRef.current.src = '';
          imageRef.current.src = src;
        }
      }, RETRY_DELAY);
    } else {
      console.error('[ProfileCoverImage] Max retry attempts reached, showing fallback');
      setImageError(true);
      setImageLoaded(true); // Set loaded to remove spinner
    }
  }, [coverImage, retryCount]);

  /**
   * Reset image loading state when cover image changes
   */
  useEffect(() => {
    // Reset all states
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    // Clear any pending timeouts
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Set a timeout to force loaded state if image takes too long
    if (coverImage) {
      loadTimeoutRef.current = setTimeout(() => {
        console.warn('[ProfileCoverImage] Image load timeout, forcing loaded state');
        setImageLoaded(true);
      }, IMAGE_LOAD_TIMEOUT);
    }
    
    // Cleanup on unmount or cover change
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [coverImage]);

  // Determine which image to show
  const displayImage = imageError || !coverImage 
    ? getDefaultCover(username)
    : coverImage;

  return (
    <div className="h-48 bg-minecraft-navy-dark rounded-t-md overflow-hidden relative">
      {/* Loading overlay - only show while loading */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Main cover image - always rendered but with transitions */}
      <img
        ref={imageRef}
        src={displayImage}
        alt="Profile Cover"
        className="w-full h-full object-cover absolute inset-0"
        style={{
          filter: imageLoaded ? 'blur(0px)' : 'blur(20px)',
          opacity: imageLoaded ? 1 : 0.7,
          transform: imageLoaded ? 'scale(1)' : 'scale(1.1)',
          transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 10
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager" // Load immediately
      />

      {/* Wallpaper Change Loading Overlay */}
      {savingWallpaper && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 animate-in fade-in duration-300">
          {/* Animated Loading Ring */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Loading Text with Animation */}
          <div className="mt-4 text-center">
            <div className="text-white font-medium text-lg animate-pulse">
              Updating Wallpaper...
            </div>
            <div className="text-gray-300 text-sm mt-1">
              <span className="inline-flex">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-32 h-1 bg-gray-600 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse" 
                 style={{
                   animation: 'progress 2s ease-in-out infinite',
                   background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)'
                 }}>
            </div>
          </div>
        </div>
      )}

      {/* Social Stats Overlay (passed as children) */}
      {children}

      {/* Cover Image Change Button */}
      {isOwnProfile && (
        <button
          onClick={() => onWallpaperSelect?.()}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-md flex items-center text-sm"
          style={{ 
            zIndex: 9999,
            position: 'absolute'
          }}
        >
          <PhotoIcon className="h-4 w-4 mr-1" />
          Change Cover
        </button>
      )}

      {/* Gear icon for Manage Profile (only for own profile) */}
      {isOwnProfile && (
        <div className="absolute top-3 left-3 z-40 group">
          <button
            type="button"
            className="p-2 rounded-full bg-minecraft-navy-light hover:bg-minecraft-habbo-blue transition-colors relative group"
            title="Manage Profile"
            aria-label="Manage Profile"
            onClick={() => onOpenSettings?.()}
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-300 group-hover:text-white" />
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Manage Profile
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

ProfileCoverImage.propTypes = {
  coverImage: PropTypes.string,
  username: PropTypes.string.isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  onWallpaperSelect: PropTypes.func,
  onOpenSettings: PropTypes.func,
  savingWallpaper: PropTypes.bool,
  children: PropTypes.node
};

export default memo(ProfileCoverImage); 