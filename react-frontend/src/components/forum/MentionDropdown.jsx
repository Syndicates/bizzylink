/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MentionDropdown.jsx
 * @description Autocomplete dropdown for @mentions in forum posts
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import MinecraftAvatar from '../MinecraftAvatar';
import api from '../../services/api';

const MentionDropdown = ({ inputRef, onSelectUser, isVisible, setIsVisible, mentionText }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Search for users when mentionText changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!mentionText || mentionText.length < 2) {
        setUsers([]);
        return;
      }
      
      setLoading(true);
      try {
        console.log(`Searching for users with query: ${mentionText}`);
        const response = await api.get(`/api/user/search?username=${mentionText}&linked=true&limit=5`);
        console.log('Search response:', response);
        if (response.data && Array.isArray(response.data.users)) {
          setUsers(response.data.users);
          setSelectedIndex(0); // Reset selection when results change
        } else {
          console.log('No users found or invalid response format:', response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [mentionText]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prevIndex => 
            prevIndex < users.length - 1 ? prevIndex + 1 : prevIndex
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prevIndex => 
            prevIndex > 0 ? prevIndex - 1 : 0
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            handleSelectUser(users[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsVisible(false);
          break;
        default:
          break;
      }
    };

    if (inputRef?.current) {
      inputRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        inputRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, users, selectedIndex, inputRef, setIsVisible]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputRef, setIsVisible]);

  const handleSelectUser = (user) => {
    onSelectUser(user);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={dropdownRef} 
      className="absolute z-50 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
      style={{ width: '300px', minWidth: '200px' }}
    >
      {loading ? (
        <div className="p-3 text-gray-400 text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          Searching...
        </div>
      ) : users.length === 0 ? (
        <div className="p-3 text-gray-400 text-center">
          No matching users found
        </div>
      ) : (
        <ul>
          {users.map((user, index) => (
            <li 
              key={user.id || user._id} 
              className={`p-2 flex items-center gap-3 cursor-pointer hover:bg-gray-800 ${index === selectedIndex ? 'bg-gray-800' : ''}`}
              onClick={() => handleSelectUser(user)}
            >
              <div className="flex-shrink-0">
                <MinecraftAvatar 
                  username={user.mcUsername || user.username}
                  size={32}
                  type="head"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">
                  {user.username}
                </div>
                {user.mcUsername && user.mcUsername !== user.username && (
                  <div className="text-xs text-gray-400 truncate">
                    MC: {user.mcUsername}
                  </div>
                )}
              </div>
              {user.webRank && (
                <div className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 flex-shrink-0">
                  {user.webRank}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentionDropdown; 