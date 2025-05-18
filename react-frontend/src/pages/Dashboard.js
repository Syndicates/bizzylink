import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { MinecraftService } from '../services/api';
import { AuthService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import Changelog from '../components/Changelog';
import MinecraftAPI from '../utils/minecraft-api';
import { 
  UserIcon, 
  LinkIcon, 
  ClockIcon, 
  CubeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  DocumentDuplicateIcon,
  ChatBubbleLeftIcon as ChatAltIcon,
  UsersIcon,
  PuzzlePieceIcon as PuzzleIcon,
  StarIcon,
  BellIcon,
  MapIcon,
  ShoppingBagIcon,
  GlobeAltIcon as GlobeIcon,
  ChartBarIcon,
  BookOpenIcon as BookIcon,
  QuestionMarkCircleIcon,
  ChatBubbleBottomCenterIcon as ChatIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/**
 * NOTE: Always use backend/database field names exactly as returned (see RULES.md: Data Management, Naming Consistency).
 * This prevents silent data mismatches between backend and frontend.
 */

const Dashboard = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [mcUsername, setMcUsername] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkExpiry, setLinkExpiry] = useState(null);
  const [linkExpiryDate, setLinkExpiryDate] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [playerStats, setPlayerStats] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [onlinePlayersLoading, setOnlinePlayersLoading] = useState(false);
  const [onlinePlayersError, setOnlinePlayersError] = useState(null);
  const [serverStatus, setServerStatus] = useState({ online: true, playerCount: 24, maxPlayers: 100 });
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topPlayersLoading, setTopPlayersLoading] = useState(false);
  const [topPlayersError, setTopPlayersError] = useState(null);
  const [serverStats, setServerStats] = useState(null);
  const [serverStatsLoading, setServerStatsLoading] = useState(false);
  const [serverStatsError, setServerStatsError] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [recentAchievementsLoading, setRecentAchievementsLoading] = useState(false);
  const [recentAchievementsError, setRecentAchievementsError] = useState(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check and update time remaining on link code
  useEffect(() => {
    if (!linkExpiryDate || isNaN(linkExpiryDate.getTime())) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiryTime = new Date(linkExpiryDate);

      if (isNaN(expiryTime.getTime()) || now >= expiryTime) {
        setLinkCode('');
        setLinkExpiry(null);
        setLinkExpiryDate(null);
        setTimeRemaining('');
        return;
      }

      const diffMs = expiryTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      setTimeRemaining(`${diffMins}:${diffSecs < 10 ? '0' : ''}${diffSecs}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [linkExpiryDate]);

  // Format UUID with dashes if needed (some APIs require this format)
  const formatUUID = (uuid) => {
    if (!uuid) return '';
    // If already has dashes, return as is
    if (uuid.includes('-')) return uuid;
    // Add dashes in standard UUID format
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  };

  // Debug - log user object when it changes
  useEffect(() => {
    if (user) {
      console.log('Current user data:', {
        username: user.username,
        linked: user.linked,
        mcUsername: user.mcUsername,
        mcUUID: user.mcUUID,
        formattedUUID: formatUUID(user.mcUUID)
      });
    }
  }, [user]);
  
  // Check for active link code on load (only on mount, not on every user change)
  useEffect(() => {
    const checkActiveLinkCode = async () => {
      if (user && !user.linked) {
        try {
          // Try to get from the API
          const response = await MinecraftService.getActiveLinkCode();
          if (response.linkCode) {
            setLinkCode(response.linkCode);
            // Optionally, calculate expiresIn if you want a timer
            setLinkExpiryDate(response.expiresAt ? new Date(response.expiresAt) : null);
            setMcUsername(user.mcUsername || '');
          }
          // Do NOT clear the code if not found; just leave as is
        } catch (error) {
          // Do NOT clear the code here
        }
      }
    };
    checkActiveLinkCode();
    // Only run on mount
  }, []);

  // Fetch player stats if account is linked and when tab changes
  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (user?.linked && user?.mcUsername && activeTab === 'account') {
        setIsUpdatingStats(true);
        try {
          console.log('Fetching player stats for:', user.mcUsername);
          
          // Use real API call instead of mock data
          const response = await MinecraftService.getPlayerStats(user.mcUsername);
          console.log('API Response:', response.data);
          
          // Create a complete data object by merging API response with defaults for missing fields
          const completeStats = {
            // Default values for fields that might be missing
            playtime: '0h',
            lastSeen: 'Never',
            balance: 0,
            blocks_mined: 0,
            mobs_killed: 0,
            deaths: 0,
            joinDate: formatDate(user.createdAt) || 'N/A',
            achievements: 0,
            level: 1,
            experience: 0,
            rank: 'Member',
            group: 'default',
            groups: ['default'],
            world: 'world',
            gamemode: 'SURVIVAL',
            online: false,
            
            // Override with actual data from API
            ...response.data,
            
            // Ensure we have a valid value for experience percentage
            experience: response.data.experience || 0
          };
          
          console.log('Using player stats:', completeStats);
          setPlayerStats(completeStats);
          setIsUpdatingStats(false);
          
        } catch (error) {
          console.error('Failed to fetch player stats:', error);
          // Use placeholder data if API fails
          setPlayerStats({
            playtime: '0h',
            lastSeen: 'Never',
            balance: 0,
            blocks_mined: 0,
            mobs_killed: 0,
            deaths: 0,
            joinDate: 'N/A',
            achievements: 0,
            level: 1,
            experience: 0,
            rank: 'Member',
            group: 'default'
          });
          setIsUpdatingStats(false);
        }
      }
    };
    
    if (user) {
      fetchPlayerStats();
    }
  }, [user, activeTab]);
  
  // No longer need this import as it's moved to the top
  /* Minecraft API already imported at the top */

  // Fetch server status and online players for the community tab
  useEffect(() => {
    const fetchServerData = async () => {
      if (activeTab === 'community') {
        setOnlinePlayersLoading(true);
        setOnlinePlayersError(null);
        try {
          // Fetch real server data
          const serverData = await MinecraftAPI.getServerStatus('play.bizzynation.co.uk');
          setServerStatus({
            online: serverData.online,
            playerCount: serverData.playerCount,
            maxPlayers: serverData.maxPlayers
          });

          // Fetch real online players from API
          const players = await MinecraftAPI.getOnlinePlayers('play.bizzynation.co.uk');
          setOnlinePlayers(players);
        } catch (error) {
          setOnlinePlayers([]);
          setOnlinePlayersError('Could not fetch online players.');
        } finally {
          setOnlinePlayersLoading(false);
        }
      }
    };
    fetchServerData();
    let intervalId;
    if (activeTab === 'community') {
      intervalId = setInterval(() => {
        fetchServerData();
      }, 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);
  
  // Generate link code
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    
    if (!mcUsername) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please enter your Minecraft username'
      });
      return;
    }
    
    setLinkLoading(true);
    console.log('Generating link code for:', mcUsername);
    
    try {
      // Make the API call
      console.log('Calling linkAccount API...');
      const response = await MinecraftService.linkAccount(mcUsername);
      console.log('Link account API response:', response);
      setNotification({
        show: true,
        type: 'success',
        message: response.data.message
      });
      // Set link code from the generate endpoint response only; do NOT call getActiveLinkCode here
      const code = response.data.linkCode || response.data.code || response.data.link_code;
      setLinkCode(code);
      setLinkExpiry(response.data.expiresIn);
      const expiryDate = new Date(response.data.codeExpiry || response.data.expires);
      setLinkExpiryDate(!isNaN(expiryDate.getTime()) ? expiryDate : null);
      setMcUsername(response.data.mcUsername || mcUsername);
    } catch (error) {
      console.error('Link account error:', error);
      console.error('Error response:', error.response);
      // If we got an error about already having an active link code, update the UI with that info
      const code = error.response?.data?.linkCode || error.response?.data?.code || error.response?.data?.link_code;
      if (code) {
        setLinkCode(code);
        setLinkExpiry(error.response.data.expiresIn);
        // Defensive date parsing
        const expiryDate = new Date(error.response.data.codeExpiry);
        if (!isNaN(expiryDate.getTime())) {
          setLinkExpiryDate(expiryDate);
        } else {
          setLinkExpiryDate(null);
        }
        setNotification({
          show: true,
          type: 'info',
          message: error.response.data.message || 'You already have an active link code'
        });
      } else {
        setNotification({
          show: true,
          type: 'error',
          message: error.response?.data?.error || 'Failed to generate link code'
        });
      }
    } finally {
      setLinkLoading(false);
    }
  };
  
  // Unlink account
  const handleUnlink = async () => {
    setShowUnlinkModal(true);
  };
  
  const confirmUnlink = async () => {
    setUnlinkLoading(true);
    try {
      const response = await MinecraftService.unlinkAccount();
      // After unlink, reload user profile from backend to ensure state is correct
      const freshUser = await AuthService.getProfile(true).then(res => res.data || res);
      updateUserProfile(freshUser);
      setNotification({ show: true, type: 'success', message: response.data.message });
      setPlayerStats(null);
      setShowUnlinkModal(false);
      setActiveTab('account');
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.error || 'Failed to unlink account' });
    } finally {
      setUnlinkLoading(false);
    }
  };
  
  // Copy link command to clipboard
  const copyLinkCommand = () => {
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setNotification({
      show: true,
      type: 'success',
      message: 'Command copied to clipboard!'
    });
  };
  
  // Fetch statistics tab data
  useEffect(() => {
    if (activeTab !== 'statistics') return;
    // Top Players
    setTopPlayersLoading(true);
    setTopPlayersError(null);
    MinecraftService.getLeaderboard('playtime', 'all', 5)
      .then(res => {
        setTopPlayers(res.data?.data?.players || []);
      })
      .catch(() => setTopPlayersError('Could not load top players.'))
      .finally(() => setTopPlayersLoading(false));
    // Server Stats
    setServerStatsLoading(true);
    setServerStatsError(null);
    MinecraftAPI.getServerStatus('play.bizzynation.co.uk')
      .then(stats => setServerStats(stats))
      .catch(() => setServerStatsError('Could not load server stats.'))
      .finally(() => setServerStatsLoading(false));
    // Recent Achievements
    setRecentAchievementsLoading(true);
    setRecentAchievementsError(null);
    MinecraftService.getLeaderboard('achievements', 'all', 5)
      .then(res => setRecentAchievements(res.data?.data?.players || []))
      .catch(() => setRecentAchievementsError('Could not load achievements.'))
      .finally(() => setRecentAchievementsLoading(false));
  }, [activeTab]);
  
  if (!user) {
    return <LoadingSpinner fullScreen />;
  }
  
  return (
    <div className="min-h-screen py-12 minecraft-grid-bg bg-habbo-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">
            Welcome, {user.username}!
          </h1>
          
          {/* Server status indicator */}
          <div className="flex items-center mt-4 md:mt-0 space-x-4">
            <div className="flex items-center bg-white/10 rounded-full px-4 py-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${serverStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {serverStatus.online ? 
                  `Server Online: ${serverStatus.playerCount}/${serverStatus.maxPlayers} players` : 
                  'Server Offline'}
              </span>
            </div>
            
            <div className="bg-white/10 rounded-full px-4 py-1 text-sm flex items-center">
              <BellIcon className="h-4 w-4 mr-2" />
              <span>3 notifications</span>
          </div>
        </div>
        </motion.div>
        
        {/* Dashboard Tabs */}
          <motion.div
          className="flex flex-wrap border-b border-white/10 mb-8 overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
              <button
                onClick={() => setActiveTab('account')}
            className={`dashboard-tab ${activeTab === 'account' ? 'active' : ''}`}
              >
            <UserIcon className="h-5 w-5 inline-block mr-2" />
            <span>Account</span>
              </button>
              <button
            onClick={() => setActiveTab('community')}
            className={`dashboard-tab ${activeTab === 'community' ? 'active' : ''}`}
          >
            <UsersIcon className="h-5 w-5 inline-block mr-2" />
            <span>Community</span>
              </button>
              <button
            onClick={() => setActiveTab('statistics')}
            className={`dashboard-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            <span>Statistics</span>
              </button>
              <button
                onClick={() => setActiveTab('news')}
            className={`dashboard-tab ${activeTab === 'news' ? 'active' : ''}`}
              >
            <ChatAltIcon className="h-5 w-5 inline-block mr-2" />
            <span>News & Events</span>
              </button>
        </motion.div>
            
            {/* Account Tab */}
            {activeTab === 'account' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
                    <motion.div
                      className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-minecraft-habbo-blue rounded-habbo flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                        <div>
                  <h2 className="text-xl font-bold text-white">{user.username}</h2>
                  <p className="text-gray-400">Member since: {formatDate(user.createdAt)}</p>
                        </div>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="flex justify-between">
                  <span className="text-gray-400">Email:</span> 
                  <span className="text-white">{user.email || 'Not provided'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Last Login:</span> 
                  <span className="text-white">{formatDate(user.lastLogin)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Role:</span> 
                  <span className="text-minecraft-habbo-blue font-medium">{user.role}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Account Status:</span> 
                  <span className="text-green-400">Active</span>
                </p>
                      </div>
                      
              <div className="mt-6 pt-4 border-t border-white/10">
                <Link to="/edit-profile" className="habbo-btn w-full mb-2 block text-center">
                  Edit Profile
                </Link>
                <Link to="/change-password" className="habbo-btn w-full bg-minecraft-habbo-purple block text-center">
                  Change Password
                </Link>
              </div>
                    </motion.div>

            {/* Minecraft Account Card */}
                    <motion.div
                      className="habbo-card p-6 rounded-habbo"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Minecraft Account</h2>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.linked ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                >
                  {user.linked ? 'Linked' : 'Not Linked'}
                </span>
              </div>

              {user.linked ? (
                // Linked account info
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    {console.log('Rendering Minecraft avatar with UUID:', user.mcUUID, 'Username:', user.mcUsername) || user.mcUUID ? (
                      <img 
                        src={`https://visage.surgeplay.com/face/128/${user.mcUsername}`}
                        alt="Minecraft Skin" 
                        className="w-16 h-16 rounded-habbo animate-bounce-slight"
                        onLoad={(e) => {
                          console.log('Successfully loaded skin from Visage', e.target.src);
                        }}
                        onError={(e) => {
                          console.log('Failed to load skin from Visage, trying PlayerDB');
                          e.target.src = `https://playerdb.co/api/player/minecraft/${user.mcUsername}/avatar`;
                          e.target.onerror = (e2) => {
                            console.log('Failed to load from PlayerDB, trying mc-heads');
                            e2.target.src = `https://mc-heads.net/avatar/${user.mcUsername}/128`;
                            e2.target.onerror = (e3) => {
                              console.log('Failed mc-heads, trying minotar');
                              e3.target.src = `https://minotar.net/avatar/${user.mcUsername}/128.png`;
                              e3.target.onerror = (e4) => {
                                console.log('All skin load attempts failed, using placeholder');
                                e4.target.src = 'https://via.placeholder.com/128?text=Skin';
                                e4.target.onerror = null;
                              };
                            };
                          };
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-habbo flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-white" />
                            </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.mcUsername}</h3>
                      <p className="text-gray-400 text-sm">
                        UUID: <span title={user.mcUUID || '--'} className="font-mono cursor-help">
                          {user.mcUUID ? `${user.mcUUID.substring(0, 8)}...` : '--'}
                        </span>
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-gray-400 text-xs">
                          <a 
                            href={`https://namemc.com/profile/${user.mcUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-minecraft-habbo-blue hover:underline"
                          >
                            View on NameMC
                          </a>
                        </p>
                        <p className="text-gray-400 text-xs">
                          <a 
                            href={`https://mc-heads.net/body/${user.mcUsername}/right`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-minecraft-habbo-blue hover:underline"
                          >
                            View Full Skin
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isUpdatingStats ? (
                    <div className="flex justify-center my-8">
                      <LoadingSpinner />
                    </div>
                  ) : playerStats ? (
                    <div className="space-y-4 mt-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Level Progress</span>
                          <span className="text-minecraft-habbo-blue">{playerStats.experience}%</span>
                        </div>
                        <div className="habbo-progress-bar">
                          <div style={{ width: `${playerStats.experience}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-habbo text-center">
                          <p className="text-gray-400 text-xs">Balance</p>
                          <p className="text-xl font-bold text-minecraft-habbo-yellow">${playerStats.balance}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-habbo text-center">
                          <p className="text-gray-400 text-xs">Level</p>
                          <p className="text-xl font-bold text-white">{playerStats.level}</p>
                        </div>
                      </div>
                      
                      {/* Minecraft Server Status */}
                      <div className="bg-white/5 p-3 rounded-habbo">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Server Status</span>
                          <span className={`text-xs ${playerStats.lastSeen === 'Online now' ? 'text-green-400' : 'text-gray-400'}`}>
                            {playerStats.lastSeen === 'Online now' ? (
                              <span className="flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                                Online Now
                              </span>
                            ) : (
                              `Last seen: ${playerStats.lastSeen}`
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Minecraft Rank and Group */}
                      {playerStats.rank && (
                        <div className="bg-white/5 p-3 rounded-habbo">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">Rank</span>
                            <span className="text-minecraft-habbo-yellow font-medium">{playerStats.rank}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Command to sync data */}
                      <div className="bg-white/5 p-3 rounded-habbo">
                        <p className="text-gray-400 text-xs mb-1">Sync Your Data</p>
                        <div className="bg-black p-2 rounded-habbo font-mono flex items-center justify-between">
                          <code className="text-minecraft-green text-sm">/link sync</code>
                            <button
                            onClick={() => {
                              navigator.clipboard.writeText('/link sync');
                              setNotification({
                                show: true,
                                type: 'success',
                                message: 'Command copied to clipboard!'
                              });
                            }}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          </div>
                      </div>
                        </div>
                      ) : (
                    <div className="text-center py-4 text-gray-400">Loading player stats...</div>
                  )}
                  
                  <button
                    onClick={handleUnlink}
                    disabled={unlinkLoading}
                    className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-habbo transition mt-4 text-white"
                  >
                    {unlinkLoading ? <LoadingSpinner /> : 'Unlink Account'}
                  </button>
                </div>
              ) : (
                // Link form
                <div className="mt-4">
                  <p className="mb-4 text-gray-300">Link your Minecraft account to access exclusive features.</p>
                  <form onSubmit={handleGenerateLink} className="space-y-4">
                    <div>
                      <label htmlFor="mcUsername" className="block mb-1 font-medium text-gray-300">
                              Minecraft Username
                            </label>
                            <input
                              type="text"
                              id="mcUsername"
                              value={mcUsername}
                              onChange={(e) => setMcUsername(e.target.value)}
                        placeholder="Your Minecraft username"
                        className="habbo-input w-full"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={linkLoading}
                      className="habbo-btn w-full py-2 rounded-habbo"
                          >
                      {linkLoading ? <LoadingSpinner /> : 'Generate Link Code'}
                          </button>
                        </form>

                  {/* Link instructions if code was generated */}
                  {linkCode && !user.linked && (
                    <div className="mt-4 bg-minecraft-navy-dark p-4 rounded-habbo">
                      <p className="mb-2 text-gray-300">To complete linking, run this command in-game:</p>
                      <div className="bg-black p-3 rounded-habbo font-mono flex items-center justify-between">
                        <code className="text-minecraft-green">/link {linkCode}</code>
                        <button 
                          onClick={copyLinkCommand}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-yellow-400 text-sm flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" /> 
                          {timeRemaining ? (
                            <>Expires in: <span className="font-mono ml-1">{timeRemaining}</span></>
                          ) : (
                            <>Code expires in {linkExpiry || '30 minutes'}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Quick Actions Card */}
                  <motion.div
                    className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                      <QuickActionButton 
                  icon={<MapIcon className="h-6 w-6" />}
                  title="Server Map"
                  description="View the live map"
                  path="/map"
                  color="bg-gradient-to-br from-minecraft-habbo-blue to-blue-700"
                      />
                      
                      <QuickActionButton 
                  icon={<ShoppingBagIcon className="h-6 w-6" />}
                  title="Shop"
                  description="Buy items & ranks"
                  path="/shop"
                  color="bg-gradient-to-br from-minecraft-habbo-purple to-purple-800"
                      />
                      
                      <QuickActionButton 
                  icon={<GlobeIcon className="h-6 w-6" />}
                  title="Forums"
                  description="Join discussions"
                  path="https://forums.bizzynation.com"
                  external
                  color="bg-gradient-to-br from-minecraft-habbo-red to-red-800"
                      />
                      
                      <QuickActionButton 
                  icon={<StarIcon className="h-6 w-6" />}
                  title="Vote"
                  description="Get daily rewards"
                  path="https://bizzynation.com/vote"
                  external
                  color="bg-gradient-to-br from-minecraft-habbo-yellow to-amber-700"
                      />
                    </div>
              
              <div className="mt-6">
                <Changelog showLatestByDefault={false} />
                </div>
            </motion.div>

            {/* Player Stats Card - Only visible when user has linked account */}
            {user.linked && playerStats && (
                  <motion.div
                className="habbo-card p-6 rounded-habbo lg:col-span-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-6">Player Statistics</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard 
                    icon={<ClockIcon className="h-5 w-5 text-minecraft-habbo-blue" />}
                    label="Playtime"
                    value={playerStats.playtime}
                  />
                  <StatCard 
                    icon={<CalendarIcon className="h-5 w-5 text-minecraft-habbo-blue" />}
                    label="Last Seen"
                    value={playerStats.lastSeen}
                  />
                  <StatCard 
                    icon={<CurrencyDollarIcon className="h-5 w-5 text-minecraft-habbo-yellow" />}
                    label="Balance"
                    value={`$${playerStats.balance}`}
                  />
                  <StatCard 
                    icon={<CubeIcon className="h-5 w-5 text-minecraft-habbo-blue" />}
                    label="Blocks Mined"
                    value={playerStats.blocks_mined.toLocaleString()}
                  />
                  <StatCard 
                    icon={<SwordIcon className="h-5 w-5 text-minecraft-habbo-red" />}
                    label="Mobs Killed"
                    value={playerStats.mobs_killed.toLocaleString()}
                  />
                  <StatCard 
                    icon={<SkullIcon className="h-5 w-5 text-gray-400" />}
                    label="Deaths"
                    value={playerStats.deaths.toLocaleString()}
                  />
                </div>
                
                {/* Extended Stats - Server Integration */}
                <div className="mt-6 border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Server Data</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard 
                      icon={<MapIcon className="h-5 w-5 text-minecraft-habbo-green" />}
                      label="Current World"
                      value={playerStats.world || "Overworld"}
                    />
                    <StatCard 
                      icon={<GlobeIcon className="h-5 w-5 text-minecraft-habbo-blue" />}
                      label="Gamemode"
                      value={playerStats.gamemode || "Survival"}
                    />
                    <StatCard 
                      icon={<UserIcon className="h-5 w-5 text-minecraft-habbo-yellow" />}
                      label="Rank"
                      value={playerStats.rank || "Member"}
                    />
                    <StatCard 
                      icon={<UserIcon className="h-5 w-5 text-minecraft-habbo-purple" />}
                      label="Permission Group"
                      value={playerStats.group || "default"}
                    />
                  </div>
                </div>
                
                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Achievements</h3>
                    <span className="text-minecraft-habbo-yellow">
                      {playerStats.achievements}/30 Completed
                    </span>
                  </div>
                  
                  <div className="habbo-progress-bar">
                    <div style={{ width: `${(playerStats.achievements / 30) * 100}%` }}></div>
                  </div>
                    </div>
                  </motion.div>
            )}
          </div>
        )}
                  
        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Online Players */}
            <motion.div
              className="habbo-card p-6 rounded-habbo md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Online Players</h2>
              {onlinePlayersLoading ? (
                <div className="text-center py-4 text-gray-400">Loading online players...</div>
              ) : onlinePlayersError ? (
                <div className="text-center py-4 text-red-400">{onlinePlayersError}</div>
              ) : onlinePlayers.length === 0 ? (
                <div className="text-center py-4 text-gray-400">No players online.</div>
              ) : (
                <div className="space-y-4">
                  {onlinePlayers.map((player, index) => (
                    <div 
                      key={index} 
                      className="flex items-center p-3 bg-white/5 rounded-habbo"
                    >
                      <img 
                        src={MinecraftAPI.getPlayerAvatar(player.username, 100)}
                        alt={player.username} 
                        className="w-10 h-10 rounded-habbo mr-4"
                        onError={(e) => {
                          e.target.src = `https://mc-heads.net/avatar/${player.username}/100`;
                          e.target.onerror = (e2) => {
                            e2.target.src = `https://minotar.net/avatar/${player.username}/100`;
                            e2.target.onerror = (e3) => {
                              e3.target.src = 'https://via.placeholder.com/100?text=MC';
                            };
                          };
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-white">{player.username}</h3>
                            <span className={`text-xs ${
                              player.rank === 'Admin' ? 'text-red-400' :
                              player.rank === 'VIP' || player.rank === 'VIP+' ? 'text-minecraft-habbo-yellow' :
                              'text-gray-400'
                            }`}>
                              {player.rank || 'Player'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {player.playTime || ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between">
                <span className="text-sm text-gray-400">
                  {onlinePlayers.length} players online
                </span>
                <button className="habbo-btn text-sm py-1">
                  View All Players
                </button>
              </div>
            </motion.div>
            
            {/* Server Information */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Server Info</h2>
                
                <div className="space-y-3">
                  <p className="flex justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white font-mono">play.bizzynation.com</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">1.19.2</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-white">{serverStatus.playerCount}/{serverStatus.maxPlayers}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`${serverStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                      {serverStatus.online ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
                
                <button className="habbo-btn w-full mt-4">
                  Copy Server IP
                </button>
              </div>
              
              {/* Recent Updates */}
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Recent Updates</h2>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-minecraft-habbo-blue pl-3">
                    <h3 className="font-medium">New Shop Items</h3>
                    <p className="text-sm text-gray-400">Added new items to the shop</p>
                    <p className="text-xs text-minecraft-habbo-blue">2 hours ago</p>
                </div>
                
                  <div className="border-l-4 border-minecraft-habbo-red pl-3">
                    <h3 className="font-medium">Server Restart</h3>
                    <p className="text-sm text-gray-400">Scheduled restart at 8PM EST</p>
                    <p className="text-xs text-minecraft-habbo-blue">1 day ago</p>
                  </div>
                  
                  <div className="border-l-4 border-minecraft-habbo-yellow pl-3">
                    <h3 className="font-medium">Weekend Event</h3>
                    <p className="text-sm text-gray-400">Double XP all weekend</p>
                    <p className="text-xs text-minecraft-habbo-blue">2 days ago</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  <QuickLink icon={<BookIcon />} label="Rules" />
                  <QuickLink icon={<QuestionMarkCircleIcon />} label="Help" />
                  <QuickLink icon={<ChatIcon />} label="Discord" />
                  <QuickLink icon={<GiftIcon />} label="Vote" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              className="habbo-card p-6 rounded-habbo lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-6">Top Players</h2>
              {topPlayersLoading ? (
                <div className="text-center py-4 text-gray-400">Loading top players...</div>
              ) : topPlayersError ? (
                <div className="text-center py-4 text-red-400">{topPlayersError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4">Rank</th>
                        <th className="text-left py-3 px-4">Player</th>
                        <th className="text-left py-3 px-4">Play Time</th>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Achievements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPlayers.map((player, index) => (
                        <tr key={player.id || player.username || index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 font-bold">#{index + 1}</td>
                          <td className="py-3 px-4">{player.username || player.mcUsername}</td>
                          <td className="py-3 px-4">{MinecraftService.formatPlaytime(player.playtime_minutes || player.playtime)}</td>
                          <td className="py-3 px-4 text-minecraft-habbo-yellow">${player.balance || 0}</td>
                          <td className="py-3 px-4">{player.achievements || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Server Statistics</h2>
              {serverStatsLoading ? (
                <div className="text-center py-4 text-gray-400">Loading server stats...</div>
              ) : serverStatsError ? (
                <div className="text-center py-4 text-red-400">{serverStatsError}</div>
              ) : serverStats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Players Online</span>
                      <span className="text-minecraft-habbo-blue">{serverStats.playerCount}/{serverStats.maxPlayers}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Server Version</span>
                      <span className="text-minecraft-habbo-blue">{serverStats.version || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">MOTD</span>
                      <span className="text-minecraft-habbo-blue">{serverStats.motd || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
            <motion.div
              className="habbo-card p-6 rounded-habbo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
              {recentAchievementsLoading ? (
                <div className="text-center py-4 text-gray-400">Loading achievements...</div>
              ) : recentAchievementsError ? (
                <div className="text-center py-4 text-red-400">{recentAchievementsError}</div>
              ) : (
                <div className="space-y-3">
                  {recentAchievements.map((item, index) => (
                    <div key={item.id || index} className="flex bg-white/5 p-3 rounded-habbo">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.username || item.player}</span>
                          <span className="text-xs text-gray-400">{item.achievement_time || item.time || ''}</span>
                        </div>
                        <p className="text-sm text-minecraft-habbo-yellow">
                          Unlocked: {item.achievement || item.achievement_name || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
            
        {/* News & Events Tab */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="habbo-card p-6 rounded-habbo lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-bold text-white mb-6">Latest News</h2>
              
              <div className="space-y-6">
                <NewsItem 
                  title="March Update: New Features & Improvements" 
                  date="March 1, 2025"
                  image="https://via.placeholder.com/600x300?text=March+Update"
                  content="We're excited to announce our March update with tons of new features! We've added a brand new shop system, auction house, and server map. Check out all the details in our changelog."
                  link="#"
                />
                
                <NewsItem 
                  title="Weekend Event: Double XP & Special Drops" 
                  date="February 25, 2025"
                  image="https://via.placeholder.com/600x300?text=Weekend+Event"
                  content="This weekend, earn double XP and get special drops from all monsters! Join us for special mini-games and competitions with amazing prizes."
                  link="#"
                />
                
                <NewsItem 
                  title="New Plot World Now Available!" 
                  date="February 15, 2025"
                  image="https://via.placeholder.com/600x300?text=Plot+World"
                  content="We've added a brand new plot world with larger plots and new themes. Reserve your spot now before they're all taken!"
                  link="#"
                  />
                </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <button className="habbo-btn">
                  View All News
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
                
                <div className="space-y-4">
                  <EventItem 
                    title="PvP Tournament"
                    date="March 5, 2025"
                    time="8:00 PM EST"
                    color="bg-red-500"
                  />
                  <EventItem 
                    title="Build Competition"
                    date="March 10, 2025"
                    time="7:00 PM EST"
                    color="bg-blue-500"
                  />
                  <EventItem 
                    title="Treasure Hunt"
                    date="March 15, 2025"
                    time="3:00 PM EST"
                    color="bg-yellow-500"
                  />
                  <EventItem 
                    title="Parkour Challenge"
                    date="March 20, 2025"
                    time="6:00 PM EST"
                    color="bg-green-500"
                  />
                </div>
                
                <button className="habbo-btn w-full mt-4">
                  View Calendar
                </button>
              </div>
              
              <Changelog maxHeight="30rem" />
              
              <div className="habbo-card p-6 rounded-habbo">
                <h2 className="text-xl font-bold text-white mb-4">Poll: Next Feature</h2>
                
                <p className="text-sm text-gray-300 mb-4">
                  What feature would you like to see added next?
                </p>
                
                <div className="space-y-3">
                  <PollOption id="pets" label="Pet System" votes={42} />
                  <PollOption id="quests" label="Daily Quests" votes={37} />
                  <PollOption id="jobs" label="Jobs & Professions" votes={28} />
                  <PollOption id="minigames" label="New Mini-games" votes={18} />
                </div>
                
                <button className="habbo-btn w-full mt-6">
                  Submit Vote
                </button>
              </div>
            </motion.div>
              </div>
            )}
      </div>
            
            <Notification
              show={notification.show}
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification({ ...notification, show: false })}
            />
            <UnlinkModal isOpen={showUnlinkModal} onClose={() => setShowUnlinkModal(false)} onConfirm={confirmUnlink} loading={unlinkLoading} />
    </div>
  );
};

// Quick Action Button component
const QuickActionButton = ({ icon, title, description, path, color, external = false }) => {
  if (external) {
  return (
    <a 
      href={path} 
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-4 rounded-habbo transition-all duration-200 hover:-translate-y-1 ${color}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-2">{icon}</div>
        <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs text-white/80">{description}</p>
      </div>
    </a>
    );
  }
  
  return (
    <Link 
      to={path}
      className={`block p-4 rounded-habbo transition-all duration-200 hover:-translate-y-1 ${color}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-xs text-white/80">{description}</p>
      </div>
    </Link>
  );
};

// Stat Card component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/5 p-3 rounded-habbo text-center">
    <div className="flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

// Quick Link component
const QuickLink = ({ icon, label }) => (
  <div className="bg-white/5 p-3 rounded-habbo flex items-center justify-center space-x-2 cursor-pointer hover:bg-white/10 transition-colors">
    <div className="text-minecraft-habbo-blue h-5 w-5">
      {icon}
    </div>
    <span>{label}</span>
  </div>
);

// News Item component
const NewsItem = ({ title, date, image, content, link }) => (
  <div className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-sm text-gray-400 mb-3">{date}</p>
    
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="md:col-span-2">
        <img src={image} alt={title} className="w-full h-32 object-cover rounded-habbo" />
      </div>
      <div className="md:col-span-3">
        <p className="text-sm text-gray-300 mb-3">{content}</p>
        <a href={link} className="text-minecraft-habbo-blue hover:underline">Read more →</a>
      </div>
    </div>
  </div>
);

// Event Item component
const EventItem = ({ title, date, time, color }) => (
  <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-habbo">
    <div className={`w-3 h-full ${color} rounded-full`}></div>
    <div className="flex-1">
      <h3 className="font-medium">{title}</h3>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{date}</span>
        <span className="text-minecraft-habbo-blue">{time}</span>
      </div>
    </div>
  </div>
);

// Poll Option component
const PollOption = ({ id, label, votes }) => (
  <div>
    <div className="flex items-center mb-1">
      <input 
        type="radio" 
        id={id} 
        name="poll" 
        className="mr-2"
      />
      <label htmlFor={id}>{label}</label>
    </div>
    <div className="habbo-progress-bar">
      <div className="bg-minecraft-habbo-blue" style={{ width: `${(votes / 125) * 100}%` }}></div>
    </div>
    <div className="flex justify-between text-xs mt-1">
      <span className="text-gray-400">{votes} votes</span>
      <span className="text-gray-400">{Math.round((votes / 125) * 100)}%</span>
    </div>
  </div>
);


// Custom icons
const SwordIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const SkullIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// UnlinkModal component
const UnlinkModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center bg-gray-900 p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            <h3 className="text-lg font-semibold text-gray-100">Unlink Minecraft Account</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6">
          <p className="text-gray-200 mb-6">Are you sure you want to unlink your Minecraft account? This will remove your in-game stats and features from your profile.</p>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 bg-red-700 hover:bg-red-600 text-gray-100 rounded-md flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>{loading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Unlinking...</>) : 'Unlink Account'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;