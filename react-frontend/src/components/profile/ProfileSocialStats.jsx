/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileSocialStats.jsx
 * @description Social stats overlay component for profile header
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../LoadingSpinner';

// Social stat configuration
const SOCIAL_STAT_TYPES = [
  { 
    key: 'followers', 
    label: 'Followers', 
    action: 'openFollowersModal', 
    hoverColor: 'minecraft-habbo-blue' 
  },
  { 
    key: 'following', 
    label: 'Following', 
    action: 'openFollowingModal', 
    hoverColor: 'minecraft-habbo-green' 
  },
  { 
    key: 'friends', 
    label: 'Friends', 
    action: 'openFriendsModal', 
    hoverColor: 'minecraft-habbo-blue' 
  }
];

/**
 * Individual social stat button component
 */
const SocialStatButton = memo(({ count, label, onClick, hoverColor }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-${hoverColor}/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover`}
    >
      <div className="text-white font-bold text-xl leading-none">
        {count}
      </div>
      <div className={`text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-${hoverColor} transition-colors`}>
        {label}
      </div>
    </button>
  );
});

SocialStatButton.displayName = 'SocialStatButton';

SocialStatButton.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  hoverColor: PropTypes.string.isRequired
};

/**
 * Main social stats overlay component
 */
const ProfileSocialStats = ({ socialStats, onSocialAction }) => {
  /**
   * Handle social action click
   */
  const handleSocialAction = useCallback((action) => {
    onSocialAction?.(action);
  }, [onSocialAction]);

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 z-30">
      {socialStats?.loading ? (
        <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center shadow-card">
          <LoadingSpinner size="small" />
        </div>
      ) : socialStats?.error ? (
        <div className="bg-red-900/60 backdrop-blur-md border-2 border-red-500/40 rounded-md px-4 py-3 min-w-[90px] text-center shadow-card">
          <div className="text-red-300 text-xs font-medium">
            Error
          </div>
        </div>
      ) : (
        <>
          {SOCIAL_STAT_TYPES.map(stat => (
            <SocialStatButton
              key={stat.key}
              count={socialStats?.[`${stat.key}Count`] || 0}
              label={stat.label}
              onClick={() => handleSocialAction(stat.action)}
              hoverColor={stat.hoverColor}
            />
          ))}
        </>
      )}
    </div>
  );
};

ProfileSocialStats.propTypes = {
  socialStats: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.bool,
    followersCount: PropTypes.number,
    followingCount: PropTypes.number,
    friendsCount: PropTypes.number
  }),
  onSocialAction: PropTypes.func
};

export default memo(ProfileSocialStats); 