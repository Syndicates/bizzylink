// src/static-pages/Friends.jsx - Super-simplified version with no external dependencies
import React, { useState } from 'react';

// Basic Friends component with minimum dependencies
const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  
  // Handle tab change without router navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Safe navigation function without dependencies
  const navigateHome = () => {
    window.location.href = '/';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Social Hub</h1>
          
          {/* Tabs */}
          <div className="flex mb-8 border-b border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleTabChange('friends')}
            >
              Friends
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleTabChange('requests')}
            >
              Requests
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'following'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleTabChange('following')}
            >
              Following
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'followers'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => handleTabChange('followers')}
            >
              Followers
            </button>
          </div>
          
          {/* Fixed content for all tabs */}
          <div className="text-center py-12 bg-gray-700 rounded-lg">
            <h2 className="text-xl text-white mb-4">
              {activeTab === 'friends' && 'Friends List'}
              {activeTab === 'requests' && 'Friend Requests'}
              {activeTab === 'following' && 'People You Follow'}
              {activeTab === 'followers' && 'Your Followers'}
            </h2>
            <p className="text-gray-400 mb-6">This feature is under development. Check back soon!</p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={navigateHome}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;