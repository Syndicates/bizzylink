/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendButton.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSocial } from '../contexts/SocialContext';
import LoadingSpinner from './LoadingSpinner';

const FriendButton = ({ username, className = '', variant = 'default', showText = true }) => {
  const { 
    getFriendStatus, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    cancelFriendRequest, 
    removeFriend 
  } = useSocial();
  
  const [status, setStatus] = useState('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const actionCooldown = useRef(false);
  const cooldownTime = 5000; // 5 seconds cooldown
  
  // Fetch friend status when the component mounts or username changes
  useEffect(() => {
    setStatus(getFriendStatus(username));
  }, [username, getFriendStatus]);
  
  // Apply cooldown to prevent rapid API requests
  const applyCooldown = (actionFn) => async () => {
    // Prevent spamming friend buttons
    if (actionCooldown.current || loading) {
      console.log('Friend action on cooldown, please wait...');
      return;
    }
    
    // Set cooldown immediately to prevent double-clicks
    actionCooldown.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const success = await actionFn();
      return success;
    } catch (err) {
      console.error('Friend action error:', err);
      setError(err.response?.data?.error || 'Failed to process friend action');
      return false;
    } finally {
      setLoading(false);
      
      // Set a timeout to reset the cooldown
      setTimeout(() => {
        actionCooldown.current = false;
      }, cooldownTime);
    }
  };

  // Handle sending a friend request
  const handleSendRequest = async () => {
    const success = await applyCooldown(async () => {
      return await sendFriendRequest(username);
    })();
    
    if (success) {
      setStatus('request_sent');
    }
  };
  
  // Handle accepting a friend request
  const handleAcceptRequest = async () => {
    const success = await applyCooldown(async () => {
      return await acceptFriendRequest(username);
    })();
    
    if (success) {
      setStatus('friends');
    }
  };
  
  // Handle rejecting a friend request
  const handleRejectRequest = async () => {
    const success = await applyCooldown(async () => {
      return await rejectFriendRequest(username);
    })();
    
    if (success) {
      setStatus('none');
    }
  };
  
  // Handle canceling a friend request
  const handleCancelRequest = async () => {
    const success = await applyCooldown(async () => {
      return await cancelFriendRequest(username);
    })();
    
    if (success) {
      setStatus('none');
    }
  };
  
  // Handle removing a friend
  const handleRemoveFriend = async () => {
    const success = await applyCooldown(async () => {
      return await removeFriend(username);
    })();
    
    if (success) {
      setStatus('none');
    }
  };
  
  // Determine button appearance based on status
  const getButtonProps = () => {
    switch (status) {
      case 'loading':
        return {
          text: 'Loading...',
          onClick: null,
          color: 'bg-gray-500 hover:bg-gray-600',
          icon: null
        };
      case 'none':
        return {
          text: 'Add Friend',
          onClick: handleSendRequest,
          color: 'bg-green-600 hover:bg-green-700',
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        };
      case 'friends':
        return {
          text: 'Friends',
          onClick: handleRemoveFriend,
          color: 'bg-blue-600 hover:bg-red-600',
          hoverText: 'Remove',
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        };
      case 'request_sent':
        return {
          text: 'Request Sent',
          onClick: handleCancelRequest,
          color: 'bg-yellow-600 hover:bg-red-600',
          hoverText: 'Cancel',
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        };
      case 'request_received':
        return {
          text: 'Respond',
          onClick: null, // We'll use separate buttons for accept/reject
          color: 'bg-purple-600',
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        };
      default:
        return {
          text: 'Add Friend',
          onClick: handleSendRequest,
          color: 'bg-green-600 hover:bg-green-700',
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        };
    }
  };
  
  const buttonProps = getButtonProps();
  
  if (status === 'loading') {
    return (
      <button 
        className={`flex items-center justify-center space-x-1 py-2 px-4 bg-gray-500 text-white rounded-md ${className}`}
        disabled
      >
        <LoadingSpinner size="sm" />
        <span className="ml-1">Loading...</span>
      </button>
    );
  }
  
  // Show accept/reject buttons for received requests
  if (status === 'request_received') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        <button
          className="flex items-center justify-center py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md"
          onClick={handleAcceptRequest}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          }
          {showText && <span className="ml-1">Accept</span>}
        </button>
        <button
          className="flex items-center justify-center py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md"
          onClick={handleRejectRequest}
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          }
          {showText && <span className="ml-1">Reject</span>}
        </button>
      </div>
    );
  }
  
  // Default button
  return (
    <button
      className={`flex items-center justify-center space-x-1 py-2 px-4 ${buttonProps.color} text-white rounded-md ${className}`}
      onClick={buttonProps.onClick}
      disabled={loading}
      title={buttonProps.hoverText || buttonProps.text}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {buttonProps.icon && buttonProps.icon}
          {showText && <span className="ml-1">{buttonProps.text}</span>}
        </>
      )}
    </button>
  );
};

export default FriendButton;