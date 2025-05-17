/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinimalUserReputation.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import ForumAPI from '../services/ForumAPI';

/**
 * Minimal User Reputation Component
 * This upgraded version includes basic functionality for reputation and vouches
 */
const MinimalUserReputation = ({ user }) => {
  const [isGivingRep, setIsGivingRep] = useState(false);
  const [isGivingVouch, setIsGivingVouch] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Handle giving reputation
  const handleGiveReputation = async (value) => {
    if (!user || !user._id) {
      alert('User information not available');
      return;
    }

    if (!isGivingRep) {
      // First click - show confirmation
      setIsGivingRep(true);
      setConfirmMessage(`Click again to confirm giving ${value > 0 ? 'positive' : 'negative'} reputation`);
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setIsGivingRep(false);
        setConfirmMessage('');
      }, 5000);
      
      return;
    }

    try {
      // Second click - submit
      setIsGivingRep(false);
      setConfirmMessage('Processing...');
      
      // Debug info - display structured user ID
      console.log("Sending reputation to user:", {
        userId: user._id,
        value: value,
        userObject: user
      });
      
      // For debugging, check if user data is properly formed
      if (typeof user._id === 'object' && user._id !== null) {
        // Use the string version if it's an object
        const userId = user._id.toString();
        const result = await ForumAPI.giveReputation(userId, value);
        setConfirmMessage(result.message || 'Reputation updated');
      } else {
        // Use as is if it's already a string
        const result = await ForumAPI.giveReputation(user._id, value);
        setConfirmMessage(result.message || 'Reputation updated');
      }
      
      setTimeout(() => setConfirmMessage(''), 3000);
    } catch (error) {
      console.error('Error giving reputation:', error);
      setConfirmMessage(error.response?.data?.message || 'Error giving reputation');
      setTimeout(() => setConfirmMessage(''), 3000);
    }
  };

  // Handle giving vouch
  const handleGiveVouch = async () => {
    if (!user || !user._id) {
      alert('User information not available');
      return;
    }

    if (!isGivingVouch) {
      // First click - show confirmation
      setIsGivingVouch(true);
      setConfirmMessage('Click again to confirm vouching for this user');
      
      // Auto-reset after 5 seconds
      setTimeout(() => {
        setIsGivingVouch(false);
        setConfirmMessage('');
      }, 5000);
      
      return;
    }

    try {
      // Second click - submit
      setIsGivingVouch(false);
      setConfirmMessage('Processing...');
      
      // Debug info - display structured user ID
      console.log("Sending vouch to user:", {
        userId: user._id,
        userObject: user
      });
      
      // For debugging, check if user data is properly formed
      if (typeof user._id === 'object' && user._id !== null) {
        // Use the string version if it's an object
        const userId = user._id.toString();
        const result = await ForumAPI.giveVouch(userId);
        setConfirmMessage(result.message || 'Vouch recorded');
      } else {
        // Use as is if it's already a string
        const result = await ForumAPI.giveVouch(user._id);
        setConfirmMessage(result.message || 'Vouch recorded');
      }
      
      setTimeout(() => setConfirmMessage(''), 3000);
    } catch (error) {
      console.error('Error giving vouch:', error);
      setConfirmMessage(error.response?.data?.message || 'Error giving vouch');
      setTimeout(() => setConfirmMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col space-y-2 mt-2">
      {/* Reputation buttons */}
      <div className="flex space-x-2">
        <button 
          onClick={() => handleGiveReputation(1)}
          className={`text-xs ${isGivingRep ? 'bg-green-700 animate-pulse' : 'bg-green-900'} hover:bg-green-800 text-green-100 py-1 px-2 rounded flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          +Rep
        </button>
        
        <button 
          onClick={() => handleGiveReputation(-1)}
          className={`text-xs ${isGivingRep ? 'bg-red-700 animate-pulse' : 'bg-red-900'} hover:bg-red-800 text-red-100 py-1 px-2 rounded flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
          -Rep
        </button>
      </div>
      
      {/* Vouch button */}
      <button 
        onClick={handleGiveVouch}
        className={`text-xs ${isGivingVouch ? 'bg-teal-700 animate-pulse' : 'bg-teal-900'} hover:bg-teal-800 text-teal-100 py-1 px-2 rounded flex items-center`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Vouch
      </button>
      
      {/* Confirmation message */}
      {confirmMessage && (
        <div className="text-xs text-gray-300 mt-1 bg-gray-800 p-1 rounded animate-pulse">
          {confirmMessage}
        </div>
      )}
    </div>
  );
};

export default MinimalUserReputation;