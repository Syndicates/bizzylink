/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file NotificationsPanel.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// src/components/social/NotificationsPanel.jsx - Using axios directly
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocial } from '../../contexts/SocialContext';

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

// Add notification type for forum threads
const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'friend_request':
      return (
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </div>
      );
    case 'friend_accept':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </div>
      );
    case 'new_follower':
      return (
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      );
    case 'achievement':
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'forum_thread':
      return (
        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'thread_reply':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'user_mention':
      return (
        <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'minecraft':
      return (
        <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>
      );
  }
};

// Notification panel component
const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useSocial();
  console.log('[NotificationsPanel] notifications:', notifications);
  const notificationList = Array.isArray(notifications) ? notifications : [];
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const notificationSoundRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Play sound when a new notification arrives
  useEffect(() => {
    if (notificationList && notificationList.length > 0) {
      const latestId = notificationList[0].id || notificationList[0]._id;
      if (lastNotificationId && latestId !== lastNotificationId) {
        if (!notificationSoundRef.current) {
          notificationSoundRef.current = new Audio('/sounds/level-up.mp3');
          notificationSoundRef.current.volume = 0.5;
        }
        notificationSoundRef.current.play().catch(() => {});
      }
      setLastNotificationId(latestId);
    }
  }, [notificationList]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // If panel is not open, don't render
  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-700"
      style={{ maxHeight: '80vh', zIndex: 9999, width: '320px' }}
    >
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-white text-lg">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {(!notificationList || notificationList.length === 0) ? (
          <div className="p-4 text-center text-gray-400">
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {notificationList.map((notification) => (
              <div
                key={notification.id || notification._id}
                onClick={() => {
                  markNotificationRead(notification.id || notification._id);
                  handleNotificationClick(notification, navigate, onClose);
                }}
                className={`p-3 border-b border-gray-700 flex items-start hover:bg-gray-700 cursor-pointer ${
                  notification.read ? 'opacity-70' : 'bg-gray-750'
                }`}
              >
                <NotificationIcon type={notification.type} />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-white text-sm font-semibold">
                      {notification.title 
                        ? (notification.title.length > 13 
                            ? `${notification.title.substring(0, 13)}...` 
                            : notification.title)
                        : "New Notification"}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1 whitespace-nowrap">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs mt-1 line-clamp-2 overflow-hidden">
                    {formatThreadTitleInMessage(notification.message)}
                  </p>
                  {!notification.read && (
                    <div className="mt-1 flex justify-end">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="p-2 text-center border-t border-gray-700">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

// Helper function to format message with capped thread title
const formatThreadTitleInMessage = (message) => {
  if (!message) return '';
  
  // Check if this is a forum thread message that follows the pattern
  if (message.includes('You created a new thread') || 
      message.includes('new thread')) {
    
    // Find the thread title within quotes
    const match = message.match(/["']([^"']+)["']/);
    
    if (match && match[1]) {
      const threadTitle = match[1];
      const cappedTitle = threadTitle.length > 13 
        ? `${threadTitle.substring(0, 13)}...` 
        : threadTitle;
      
      // Replace the original title with the capped one
      return message.replace(threadTitle, cappedTitle);
    }
  }
  
  // Return original message if no thread title found or different message format
  return message;
};

// Handle notification click with different actions based on type
const handleNotificationClick = (notification, navigate, onClose) => {
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
        // Dispatch custom event for ForumSystem to handle
        const event = new CustomEvent('viewForumThread', { 
          detail: { threadId } 
        });
        
        // Close notification panel
        onClose();
        
        // Store in sessionStorage for page refreshes
        sessionStorage.setItem('viewThread', threadId);
        
        // Dispatch event to open thread
        document.dispatchEvent(event);
        
        // Navigate to community page if we're not already there
        if (!window.location.pathname.includes('/community')) {
          navigate('/community');
        }
      } else {
        navigate('/community');
      }
      break;
    case 'new_follower':
      navigate('/profile');
      break;
    case 'thread_reply':
      // Get thread ID from notification data
      const replyThreadId = notification.data?.threadId;
      if (replyThreadId) {
        // Store in sessionStorage for page refreshes
        sessionStorage.setItem('viewThread', replyThreadId);
        
        // Add optional postId if available to scroll to specific reply
        if (notification.data?.postId) {
          sessionStorage.setItem('viewPost', notification.data.postId);
        }
        
        // Dispatch custom event for ForumSystem to handle
        const replyEvent = new CustomEvent('viewForumThread', { 
          detail: { 
            threadId: replyThreadId,
            postId: notification.data?.postId 
          } 
        });
        
        // Close notification panel
        onClose();
        
        // Navigate to community page if we're not already there
        if (!window.location.pathname.includes('/community')) {
          navigate('/community');
        }
        
        // Dispatch event after a short delay to ensure page has loaded
        setTimeout(() => {
          document.dispatchEvent(replyEvent);
        }, 100);
      } else {
        navigate('/community');
      }
      break;
    case 'user_mention':
      // Similar to thread_reply but with possible highlighting of the mention
      const mentionThreadId = notification.data?.threadId;
      if (mentionThreadId) {
        // Store in sessionStorage for page refreshes
        sessionStorage.setItem('viewThread', mentionThreadId);
        
        // Add optional postId if available to scroll to specific post
        if (notification.data?.postId) {
          sessionStorage.setItem('viewPost', notification.data.postId);
          // Add mention flag to highlight the username
          sessionStorage.setItem('highlightMention', 'true');
        }
        
        // Dispatch custom event for ForumSystem to handle
        const mentionEvent = new CustomEvent('viewForumThread', { 
          detail: { 
            threadId: mentionThreadId,
            postId: notification.data?.postId,
            highlightMention: true
          } 
        });
        
        // Close notification panel
        onClose();
        
        // Navigate to community page if we're not already there
        if (!window.location.pathname.includes('/community')) {
          navigate('/community');
        }
        
        // Dispatch event after a short delay to ensure page has loaded
        setTimeout(() => {
          document.dispatchEvent(mentionEvent);
        }, 100);
      } else {
        navigate('/community');
      }
      break;
    default:
      // For unknown types, just close the panel
      onClose();
      break;
  }
};

export default NotificationsPanel;