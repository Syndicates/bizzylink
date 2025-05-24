/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfileTabNavigation.jsx
 * @description Profile tab navigation matching original gradient design
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { 
  ChatBubbleOvalLeftIcon, 
  UserIcon,
  ChartBarIcon,
  TrophyIcon,
  CubeIcon,
  BookOpenIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const ProfileTabNavigation = ({ 
  activeTab, 
  onTabChange, 
  isOwnProfile, 
  className = '' 
}) => {
  const tabs = [
    { 
      id: 'wall', 
      label: 'Wall', 
      icon: ChatBubbleOvalLeftIcon,
      activeColor: 'minecraft-habbo-blue',
      borderColor: 'border-minecraft-habbo-blue'
    },
    { 
      id: 'info', 
      label: 'Info', 
      icon: UserIcon,
      activeColor: 'minecraft-habbo-green',
      borderColor: 'border-minecraft-habbo-green'
    },
    { 
      id: 'stats', 
      label: 'Stats', 
      icon: ChartBarIcon,
      activeColor: 'minecraft-habbo-yellow',
      borderColor: 'border-minecraft-habbo-yellow'
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: CubeIcon,
      activeColor: 'purple-500',
      borderColor: 'border-purple-500'
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      icon: TrophyIcon,
      activeColor: 'yellow-500',
      borderColor: 'border-yellow-500'
    },
    { 
      id: 'recipes', 
      label: 'Recipes', 
      icon: BookOpenIcon,
      activeColor: 'pink-500',
      borderColor: 'border-pink-500'
    },
    { 
      id: 'photos', 
      label: 'Screenshots', 
      icon: PhotoIcon,
      activeColor: 'indigo-500',
      borderColor: 'border-indigo-500'
    }
  ];

  return (
    <>
      {/* Enhanced Tab Styling */}
      <style jsx>{`
        .profile-tab {
          position: relative;
          overflow: hidden;
        }

        .profile-tab::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s;
        }

        .profile-tab:hover::before {
          left: 100%;
        }

        .profile-tab.active {
          box-shadow:
            0 0 10px rgba(74, 222, 128, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .profile-tab.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid var(--tab-color, #4ade80);
        }

        .tab-glow {
          animation: tabGlow 2s ease-in-out infinite alternate;
        }

        @keyframes tabGlow {
          from {
            box-shadow: 0 0 5px rgba(74, 222, 128, 0.3);
          }
          to {
            box-shadow: 0 0 15px rgba(74, 222, 128, 0.6);
          }
        }

        .minecraft-texture {
          background-image:
            linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.1) 25%,
              transparent 25%
            ),
            linear-gradient(
              -45deg,
              rgba(255, 255, 255, 0.1) 25%,
              transparent 25%
            );
          background-size: 4px 4px;
          background-position:
            0 0,
            2px 2px;
        }
      `}</style>

      {/* Profile Tabs - Exact copy from original Profile.js */}
      <div className={`flex mt-6 border-b border-white/10 overflow-x-auto pb-px relative bg-gradient-to-r from-minecraft-navy-dark via-minecraft-navy to-minecraft-navy-dark rounded-t-lg ${className}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`profile-tab relative flex items-center px-5 py-3 font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                isActive
                  ? `text-white bg-gradient-to-t from-${tab.activeColor}/20 to-transparent border-b-2 ${tab.borderColor} -mb-px shadow-lg minecraft-texture`
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              } rounded-t-lg group`}
              style={isActive ? { "--tab-color": `var(--${tab.activeColor})` } : {}}
            >
              <Icon
                className={`h-5 w-5 mr-2 transition-all duration-300 ${
                  isActive
                    ? `text-${tab.activeColor} animate-pulse`
                    : `text-gray-500 group-hover:text-${tab.activeColor} group-hover:scale-110`
                }`}
              />
              <span className="font-minecraft">{tab.label}</span>
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-${tab.activeColor} to-transparent animate-pulse`}></div>
              )}
              {/* Tab notification indicator */}
              {!isActive && tab.id === 'wall' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-minecraft-habbo-blue rounded-full animate-ping opacity-75"></div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ProfileTabNavigation; 