// src/components/social/FriendButton.jsx
import React, { useState, useCallback } from 'react';
import { useSocial } from '../../contexts/SocialContext';
import './FriendButton.css';

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
      console.error(`Friend action '${action}' failed:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend]);

  if (!username) {
    return null;
  }

  const getButtonConfig = () => {
    if (isFriend(username)) {
      return {
        onClick: () => handleAction('remove'),
        className: 'friend-button error',
        icon: '❌',
        text: 'Remove Friend',
        title: 'Remove from friends'
      };
    }

    if (hasSentFriendRequest(username)) {
      return {
        onClick: () => handleAction('cancel'),
        className: 'friend-button warning',
        icon: '✕',
        text: 'Cancel Request',
        title: 'Cancel friend request'
      };
    }

    if (hasReceivedFriendRequest(username)) {
      return {
        onClick: () => handleAction('accept'),
        className: 'friend-button success',
        icon: '✓',
        text: 'Accept Request',
        title: 'Accept friend request'
      };
    }

    return {
      onClick: () => handleAction('send'),
      className: 'friend-button primary',
      icon: '➕',
      text: 'Add Friend',
      title: 'Send friend request'
    };
  };

  const buttonConfig = getButtonConfig();
  const buttonClass = `friend-button ${size} ${variant} ${buttonConfig.className} ${loading ? 'loading' : ''}`;

  return (
    <div className="friend-button-wrapper" title={error || buttonConfig.title}>
      <button
        className={buttonClass}
        onClick={buttonConfig.onClick}
        disabled={loading}
      >
        <span className="icon">{buttonConfig.icon}</span>
        {size !== 'small' && <span className="text">{buttonConfig.text}</span>}
      </button>
    </div>
  );
};

export default FriendButton;