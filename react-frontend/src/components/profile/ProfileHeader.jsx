/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileHeader.jsx
 * @description Profile header component with cover image and user info matching original design
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CubeIcon, 
  PhotoIcon, 
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import MinecraftAvatar from '../MinecraftAvatar';
import MinecraftPlayerModel3D from '../MinecraftPlayerModel3D';
import FriendButton from '../social/FriendButton';
import FollowButton from '../social/FollowButton';
import LoadingSpinner from '../LoadingSpinner';

const ProfileHeader = ({
  profileUser,
  playerStats,
  coverImage,
  isOwnProfile,
  relationship,
  viewMode = 'avatar',
  onViewModeChange,
  onWallpaperSelect,
  onSocialAction,
  socialStats,
  savingWallpaper = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const [verificationAlertDismissed, setVerificationAlertDismissed] = useState(() => {
    // Check if verification alert was dismissed
    const dismissed = localStorage.getItem('verification_alert_dismissed');
    if (dismissed) {
      const dismissalTime = parseInt(dismissed);
      return Date.now() < dismissalTime;
    }
    return false;
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image loading state when cover image changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [coverImage]);

  if (!profileUser) return null;

  const displayName = profileUser.displayName || profileUser.username;
  const mcUsername = profileUser.mcUsername || profileUser.username;
  const role = profileUser.title || profileUser.role || playerStats?.rank || 'Adventurer';



  // Get default cover image if none provided
  const getDefaultCover = (username) => {
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/night_adventure/${username || 'Steve'}`;
  };

  const handleAcceptFriendRequest = async (username) => {
    return await onSocialAction?.('acceptFriendRequest', { username });
  };

  const handleRejectFriendRequest = async (username) => {
    return await onSocialAction?.('rejectFriendRequest', { username });
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'avatar' ? '3d' : 'avatar';
    onViewModeChange?.(newMode);
  };

  return (
    <div className={className}>
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        
        .wallpaper-transition {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .loading-pulse {
          animation: loading-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes loading-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 bg-minecraft-navy-dark rounded-t-md overflow-hidden relative">
          {/* Loading skeleton (kept for initial load, but image is always rendered) */}
          {!imageLoaded && !imageError && (
            <div className="w-full h-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse flex items-center justify-center absolute inset-0 z-10 pointer-events-none">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Always render the image, but animate blur/opacity */}
          {coverImage && (
            <img
              src={coverImage}
              alt="Profile Cover"
              className="w-full h-full object-cover absolute inset-0"
              style={{
                filter: imageLoaded ? 'blur(0px)' : 'blur(16px)',
                opacity: imageLoaded ? 1 : 0.5,
                transition: 'filter 1.2s cubic-bezier(0.4,0,0.2,1), opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
                zIndex: 1
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Fallback/Default cover */}
          {(imageError || !coverImage) && (
            <div className="w-full h-full bg-minecraft-navy-dark flex items-center justify-center absolute inset-0 z-0">
              <img
                src={getDefaultCover(profileUser?.username)}
                alt="Default Cover"
                className="w-full h-full object-cover"
                style={{
                  filter: imageLoaded ? 'blur(0px)' : 'blur(16px)',
                  opacity: imageLoaded ? 1 : 0.5,
                  transition: 'filter 1.2s cubic-bezier(0.4,0,0.2,1), opacity 1.2s cubic-bezier(0.4,0,0.2,1)'
                }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}

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

          {/* Instagram/TikTok Style Social Stats Overlay */}
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
                {/* Followers */}
                <button
                  onClick={() => onSocialAction?.('openFollowersModal')}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-blue/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                >
                  <div className="text-white font-bold text-xl leading-none">
                    {socialStats?.followersCount || 0}
                  </div>
                  <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-blue transition-colors">
                    Followers
                  </div>
                </button>

                {/* Following */}
                <button
                  onClick={() => onSocialAction?.('openFollowingModal')}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-green/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                >
                  <div className="text-white font-bold text-xl leading-none">
                    {socialStats?.followingCount || 0}
                  </div>
                  <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-green transition-colors">
                    Following
                  </div>
                </button>

                {/* Friends */}
                <button
                  onClick={() => onSocialAction?.('openFriendsModal')}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-md px-4 py-3 min-w-[90px] text-center hover:bg-white/15 hover:border-minecraft-habbo-blue/50 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 transform shadow-card hover:shadow-card-hover"
                >
                  <div className="text-white font-bold text-xl leading-none">
                    {socialStats?.friendsCount || 0}
                  </div>
                  <div className="text-gray-300 text-xs font-medium uppercase tracking-wider mt-1 group-hover:text-minecraft-habbo-blue transition-colors">
                    Friends
                  </div>
                </button>
              </>
            )}
          </div>

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

        </div>

        {/* Profile Info */}
        <div className="px-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-end -mt-16 relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative group">
              <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-minecraft-navy-dark bg-minecraft-navy-light">
                {viewMode === "avatar" ? (
                  <MinecraftAvatar
                    username={mcUsername}
                    size={128}
                    className="w-full h-full"
                  />
                ) : (
                  <MinecraftPlayerModel3D
                    username={mcUsername}
                    width={128}
                    height={128}
                  />
                )}
              </div>
              <button
                onClick={toggleViewMode}
                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title={
                  viewMode === "avatar" ? "Show 3D Model" : "Show Avatar"
                }
              >
                <CubeIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 md:ml-6 mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-minecraft flex items-center">
                    {profileUser?.username}
                    {profileUser?.verified && (
                      <span
                        className="ml-2 text-minecraft-habbo-blue"
                        title="Verified"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </h1>
                  <div className="text-gray-400 text-sm mt-1">
                    {role}
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  {!isOwnProfile && (
                    <>
                      <FriendButton username={profileUser?.username} />
                      <FollowButton
                        username={profileUser?.username}
                        mcUsername={profileUser?.mcUsername}
                        initialFollowing={relationship?.following}
                        followsYou={relationship?.followsYou}
                      />
                      <button
                        onClick={() =>
                          navigate(`/messages/new/${profileUser?.username}`)
                        }
                        className="message-btn flex items-center px-4 py-2 rounded-lg border border-blue-500 bg-transparent text-blue-300 font-semibold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-all duration-150 scale-100 hover:scale-105 active:scale-95"
                        aria-label="Send Message"
                        tabIndex={0}
                      >
                        <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Friend Request Notification */}
              {relationship?.status === "pending_received" && (
                <div className="mt-4 bg-minecraft-navy-light p-4 rounded-md">
                  <p className="text-sm mb-2">
                    {profileUser?.username} sent you a friend request
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptFriendRequest(profileUser?.username)}
                      className="habbo-btn-success text-sm px-3 py-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectFriendRequest(profileUser?.username)}
                      className="habbo-btn-danger text-sm px-3 py-1"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Verification Alert - Only show for own profile if not verified */}
      {isOwnProfile &&
        profileUser &&
        !profileUser.verified &&
        !profileUser.isVerified &&
        !verificationAlertDismissed && (
          <div className="mt-6 animate-in slide-in-from-top duration-300 verification-alert">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                {/* Warning Icon */}
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-yellow-300 mb-1">
                        🔐 Account Verification Required
                      </h3>
                      <p className="text-sm text-gray-300">
                        Your account is not verified yet. Verify your
                        account to access all features, build trust with
                        other users, and unlock exclusive benefits.
                      </p>

                      {/* Benefits List */}
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Benefits of verification:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                            ✓ Blue checkmark badge
                          </span>
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                            🔒 Enhanced security
                          </span>
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                            🎮 Full Minecraft integration
                          </span>
                          <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                            🏆 Access to leaderboards
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 ml-4">
                      <Link
                        to="/verify-account"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Verify Now
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => {
                          // Store dismissal in localStorage with expiry (show again after 24 hours)
                          const dismissalTime = Date.now() + 24 * 60 * 60 * 1000;
                          localStorage.setItem(
                            "verification_alert_dismissed",
                            dismissalTime.toString(),
                          );
                          // Update state to hide the alert
                          setVerificationAlertDismissed(true);
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors focus:outline-none"
                        title="Remind me later (24 hours)"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ProfileHeader; 