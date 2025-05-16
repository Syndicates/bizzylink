import React, { useState, useEffect } from 'react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import MinecraftAvatar from '../components/MinecraftAvatar';
import FriendButton from '../components/FriendButton';
import FollowButton from '../components/FollowButton';

const Friends = () => {
  const { user } = useAuth();
  const { friends, following, loading, fetchFriends, fetchFollowing } = useSocial();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchFriends(true); // Skip cache for fresh data
    fetchFollowing(true);
  }, [fetchFriends, fetchFollowing]);
  
  // Filter lists based on search term with null checks
  const filteredFriends = friends?.list?.filter(friend => 
    friend?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (friend?.mcUsername && friend.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  const filteredRequests = friends?.received?.filter(request => 
    request?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request?.mcUsername && request.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  const filteredSent = friends?.sent?.filter(request => 
    request?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request?.mcUsername && request.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  const filteredFollowing = following?.following?.filter(user => 
    user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.mcUsername && user.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  const filteredFollowers = following?.followers?.filter(user => 
    user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.mcUsername && user.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Render friend card
  const renderFriendCard = (friend, showControls = true) => (
    <div key={friend.username} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      <Link to={`/profile/${friend.username}`} className="block hover:opacity-90">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-16 relative">
          {/* Online status indicator */}
          <div className={`absolute top-2 right-2 h-3 w-3 rounded-full ${friend.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        <div className="flex justify-center -mt-8">
          <MinecraftAvatar 
            username={friend.mcUsername || friend.username}
            uuid={friend.mcUUID}
            size={64}
            className="border-4 border-white rounded"
          />
        </div>
      </Link>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${friend.username}`} className="block">
          <h3 className="font-bold text-gray-800 mb-1">{friend.mcUsername || friend.username}</h3>
          {friend.mcUsername && friend.mcUsername !== friend.username && (
            <p className="text-xs text-gray-500 mb-2">@{friend.username}</p>
          )}
        </Link>
        
        {/* Status */}
        <p className="text-sm text-gray-600 mb-3">
          {friend.online ? (
            <span className="text-green-600">Online now</span>
          ) : (
            <span className="text-gray-500">
              {friend.lastSeen ? `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}` : 'Offline'}
            </span>
          )}
        </p>
        
        {/* Action buttons */}
        {showControls && (
          <div className="mt-2 flex justify-center space-x-2">
            <FriendButton 
              username={friend.username}
              mcUsername={friend.mcUsername} 
              className="text-xs py-1" 
              showText={false}
            />
          </div>
        )}
      </div>
    </div>
  );
  
  // Render request card
  const renderRequestCard = (request) => (
    <div key={request.username} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      <Link to={`/profile/${request.username}`} className="block hover:opacity-90">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-16 relative"></div>
        <div className="flex justify-center -mt-8">
          <MinecraftAvatar 
            username={request.mcUsername || request.username}
            uuid={request.mcUUID}
            size={64}
            className="border-4 border-white rounded"
          />
        </div>
      </Link>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${request.username}`} className="block">
          <h3 className="font-bold text-gray-800 mb-1">{request.mcUsername || request.username}</h3>
          {request.mcUsername && request.mcUsername !== request.username && (
            <p className="text-xs text-gray-500 mb-2">@{request.username}</p>
          )}
        </Link>
        
        {/* Action buttons */}
        <div className="mt-3">
          <FriendButton 
            username={request.username}
            mcUsername={request.mcUsername}
            className="w-full text-xs py-1"
          />
        </div>
      </div>
    </div>
  );
  
  // Render following/follower card
  const renderFollowCard = (user) => (
    <div key={user.username} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      <Link to={`/profile/${user.username}`} className="block hover:opacity-90">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-16 relative">
          {/* Online status indicator */}
          {user.online !== undefined && (
            <div className={`absolute top-2 right-2 h-3 w-3 rounded-full ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          )}
        </div>
        <div className="flex justify-center -mt-8">
          <MinecraftAvatar 
            username={user.mcUsername || user.username}
            uuid={user.mcUUID}
            size={64}
            className="border-4 border-white rounded"
          />
        </div>
      </Link>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${user.username}`} className="block">
          <h3 className="font-bold text-gray-800 mb-1">{user.mcUsername || user.username}</h3>
          {user.mcUsername && user.mcUsername !== user.username && (
            <p className="text-xs text-gray-500 mb-2">@{user.username}</p>
          )}
        </Link>
        
        {/* Status if available */}
        {user.online !== undefined && (
          <p className="text-sm text-gray-600 mb-3">
            {user.online ? (
              <span className="text-green-600">Online now</span>
            ) : (
              <span className="text-gray-500">
                {user.lastSeen ? `Last seen ${new Date(user.lastSeen).toLocaleDateString()}` : 'Offline'}
              </span>
            )}
          </p>
        )}
        
        {/* Action buttons */}
        <div className="mt-2 flex justify-center space-x-2">
          <FriendButton 
            username={user.username}
            mcUsername={user.mcUsername} 
            className="text-xs py-1" 
            showText={false}
          />
          <FollowButton 
            username={user.username}
            mcUsername={user.mcUsername}
            className="text-xs py-1" 
            showText={false}
          />
        </div>
      </div>
    </div>
  );
  
  // Main content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {loading.friends ? (
              <div className="col-span-full flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No friends found</p>
                <p className="text-sm mt-2">Send a friend request to connect with other players!</p>
              </div>
            ) : (
              filteredFriends.map(friend => renderFriendCard(friend))
            )}
          </div>
        );
      
      case 'requests':
        return (
          <div className="mt-4">
            {loading.friends ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>No friend requests</p>
                <p className="text-sm mt-2">You don't have any pending friend requests at the moment.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">Friend Requests ({filteredRequests.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRequests.map(request => renderRequestCard(request))}
                </div>
                
                {filteredSent.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mt-8 mb-3">Sent Requests ({filteredSent.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredSent.map(request => renderRequestCard(request))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      
      case 'following':
        return (
          <div className="mt-4">
            {loading.following ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">Following ({filteredFollowing.length})</h3>
                {filteredFollowing.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">
                    <p>You're not following anyone yet</p>
                    <p className="text-sm mt-2">Follow other players to see their updates!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFollowing.map(user => renderFollowCard(user))}
                  </div>
                )}
                
                <h3 className="text-lg font-semibold mt-8 mb-3">Followers ({filteredFollowers.length})</h3>
                {filteredFollowers.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">
                    <p>You don't have any followers yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFollowers.map(user => renderFollowCard(user))}
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              <span className="text-purple-600">Friends</span> & Social
            </h1>
            <p className="text-gray-600">Connect with other players from the server</p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-64 mt-4 md:mt-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'friends' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-purple-500'}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends?.list?.length || 0})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'requests' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-purple-500'}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests {friends?.received?.length > 0 && `(${friends.received.length})`}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'following' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600 hover:text-purple-500'}`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>
        
        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Friends;