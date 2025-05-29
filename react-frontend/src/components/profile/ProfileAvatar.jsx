/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileAvatar.jsx
 * @description Profile avatar component with 2D Minecraft avatar
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import MinecraftAvatar from '../MinecraftAvatar';

const ProfileAvatar = ({ username, size = 128, className = '' }) => {
  return (
    <div className="flex-shrink-0 relative group">
      <div className={`w-${size} h-${size} rounded-md overflow-hidden border-4 border-minecraft-navy-dark bg-minecraft-navy-light ${className}`}>
        <MinecraftAvatar
          username={username}
          size={size}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

ProfileAvatar.propTypes = {
  username: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string
};

export default memo(ProfileAvatar); 