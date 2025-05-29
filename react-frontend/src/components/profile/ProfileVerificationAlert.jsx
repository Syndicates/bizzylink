/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileVerificationAlert.jsx
 * @description Profile verification alert component
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProfileVerificationAlert = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
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
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-500">
              Verify Your Account
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              Complete your account verification to unlock all features and show your verified badge.
            </p>
            <div className="mt-3 flex items-center space-x-3">
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                Verify Now
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

ProfileVerificationAlert.propTypes = {
  onDismiss: PropTypes.func
};

export default memo(ProfileVerificationAlert); 