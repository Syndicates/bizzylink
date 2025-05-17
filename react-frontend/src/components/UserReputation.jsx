/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file UserReputation.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ForumAPI from '../services/ForumAPI';

const UserReputation = ({ user, currentUser, postId, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(null); // 'rep-positive', 'rep-negative', 'vouch'
  
  // Get the appropriate reputation color based on count
  const getReputationColor = (rep) => {
    if (rep === undefined || rep === null) return 'text-gray-500';
    
    if (rep >= 50) return 'text-green-400';
    if (rep >= 10) return 'text-green-300';
    if (rep > 0) return 'text-green-200';
    if (rep === 0) return 'text-gray-400';
    if (rep > -10) return 'text-red-200';
    if (rep > -50) return 'text-red-300';
    return 'text-red-400';
  };
  
  // Handle giving positive reputation
  const handleGivePositiveRep = async () => {
    if (isLoading) return;
    if (confirmingAction === 'rep-positive') {
      setConfirmingAction(null);
      return;
    }
    
    setConfirmingAction('rep-positive');
    
    // Auto-confirm after 3 seconds
    setTimeout(() => {
      setConfirmingAction(null);
    }, 3000);
  };
  
  // Handle giving negative reputation
  const handleGiveNegativeRep = async () => {
    if (isLoading) return;
    if (confirmingAction === 'rep-negative') {
      setConfirmingAction(null);
      return;
    }
    
    setConfirmingAction('rep-negative');
    
    // Auto-confirm after 3 seconds
    setTimeout(() => {
      setConfirmingAction(null);
    }, 3000);
  };
  
  // Handle giving vouch
  const handleGiveVouch = async () => {
    if (isLoading) return;
    if (confirmingAction === 'vouch') {
      setConfirmingAction(null);
      return;
    }
    
    setConfirmingAction('vouch');
    
    // Auto-confirm after 3 seconds
    setTimeout(() => {
      setConfirmingAction(null);
    }, 3000);
  };
  
  // Confirm giving positive reputation
  const confirmGivePositiveRep = async () => {
    setIsLoading(true);
    try {
      const result = await ForumAPI.giveReputation(user._id, 1, postId);
      toast.success('Successfully gave positive reputation');
      if (onUpdate) {
        onUpdate({ reputation: result.newReputation });
      }
    } catch (error) {
      console.error('Error giving positive reputation:', error);
      toast.error(error.response?.data?.message || 'Failed to give reputation');
    } finally {
      setIsLoading(false);
      setConfirmingAction(null);
    }
  };
  
  // Confirm giving negative reputation
  const confirmGiveNegativeRep = async () => {
    setIsLoading(true);
    try {
      const result = await ForumAPI.giveReputation(user._id, -1, postId);
      toast.success('Successfully gave negative reputation');
      if (onUpdate) {
        onUpdate({ reputation: result.newReputation });
      }
    } catch (error) {
      console.error('Error giving negative reputation:', error);
      toast.error(error.response?.data?.message || 'Failed to give reputation');
    } finally {
      setIsLoading(false);
      setConfirmingAction(null);
    }
  };
  
  // Confirm giving vouch
  const confirmGiveVouch = async () => {
    setIsLoading(true);
    try {
      const result = await ForumAPI.giveVouch(user._id, null, postId);
      toast.success('Successfully vouched for user');
      if (onUpdate) {
        onUpdate({ vouches: result.newVouches });
      }
    } catch (error) {
      console.error('Error vouching for user:', error);
      toast.error(error.response?.data?.message || 'Failed to vouch for user');
    } finally {
      setIsLoading(false);
      setConfirmingAction(null);
    }
  };
  
  // Don't render for your own profile
  if (currentUser && user._id === currentUser._id) {
    return null;
  }
  
  return (
    <div className="flex flex-col space-y-2 mt-2">
      {/* Reputation buttons */}
      <div className="flex space-x-2">
        {confirmingAction === 'rep-positive' ? (
          <button 
            onClick={confirmGivePositiveRep}
            disabled={isLoading}
            className="text-xs bg-green-800 hover:bg-green-700 text-green-100 py-1 px-2 rounded flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Confirm +Rep?
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={handleGivePositiveRep}
            className="text-xs bg-green-900 hover:bg-green-800 text-green-100 py-1 px-2 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            +Rep
          </button>
        )}
        
        {confirmingAction === 'rep-negative' ? (
          <button 
            onClick={confirmGiveNegativeRep}
            disabled={isLoading}
            className="text-xs bg-red-800 hover:bg-red-700 text-red-100 py-1 px-2 rounded flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Confirm -Rep?
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={handleGiveNegativeRep}
            className="text-xs bg-red-900 hover:bg-red-800 text-red-100 py-1 px-2 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            -Rep
          </button>
        )}
      </div>
      
      {/* Vouch button */}
      {confirmingAction === 'vouch' ? (
        <button 
          onClick={confirmGiveVouch}
          disabled={isLoading}
          className="text-xs bg-teal-800 hover:bg-teal-700 text-teal-100 py-1 px-2 rounded flex items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              Confirm Vouch?
            </>
          )}
        </button>
      ) : (
        <button 
          onClick={handleGiveVouch}
          className="text-xs bg-teal-900 hover:bg-teal-800 text-teal-100 py-1 px-2 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Vouch
        </button>
      )}
    </div>
  );
};

export default UserReputation;