/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ActivityItem.jsx
 * @description Activity feed item component for profile
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { HandThumbUpIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';

// Activity feed item component
const ActivityItem = ({
  icon,
  title,
  description,
  time,
  children,
  type = "default",
}) => {
  return (
    <div className="bg-white/10 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 
          ${
            type === "achievement"
              ? "bg-yellow-600/50"
              : type === "kill"
                ? "bg-red-600/50"
                : type === "build"
                  ? "bg-blue-600/50"
                  : type === "mine"
                    ? "bg-green-600/50"
                    : "bg-gray-600/50"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-minecraft">{title}</h3>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
          {children && (
            <div className="mt-3 border-t border-white/10 pt-3">{children}</div>
          )}
          <div className="flex items-center mt-3 text-sm text-gray-400">
            <button className="flex items-center hover:text-white mr-4">
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Like
            </button>
            <button className="flex items-center hover:text-white">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem; 