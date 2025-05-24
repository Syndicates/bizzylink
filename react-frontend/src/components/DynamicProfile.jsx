/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file DynamicProfile.jsx
 * @description Dynamic Profile component that switches between Legacy and Refactored versions
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfileToggle } from '../hooks/useProfileToggle';
import LoadingSpinner from './LoadingSpinner';

const DynamicProfile = () => {
  const location = useLocation();
  const { getProfileImport, profileType, useLegacyProfile, toggleProfile } = useProfileToggle();
  const [ProfileComponent, setProfileComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('[DynamicProfile] Rendering:', {
    useLegacyProfile,
    profileType,
    username: location.pathname.split('/').pop(),
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[ProfileToggle] Loading ${profileType} Profile component...`);
        
        const importFunc = getProfileImport();
        const module = await importFunc();
        
        if (module && module.default) {
          setProfileComponent(() => module.default);
          console.log(`[ProfileToggle] Successfully loaded ${profileType} Profile`);
        } else {
          throw new Error(`Failed to load ${profileType} Profile: No default export found`);
        }
      } catch (err) {
        console.error(`[ProfileToggle] Error loading ${profileType} Profile:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [getProfileImport, profileType]);

  // Show loading spinner while importing
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-gray-300">
          Loading {profileType} Profile...
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-sm text-gray-500">
            Dynamic component loading in progress
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-red-400 text-xl">
          ⚠️ Failed to Load Profile
        </div>
        <div className="text-gray-300 text-center max-w-md">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-minecraft-habbo-blue text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-800 rounded">
            Component: {profileType} Profile
          </div>
        )}
      </div>
    );
  }

  // Render the loaded Profile component
  if (ProfileComponent) {
    return <ProfileComponent />;
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-300">
        No Profile component available
      </div>
    </div>
  );
};

export default DynamicProfile; 