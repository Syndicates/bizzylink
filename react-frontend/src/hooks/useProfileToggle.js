/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useProfileToggle.js
 * @description Hook for toggling between legacy and refactored Profile components
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'bizzy-profile-toggle';

export const useProfileToggle = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Initialize state from localStorage, URL params, or environment variable
  const [useLegacyProfile, setUseLegacyProfile] = useState(() => {
    // 1. Check URL parameter first (highest priority)
    const urlParam = searchParams.get('legacy');
    if (urlParam !== null) {
      return urlParam === 'true';
    }
    
    // 2. Check environment variable (development only)
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_LEGACY_PROFILE) {
      return process.env.REACT_APP_USE_LEGACY_PROFILE === 'true';
    }
    
    // 3. Check localStorage (persisted user preference)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // 4. Default to refactored version
    return false; // Force refactored version for debugging
  });

  // Update when URL parameters change
  useEffect(() => {
    const urlParam = searchParams.get('legacy');
    if (urlParam !== null) {
      const isLegacy = urlParam === 'true';
      setUseLegacyProfile(isLegacy);
      // Also update localStorage to persist the choice
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isLegacy));
    }
  }, [searchParams]);

  // Toggle function
  const toggleProfile = useCallback(() => {
    const newValue = !useLegacyProfile;
    setUseLegacyProfile(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
    
    // Update URL parameter to reflect the change
    const newSearchParams = new URLSearchParams(searchParams);
    if (newValue) {
      newSearchParams.set('legacy', 'true');
    } else {
      newSearchParams.delete('legacy');
    }
    setSearchParams(newSearchParams);
  }, [useLegacyProfile, searchParams, setSearchParams]);

  // Force set to legacy
  const setLegacyProfile = useCallback((value) => {
    setUseLegacyProfile(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set('legacy', 'true');
    } else {
      newSearchParams.delete('legacy');
    }
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // Get current profile component import
  const getProfileImport = useCallback(() => {
    if (useLegacyProfile) {
      return () => import('../pages/Profile');
    } else {
      return () => import('../pages/Profile.refactored');
    }
  }, [useLegacyProfile]);

  // Check if we're currently on a profile page
  const isProfilePage = location.pathname.startsWith('/profile/');

  return {
    useLegacyProfile,
    toggleProfile,
    setLegacyProfile,
    getProfileImport,
    isProfilePage,
    profileType: useLegacyProfile ? 'Legacy' : 'Refactored'
  };
}; 