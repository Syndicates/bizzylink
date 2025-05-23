/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendButton.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// src/components/social/FriendButton.jsx
import React, { useState, useCallback } from 'react';
import { useSocial } from '../../contexts/SocialContext';
import './FriendButton.css';

const ICONS = {
  add: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  remove: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  accept: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  cancel: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const FriendButton = ({ username, size = 'medium', variant = 'primary' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    isFriend,
    hasSentFriendRequest,
    hasReceivedFriendRequest,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend
  } = useSocial();

  const handleAction = useCallback(async (action) => {
    if (!username) {
      console.error('Username is required for friend actions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      switch (action) {
        case 'send':
          await sendFriendRequest(username);
          break;
        case 'accept':
          await acceptFriendRequest(username);
          break;
        case 'reject':
          await rejectFriendRequest(username);
          break;
        case 'cancel':
          await cancelFriendRequest(username);
          break;
        case 'remove':
          await removeFriend(username);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (err) {
      console.error(`Friend action '${action}' failed:`, err, err?.response?.data);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend]);

  if (!username) {
    console.error('[FriendButton] Missing or invalid username prop:', username);
    return (
      <div className="friend-button-wrapper error" title="Missing username">
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          [FriendButton] Error: No username provided
        </span>
      </div>
    );
  }

  const getButtonConfig = () => {
    if (isFriend(username)) {
      return {
        onClick: () => handleAction('remove'),
        className: 'friend-btn friend-btn-remove',
        icon: ICONS.remove,
        text: 'Remove Friend',
        title: 'Remove from friends'
      };
    }

    if (hasSentFriendRequest(username)) {
      return {
        onClick: () => handleAction('cancel'),
        className: 'friend-btn friend-btn-cancel',
        icon: ICONS.cancel,
        text: 'Cancel Request',
        title: 'Cancel friend request'
      };
    }

    if (hasReceivedFriendRequest(username)) {
      return {
        onClick: () => handleAction('accept'),
        className: 'friend-btn friend-btn-accept',
        icon: ICONS.accept,
        text: 'Accept Request',
        title: 'Accept friend request'
      };
    }

    return {
      onClick: () => handleAction('send'),
      className: 'friend-btn friend-btn-add',
      icon: ICONS.add,
      text: 'Add Friend',
      title: 'Send friend request'
    };
  };

  const buttonConfig = getButtonConfig();
  const buttonClass = `${buttonConfig.className} ${loading ? 'friend-btn-loading' : ''}`;

  return (
    <div className="friend-btn-wrapper" title={error || buttonConfig.title}>
      <button
        className={buttonClass}
        onClick={buttonConfig.onClick}
        disabled={loading}
        aria-label={buttonConfig.title}
        tabIndex={0}
        style={{ minWidth: 130 }}
      >
        <span className="icon">{buttonConfig.icon}</span>
        {size !== 'small' && <span className="text">{buttonConfig.text}</span>}
      </button>
    </div>
  );
};

export default FriendButton;