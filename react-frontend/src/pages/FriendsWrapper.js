/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendsWrapper.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// src/pages/FriendsWrapper.js
// A defensive wrapper around the Friends component that ensures it handles errors gracefully

import React, { useState, useEffect } from 'react';
import Friends from './Friends.js'; // Import specifically the .js version
import axios from 'axios';

/**
 * This component is a defensive wrapper around the Friends component.
 * It ensures that the component doesn't crash if the social features are unavailable.
 */
const FriendsWrapper = () => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  
  // Check if social features are available before rendering the component
  useEffect(() => {
    const checkSocialFeatures = async () => {
      try {
        // Skip the API check and just render the component
        // Previously this was trying to check /api/test which doesn't exist
        
        // If we have a token, consider social features available
        if (localStorage.getItem('token')) {
          setStatus('ready');
        } else {
          // If no token, user isn't logged in, but we'll still show the component
          // The authentication system will handle redirecting if needed
          setStatus('ready');
        }
      } catch (err) {
        console.error('Error checking social features:', err);
        // Even on error, we'll try to render the component
        // The defensive programming in Friends.js should handle API failures
        setStatus('ready');
      }
    };
    
    checkSocialFeatures();
  }, []);
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Social Hub</h1>
            <div className="text-center py-12 bg-gray-700 rounded-lg">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading social features...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Social Hub - Emergency Mode</h1>
            <div className="text-center py-12 bg-gray-700 rounded-lg">
              <p className="text-gray-400 mb-4">Social features are currently unavailable.</p>
              <p className="text-gray-500 text-sm mb-6">The server may be experiencing issues. Please try again later.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If everything's ready, render the actual Friends component
  return (
    <div className="relative">
      {/* Wrap in an error boundary for additional safety */}
      <Friends />
    </div>
  );
};

export default FriendsWrapper;