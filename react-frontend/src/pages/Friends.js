/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Friends.js
 * @description Social connections management system for Minecraft players
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import MinecraftAvatar from '../components/MinecraftAvatar';
import FriendButton from '../components/social/FriendButton';
import FollowButton from '../components/social/FollowButton';
import { 
  UserIcon, 
  UsersIcon,
  UserPlusIcon,
  UserGroupIcon,
  BellIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Friends = () => {
  const { user } = useAuth();
  const { friends, following, loading, fetchFriends, fetchFollowing } = useSocial();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchFriends(true); // Skip cache for fresh data
    fetchFollowing(true);
  }, [fetchFriends, fetchFollowing]);
  
  // Handle manual refresh with animation
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFriends(true),
      fetchFollowing(true)
    ]);
    setTimeout(() => setRefreshing(false), 500); // Small delay for animation to complete
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
  
  // Render friend card with enhanced design
  const renderFriendCard = (friend, showControls = true) => (
    <motion.div 
      key={friend.username} 
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="relative">
        {/* Header with cover image */}
        <div 
          className="h-24 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://starlightskins.lunareclipse.studio/render/wallpaper/${friend.wallpaperId || 1}/${friend.mcUsername || friend.username})`
          }}
        >
          {/* Online status indicator */}
          <div className="absolute top-0 right-0 p-2">
            <div className={`h-4 w-4 rounded-full border-2 border-gray-800 ${friend.online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
        </div>
        
        {/* Avatar */}
        <Link to={`/profile/${friend.username}`} className="block">
          <div className="relative -mt-10 flex justify-center">
            <div className="p-1 bg-gray-800 rounded-lg inline-block">
              <MinecraftAvatar 
                username={friend.mcUsername || friend.username}
                uuid={friend.mcUUID}
                size={70}
                className="rounded-md"
              />
            </div>
          </div>
        </Link>
      </div>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${friend.username}`} className="block">
          <h3 className="font-minecraft text-lg text-white mb-1">{friend.mcUsername || friend.username}</h3>
          {friend.mcUsername && friend.mcUsername !== friend.username && (
            <p className="text-xs text-gray-400 mb-2">@{friend.username}</p>
          )}
        </Link>
        
        {/* Status with icon */}
        <div className="flex items-center justify-center text-sm mb-3">
          {friend.online ? (
            <span className="text-green-400 flex items-center">
              <span className="pulse-dot mr-2"></span> Online now
            </span>
          ) : (
            <span className="text-gray-400 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {friend.lastSeen ? `Last seen ${formatLastSeen(friend.lastSeen)}` : 'Offline'}
            </span>
          )}
        </div>
        
        {/* Rank badge if available */}
        {friend.rank && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${getRankColor(friend.rank)}`}>
            {friend.rank}
          </span>
        )}
        
        {/* Action buttons */}
        {showControls && (
          <div className="mt-3 flex justify-center space-x-2">
            <FriendButton 
              username={friend.username}
              mcUsername={friend.mcUsername} 
              className="text-xs rounded-md px-3 py-1.5 bg-gray-700 hover:bg-gray-600" 
              showText={true}
            />
            <Link to={`/messages/${friend.username}`} className="text-xs rounded-md px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white flex items-center">
              <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
              Message
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
  
  // Render request card with enhanced design
  const renderRequestCard = (request) => (
    <motion.div 
      key={request.username} 
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-500 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="relative">
        {/* Header with cover image */}
        <div 
          className="h-24 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://starlightskins.lunareclipse.studio/render/wallpaper/${request.wallpaperId || 1}/${request.mcUsername || request.username})`
          }}
        ></div>
        
        {/* Avatar */}
        <Link to={`/profile/${request.username}`} className="block">
          <div className="relative -mt-10 flex justify-center">
            <div className="p-1 bg-gray-800 rounded-lg inline-block">
              <MinecraftAvatar 
                username={request.mcUsername || request.username}
                uuid={request.mcUUID}
                size={70}
                className="rounded-md"
              />
            </div>
          </div>
        </Link>
      </div>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${request.username}`} className="block">
          <h3 className="font-minecraft text-lg text-white mb-1">{request.mcUsername || request.username}</h3>
          {request.mcUsername && request.mcUsername !== request.username && (
            <p className="text-xs text-gray-400 mb-2">@{request.username}</p>
          )}
        </Link>
        
        {/* Rank badge if available */}
        {request.rank && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${getRankColor(request.rank)}`}>
            {request.rank}
          </span>
        )}
        
        {/* Action buttons */}
        <div className="mt-3">
          <FriendButton 
            username={request.username}
            mcUsername={request.mcUsername}
            className="w-full text-sm py-2 rounded-md bg-green-600 hover:bg-green-500"
          />
        </div>
      </div>
    </motion.div>
  );
  
  // Render following/follower card with enhanced design
  const renderFollowCard = (user) => (
    <motion.div 
      key={user.username} 
      className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="relative">
        {/* Header with cover image */}
        <div 
          className="h-24 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://starlightskins.lunareclipse.studio/render/wallpaper/${user.wallpaperId || 1}/${user.mcUsername || user.username})`
          }}
        >
          {/* Online status indicator if available */}
          {user.online !== undefined && (
            <div className="absolute top-0 right-0 p-2">
              <div className={`h-4 w-4 rounded-full border-2 border-gray-800 ${user.online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            </div>
          )}
        </div>
        
        {/* Avatar */}
        <Link to={`/profile/${user.username}`} className="block">
          <div className="relative -mt-10 flex justify-center">
            <div className="p-1 bg-gray-800 rounded-lg inline-block">
              <MinecraftAvatar 
                username={user.mcUsername || user.username}
                uuid={user.mcUUID}
                size={70}
                className="rounded-md"
              />
            </div>
          </div>
        </Link>
      </div>
      
      <div className="p-4 text-center">
        <Link to={`/profile/${user.username}`} className="block">
          <h3 className="font-minecraft text-lg text-white mb-1">{user.mcUsername || user.username}</h3>
          {user.mcUsername && user.mcUsername !== user.username && (
            <p className="text-xs text-gray-400 mb-2">@{user.username}</p>
          )}
        </Link>
        
        {/* Status if available */}
        {user.online !== undefined && (
          <div className="flex items-center justify-center text-sm mb-3">
            {user.online ? (
              <span className="text-green-400 flex items-center">
                <span className="pulse-dot mr-2"></span> Online now
              </span>
            ) : (
              <span className="text-gray-400 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {user.lastSeen ? `Last seen ${formatLastSeen(user.lastSeen)}` : 'Offline'}
              </span>
            )}
          </div>
        )}
        
        {/* Rank badge if available */}
        {user.rank && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${getRankColor(user.rank)}`}>
            {user.rank}
          </span>
        )}
        
        {/* Action buttons */}
        <div className="mt-3 flex justify-center space-x-2">
          <FriendButton 
            username={user.username}
            mcUsername={user.mcUsername} 
            className="text-xs rounded-md px-3 py-1.5 bg-gray-700 hover:bg-gray-600" 
            showText={false}
          />
          <FollowButton 
            username={user.username}
            mcUsername={user.mcUsername}
            className="text-xs rounded-md px-3 py-1.5 bg-blue-700 hover:bg-blue-600" 
            showText={false}
          />
          <Link to={`/profile/${user.username}`} className="text-xs rounded-md px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white flex items-center">
            <UserIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
  
  // Format last seen time for better readability
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    
    // Convert to minutes
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    
    // Convert to hours
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    // Convert to days
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    // For older dates, return date
    return date.toLocaleDateString();
  };
  
  // Get color for rank badges
  const getRankColor = (rank) => {
    rank = rank.toLowerCase();
    if (rank.includes('admin')) return 'bg-red-600 text-white';
    if (rank.includes('mod')) return 'bg-green-600 text-white';
    if (rank.includes('vip+')) return 'bg-purple-600 text-white';
    if (rank.includes('vip')) return 'bg-blue-600 text-white';
    if (rank.includes('mvp+')) return 'bg-yellow-600 text-black';
    if (rank.includes('mvp')) return 'bg-yellow-500 text-black';
    return 'bg-gray-600 text-white';
  };
  
  // Get stats count for tab labels
  const getTabCounts = () => {
    return {
      friends: friends?.list?.length || 0,
      requests: friends?.received?.length || 0,
      sent: friends?.sent?.length || 0,
      following: following?.following?.length || 0,
      followers: following?.followers?.length || 0
    };
  };
  
  const tabCounts = getTabCounts();
  
  // Main content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="mt-8">
            {loading.friends ? (
              <div className="col-span-full flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <motion.div 
                className="bg-gray-800/50 rounded-lg p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gray-700/50 inline-flex rounded-full p-4 mb-4">
                  <UsersIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-minecraft text-white mb-2">No Friends Found</h3>
                <p className="text-gray-400 mb-6">Make new friends by sending requests to other players!</p>
                
                <Link 
                  to="/leaderboard" 
                  className="inline-flex items-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Discover Players
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFriends.map(friend => renderFriendCard(friend))}
                </div>
                
                {/* Friend stats */}
                <div className="mt-10 p-6 bg-gray-800/50 rounded-lg">
                  <h3 className="text-lg font-minecraft text-white mb-4">Friend Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                      <div className="bg-purple-600/20 p-3 rounded-full mr-3">
                        <UserGroupIcon className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Friends</p>
                        <p className="text-xl text-white font-bold">{tabCounts.friends}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                      <div className="bg-green-600/20 p-3 rounded-full mr-3">
                        <UserPlusIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Online Friends</p>
                        <p className="text-xl text-white font-bold">{filteredFriends.filter(f => f.online).length}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                      <div className="bg-blue-600/20 p-3 rounded-full mr-3">
                        <HeartIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Mutual Followers</p>
                        <p className="text-xl text-white font-bold">{tabCounts.followers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case 'requests':
        return (
          <div className="mt-8">
            {loading.friends ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredRequests.length === 0 && filteredSent.length === 0 ? (
              <motion.div 
                className="bg-gray-800/50 rounded-lg p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-gray-700/50 inline-flex rounded-full p-4 mb-4">
                  <BellIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-minecraft text-white mb-2">No Friend Requests</h3>
                <p className="text-gray-400">You don't have any pending friend requests at the moment.</p>
              </motion.div>
            ) : (
              <>
                {filteredRequests.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center mb-6">
                      <div className="bg-yellow-600/20 p-2 rounded-md mr-3">
                        <BellIcon className="h-5 w-5 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-minecraft text-white">Friend Requests ({filteredRequests.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredRequests.map(request => renderRequestCard(request))}
                    </div>
                  </div>
                )}
                
                {filteredSent.length > 0 && (
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-600/20 p-2 rounded-md mr-3">
                        <UserPlusIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-minecraft text-white">Sent Requests ({filteredSent.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredSent.map(request => renderRequestCard(request))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      case 'following':
        return (
          <div className="mt-8">
            {loading.following ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-600/20 p-2 rounded-md mr-3">
                      <HeartIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-minecraft text-white">Following ({filteredFollowing.length})</h3>
                  </div>
                  
                  {filteredFollowing.length === 0 ? (
                    <motion.div 
                      className="bg-gray-800/50 rounded-lg p-6 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-gray-400">You're not following anyone yet.</p>
                      <p className="text-sm text-gray-500 mt-2">Follow other players to see their updates!</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredFollowing.map(user => renderFollowCard(user))}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-600/20 p-2 rounded-md mr-3">
                      <UserGroupIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-minecraft text-white">Followers ({filteredFollowers.length})</h3>
                  </div>
                  
                  {filteredFollowers.length === 0 ? (
                    <motion.div 
                      className="bg-gray-800/50 rounded-lg p-6 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-gray-400">You don't have any followers yet.</p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredFollowers.map(user => renderFollowCard(user))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <motion.div 
      className="min-h-screen pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <motion.h1 
                className="text-3xl font-minecraft mb-2 flex items-center"
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Friends</span>
                <span className="text-white ml-2">&</span>
                <span className="text-blue-400 ml-2">Social</span>
              </motion.h1>
              <p className="text-gray-400">Connect with other players from the Minecraft server</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button 
                onClick={handleRefresh}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors"
                disabled={loading.friends || loading.following || refreshing}
              >
                <ArrowPathIcon className={`h-5 w-5 text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-60 pl-10 pr-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 sticky top-24">
              <h2 className="font-minecraft text-lg mb-6 text-center pb-3 border-b border-gray-700">Navigation</h2>
              
              {/* Navigation Tabs */}
              <div className="flex flex-col space-y-2">
                <button
                  className={`flex items-center justify-between px-4 py-3 font-medium rounded-md transition-colors ${activeTab === 'friends' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  onClick={() => setActiveTab('friends')}
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-3" />
                    <span>Friends</span>
                  </div>
                  <span className="bg-gray-900/50 px-2 py-0.5 rounded-md text-sm">{tabCounts.friends}</span>
                </button>
                
                <button
                  className={`flex items-center justify-between px-4 py-3 font-medium rounded-md transition-colors ${activeTab === 'requests' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  onClick={() => setActiveTab('requests')}
                >
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 mr-3" />
                    <span>Requests</span>
                  </div>
                  {tabCounts.requests > 0 && (
                    <span className="bg-red-500 px-2 py-0.5 rounded-md text-sm">{tabCounts.requests}</span>
                  )}
                </button>
                
                <button
                  className={`flex items-center justify-between px-4 py-3 font-medium rounded-md transition-colors ${activeTab === 'following' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  onClick={() => setActiveTab('following')}
                >
                  <div className="flex items-center">
                    <HeartIcon className="h-5 w-5 mr-3" />
                    <span>Following</span>
                  </div>
                  <span className="bg-gray-900/50 px-2 py-0.5 rounded-md text-sm">{tabCounts.following}</span>
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-sm uppercase text-gray-400 font-bold mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Friends</span>
                    <span className="font-bold text-white">{tabCounts.friends}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pending Requests</span>
                    <span className="font-bold text-white">{tabCounts.requests}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sent Requests</span>
                    <span className="font-bold text-white">{tabCounts.sent}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Following</span>
                    <span className="font-bold text-white">{tabCounts.following}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Followers</span>
                    <span className="font-bold text-white">{tabCounts.followers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
              {/* Mobile Tabs */}
              <div className="flex lg:hidden border-b border-gray-700 mb-4 overflow-x-auto no-scrollbar">
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'friends' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('friends')}
                >
                  Friends ({tabCounts.friends})
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'requests' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('requests')}
                >
                  Requests {tabCounts.requests > 0 && `(${tabCounts.requests})`}
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'following' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('following')}
                >
                  Following ({tabCounts.following})
                </button>
              </div>
              
              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for the pulse dot animation */}
      <style jsx>{`
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #4ade80;
          position: relative;
          display: inline-block;
        }
        
        .pulse-dot:before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background-color: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          70% {
            transform: scale(2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default Friends;