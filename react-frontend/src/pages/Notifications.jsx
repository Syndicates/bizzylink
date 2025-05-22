/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Notifications.jsx
 * @description Notifications page displaying all user notifications
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSocial } from '../contexts/SocialContext';

// Helper function to format time
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
};

// Notification type icon component
const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'friend_request':
      return (
        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </div>
      );
    case 'friend_accept':
      return (
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
      );
    case 'new_follower':
      return (
        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      );
    case 'achievement':
      return (
        <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'forum_thread':
      return (
        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'minecraft':
      return (
        <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>
      );
  }
};

// Empty state component
const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    </div>
    <h3 className="text-gray-400 text-lg mb-2">No notifications</h3>
    <p className="text-gray-500 max-w-md mx-auto text-sm">
      You don't have any notifications yet. Come back later when there's
      activity on your account or in the community.
    </p>
  </div>
);

// Main notifications page component
const Notifications = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useSocial();
  console.log('[NotificationsPage] notifications:', notifications);
  const notificationList = Array.isArray(notifications) ? notifications : [];
  const navigate = useNavigate();

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark notification as read
    markNotificationRead(notification._id || notification.id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'friend_request':
        navigate('/friends');
        break;
      case 'friend_accept':
        navigate('/friends');
        break;
      case 'achievement':
        navigate('/achievements');
        break;
      case 'forum_thread':
        // Get thread ID from notification data
        const threadId = notification.data?.threadId;
        if (threadId) {
          // Store in sessionStorage for page refreshes
          sessionStorage.setItem('viewThread', threadId);
          
          // Dispatch custom event for ForumSystem to handle
          const event = new CustomEvent('viewForumThread', { 
            detail: { threadId } 
          });
          
          // Navigate to community page
          navigate('/community');
          
          // Dispatch event after navigation
          setTimeout(() => {
            document.dispatchEvent(event);
          }, 100);
        } else {
          navigate('/community');
        }
        break;
      case 'new_follower':
        navigate('/profile');
        break;
      default:
        // Do nothing for unknown types
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Mark All as Read
              </button>
            )}
          </div>
          
          {notificationList.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {notificationList.map((notification) => (
                <div
                  key={notification._id || notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border border-gray-700 rounded-lg flex items-start hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    notification.read ? 'opacity-70' : 'bg-gray-700/30 border-l-4 border-l-blue-500'
                  }`}
                >
                  <NotificationIcon type={notification.subtype || notification.type} />
                  
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-white font-semibold break-words pr-2 flex-1">
                        {notification.title || "New Notification"}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mt-1 break-words">
                      {notification.message}
                    </p>
                    
                    {!notification.read && (
                      <div className="mt-1 flex">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;