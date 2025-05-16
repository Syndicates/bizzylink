import React, { useState, useEffect } from 'react';
import ForumAPI from '../services/ForumAPI';
import { useNavigate } from 'react-router-dom';
import DonationModal from './DonationModal';

const UserProfileStats = ({ userId, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await ForumAPI.getUserStats(userId);
        console.log("User stats received:", data); // Debugging to see what we're getting
        setStats(data.stats);
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load user statistics');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchStats();
    }
  }, [userId]);
  
  const handleDonationSuccess = (result) => {
    // Update the user's balance if it's the current user
    if (currentUser && currentUser._id === userId) {
      setUser(prev => ({
        ...prev,
        balance: result.newBalance
      }));
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 rounded-lg p-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!stats || !user) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400">No user data available</p>
      </div>
    );
  }
  
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };
  
  // Get reputation color
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
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">User Statistics</h2>
      
      {/* User basic info */}
      <div className="flex flex-col md:flex-row items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col">
          <div className="text-sm text-gray-400">
            Member since: <span className="text-gray-300">{formatDate(user.createdAt)}</span>
          </div>
          <div className="text-sm text-gray-400">
            Last active: <span className="text-gray-300">{getTimeAgo(user.lastActive)}</span>
          </div>
        </div>
        
        {/* Action buttons (only show for other users) */}
        {currentUser && currentUser._id !== userId && (
          <div className="ml-auto flex gap-2">
            <button 
              onClick={() => setShowDonationModal(true)}
              className="bg-green-700 hover:bg-green-600 text-green-100 px-3 py-1 rounded text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Donate
            </button>
            
            <button 
              onClick={() => navigate(`/messages/new?recipient=${user.username}`)}
              className="bg-blue-700 hover:bg-blue-600 text-blue-100 px-3 py-1 rounded text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Message
            </button>
            
            {!currentUser.friends?.includes(userId) && (
              <button 
                className="bg-purple-700 hover:bg-purple-600 text-purple-100 px-3 py-1 rounded text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add Friend
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-gray-400 text-xs mb-1">Posts</h3>
          <div className="text-gray-200 font-semibold">{user.postCount || 0}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-gray-400 text-xs mb-1">Threads</h3>
          <div className="text-gray-200 font-semibold">{user.threadCount || 0}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-gray-400 text-xs mb-1">Likes Received</h3>
          <div className="text-blue-300 font-semibold">
            {/* Access total likes from the stats object if available */}
            {typeof stats.totalLikes === 'number' 
              ? stats.totalLikes 
              : "Loading..."}
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-gray-400 text-xs mb-1">Reputation</h3>
          <div className={`font-semibold ${getReputationColor(user.reputation)}`}>
            {user.reputation || 0}
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-gray-400 text-xs mb-1">Vouches</h3>
          <div className="text-green-300 font-semibold">
            {/* Direct access to vouches or count vouchesFrom array for backwards compatibility */}
            {(() => {
              if (user.vouches !== undefined) return user.vouches;
              if (user.vouchesFrom && Array.isArray(user.vouchesFrom)) return user.vouchesFrom.length;
              return 0;
            })()}
          </div>
        </div>
        
        {user.settings?.privacy?.showBalance && (
          <div className="bg-gray-700 p-3 rounded-lg">
            <h3 className="text-gray-400 text-xs mb-1">Balance</h3>
            <div className="text-yellow-300 font-semibold">{user.balance || 0}</div>
          </div>
        )}
      </div>
      
      {/* Recent activity */}
      {stats.recentThreads && stats.recentThreads.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-300 text-sm font-semibold mb-2">Recent Threads</h3>
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            {stats.recentThreads.map((thread, index) => (
              <div 
                key={thread._id} 
                className={`p-3 ${index < stats.recentThreads.length - 1 ? 'border-b border-gray-600' : ''}`}
                onClick={() => navigate(`/community/thread/${thread._id}`)}
              >
                <div className="text-gray-200 hover:text-green-300 cursor-pointer text-sm">
                  {thread.title}
                </div>
                <div className="text-gray-400 text-xs flex justify-between mt-1">
                  <span>in {thread.category?.name || 'Unknown Category'}</span>
                  <span>{formatDate(thread.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* User signature if they have one */}
      {user.signature && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h3 className="text-gray-400 text-xs mb-2">Signature</h3>
          <div className="text-gray-300 text-sm italic bg-gray-700/50 p-3 rounded">
            {user.signature}
          </div>
        </div>
      )}
      
      {/* Donation modal */}
      {showDonationModal && (
        <DonationModal 
          isOpen={showDonationModal}
          onClose={() => setShowDonationModal(false)}
          recipient={user}
          onSuccess={handleDonationSuccess}
        />
      )}
    </div>
  );
};

export default UserProfileStats;