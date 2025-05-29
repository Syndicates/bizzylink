/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileInfo.jsx
 * @description Profile info component with user details and actions
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import FriendButton from '../social/FriendButton';
import FollowButton from '../social/FollowButton';

const ProfileInfo = ({
  profileUser,
  role,
  isOwnProfile,
  relationship,
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`flex-1 md:ml-6 mt-4 md:mt-0 ${className}`}>
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
        {!isOwnProfile && (
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <FriendButton username={profileUser?.username} />
            <FollowButton
              username={profileUser?.username}
              mcUsername={profileUser?.mcUsername}
              initialFollowing={relationship?.following}
              followsYou={relationship?.followsYou}
            />
            <button
              onClick={() => navigate(`/messages/new/${profileUser?.username}`)}
              className="message-btn flex items-center px-4 py-2 rounded-lg border border-blue-500 bg-transparent text-blue-300 font-semibold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-all duration-150 scale-100 hover:scale-105 active:scale-95"
              aria-label="Send Message"
              tabIndex={0}
            >
              <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

ProfileInfo.propTypes = {
  profileUser: PropTypes.object.isRequired,
  role: PropTypes.string.isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  relationship: PropTypes.object,
  className: PropTypes.string
};

export default memo(ProfileInfo); 