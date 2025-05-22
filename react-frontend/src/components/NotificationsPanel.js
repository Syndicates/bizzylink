/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file NotificationsPanel.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useSocial } from '../contexts/SocialContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import MinecraftAvatar from './MinecraftAvatar';

const NotificationsPanel = ({ onClose }) => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification 
  } = useSocial();
  
  console.log('[NotificationsPanel] notifications:', notifications);
  const notificationList = Array.isArray(notifications) ? notifications : [];
  
  const [page, setPage] = useState(1);
  
  // Load notifications when the component mounts
  useEffect(() => {
    fetchNotifications(1, 20, true); // Skip cache for fresh data
  }, [fetchNotifications]);
  
  // Function to load the next page
  const loadMore = () => {
    if (page < notifications.totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, 20);
    }
  };
  
  // Function to mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };
  
  // Function to format the notification message
  const formatNotificationTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };
  
  // Function to render the notification icon based on type
  const renderNotificationIcon = (notification) => {
    const { type } = notification;
    
    switch (type) {
      case 'friend_request':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-purple-100 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      case 'friend_accept':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        );
      case 'new_follower':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-blue-100 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-yellow-100 text-yellow-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'game_event':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-indigo-100 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        );
      case 'WALL_COMMENT':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 13a1 1 0 01-1 1H7l-4 4V4a1 1 0 011-1h13a1 1 0 011 1v9z" />
            </svg>
          </div>
        );
      case 'WALL_LIKE':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-pink-100 text-pink-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </div>
        );
      case 'WALL_MENTION':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-blue-100 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0v10h12V5H4zm2 2h8v2H6V7zm0 4h5v2H6v-2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };
  
  // Function to get the link for a notification
  const getNotificationLink = (notification) => {
    const { type, sender, relatedData, postId } = notification;
    
    switch (type) {
      case 'friend_request':
        return '/friends';
      case 'friend_accept':
        return `/profile/${sender?.username}`;
      case 'new_follower':
        return `/profile/${sender?.username}`;
      case 'achievement':
        return '/achievements';
      case 'game_event':
        // Check if there's specific data to link to
        if (relatedData?.eventType === 'server_update') {
          return '/server';
        }
        return '/dashboard';
      case 'WALL_COMMENT':
      case 'WALL_LIKE':
      case 'WALL_MENTION':
        // If postId is present, link to the profile with wall anchor
        if (postId) return `/profile/${sender?.username || ''}#wall-${postId}`;
        // Fallback to sender's profile
        return `/profile/${sender?.username || ''}`;
      default:
        return '/dashboard';
    }
  };
  
  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white">
        <h3 className="text-lg font-medium">Notifications</h3>
        <div className="flex space-x-2">
          {notifications.unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded"
            >
              Mark all as read
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Notification Counter */}
      <div className="px-4 py-2 bg-gray-100 border-b">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {notifications.unreadCount > 0 ? (
              `${notifications.unreadCount} unread ${notifications.unreadCount === 1 ? 'notification' : 'notifications'}`
            ) : (
              'No unread notifications'
            )}
          </span>
          <span className="text-xs text-gray-500">
            {notifications.total} total
          </span>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {loading.notifications && notifications.items.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : notifications.items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.items.map((notification) => (
            <div 
              key={notification.id} 
              className={`flex p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
            >
              {/* Icon */}
              {renderNotificationIcon(notification)}
              
              {/* Content */}
              <div className="ml-3 flex-1">
                <Link 
                  to={getNotificationLink(notification)}
                  onClick={() => markNotificationAsRead(notification.id)}
                  className="block"
                >
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-700'}`}>
                      {/* Custom message for wall notifications */}
                      {notification.type === 'WALL_COMMENT' && (
                        <>
                          <span className="font-bold">{notification.sender?.username}</span> commented on your wall post.
                        </>
                      )}
                      {notification.type === 'WALL_LIKE' && (
                        <>
                          <span className="font-bold">{notification.sender?.username}</span> liked your wall post.
                        </>
                      )}
                      {notification.type === 'WALL_MENTION' && (
                        <>
                          <span className="font-bold">{notification.sender?.username}</span> mentioned you in a wall post comment.
                        </>
                      )}
                      {/* Fallback to default message */}
                      {!(notification.type === 'WALL_COMMENT' || notification.type === 'WALL_LIKE' || notification.type === 'WALL_MENTION') && notification.message}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  {/* Show sender's Minecraft avatar for wall notifications */}
                  {(notification.type === 'WALL_COMMENT' || notification.type === 'WALL_LIKE' || notification.type === 'WALL_MENTION') && notification.sender && (
                    <div className="mt-1 flex items-center">
                      <MinecraftAvatar 
                        username={notification.sender.mcUsername || notification.sender.username}
                        uuid={notification.sender.mcUUID}
                        size={24}
                      />
                      <span className="ml-2 text-xs text-gray-600">
                        {notification.sender.mcUsername || notification.sender.username}
                      </span>
                    </div>
                  )}
                </Link>
                
                {/* Action buttons */}
                <div className="mt-2 flex justify-between">
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button 
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="text-xs text-gray-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Load More Button */}
        {notifications.currentPage < notifications.totalPages && (
          <div className="p-4 flex justify-center">
            <button
              onClick={loadMore}
              className="text-sm text-purple-600 hover:text-purple-800"
              disabled={loading.notifications}
            >
              {loading.notifications ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;