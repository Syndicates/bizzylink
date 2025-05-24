/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileToggle.jsx
 * @description Toggle component for switching between Legacy and Refactored Profile views
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { ArrowPathIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useProfileToggle } from '../hooks/useProfileToggle';

const ProfileToggle = ({ className = '', showLabel = false, size = 'md' }) => {
  const { useLegacyProfile, toggleProfile, profileType, isProfilePage } = useProfileToggle();

  // Size variants
  const sizes = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  };

  const sizeClasses = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={toggleProfile}
        className={`
          ${sizeClasses.button}
          flex items-center space-x-2
          bg-white/10 hover:bg-white/20 
          border border-white/20 hover:border-white/30
          rounded-lg transition-all duration-200
          text-white hover:text-minecraft-habbo-blue
          ${isProfilePage ? 'ring-2 ring-minecraft-habbo-blue/50' : ''}
        `}
        title={`Switch to ${useLegacyProfile ? 'Refactored' : 'Legacy'} Profile`}
      >
        {/* Icon */}
        {useLegacyProfile ? (
          <CodeBracketIcon className={sizeClasses.icon} />
        ) : (
          <ArrowPathIcon className={sizeClasses.icon} />
        )}
        
        {/* Label */}
        <span className={sizeClasses.text}>
          {profileType}
        </span>
      </button>

      {/* Optional detailed label */}
      {showLabel && (
        <div className={`${sizeClasses.text} text-gray-300`}>
          Profile Build
        </div>
      )}

      {/* Development indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`
          ${sizeClasses.text} 
          px-2 py-1 
          bg-yellow-500/20 text-yellow-300 
          rounded border border-yellow-500/30
        `}>
          DEV
        </div>
      )}
    </div>
  );
};

export default ProfileToggle; 