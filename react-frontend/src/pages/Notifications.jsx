// src/pages/Notifications.jsx - Completely simplified version
import React from 'react';
import { Link } from 'react-router-dom';

// Simplified Notifications component
const Notifications = () => {
  // Simple component that just shows placeholder content
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>
          <div className="text-center py-12 bg-gray-700 rounded-lg">
            <p className="text-gray-400 mb-4">Notifications feature coming soon!</p>
            <Link 
              to="/friends" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Friends
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;