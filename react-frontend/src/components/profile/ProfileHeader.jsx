/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileHeader.jsx
 * @description Profile header component with cover image and user info
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import ProfileCoverImage from './ProfileCoverImage';
import ProfileAvatar from './ProfileAvatar';
import ProfileInfo from './ProfileInfo';
import ProfileVerificationAlert from './ProfileVerificationAlert';
import ProfileSocialStats from './ProfileSocialStats';
import ProfileSettingsModal from '../ProfileSettingsModal';

const ProfileHeader = ({
  profileUser,
  playerStats,
  coverImage,
  isOwnProfile,
  relationship,
  onWallpaperSelect,
  onSocialAction,
  socialStats,
  savingWallpaper = false,
  className = ''
}) => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [verificationAlertDismissed, setVerificationAlertDismissed] = useState(() => {
    const dismissed = localStorage.getItem('verification_alert_dismissed');
    if (dismissed) {
      const dismissalTime = parseInt(dismissed);
      return Date.now() < dismissalTime;
    }
    return false;
  });

  const handleVerificationAlertDismiss = useCallback(() => {
    setVerificationAlertDismissed(true);
    localStorage.setItem('verification_alert_dismissed', (Date.now() + 24 * 60 * 60 * 1000).toString());
  }, []);

  if (!profileUser) return null;

  const role = profileUser.title || profileUser.role || playerStats?.rank || 'Adventurer';
  const mcUsername = profileUser.mcUsername || profileUser.username;

  return (
    <div className={className}>
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image with Social Stats */}
        <ProfileCoverImage
          coverImage={coverImage}
          username={profileUser.username}
          isOwnProfile={isOwnProfile}
          onWallpaperSelect={onWallpaperSelect}
          onOpenSettings={() => setShowProfileSettings(true)}
          savingWallpaper={savingWallpaper}
        >
          <ProfileSocialStats
            socialStats={socialStats}
            onSocialAction={onSocialAction}
          />
        </ProfileCoverImage>

        {/* Profile Info Section */}
        <div className="px-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 relative z-10">
            {/* Avatar */}
            <ProfileAvatar
              username={mcUsername}
              size={128}
            />

            {/* Profile Info & Actions */}
            <ProfileInfo
              profileUser={profileUser}
              role={role}
              isOwnProfile={isOwnProfile}
              relationship={relationship}
            />
          </div>

          {/* Verification Alert */}
          {isOwnProfile &&
            profileUser &&
            !profileUser.verified &&
            !profileUser.isVerified &&
            !verificationAlertDismissed && (
              <ProfileVerificationAlert
                onDismiss={handleVerificationAlertDismiss}
              />
            )}
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettingsModal
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
          currentUser={profileUser}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};

ProfileHeader.propTypes = {
  profileUser: PropTypes.object.isRequired,
  playerStats: PropTypes.object,
  coverImage: PropTypes.string,
  isOwnProfile: PropTypes.bool.isRequired,
  relationship: PropTypes.object,
  onWallpaperSelect: PropTypes.func,
  onSocialAction: PropTypes.func,
  socialStats: PropTypes.object,
  savingWallpaper: PropTypes.bool,
  className: PropTypes.string
};

export default memo(ProfileHeader); 