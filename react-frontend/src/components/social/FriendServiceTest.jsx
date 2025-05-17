/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file FriendServiceTest.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import FriendService from '../../services/friendService';

const FriendServiceTest = () => {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [testUsername] = useState('testuser');

  const runTests = async () => {
    try {
      setStatus('Testing API connection...');
      const isConnected = await FriendService.testConnection();
      if (!isConnected) {
        throw new Error('API connection failed');
      }
      setStatus('API connection successful');

      // Test getting friends list
      setStatus('Testing getFriends...');
      const friends = await FriendService.getFriends();
      console.log('Friends list:', friends);
      setStatus('Successfully retrieved friends list');

      // Test sending friend request
      setStatus(`Testing sendFriendRequest to ${testUsername}...`);
      await FriendService.sendFriendRequest(testUsername);
      setStatus('Successfully sent friend request');

      // Get updated friend status
      setStatus('Testing getFriendStatus...');
      const friendStatus = await FriendService.getFriendStatus(testUsername);
      console.log('Friend status:', friendStatus);
      setStatus('All tests completed successfully!');
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
      setStatus('Tests failed');
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>FriendService Test</h2>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <button 
        onClick={runTests}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Run Tests Again
      </button>
    </div>
  );
};

export default FriendServiceTest; 