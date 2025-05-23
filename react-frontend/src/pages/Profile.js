/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Profile.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VerificationCelebration from '../components/VerificationCelebration';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { MinecraftService } from '../services/api';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import MinecraftAvatar from '../components/MinecraftAvatar';
import MinecraftInventory from '../components/MinecraftInventory';
import MinecraftAchievements from '../components/MinecraftAchievements';
import MinecraftPluginIntegrations from '../components/MinecraftPluginIntegrations';
import LevelProgressBar from '../components/LevelProgressBar';
import TitleSystem from '../components/TitleSystem';
import MinecraftPlayerModel3D from '../components/MinecraftPlayerModel3D';
import FriendButton from '../components/social/FriendButton';
import FollowButton from '../components/social/FollowButton';
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PhotoIcon,
  PencilIcon,
  MapPinIcon,
  BriefcaseIcon,
  BookmarkIcon,
  GiftIcon,
  HeartIcon,
  HandThumbUpIcon,
  ChatBubbleOvalLeftIcon,
  HomeIcon,
  TrophyIcon,
  CheckIcon,
  UserPlusIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import AnimatedPlayerStats from '../components/AnimatedPlayerStats';
// Import WallService after all React, UI and context imports
import WallService from '../services/wallService';
import { SocialService } from '../services/api';
// Import timeUtils explicitly
import { timeAgo, formatDate } from '../utils/timeUtils';
// Import the useSocialStats hook after all service imports
import useSocialStats from '../hooks/useSocialStats';
import { useEventSource } from '../contexts/EventSourceContext';

// Using imported timeAgo from utils

// Predefined wallpaper options (id, label)
const WALLPAPERS = [
  { id: 'herobrine_hill', label: 'Herobrine Hill', external: true },
  { id: 'quick_hide', label: 'Quick Hide', external: true },
  { id: 'malevolent', label: 'Malevolent', external: true },
  { id: 'sunset_lake', label: 'Sunset Lake', custom: true },
  { id: 'pink_sky', label: 'Pink Sky', custom: true },
  { id: 'night_adventure', label: 'Night Adventure', custom: true }
  // Removed unavailable wallpapers wallpaper_1, wallpaper_2, and wallpaper_3
];

// Helper to get wallpaper URL for a given id and username
const getWallpaperUrl = (id, username) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find(wp => wp.id === id);
  
  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }
  
  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }
  
  // Use the external service for standard wallpapers if we mark it as external
  if (wallpaper.external) {
    // If no username provided, use Steve as default
    const safeUsername = username || 'Steve';
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${safeUsername}`;
  }
  
  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Helper to get thumbnail (use a default player for preview)
const getWallpaperThumb = (id) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find(wp => wp.id === id);
  
  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }
  
  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }
  
  // Use the external service for standard wallpapers
  if (wallpaper.external) {
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/Steve?thumb=1`;
  }
  
  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Map usernames to default covers to make each profile feel unique
const getDefaultCover = (username) => {
  // Always use a valid wallpaperId and username
  return getWallpaperUrl('herobrine_hill', username || 'Steve');
};

// Activity feed item component
const ActivityItem = ({ icon, title, description, time, children, type = 'default' }) => {
  return (
    <div className="bg-white/10 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 
          ${type === 'achievement' ? 'bg-yellow-600/50' : 
          type === 'kill' ? 'bg-red-600/50' : 
          type === 'build' ? 'bg-blue-600/50' :
          type === 'mine' ? 'bg-green-600/50' :
          'bg-gray-600/50'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-minecraft">{title}</h3>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{description}</p>
          {children && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {children}
            </div>
          )}
          <div className="flex items-center mt-3 text-sm text-gray-400">
            <button className="flex items-center hover:text-white mr-4">
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Like
            </button>
            <button className="flex items-center hover:text-white">
              <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Friend component
const FriendItem = ({ username, avatar, status, online }) => {
  return (
    <div className="flex items-center mb-3">
      <div className="relative">
        <MinecraftAvatar 
          username={username}
          size={40}
          className="mr-3"
          type="head"
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800"></span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{username}</p>
        <p className="text-xs text-gray-400">{status}</p>
      </div>
    </div>
  );
};

// Generate inventory items from player data
const generateInventoryItems = (inventoryData) => {
  if (!inventoryData) return [];
  
  const items = [];
  
  // Add main hand item if available
  if (inventoryData.main_hand && inventoryData.main_hand.name) {
    items.push({
      name: inventoryData.main_hand.name,
      count: inventoryData.main_hand.amount || 1,
      durability: inventoryData.main_hand.durability,
      label: inventoryData.main_hand.name.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    });
  }
  
  // Add hotbar and inventory items if available
  if (inventoryData.contents && Array.isArray(inventoryData.contents)) {
    inventoryData.contents.forEach(item => {
      if (item && item.name) {
        items.push({
          name: item.name,
          count: item.amount || 1,
          durability: item.durability,
          label: item.name.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        });
      }
    });
  }
  
  // Add valuables as items if available and not already added
  if (inventoryData.valuables) {
    if (inventoryData.valuables.diamond > 0) {
      items.push({
        name: 'diamond',
        count: inventoryData.valuables.diamond,
        label: 'Diamond'
      });
    }
    
    if (inventoryData.valuables.emerald > 0) {
      items.push({
        name: 'emerald',
        count: inventoryData.valuables.emerald,
        label: 'Emerald'
      });
    }
    
    if (inventoryData.valuables.gold > 0) {
      items.push({
        name: 'gold_ingot',
        count: inventoryData.valuables.gold,
        label: 'Gold Ingot'
      });
    }
    
    if (inventoryData.valuables.netherite > 0) {
      items.push({
        name: 'netherite_ingot',
        count: inventoryData.valuables.netherite,
        label: 'Netherite Ingot'
      });
    }
  }
  
  return items;
};

// Add this at the beginning of the file to define animations
const fadeInAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

// Enhanced CommentItem with animation and fixed avatar/username issues
const CommentItem = ({ comment, postId, onDelete, currentUser }) => {
  // Format the date to display
  const formattedDate = timeAgo(comment.createdAt);
  
  // Check if the current user is the author of the comment
  const isCommentAuthor = currentUser && 
    (currentUser._id === comment.author?._id || 
     currentUser.username === comment.author?.username);
  
  // Ensure author exists or provide fallback
  const author = comment.author || {
    username: 'Unknown User',
    mcUsername: 'Steve'
  };
  
  // Create exact timestamp for hover
  const exactTimestamp = comment.createdAt ? 
    new Date(comment.createdAt).toLocaleString() : 
    'Unknown date';
  
  // Log comment author info for debugging
  console.log(`[CommentItem] Comment author data:`, author);
  
  // Ensure we have a valid username for the avatar
  // Fixed: ensure mcUsername is properly used (in server responses it might be minecraftUsername)
  const avatarUsername = author.mcUsername || author.minecraftUsername || author.username;
  console.log(`[CommentItem] Using avatar username: ${avatarUsername} for author: ${author.username}`);
  
  return (
    <motion.div 
      className="flex items-start py-2 group hover:bg-minecraft-navy/20 rounded-md px-2 -mx-2 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/profile/${author.username}`} className="flex-shrink-0">
        <MinecraftAvatar 
          username={avatarUsername}
          size={28}
          type="head"
          className="rounded-md hover:ring-2 hover:ring-minecraft-habbo-blue transition-all"
        />
      </Link>
      <div className="ml-2 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Link 
              to={`/profile/${author.username}`}
              className="font-medium text-sm hover:text-minecraft-habbo-blue transition-colors"
            >
              {author.username}
            </Link>
            <span 
              className="text-gray-400 text-xs ml-2 cursor-default" 
              title={exactTimestamp}
            >
              {formattedDate}
            </span>
          </div>
          {isCommentAuthor && (
            <button 
              onClick={() => onDelete(postId, comment._id)}
              className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200"
              title="Delete comment"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-200 mt-1 break-words">{comment.content}</p>
      </div>
    </motion.div>
  );
};

// Enhanced CommentSection with animations and improved styling
const CommentSection = ({ 
  post, 
  commentInput, 
  commentLoading, 
  commentError,
  onCommentChange, 
  onAddComment,
  onDeleteComment,
  currentUser,
  isExpanded,
  onToggleExpand
}) => {
  // Get comments from post or default to empty array
  const comments = post.comments || [];
  const postId = post._id;
  
  // Reference to input field for focusing
  const inputRef = useRef(null);
  
  // State to track emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // State to track if the comment input is visible
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && showCommentInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded, showCommentInput]);
  
  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && commentInput.trim()) {
      e.preventDefault();
      onAddComment(postId);
      setShowCommentInput(false); // Hide input after posting
    }
  };
  
  // Handle emoji insertion
  const handleEmojiSelect = (emoji) => {
    onCommentChange(postId, commentInput + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };
  
  // Common emojis for quick selection
  const quickEmojis = ['😊', '👍', '❤️', '😂', '😎', '🎮', '🧱', '⛏️', '🗡️'];

  // In CommentSection, add state for comment deletion modal and pending comment
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Handler to trigger modal
  const handleDeleteCommentWithConfirm = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  // Handler to confirm deletion
  const confirmDeleteComment = () => {
    if (commentToDelete) {
      onDeleteComment(postId, commentToDelete);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  // Handler to cancel deletion
  const cancelDeleteComment = () => {
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  return (
    <div className="mt-4">
      {/* Comment toggle button */}
      <button 
        onClick={onToggleExpand}
        className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
      >
        <div className="flex items-center relative">
          <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
          {comments.length > 0 && (
            <span className="absolute -top-2 -right-1 bg-minecraft-habbo-blue text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {comments.length > 99 ? '99+' : comments.length}
            </span>
          )}
        </div>
        <span className="ml-1 group-hover:text-white transition-colors">
          {comments.length === 0 ? 'Add Comment' : 
           isExpanded ? 'Hide Comments' : 'Show Comments'}
        </span>
      </button>
      
      {/* Expanded comment section */}
      {isExpanded && (
        <motion.div 
          className="mt-3 pt-3 border-t border-white/10 comment-section rounded-md transition-colors duration-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Comment list with animation */}
          <div className="mb-4 space-y-3">
            <AnimatePresence>
              {comments.map(comment => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommentItem 
                    comment={comment} 
                    postId={postId}
                    onDelete={() => handleDeleteCommentWithConfirm(comment._id)}
                    currentUser={currentUser} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Add Comment button or comment input form */}
          {currentUser && (
            <>
              {!showCommentInput ? (
                <motion.button
                  className="flex items-center text-sm text-minecraft-habbo-blue hover:text-minecraft-habbo-green transition-colors mt-2"
                  onClick={() => setShowCommentInput(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="mr-1">+</span> Write a comment...
                </motion.button>
              ) : (
                <motion.div 
                  className="flex items-start mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MinecraftAvatar 
                    username={currentUser.mcUsername || currentUser.username}
                    size={30}
                    type="head"
                    className="rounded-md mr-2 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={commentInput}
                        onChange={(e) => onCommentChange(postId, e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Write a comment..."
                        className="w-full bg-minecraft-navy/50 text-white rounded-md py-2 px-3 pr-16 
                          focus:outline-none focus:ring-1 focus:ring-minecraft-habbo-blue
                          transition-all duration-200 hover:bg-minecraft-navy/70"
                      />
                      
                      {/* Quick Emoji Picker (now appears below the new emoji button) */}
                      {showEmojiPicker && (
                        <div className="absolute right-0 top-full mt-2 bg-minecraft-navy-dark rounded-md p-2 shadow-lg border border-minecraft-habbo-blue/30 z-10">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {quickEmojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleEmojiSelect(emoji)}
                                className="hover:bg-minecraft-navy p-1 rounded-md transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <button
                          onClick={() => setShowCommentInput(false)}
                          className="text-gray-400 hover:text-white"
                          title="Cancel"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Add emoji"
                        >
                          😊
                        </button>
                        <button
                          onClick={() => {
                            if (commentInput.trim()) {
                              onAddComment(postId);
                              setShowCommentInput(false);
                            }
                          }}
                          disabled={!commentInput?.trim() || commentLoading}
                          className={`px-2 py-1 rounded-md text-sm transition-all duration-200
                            ${(!commentInput?.trim() || commentLoading) 
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                              : 'bg-minecraft-habbo-blue text-white hover:bg-minecraft-habbo-blue-dark'}`}
                        >
                          {commentLoading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Posting
                            </span>
                          ) : 'Post'}
                        </button>
                      </div>
                    </div>
                    
                    {commentError && (
                      <motion.p 
                        className="text-red-400 text-xs mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {commentError}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">Delete Comment?</h3>
            <p className="text-gray-300 mb-4">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={cancelDeleteComment}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteComment}
                className="habbo-btn px-4 py-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Profile Component
const Profile = () => {
  // Router hooks
  const { username } = useParams();
  const navigate = useNavigate();
  
  // Context hooks
  const { user } = useAuth();
  const socialContext = useSocial() || {};
  
  // Get context with fallbacks
  const { 
    getRelationship = async () => ({ status: 'not_friends', following: false }),
    friendRequests = [],
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    followUser,
    unfollowUser
  } = socialContext;
  
  // Custom hooks
  const socialStats = useSocialStats(username);
  
  // State hooks
  const [profileUser, setProfileUser] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [selectedTab, setSelectedTab] = useState('wall');
  const [coverImage, setCoverImage] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [wallPosts, setWallPosts] = useState([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [wallError, setWallError] = useState(null);
  const [wallPage, setWallPage] = useState(1);
  const [wallTotalPages, setWallTotalPages] = useState(1);
  const [newWallPost, setNewWallPost] = useState('');
  const [friends, setFriends] = useState([]);
  const [viewMode, setViewMode] = useState('avatar');
  const [relationship, setRelationship] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mcUsername, setMcUsername] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
  const [availableWallpapers, setAvailableWallpapers] = useState([]);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [pendingWallpaperId, setPendingWallpaperId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: "" }
  const [commentLoading, setCommentLoading] = useState({}); // { [postId]: false }
  const [commentError, setCommentError] = useState({}); // { [postId]: "" }
  const [expandedComments, setExpandedComments] = useState({});
  const [wallPostsRefreshKey, setWallPostsRefreshKey] = useState(0);
  const { addEventListener, isConnected } = useEventSource();
  // --- Moved up to fix React Hook order ---
  const [showManagePostsModal, setShowManagePostsModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');
  
  const profileUserRef = useRef();
  const userRef = useRef();
  
  // Check if profile should be displayed - Setting this at the top level
  const shouldDisplayProfile = username || user?.username;
  
  // ALL useEffect hooks moved here, before any conditional returns
  
  // Check which wallpapers are available
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;
    
    const checkWallpaperAvailability = async () => {
      // First detect which local wallpapers actually exist
      const localWallpapers = WALLPAPERS.filter(wp => wp.custom);
      const availableLocalWallpapers = [];
      
      // Reset available wallpapers array to start fresh
      setAvailableWallpapers([]);
      
      // Check each local wallpaper and add it if it exists
      for (const wallpaper of localWallpapers) {
        const img = new Image();
        const src = getWallpaperUrl(wallpaper.id, 'Steve');
        console.log(`Checking wallpaper: ${wallpaper.id} at ${src}`);
        img.onload = () => {
          console.log(`Wallpaper ${wallpaper.id} loaded successfully`);
          setAvailableWallpapers(prev => {
            if (!prev.some(wp => wp.id === wallpaper.id)) {
              return [...prev, wallpaper];
            }
            return prev;
    });
  };
        img.onerror = () => {
          console.warn(`Wallpaper ${wallpaper.id} failed to load`);
        };
        img.src = src;
      }
      
      // In parallel, check external wallpapers
      const checkExternalWallpapers = async () => {
        const externalWallpapers = WALLPAPERS.filter(wp => !wp.custom);
        if (externalWallpapers.length === 0) return;
        
        try {
          const testUrl = getWallpaperUrl(externalWallpapers[0].id, 'Steve');
          const response = await fetch(testUrl, { method: 'HEAD', timeout: 3000 });
          
          if (response.ok) {
            // Add external wallpapers to the available list
            setAvailableWallpapers(prev => [...prev, ...externalWallpapers]);
          }
        } catch (error) {
          console.warn('External wallpapers not available:', error);
        }
      };
      
      // Start checking external wallpapers without awaiting
      checkExternalWallpapers();
    };
    
    checkWallpaperAvailability();
  }, [shouldDisplayProfile]);

  // Fetch profile data
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;
    
    let isMounted = true;
    let controller = new AbortController(); // For cleanup of fetch requests
    const signal = controller.signal;
    
    // Define fetchProfileData function first before using it
    const fetchProfileData = async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setNotFound(false);
        // Check if viewing own profile
        const isOwn = user && (user.username === username || (!username && user));
        setIsOwnProfile(isOwn);
        // Use currently logged in user for "me" profile
        const targetUsername = username || (user ? user.username : null);
        if (!targetUsername) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Try to fetch user by website username first
        let websiteUser = null;
        try {
          const userRes = await API.get(`/api/user/by-username/${targetUsername}`);
          websiteUser = userRes.data && userRes.data.user ? userRes.data.user : null;
        } catch (e) {
          websiteUser = null;
        }
        let mcUsernameToUse = targetUsername;
        if (websiteUser && websiteUser.minecraftUsername) {
          mcUsernameToUse = websiteUser.minecraftUsername;
        }
        // Now fetch player stats using the correct Minecraft username
        let completeStats = {
          playtime: '0h', lastSeen: 'Never', balance: 0, blocksMined: 0, mobsKilled: 0, deaths: 0, joinDate: websiteUser ? formatDate(websiteUser.createdAt) : 'N/A', achievements: 0, level: 1, experience: 0, rank: 'Member', group: 'default', groups: ['default'], world: 'world', gamemode: 'SURVIVAL', online: false
        };
        
        try {
          // Add a debounce flag to prevent overlapping calls
          if (window.__FETCHING_PLAYER_STATS) {
            console.log('Skipping player stats fetch - already in progress');
            // Wait for the previous fetch to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!isMounted) return;
          }
          
          window.__FETCHING_PLAYER_STATS = true;
          const playerStatsRes = await MinecraftService.getPlayerStats(mcUsernameToUse);
          window.__FETCHING_PLAYER_STATS = false;
          
          console.log('Player Stats API Response:', playerStatsRes.data);
          // Merge API data, prioritizing API values
          completeStats = {
            ...completeStats,
            ...playerStatsRes.data.data, // Access the nested 'data' object
            // Ensure specific fields are handled correctly after merge if needed
            // Example: playtime might need specific formatting
          };
          console.log('Using completeStats:', completeStats);
          if (isMounted) {
            setPlayerStats(completeStats);
          }
        } catch (playerStatsError) {
          window.__FETCHING_PLAYER_STATS = false;
          console.error('Failed to fetch player stats:', playerStatsError);
          // Use fallback stats if API fails
          if (isMounted) {
            setPlayerStats({
              playtime: '0h', lastSeen: 'Never', balance: 0, blocksMined: 0, mobsKilled: 0, deaths: 0, joinDate: websiteUser ? formatDate(websiteUser.createdAt) : 'N/A', achievements: 0, level: 1, experience: 0, rank: 'Member', group: 'default'
            });
          }
        }
        setCoverImage(getDefaultCover(targetUsername));
        // Set profile user data
        let userProfileData;
        if (isOwn && user) {
          userProfileData = user;
          setProfileUser(user);
        } else if (websiteUser) {
          userProfileData = websiteUser;
          setProfileUser(websiteUser);
        } else {
          userProfileData = { username: mcUsernameToUse, mcUsername: mcUsernameToUse, createdAt: completeStats.joinDate, role: completeStats.rank || 'Member', titles: completeStats.titles || [], activeTitle: completeStats.activeTitle, _id: completeStats.userId || 'user-' + Math.random().toString(36).substr(2, 9) };
          setProfileUser(userProfileData);
        }
        // Prevent excessive API calls for relationship status
        let relationshipData = { status: 'not_friends', following: false };
        
        if (!isOwn && isMounted) {
          try {
            // Only fetch relationship data if we're viewing someone else's profile and component is still mounted
            // Remove all special-case logic for n0t_awake and bizzy
            const userAccountName = userProfileData.username;
            const userMinecraftName = userProfileData.mcUsername;
            console.log(`Getting relationship for user ${userAccountName} (MC: ${userMinecraftName})`);
            try {
              // Always fetch from API
              const relationshipResponse = await getRelationship(userAccountName, userMinecraftName);
                console.log('API relationship response:', relationshipResponse);
                if (relationshipResponse) {
                  relationshipData = {
                    status: relationshipResponse.status || 'not_friends',
                  following: relationshipResponse.following || false,
                  followsYou: relationshipResponse.followsYou || false
                  };
                }
              } catch (err) {
                console.warn('Error fetching relationship, using default');
            }
            if (isMounted) {
              setRelationship(relationshipData);
            }
          } catch (relationshipError) {
            console.error('Error fetching relationship status:', relationshipError);
            if (isMounted) {
              setRelationship({ status: 'not_friends', following: false });
            }
          }
        }
        
        // Fetch or generate friend data
        let friendsList = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          friendsList = await fetchFriends(targetUsername);
          if (isMounted) {
            setFriends(friendsList);
          }
        } catch (err) {
          console.warn('Error with friends, using defaults');
          // Use generic fallback but don't re-fetch
        }
        
        // Generate or fetch wall posts
        let posts = [];
        try {
          // Remove all special-case logic for n0t_awake and bizzy. Always use real data from the API or generic fallback.
          posts = await generateWallPosts(targetUsername, completeStats);
          // Do NOT setWallPosts here; let the wall posts effect handle it
        } catch (err) {
          console.warn('Error with wall posts, using defaults:', err);
          // Do NOT setWallPosts here
        }
        
        // Cache the full profile data to prevent repeated API calls
        if (isMounted) {
          try {
            // Convert wall posts to a cacheable format
            const cachablePosts = posts.map(post => {
              let iconType = 'UserIcon';
              if (post.icon && post.icon.type && post.icon.type.name) {
                iconType = post.icon.type.name;
              }
              
              return {
                ...post,
                icon: iconType
              };
            });
            
            const cacheData = {
              profileUser: userProfileData,
              playerStats: completeStats,
              relationship: relationshipData,
              friends: friendsList,
              wallPosts: cachablePosts
            };
            
            sessionStorage.setItem(profileCacheKey, JSON.stringify(cacheData));
            sessionStorage.setItem(`${profileCacheKey}_timestamp`, now.toString());
          } catch (err) {
            console.warn('Failed to cache profile data:', err);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in profile data fetch:', error);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };
    
    // Cache mechanism 
    const CACHE_DURATION = 30000; // 30 seconds (reduced from 60s)
    const profileCacheKey = `profile_${username || 'me'}`;
    const cachedData = sessionStorage.getItem(profileCacheKey);
    const cachedTimestamp = sessionStorage.getItem(`${profileCacheKey}_timestamp`);
    const now = Date.now();
    const isCacheValid = cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp, 10) < CACHE_DURATION);
    
    // Check if we already have valid cached data
    if (isCacheValid && isMounted) {
      try {
        const parsedData = JSON.parse(cachedData);
        setProfileUser(parsedData.profileUser);
        setPlayerStats(parsedData.playerStats);
        setRelationship(parsedData.relationship);
        setFriends(parsedData.friends);
        
        // Do NOT set wallPosts from cache - always fetch these fresh
        console.log('[Profile] Loading profile from cache, but fetching wall posts separately');
        
        setLoading(false);
        // Use cached data but still fetch wall posts immediately
        setTimeout(() => {
          if (isMounted) fetchWallPosts();
        }, 100);
        
        // Also fetch full profile data in the background after a delay
        setTimeout(() => {
          if (isMounted) fetchProfileData();
        }, 5000);
        return;
      } catch (e) {
        console.warn('[Profile] Error parsing cached profile data:', e);
        // Continue to fetch if cache parsing fails
      }
    }
    
    // Only fetch if component is mounted
    if (isMounted) {
      fetchProfileData();
    }
    
    return () => { 
      isMounted = false; 
      controller.abort();
      // Clean up debounce flag
      window.__FETCHING_PLAYER_STATS = false;
    };
    // We need to include the shouldDisplayProfile, username, and user deps
    // but exclude getRelationship as it can change between renders and cause issues
  }, [user, username, shouldDisplayProfile]);
  
  useEffect(() => {
    profileUserRef.current = profileUser;
    userRef.current = user;
  }, [profileUser, user]);
  
  // Listen for minecraft_linked events to refresh the profile
  useEffect(() => {
    // Skip if not showing profile
    if (!shouldDisplayProfile) return;
    
    const handleMinecraftLinked = (event) => {
      console.log('🎮 Minecraft account linked event received:', event.detail);
      // Show celebration notification
      setNotification({
        show: true,
        type: 'success',
        message: `Your Minecraft account (${event.detail.mcUsername}) has been successfully linked!`
      });
      // Enable celebration animation
      setShowCelebration(true);
      setMcUsername(event.detail.mcUsername);
      // Force the celebration to show with a slight delay to ensure DOM is ready
      setTimeout(() => {
        console.log('Showing celebration modal...');
        // Make sure the modal is visible in the DOM
        const modal = document.querySelector('.celebration-container');
        if (modal) {
          console.log('Modal found in DOM, ensuring visibility');
          modal.style.display = 'block';
          modal.style.opacity = '1';
          modal.style.zIndex = '9999';
        } else {
          console.log('Modal not found in DOM');
        }
        // Play a sound effect
        try {
          const audio = new Audio('/sounds/level-up.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
        } catch (e) {
          console.log('Audio not supported', e);
        }
      }, 500);
      // Refresh profile data
      if (user && (user.username === username || !username)) {
        // Use direct state updates instead
        setPlayerStats(prevStats => ({
          ...prevStats,
          mcUsername: event.detail.mcUsername,
          linked: true,
          balance: prevStats?.balance || 500,
          playtime: prevStats?.playtime || '10h',
          achievements: prevStats?.achievements || 42
        }));
        setProfileUser(prevUser => ({
          ...prevUser,
          mcUsername: event.detail.mcUsername,
          minecraft: {
            ...prevUser?.minecraft,
            linked: true,
            mcUsername: event.detail.mcUsername
          }
        }));
      }
      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 8000);
    };
    // Add event listener
    window.addEventListener('minecraft_linked', handleMinecraftLinked);
    // Cleanup
    return () => {
      window.removeEventListener('minecraft_linked', handleMinecraftLinked);
    };
  }, [user, username, shouldDisplayProfile]);
  
  // On profileUser or wallpaperId change, update cover image
  useEffect(() => {
    // Skip if not showing profile or if profileUser not loaded
    if (!shouldDisplayProfile || !profileUser) return;
    
    if (profileUser && (profileUser.wallpaperId || wallpaperId)) {
      const id = profileUser.wallpaperId || wallpaperId || WALLPAPERS[0].id;
      const uname = profileUser.mcUsername || profileUser.username || 'Steve';
      setWallpaperId(id);
      setCoverImage(getWallpaperUrl(id, uname));
    } else if (profileUser) {
      setWallpaperId(null);
      setCoverImage(getWallpaperUrl(WALLPAPERS[0].id, profileUser.mcUsername || profileUser.username || 'Steve'));
    }
  }, [profileUser, wallpaperId, shouldDisplayProfile]);
  
  // Preload wallpaper image when coverImage changes
  useEffect(() => {
    // Skip if not showing profile or no cover image
    if (!shouldDisplayProfile || !coverImage) return;
    
    setWallpaperLoaded(false);
    const img = new window.Image();
    img.src = coverImage;
    img.onload = () => setWallpaperLoaded(true);
  }, [coverImage, shouldDisplayProfile]);
  
  // Refactored wall post fetching (no fallback unless API fails and no posts)
  const fetchWallPosts = useCallback(async () => {
    console.log('[DEBUG] fetchWallPosts called');
    if (!username) return;
    setWallLoading(true);
    setWallError(null);
    try {
      console.log('[Profile] Fetching wall posts for', username, 'page', wallPage);
      // Always fetch fresh data from the API
      const res = await WallService.getWallPosts(username, wallPage, 10);
      console.log('[Profile] Wall posts API response:', res);
      
      let postsToSet = [];
      
      if (res && Array.isArray(res.posts) && res.posts.length > 0) {
        // Ensure each post has required properties before setting state
        postsToSet = res.posts.map(post => ({
          ...post,
          // Ensure post has author information
          author: post.author || {
            username: username,
            mcUsername: username,
            _id: post.author_id || `user-${Date.now()}`
          },
          // Defensive patch: ensure every comment has a valid author object
          comments: (post.comments || []).map(comment => ({
            ...comment,
            author: comment.author && comment.author.username ? comment.author : {
              username: 'Unknown User',
              mcUsername: 'Steve'
            }
          }))
        }));
        
        console.log('[Profile] Processed', postsToSet.length, 'wall posts');
      } else {
        console.warn('[Profile] No posts found in API response, using fallback');
        postsToSet = [{
          _id: `fallback-${Date.now()}`,
          content: 'Welcome to your wall! Start posting to see your content here.',
          author: {
            username: username,
            mcUsername: username
          },
          createdAt: new Date().toISOString(),
          likes: [],
          comments: []
        }];
      }
      
      // Force clear any cached wall posts before setting state
      try {
        sessionStorage.removeItem(`wall_posts_${username}`);
        sessionStorage.removeItem(`profile_${username}`);
      } catch (e) {
        console.warn('[Profile] Failed to clear cached wall posts:', e);
      }
      
      // Set state all at once after processing
      console.log('[Profile] Setting wall posts state with', postsToSet.length, 'posts');
      setWallPosts(postsToSet);
      setWallTotalPages(res?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('[Profile] Error fetching wall posts:', err);
      setWallError(err.message || 'Failed to load wall posts');
      
      // Use fallback on error
      const fallbackPost = {
        _id: `fallback-${Date.now()}`,
        content: 'Welcome to your wall! Start posting to see your content here.',
        author: {
          username: username,
          mcUsername: username
        },
        createdAt: new Date().toISOString(),
        likes: [],
        comments: []
      };
      
      setWallPosts([fallbackPost]);
      setWallTotalPages(1);
    } finally {
      setWallLoading(false);
    }
  }, [username, wallPage]);
  
  // Function to refresh wall posts
  const refreshWallPosts = async () => {
    console.log('[DEBUG] refreshWallPosts called');
    if (!username) return;

    // Always reset to page 1 before fetching
    setWallPage(1);
    
    try {
      setWallLoading(true);
      
      // Save current expanded comment sections before refresh
      const currentExpandedComments = { ...expandedComments };
      
      // Clear any cached wall posts data
      try {
        const cacheKey = `wall_posts_${username}`;
        sessionStorage.removeItem(cacheKey);
        console.log('[Profile] Cleared wall posts cache for', username);
      } catch (e) {
        console.warn('[Profile] Failed to clear wall posts cache:', e);
      }
      
      console.log('[Profile] Refreshing wall posts for', username);
      const res = await WallService.getWallPosts(username, 1, 10);
      console.log('[Profile][SSE] Wall posts refresh response:', res);
      
      let postsToSet = [];
      
      if (res && Array.isArray(res.posts) && res.posts.length > 0) {
        // Ensure each post has required properties before setting state
        postsToSet = res.posts.map(post => ({
          ...post,
          // Ensure post has author information
          author: post.author || {
            username: post.author_username || username,
            mcUsername: post.author_mcUsername || username,
            _id: post.author_id || `user-${Date.now()}`
          },
          // Ensure likes array exists
          likes: post.likes || [],
          // Ensure comments array exists
          comments: post.comments || []
        }));
        
        console.log('[Profile] Processed posts for state update:', postsToSet.length);
      } else {
        // Fallback post
        postsToSet = [{
          _id: `fallback-${Date.now()}`,
          content: 'Welcome to your wall! Start posting to see your content here.',
          author: {
            username: username,
            mcUsername: username
          },
          createdAt: new Date().toISOString(),
          likes: [],
          comments: []
        }];
        console.log('[Profile] Using fallback post for empty response');
      }
      
      // Do a direct update with the prepared array
      setWallPosts(postsToSet);
      setWallPage(1);
      setWallTotalPages(res?.pagination?.totalPages || 1);
      
      // Restore expanded comments state for posts that still exist
      const newExpandedCommentsState = { ...currentExpandedComments };
      postsToSet.forEach(post => {
        // If the post had comments expanded before, keep it expanded
        if (post._id && currentExpandedComments[post._id]) {
          newExpandedCommentsState[post._id] = true;
        }
        
        // Auto-expand any posts with new activity (new comments since last refresh)
        if (post.comments && post.comments.length > 0 && post.comments[0].createdAt) {
          const latestCommentTime = new Date(post.comments[0].createdAt).getTime();
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); 
          
          // If the latest comment is less than 5 minutes old, auto-expand
          if (latestCommentTime > fiveMinutesAgo) {
            newExpandedCommentsState[post._id] = true;
          }
        }
      });
      
      setExpandedComments(newExpandedCommentsState);
      
    } catch (err) {
      console.error('[Profile] Failed to refresh wall posts:', err);
      // Use fallback on error
      setWallPosts([{
        _id: `fallback-${Date.now()}`,
        content: 'Welcome to your wall! Start posting to see your content here.',
        author: {
          username: username,
          mcUsername: username
        },
        createdAt: new Date().toISOString(),
        likes: [],
        comments: []
      }]);
      setWallTotalPages(1);
    } finally {
      setWallLoading(false);
    }
  };
  
  // Fetch wall posts for the profile user
  useEffect(() => {
    if (isConnected && user && username) {
    fetchWallPosts();
    }
  }, [isConnected, user, username, fetchWallPosts]);
  
  // Friend request handlers
  const handleSendFriendRequest = async (username) => {
    try {
      await sendFriendRequest(username);
      setNotification({ show: true, type: 'success', message: 'Friend request sent!' });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({ show: true, type: 'error', message: 'Failed to send friend request' });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
        setRelationship(updated);
      }
    }
  };
  
  const handleAcceptFriendRequest = async (username) => {
    try {
      await acceptFriendRequest(username);
      setNotification({ show: true, type: 'success', message: 'Friend request accepted!' });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({ show: true, type: 'error', message: 'Failed to accept friend request' });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
        setRelationship(updated);
      }
    }
  };
  
  const handleRejectFriendRequest = async (username) => {
    try {
      await rejectFriendRequest(username);
      setNotification({ show: true, type: 'success', message: 'Friend request declined' });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      setNotification({ show: true, type: 'error', message: 'Failed to decline friend request' });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
        setRelationship(updated);
      }
    }
  };
  
  // Follow handlers
  const handleFollowUser = async (username) => {
    try {
      await followUser(username);
      setRelationship(prev => ({ ...prev, following: true }));
      setNotification({
        show: true,
        type: 'success',
        message: `Now following ${profileUser?.username}`
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      console.error('[Profile] Failed to follow user:', error, error?.response?.data, { username });
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to follow user'
      });
      console.debug('[Profile] Toast error: Failed to follow user', { error, username });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
        setRelationship(updated);
      }
    }
  };
  
  const handleUnfollowUser = async (username) => {
    try {
      await unfollowUser(username);
      setRelationship(prev => ({ ...prev, following: false }));
      setNotification({
        show: true,
        type: 'success',
        message: `Unfollowed ${profileUser?.username}`
      });
      socialStats.refetch();
      invalidateRelationshipCache(username);
    } catch (error) {
      console.error('[Profile] Failed to unfollow user:', error, error?.response?.data, { username });
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to unfollow user'
      });
      console.debug('[Profile] Toast error: Failed to unfollow user', { error, username });
    } finally {
      if (profileUser?.username) {
        const updated = await getRelationship(profileUser.username, profileUser.mcUsername);
        setRelationship(updated);
      }
    }
  };
  
  // Predefined cover banner options
  const coverOptions = [];

  // Fetch real friends with memoization to prevent re-renders
  const fetchFriends = async (username) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `friends_${username}`;
    const cachedFriends = sessionStorage.getItem(cacheKey);
    
    if (cachedFriends) {
      try {
        return JSON.parse(cachedFriends);
      } catch (e) {
        // Invalid cache, continue to fetch
        console.warn('Error parsing cached friends data:', e);
      }
    }
    
    try {
      // Try to get real friends data first
      const response = await SocialService.getFriends();
      if (response && response.data && Array.isArray(response.data.friends)) {
        // Cache the response
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data.friends));
        } catch (e) {
          // Failed to cache, but we can still use the data
          console.warn('Failed to cache friends data:', e);
        }
        return response.data.friends;
      }
      
      // If the response doesn't have the expected structure, throw an error
      throw new Error('Invalid friends data structure');
    } catch (error) {
      console.warn('Error fetching friends, using fallback:', error.message);
    
    // Fallback with reasonable data if API fails
    const fallbackFriends = [
        { _id: 'f1', username: 'DiamondDigger', status: 'Mining diamonds', online: true },
        { _id: 'f2', username: 'CreeperSlayer', status: 'Fighting mobs', online: true },
        { _id: 'f3', username: 'RedstoneWizard', status: 'Building circuits', online: false },
        { _id: 'f4', username: 'MinerSteve', status: 'Last seen 2 hours ago', online: false },
    ];
    
    // Cache the fallback data to prevent repeated API calls
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(fallbackFriends));
    } catch (e) {
      // Failed to cache, but we can still use the data
        console.warn('Failed to cache fallback friends data:', e);
    }
    
    return fallbackFriends;
    }
  };
  
  // Generate wall posts with memoization to prevent re-renders
  const generateWallPosts = async (username, stats) => {
    // Use session storage cache to prevent repeated API calls
    const cacheKey = `wall_posts_${username}`;
    const cachedPosts = sessionStorage.getItem(cacheKey);
    
    if (cachedPosts) {
      try {
        // When loading from cache, we need to convert any stored icon objects back to React elements
        const parsedPosts = JSON.parse(cachedPosts);
        return parsedPosts.map(post => ({
          ...post,
          // Recreate the icon element if it was stringified
          icon: typeof post.icon === 'object' ? 
            <UserIcon className="h-5 w-5 text-white" /> : post.icon,
          // Ensure post has a valid author
          author: post.author || { 
            username: username, 
            mcUsername: username
          }
        }));
      } catch (e) {
        // Invalid cache, continue to fetch
        console.warn("Error parsing cached wall posts:", e);
      }
    }
    
    try {
      // Try to get real wall posts first
      const response = await SocialService.getWallPosts(username);
      if (response && response.data && Array.isArray(response.data.posts)) {
        // Store simplified version without React elements for caching
        const cachablePosts = response.data.posts.map(post => ({
          ...post,
          // Convert icon to string representation for storage
          icon: 'UserIcon'
        }));
        
        // Cache the simplified posts
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cachablePosts));
        } catch (e) {
          // Failed to cache, but we can still use the data
          console.warn("Failed to cache wall posts:", e);
        }
        
        return response.data.posts;
      }
    } catch (error) {
      console.warn('Error fetching wall posts, using fallbacks:', error);
    }
    
    // Create reasonable fallback posts based on user data
    const defaultIcon = <UserIcon className="h-5 w-5 text-white" />;
    
    const posts = [
      {
        _id: `fallback-${Date.now()}`,
        type: 'default',
        title: `${username}'s Profile`,
        description: 'Welcome to my Minecraft profile!',
        content: `Welcome to ${username}'s Minecraft profile! Thanks for visiting.`,
        time: 'Just now',
        createdAt: new Date(),
        author: {
          username: username,
          mcUsername: username,
          _id: `user-${Math.random().toString(36).substr(2, 9)}`
        },
        likes: [],
        comments: [],
        icon: defaultIcon
      }
    ];
    
    // Cache simplified version for storage
    const cachablePosts = [
      {
        _id: `fallback-${Date.now()}`,
        type: 'default',
        title: `${username}'s Profile`,
        description: 'Welcome to my Minecraft profile!',
        content: `Welcome to ${username}'s Minecraft profile! Thanks for visiting.`,
        time: 'Just now',
        createdAt: new Date(),
        author: {
          username: username,
          mcUsername: username,
          _id: `user-${Math.random().toString(36).substr(2, 9)}`
        },
        likes: [],
        comments: [],
        icon: 'UserIcon'
      }
    ];
    
    // Cache the fallback data to prevent repeated API calls
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cachablePosts));
    } catch (e) {
      // Failed to cache, but we can still use the data
      console.warn("Failed to cache default wall posts:", e);
    }
    
    return posts;
  };
  
  // Optimistic update for adding a comment
  const handleAddComment = async (postId) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;

    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    setCommentError((prev) => ({ ...prev, [postId]: '' }));

    // Optimistically add a temporary comment
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempCommentId,
      content,
      author: {
        username: user?.username || 'You',
        mcUsername: user?.mcUsername || user?.minecraftUsername || user?.username || 'Steve',
        _id: user?._id || 'me',
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setWallPosts((prevPosts) => prevPosts.map(post =>
      post._id === postId
        ? { ...post, comments: [...(post.comments || []), optimisticComment] }
        : post
    ));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    try {
      const response = await WallService.addComment(postId, content);
      // Remove the optimistic comment and add the real one from the response
      setWallPosts((prevPosts) => prevPosts.map(post => {
        if (post._id !== postId) return post;
        let comments = (post.comments || []).filter(c => c._id !== tempCommentId);
        if (response && response.comments) {
          comments = response.comments;
        }
        return { ...post, comments };
      }));
      setNotification({ show: true, type: 'success', message: 'Comment added successfully' });
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
      } catch (e) {
        console.log('Audio not supported', e);
      }
    } catch (err) {
      setWallPosts((prevPosts) => prevPosts.map(post =>
        post._id === postId
          ? { ...post, comments: (post.comments || []).filter(c => c._id !== tempCommentId) }
          : post
      ));
      setCommentError((prev) => ({ 
        ...prev, 
        [postId]: err?.response?.data?.error || 'Failed to add comment. Please try again.'
      }));
      setNotification({ show: true, type: 'error', message: 'Failed to add comment' });
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Optimistic update for deleting a comment
  const handleDeleteComment = async (postId, commentId) => {
    let removedComment = null;
    setWallPosts((prevPosts) => prevPosts.map(post => {
      if (post._id !== postId) return post;
      const comments = (post.comments || []);
      removedComment = comments.find(c => c._id === commentId);
      return { ...post, comments: comments.filter(c => c._id !== commentId) };
    }));
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    setCommentError((prev) => ({ ...prev, [postId]: '' }));

    try {
      await WallService.deleteComment(postId, commentId);
      setNotification({ show: true, type: 'success', message: 'Comment deleted successfully' });
    } catch (err) {
      setWallPosts((prevPosts) => prevPosts.map(post => {
        if (post._id !== postId) return post;
        return { ...post, comments: [...(post.comments || []), removedComment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) };
      }));
      setCommentError((prev) => ({ 
        ...prev, 
        [postId]: err?.response?.data?.error || 'Failed to delete comment. Please try again.'
      }));
      setNotification({ show: true, type: 'error', message: 'Failed to delete comment' });
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Optimistic update for creating a wall post
  const handleCreateWallPost = async (content, image) => {
    if (!content?.trim()) return Promise.reject(new Error('Empty content'));
    setWallError(null);
    const tempPostId = `temp-${Date.now()}`;
    const optimisticPost = {
      _id: tempPostId,
      content,
      author: profileUser || user || { username: 'You', mcUsername: 'Steve' },
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      isOptimistic: true,
    };
    setWallPosts((prev) => {
      const newPosts = [optimisticPost, ...prev];
      console.log('[DEBUG] Optimistic post added. wallPosts now:', newPosts.map(p => p._id));
      return newPosts;
    });
    try {
      const response = await WallService.createWallPost(username, content, image);
      console.log('[DEBUG] WallService.createWallPost response:', response);
      if (response && response.post) {
        setWallPosts((prev) => {
          const newPosts = [response.post, ...prev.filter(p => p._id !== tempPostId)];
          console.log('[DEBUG] Backend post added. wallPosts now:', newPosts.map(p => p._id));
          return newPosts;
        });
      } else {
        setWallPosts((prev) => prev);
      }
      if (response && response.post && response.post._id) {
        setExpandedComments(prev => ({
          ...prev,
          [response.post._id]: true
        }));
      }
      setNotification({ show: true, type: 'success', message: 'Post created successfully!' });
      if (socialStats && socialStats.refetch) socialStats.refetch();
      return Promise.resolve();
    } catch (err) {
      setWallPosts((prev) => prev.filter(p => p._id !== tempPostId));
      setWallError(err.message || 'Failed to create wall post');
      setNotification({ show: true, type: 'error', message: 'Failed to create post. Please try again.' });
      return Promise.reject(err);
    }
  };
  
  // Refactored handleDeleteWallPost: always fetch fresh after
  const handleDeleteWallPost = async (postId) => {
    try {
      console.log('[Profile] Deleting post:', postId);
      await WallService.deleteWallPost(postId);
      
      // Clear cache and refresh
      try {
        sessionStorage.removeItem(`wall_posts_${username}`);
      } catch (e) {
        console.warn('[Profile] Failed to clear wall posts cache for post deletion:', e);
      }
      
      // Use refreshWallPosts for consistency
      await refreshWallPosts();
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Post deleted successfully'
      });
    } catch (err) {
      console.error('[Profile] Error deleting post:', err);
      setWallError(err.message || 'Failed to delete wall post');
      setNotification({
        show: true,
        type: 'error',
        message: 'Failed to delete post'
      });
    }
  };

  // Handler to like a wall post
  const handleLikeWallPost = async (postId) => {
    try {
      await WallService.likeWallPost(postId);
      await fetchWallPostsDirectly(); // Always refetch after like
    } catch (err) {
      setWallError(err.message || 'Failed to like wall post');
    }
  };

  // Handler to unlike a wall post
  const handleUnlikeWallPost = async (postId) => {
    try {
      await WallService.unlikeWallPost(postId);
      await fetchWallPostsDirectly(); // Always refetch after unlike
    } catch (err) {
      setWallError(err.message || 'Failed to unlike wall post');
    }
  };
  
  // Add handleDeleteWallPostWithConfirm
  const handleDeleteWallPostWithConfirm = (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDeleteWallPost = async () => {
    if (postToDelete) {
      await handleDeleteWallPost(postToDelete);
      setPostToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteWallPost = () => {
    setPostToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Toggle comment section expansion
  const toggleCommentSection = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  // Update comment input handler
  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };
  
  // Add this before the return statement in Profile
  useEffect(() => {
    console.log('[Profile] About to render', wallPosts.length, 'posts, array:', JSON.stringify(wallPosts.map(p => ({ id: p._id, author: p.author?.username }))));
  }, [wallPosts]);
  
  // Unified, smoother wall post animation variants
  const postVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 35, mass: 0.9 }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { type: 'spring', stiffness: 300, damping: 35, mass: 0.9, duration: 0.35, ease: 'easeInOut' }
    }
  };

  // Smoother, more relaxed stagger for wall posts (applies to both enter and exit)
  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.12 } },
    exit: { transition: { staggerChildren: 0.12 } },
    hidden: {}
  };

  // Render wall posts with a single AnimatePresence and motion.div, layout everywhere, unique keys, and mode='wait'
  const renderedWallPosts = useMemo(() => (
    <AnimatePresence mode="wait">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={staggerContainer}
        layout
      >
        {wallPosts.map((post, index) => {
          if (!post) return null;
    if (!post.author) {
      post = {
        ...post,
        author: {
          username: profileUser.username || username,
          mcUsername: profileUser.mcUsername || username,
          _id: post.author_id || `user-${Date.now()}`
        }
      };
    }
    const avatarUsername = post.author.mcUsername || post.author.username;
    const postId = post._id || `post-${Date.now()}-${Math.random()}`;
    return (
            <motion.div
              key={postId}
              variants={postVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className="bg-white/10 rounded-md p-4 mb-2"
            >
        <div className="flex items-start">
          <Link to={`/profile/${post.author.username}`} className="flex-shrink-0">
            <MinecraftAvatar 
              username={avatarUsername}
              size={40}
              type="head"
              className="rounded-md"
            />
          </Link>
          <div className="flex-1 ml-3">
            <div className="flex justify-between items-start">
              <div>
                <Link 
                  to={`/profile/${post.author.username}`}
                  className="font-medium hover:text-minecraft-habbo-blue"
                >
                  {post.author.username}
                </Link>
                <span className="text-gray-400 text-sm ml-2">
                  {timeAgo(post.createdAt || Date.now())}
                </span>
              </div>
              {(isOwnProfile || (user && post.author.username === user.username)) && (
                <button 
                  onClick={() => handleDeleteWallPostWithConfirm(post._id)}
                  className="text-gray-400 hover:text-red-400"
                  title="Delete post"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-gray-200 whitespace-pre-wrap break-all overflow-x-auto">{post.content || ''}</p>
            {post.image && (
              <div className="mt-3">
                <img 
                  src={post.image} 
                  alt=""
                  className="rounded-md max-h-96 w-auto"
                />
              </div>
            )}
            <div className="flex items-center mt-3 text-sm text-gray-400">
              <button 
                className={`flex items-center hover:text-white mr-4 ${
                  (post.likes && user && post.likes.includes(user._id)) ? 'text-minecraft-habbo-blue' : ''
                }`}
                onClick={() => {
                  if (!user || !post._id) return;
                  if (post.likes && post.likes.includes(user._id)) {
                    handleUnlikeWallPost(post._id);
                  } else {
                    handleLikeWallPost(post._id);
                  }
                }}
              >
                <HandThumbUpIcon className="h-4 w-4 mr-1" />
                {post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}
              </button>
              {post.comments && post.comments.length > 0 && (
                <div className="relative h-2 w-2 mr-2">
                  <span className="absolute inset-0 inline-flex h-2 w-2 rounded-full bg-minecraft-habbo-blue opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-minecraft-habbo-blue"></span>
                </div>
              )}
            </div>
            <CommentSection
              post={post}
              commentInput={commentInputs[postId] || ''}
              commentLoading={commentLoading[postId] || false}
              commentError={commentError[postId] || ''}
              onCommentChange={handleCommentInputChange}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              currentUser={user}
              isExpanded={expandedComments[postId] || false}
              onToggleExpand={() => toggleCommentSection(postId)}
            />
          </div>
        </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  ), [wallPosts, user, isOwnProfile, commentInputs, commentLoading, commentError, expandedComments, profileUser, username]);
  
  useEffect(() => {
    if (!profileUser) return; // Only set up listener if profileUser is loaded
    const handleNotification = (event) => {
      const notification = event.detail;
      if (
        notification.type === 'notification' &&
        (notification.subtype === 'FOLLOW' || notification.subtype === 'UNFOLLOW')
      ) {
        if (
          notification.sender?.username === profileUser.username ||
          notification.recipient?.username === profileUser.username
        ) {
          getRelationship(profileUser.username, profileUser.mcUsername).then(setRelationship);
        }
      }
      // Existing friend request logic
      if (
        notification.type === 'friend_request' ||
        notification.type === 'friend_accept' ||
        notification.type === 'friend_decline'
      ) {
        if (
          notification.sender?.username === profileUser.username ||
          notification.recipient?.username === profileUser.username
        ) {
          getRelationship(profileUser.username, profileUser.mcUsername).then(setRelationship);
        }
      }
    };
    window.addEventListener('notification', handleNotification);
    return () => window.removeEventListener('notification', handleNotification);
  }, [profileUser?.username, profileUser?.mcUsername]);
  
  // Add this function near other fetch functions
  const fetchWallPostsDirectly = async () => {
    try {
      console.log('[DEBUG][fetchWallPostsDirectly] Called for', username);
      // Clear sessionStorage for wall posts before fetching
      try {
        const cacheKey = `wall_posts_${username}`;
        sessionStorage.removeItem(cacheKey);
        console.log('[Profile][SSE] Cleared wall posts cache for', username);
      } catch (e) {
        console.warn('[Profile][SSE] Failed to clear wall posts cache:', e);
      }
      // Add a 300ms delay to ensure backend commit
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[Profile][SSE] Fetching wall posts for', username, 'after SSE event');
      const res = await WallService.getWallPosts(username, 1, 10);
      console.log('[DEBUG][fetchWallPostsDirectly] API response:', res);
      if (res && Array.isArray(res.posts)) {
        // PATCH: Normalize posts and comments just like fetchWallPosts
        const postsToSet = res.posts.map(post => ({
          ...post,
          author: post.author || {
            username: username,
            mcUsername: username,
            _id: post.author_id || `user-${Date.now()}`
          },
          comments: (post.comments || []).map(comment => ({
            ...comment,
            author: comment.author && comment.author.username ? comment.author : {
              username: 'Unknown User',
              mcUsername: 'Steve'
            }
          }))
        }));
        console.log('[DEBUG][fetchWallPostsDirectly] Setting wall posts:', postsToSet);
        setWallPosts(postsToSet);
        setWallPage(1);
        setWallTotalPages(res?.pagination?.totalPages || 1);
      }
    } catch (err) {
      // Optionally handle error
      console.error('[Profile][SSE] Failed to fetch wall posts directly:', err);
    }
  };
  
  // --- PATCH: Real-time wall_post event handler (top-level) ---
  const handleWallPostEvent = (event) => {
    const currentProfileUser = profileUserRef.current;
    // Debug log all event fields
    console.log('[SSE][WALL_POST][DEBUG] Event received:', event);
    if (!event) return;
    // Check if the event is relevant to the wall currently being viewed
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    console.log('[SSE][WALL_POST][DEBUG] wallOwnerUsername:', event.wallOwnerUsername, 'viewedUsername:', viewedUsername);
    if (event.wallOwnerUsername === viewedUsername) {
      if (event.type === 'new_post') {
        setNotification({
          show: true,
          type: 'success',
          message: `New wall post received!`
        });
      }
      if (event.type === 'delete_post') {
        setNotification({
          show: true,
          type: 'success',
          message: `A wall post was deleted.`
        });
      }
      fetchWallPostsDirectly(); // Always fetch fresh wall posts after SSE event
    }
  };
  // ... existing code ...
  // In the useEffect for wall_post, remove the inner definition and use the top-level handleWallPostEvent
  useEffect(() => {
    if (!addEventListener) return;
    const removeWallPost = addEventListener('wall_post', handleWallPostEvent);
    const removeNewPost = addEventListener('new_post', handleWallPostEvent);
    const removeDeletePost = addEventListener('delete_post', handleWallPostEvent);
    return () => {
      if (removeWallPost) removeWallPost();
      if (removeNewPost) removeNewPost();
      if (removeDeletePost) removeDeletePost();
    };
  }, [addEventListener]);
  // ... existing code ...
  
  // --- PATCH: Real-time wall_comment event handler (top-level) ---
  const handleWallCommentEvent = (event) => {
    console.log('[DEBUG][SSE] handleWallCommentEvent fired:', event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: 'success',
        message: 'New comment received!'
      });
      fetchWallPostsDirectly();
    }
  };
  // ... existing code ...
  // In the useEffect for wall_comment, remove the inner definition and use the top-level handleWallCommentEvent
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    addEventListener('wall_comment', handleWallCommentEvent);
    return () => {
      if (addEventListener) addEventListener('wall_comment', null);
    };
  }, [addEventListener, isConnected, fetchWallPostsDirectly]);
  // ... existing code ...
  
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeWallLike = addEventListener('wall_like', handleWallLikeEvent);
    return () => {
      if (removeWallLike) removeWallLike();
    };
  }, [addEventListener, isConnected]);
  
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeLikeAdded = addEventListener('like_added', handleWallLikeEvent);
    const removeLikeRemoved = addEventListener('like_removed', handleWallLikeEvent);
    return () => {
      if (removeLikeAdded) removeLikeAdded();
      if (removeLikeRemoved) removeLikeRemoved();
    };
  }, [addEventListener, isConnected]);
  
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    // Listen for delete_post events (real-time post deletion)
    const removeDeletePost = addEventListener('delete_post', handleWallPostEvent);
    return () => {
      if (removeDeletePost) removeDeletePost();
    };
  }, [addEventListener, isConnected]);
  
  // --- PATCH: Real-time wall_like event handler (top-level) ---
  const handleWallLikeEvent = (event) => {
    console.log('[DEBUG][SSE] handleWallLikeEvent fired:', event);
    const currentProfileUser = profileUserRef.current;
    const viewedUsername = currentProfileUser?.username || currentProfileUser?.mcUsername;
    if (event.wallOwnerUsername === viewedUsername) {
      setNotification({
        show: true,
        type: 'success',
        message: 'A post was liked!'
      });
      fetchWallPostsDirectly();
    }
  };
  
  useEffect(() => {
    if (!addEventListener || !isConnected) return;
    const removeCommentAdded = addEventListener('comment_added', handleWallCommentEvent);
    return () => {
      if (removeCommentAdded) removeCommentAdded();
    };
  }, [addEventListener, isConnected]);
  
  if (!shouldDisplayProfile) {
    return (
      <div className="min-h-screen pt-24 py-20 minecraft-grid-bg bg-habbo-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-6">Profile Not Found</h1>
          <p className="text-gray-300 mb-8">Please log in to view your profile or specify a username.</p>
          <Link to="/login" className="habbo-btn text-center px-6 py-2">
            Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (notFound) {
    return (
      <div className="min-h-screen pt-24 py-20 minecraft-grid-bg bg-habbo-pattern text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue mb-6">User Not Found</h1>
          <p className="text-gray-300 mb-8">The user profile you are looking for does not exist.</p>
          <Link to="/" className="habbo-btn text-center px-6 py-2">
            Return Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return <LoadingSpinner fullScreen />;
  }
  
  // Custom skull icon
  const SkullIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
  
  // Old post method and wallpaper functions that were removed
  // Handle posting to wall
  const handleWallPost = async (e) => {
    e.preventDefault();
    if (!newWallPost.trim()) return;
    await handleCreateWallPost(newWallPost);
  };
  
  // Toggle between 3D model and regular avatar
  const toggleViewMode = () => {
    console.log('Toggling view mode from', viewMode, 'to', viewMode === '3d' ? 'avatar' : '3d');
    setViewMode(prevMode => prevMode === '3d' ? 'avatar' : '3d');
  };
  
  // Change cover image
  const handleCoverChange = (imagePath) => {
    setCoverImage(imagePath);
    
    setNotification({
      show: true,
      type: 'success',
      message: 'Cover image updated!'
    });
  };
  
  // Change wallpaper handler
  const handleWallpaperSelect = async (id) => {
    if (savingWallpaper || wallpaperId === id) return;
    
    // Show confirmation dialog instead of immediately changing
    setPendingWallpaperId(id);
    setShowWallpaperModal(true);
  };
  
  // Confirm wallpaper change
  const confirmWallpaperChange = async () => {
    const id = pendingWallpaperId;
    setShowWallpaperModal(false);
    
    if (!id) return;
    
    setWallpaperId(id);
    const uname = profileUser.mcUsername || profileUser.username || 'Steve';
    setCoverImage(getWallpaperUrl(id, uname));
    setSavingWallpaper(true);
    
    try {
      await API.put('/api/user/profile', { wallpaperId: id });
      
      // Play sound effect on successful change
      try {
        const audio = new Audio('/sounds/level-up.mp3');
        audio.volume = 0.3; // Lower volume for this sound
        audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
      } catch (e) {
        console.log('Audio not supported', e);
      }
      
      setNotification({ show: true, type: 'success', message: 'Wallpaper updated!' });
    } catch (err) {
      setNotification({ show: true, type: 'error', message: 'Failed to update wallpaper.' });
      // Revert to previous
      setWallpaperId(profileUser.wallpaperId || null);
      setCoverImage(getWallpaperUrl(profileUser.wallpaperId || WALLPAPERS[0].id, uname));
    } finally {
      setSavingWallpaper(false);
      setPendingWallpaperId(null);
    }
  };
  
  const invalidateRelationshipCache = (username) => {
    // Remove all possible relationship cache keys for this user
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(`relationship_${username}_`));
    keys.forEach(k => sessionStorage.removeItem(k));
  };
  
  // Add state for manage posts modal and loading
  const openManagePostsModal = () => {
    setShowManagePostsModal(true);
    setBulkDeleteError('');
  };

  // Handler to close modal
  const closeManagePostsModal = () => {
    setShowManagePostsModal(false);
    setBulkDeleteError('');
  };

  // Handler to delete all posts
  const handleDeleteAllPosts = async () => {
    setBulkDeleteLoading(true);
    setBulkDeleteError('');
    try {
      const allPostIds = wallPosts.map(p => p._id);
      if (allPostIds.length === 0) {
        setBulkDeleteError('No posts to delete.');
        setBulkDeleteLoading(false);
        return;
      }
      await API.delete(`/api/wall/${username}/bulk-delete`, { data: { postIds: allPostIds } });
      await refreshWallPosts();
      setShowManagePostsModal(false);
      setBulkDeleteLoading(false);
      setNotification({ show: true, type: 'success', message: 'All posts deleted!' });
    } catch (err) {
      setBulkDeleteError(err?.response?.data?.error || 'Failed to delete posts.');
      setBulkDeleteLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen ...">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
          <div className="celebration-container relative z-50">
            <div className="celebration-title text-4xl font-bold text-green-500 mb-4 animate-bounce">
              🎮 Minecraft Account Linked! 🎉
            </div>
            <div className="celebration-subtitle text-2xl font-semibold text-white mb-6">
              {profileUser?.minecraft?.mcUsername ? `Welcome, ${profileUser.minecraft.mcUsername}!` : 'Welcome, Minecrafter!'}
            </div>
            <div className="celebration-items flex justify-center space-x-4">
              {[...Array(30)].map((_, i) => (
                <div 
                  key={i}
                  className="celebration-item"
                  style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `fall ${3 + Math.random() * 5}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 2 + 1}rem`,
                    opacity: 0.7
                  }}
                >
                  {['🎮', '⛏️', '🗡️', '🏹', '🧪', '🌳', '💎', '🏆', '🧱', '🔥'][Math.floor(Math.random() * 10)]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Add celebration CSS */}
      {showCelebration && (
        <style jsx="true">{`
          @keyframes fall {
            0% {
              transform: translateY(-20vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          .celebration-container {
            text-align: center;
            z-index: 9999;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 2rem;
            border-radius: 1rem;
            animation: pulse 2s infinite;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            border: 2px solid #4ade80;
            max-width: 90%;
            width: 600px;
            pointer-events: auto;
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 255, 0, 0.8); }
            100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
          }
        `}</style>
      )}
      
      {/* Notification system */}
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
      
      <div className="min-h-screen ...">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-minecraft-navy-dark rounded-t-md overflow-hidden relative">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Profile Cover"
                  className="w-full h-full object-cover"
                  onLoad={() => setWallpaperLoaded(true)}
                />
              ) : (
                <div className="w-full h-full bg-minecraft-navy-dark flex items-center justify-center">
                  <img
                    src={getDefaultCover(profileUser?.username)}
                    alt="Default Cover"
                    className="w-full h-full object-cover opacity-50"
                  />
                </div>
              )}
              
              {/* Cover Image Change Button */}
            {isOwnProfile && (
                        <button 
                  onClick={() => setShowWallpaperModal(true)}
                  className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-md flex items-center text-sm"
                >
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  Change Cover
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-4">
              <div className="flex flex-col md:flex-row md:items-end -mt-16 relative z-10">
                {/* Avatar */}
                <div className="flex-shrink-0 relative group">
                  <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-minecraft-navy-dark bg-minecraft-navy-light">
                    {viewMode === 'avatar' ? (
                            <MinecraftAvatar 
                        username={profileUser?.mcUsername || profileUser?.username}
                              size={128}
                        className="w-full h-full"
                      />
                    ) : (
                      <MinecraftPlayerModel3D
                        username={profileUser?.mcUsername || profileUser?.username}
                        width={128}
                        height={128}
                      />
                    )}
                  </div>
                <button 
                  onClick={toggleViewMode}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title={viewMode === 'avatar' ? 'Show 3D Model' : 'Show Avatar'}
                  >
                    <CubeIcon className="h-4 w-4" />
                </button>
          </div>
          
                {/* Profile Info & Actions */}
                <div className="flex-1 md:ml-6 mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                      <h1 className="text-2xl font-minecraft flex items-center">
                        {profileUser?.username}
                        {profileUser?.verified && (
                          <span className="ml-2 text-minecraft-habbo-blue" title="Verified">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                    )}
                  </h1>
                      <div className="text-gray-400 text-sm mt-1">
                        {profileUser?.title || 'Adventurer'}
                </div>
              </div>
              
                    {/* Profile Actions */}
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                {!isOwnProfile && (
                  <>
                    <FriendButton username={profileUser?.username} />
                    {/* Replace the manual Follow/Unfollow button with the modern FollowButton component */}
                    <FollowButton
                      username={profileUser?.username}
                      mcUsername={profileUser?.mcUsername}
                      initialFollowing={relationship?.following}
                      followsYou={relationship?.followsYou}
                    />
                          <button
                            onClick={() => navigate(`/messages/new/${profileUser?.username}`)}
                      className="message-btn flex items-center px-4 py-2 rounded-lg border border-blue-500 bg-transparent text-blue-300 font-semibold shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-all duration-150 scale-100 hover:scale-105 active:scale-95"
                      aria-label="Send Message"
                      tabIndex={0}
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                            Message
                </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Friend Request Notification */}
                  {relationship?.status === 'pending_received' && (
                    <div className="mt-4 bg-minecraft-navy-light p-4 rounded-md">
                      <p className="text-sm mb-2">
                        {profileUser?.username} sent you a friend request
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(profileUser?.username)}
                          className="habbo-btn-success text-sm px-3 py-1"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectFriendRequest(profileUser?.username)}
                          className="habbo-btn-danger text-sm px-3 py-1"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
            
            {/* Profile Tabs */}
            <div className="flex mt-6 border-b border-white/10 overflow-x-auto pb-px">
              <button
                onClick={() => setSelectedTab('wall')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'wall' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setSelectedTab('info')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'info' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setSelectedTab('stats')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'stats' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setSelectedTab('inventory')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'inventory' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setSelectedTab('achievements')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'achievements' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Achievements
              </button>
              <button
                onClick={() => setSelectedTab('photos')}
                className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
                  selectedTab === 'photos' ? 'text-white border-b-2 border-minecraft-habbo-blue -mb-px' : 'text-gray-400 hover:text-white'
                }`}
              >
                Screenshots
              </button>
          </div>
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Information
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Location:</p>
                      <p>{playerStats?.world || 'Overworld'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Rank:</p>
                      <p>{playerStats?.rank || profileUser.role || 'Member'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Gamemode:</p>
                      <p>{playerStats?.gamemode || 'SURVIVAL'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Playtime:</p>
                      <p>{playerStats?.playtime || '0h'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Balance:</p>
                      <p className="text-minecraft-habbo-yellow">${playerStats?.balance || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Social Stats Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Social
                </h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <UserIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Friends:</p>
                      <p>{socialStats.friendsCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <UsersIcon className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Followers:</p>
                      <p>{socialStats.followersCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <HeartIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400">Following:</p>
                      <p>{socialStats.followingCount || 0}</p>
                    </div>
                  </div>
                  
                  {socialStats.loading ? (
                    <div className="text-center py-2">
                      <LoadingSpinner size="small" />
                    </div>
                  ) : socialStats.error ? (
                    <div className="text-center text-red-400 text-xs py-2">
                      {socialStats.error}
                    </div>
                  ) : (
                  <Link to="/friends" className="block text-center text-minecraft-habbo-blue hover:text-minecraft-habbo-green mt-3 text-xs">
                    View all social connections
                  </Link>
                  )}
                </div>
              </div>
              
              {/* Level Display Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Level
                </h2>
                
                <LevelProgressBar 
                  level={playerStats?.level || 1} 
                  experience={playerStats?.experience || 0} 
                />
                
                <div className="mt-3 text-center">
                  <span className="text-xl font-minecraft">Level {playerStats?.level || 1}</span>
                </div>
              </div>
              
              {/* Friends Box */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>Friends ({socialStats.friendsCount || 0})</span>
                  <Link to="/friends" className="text-sm text-minecraft-habbo-green hover:underline">
                    See All
                  </Link>
                </h2>
                
                <div className="space-y-1">
                  {socialStats.loading ? (
                    <div className="text-center py-4">
                      <LoadingSpinner size="small" />
                    </div>
                  ) : socialStats.error ? (
                    <div className="text-center text-red-400 py-4">
                      Failed to load friends
                    </div>
                  ) : socialStats.friends.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No friends yet
                    </div>
                  ) : (
                    socialStats.friends.slice(0, 5).map((friend) => (
                    <FriendItem 
                        key={friend._id}
                      username={friend.username}
                      status={friend.status}
                      online={friend.online}
                    />
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Wall Tab */}
              {selectedTab === 'wall' && (
                <div>
                  {/* Post to Wall Form */}
                  <div className="habbo-card p-5 rounded-md mb-6">
                    <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4">
                      {isOwnProfile ? 'Update Your Status' : `Write on ${profileUser.username}'s Wall`}
                    </h2>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newWallPost.trim()) return;
                      try {
                        await handleCreateWallPost(newWallPost);
                        setNewWallPost('');
                      } catch (err) {
                        setNotification({ show: true, type: 'error', message: 'Failed to create post. Please try again.' });
                        setNewWallPost(newWallPost); // restore input if failed
                      }
                    }}>
                      <textarea
                        value={newWallPost}
                        onChange={(e) => setNewWallPost(e.target.value)}
                        className="w-full p-3 bg-minecraft-navy-light border border-white/10 rounded-md text-white placeholder-gray-500 focus:border-minecraft-habbo-blue focus:ring focus:ring-minecraft-habbo-blue focus:ring-opacity-50"
                        placeholder={isOwnProfile ? "What's on your mind?" : `Write something to ${profileUser.username}...`}
                        rows={3}
                      ></textarea>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="bg-minecraft-navy-light hover:bg-minecraft-navy p-2 rounded-md"
                            title="Add Image"
                          >
                            <PhotoIcon className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            type="button"
                            className="bg-minecraft-navy-light hover:bg-minecraft-navy p-2 rounded-md"
                            title="Add Emoji"
                          >
                            <span className="text-xl">😊</span>
                          </button>
                        </div>
                        <button 
                          type="submit"
                          className="habbo-btn px-4 py-2"
                          disabled={!newWallPost.trim() || wallLoading}
                        >
                          {wallLoading ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* Manage Posts Icon Button (only for profile owner) */}
                  {isOwnProfile && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={openManagePostsModal}
                        className="p-2 rounded-full bg-minecraft-navy-light hover:bg-minecraft-habbo-blue transition-colors relative group"
                        title="Manage Posts"
                        aria-label="Manage Posts"
                      >
                        <Cog6ToothIcon className="h-6 w-6 text-gray-300 group-hover:text-white" />
                        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          Manage Posts
                        </span>
                      </button>
                    </div>
                  )}
                  
                  {/* Wall Posts */}
                  <div className="space-y-4">
                    {wallError && (
                      <div className="bg-red-500/10 text-red-400 p-4 rounded-md mb-4">
                        {wallError}
                      </div>
                    )}
                    
                    {wallLoading ? (
                      <div className="text-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : wallPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <ChatBubbleOvalLeftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-lg text-gray-400">No wall posts yet</p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                          {isOwnProfile ? 
                            "Share what's on your mind or what you've been up to in Minecraft!" :
                            `Be the first to write on ${profileUser.username}'s wall!`}
                        </p>
                      </div>
                    ) : (
                      <>
                          {renderedWallPosts}
                        
                        {/* Pagination */}
                        {wallTotalPages > 1 && (
                          <div className="flex justify-center mt-6 space-x-2">
                            <button
                              onClick={() => setWallPage(prev => Math.max(prev - 1, 1))}
                              disabled={wallPage === 1}
                              className={`px-3 py-1 rounded-md ${
                                wallPage === 1 
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                  : 'bg-minecraft-navy-light hover:bg-minecraft-navy text-white'
                              }`}
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 bg-minecraft-navy-dark text-white rounded-md">
                              Page {wallPage} of {wallTotalPages}
                            </span>
                            <button
                              onClick={() => setWallPage(prev => Math.min(prev + 1, wallTotalPages))}
                              disabled={wallPage === wallTotalPages}
                              className={`px-3 py-1 rounded-md ${
                                wallPage === wallTotalPages
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-minecraft-navy-light hover:bg-minecraft-navy text-white'
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Info Tab */}
              {selectedTab === 'info' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Player Info
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-2">
                        Basic Information
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Username:</span>
                          <span>{profileUser.username}</span>
                        </div>
                        
                        {profileUser.mcUsername && profileUser.mcUsername !== profileUser.username && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Minecraft Username:</span>
                            <span>{profileUser.mcUsername}</span>
                          </div>
                        )}
                        
                        {profileUser.mcUUID && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">UUID:</span>
                            <span className="font-mono text-xs">{profileUser.mcUUID}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rank:</span>
                          <span>{playerStats?.rank || profileUser.role || 'Member'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Joined:</span>
                          <span>{formatDate(profileUser.createdAt)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Seen:</span>
                          <span>{playerStats?.lastSeen || 'Never'}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mt-6 mb-2">
                        Game Status
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">World:</span>
                          <span>{playerStats?.world || 'Overworld'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gamemode:</span>
                          <span>{playerStats?.gamemode || 'SURVIVAL'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Level:</span>
                          <span>{playerStats?.level || 1}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playtime:</span>
                          <span>{playerStats?.playtime || '0h'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mb-2">
                        External Links
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        <a 
                          href={`https://namemc.com/profile/${profileUser.mcUsername || profileUser.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          View on NameMC
                        </a>
                        
                        <a 
                          href={`https://mc-heads.net/body/${profileUser.mcUsername || profileUser.username}/right`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-minecraft-navy-light hover:bg-minecraft-navy-dark p-3 rounded-md text-minecraft-habbo-blue"
                        >
                          View Full Skin
                        </a>
                      </div>
                      
                      <h3 className="text-md font-minecraft text-minecraft-habbo-green mt-6 mb-2">
                        Plugin Data
                      </h3>
                      
                      <div className="space-y-3 text-sm">
                        {playerStats?.mcmmo_data ? (
                          <div className="bg-minecraft-navy-light p-3 rounded-md">
                            <p className="font-medium mb-1">mcMMO Stats</p>
                            <p className="text-gray-400">Power Level: {playerStats.mcmmo_data.power_level || 0}</p>
                          </div>
                        ) : (
                          <div className="bg-minecraft-navy-light p-3 rounded-md text-gray-400">
                            No mcMMO data available
                          </div>
                        )}
                        
                        {playerStats?.jobs_data ? (
                          <div className="bg-minecraft-navy-light p-3 rounded-md">
                            <p className="font-medium mb-1">Jobs</p>
                            <p className="text-gray-400">Active Jobs: {Object.keys(playerStats.jobs_data).length}</p>
                          </div>
                        ) : (
                          <div className="bg-minecraft-navy-light p-3 rounded-md text-gray-400">
                            No Jobs data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats Tab */}
              {selectedTab === 'stats' && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Player Statistics</h3>
                        
                        {playerStats && (
                          <AnimatedPlayerStats 
                            initialStats={playerStats}
                            className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner"
                            showTitle={false}
                            disablePolling={true}
                          />
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Game Progress</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          <div className="mb-4">
                            <LevelProgressBar 
                              level={playerStats?.level || 1}
                              experience={playerStats?.experience || 0}
                              nextLevelExperience={playerStats?.next_level_experience || 100}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <StatCard
                              icon={<TrophyIcon className="h-5 w-5 text-yellow-400" />}
                              label="Level"
                              value={playerStats?.level || 1}
                            />
                            <StatCard
                              icon={<ChartBarIcon className="h-5 w-5 text-green-400" />}
                              label="Experience"
                              value={playerStats?.experience || 0}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Player Titles</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          {playerStats && (
                            <TitleSystem 
                              playerData={playerStats}
                              compact={false}
                              selectedTitle={profileUser?.activeTitle}
                              readOnly={!isOwnProfile}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Inventory</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          {playerStats?.inventory ? (
                            <MinecraftInventory 
                              items={generateInventoryItems(playerStats.inventory)}
                              username={profileUser.mcUsername}
                            />
                          ) : (
                            <div className="text-center text-gray-400 py-4">
                              Inventory data not available
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Achievements</h3>
                        <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                          <MinecraftAchievements 
                            achievements={playerStats?.achievements || []}
                            totalAchievements={playerStats?.total_achievements || 0}
                            username={profileUser.mcUsername}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl font-minecraft text-minecraft-habbo-blue mb-2">Plugin Statistics</h3>
                    <div className="p-4 bg-minecraft-navy-light/50 rounded-md shadow-inner">
                      <MinecraftPluginIntegrations playerData={playerStats} username={profileUser.mcUsername} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Inventory Tab */}
              {selectedTab === 'inventory' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Player Inventory
                  </h2>
                  
                  {playerStats?.inventory ? (
                    <div>
                      {/* Main hand callout */}
                      {playerStats.inventory.main_hand && playerStats.inventory.main_hand.name && (
                        <div className="mb-4 bg-minecraft-navy-light p-3 rounded-md flex items-center">
                          <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center mr-4">
                            <img 
                              src={`https://minecraft-api.com/api/items/${playerStats.inventory.main_hand.name.replace(/_/g, '')}/image`} 
                              alt=""
                              className="w-10 h-10"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=MC' }}
                            />
                          </div>
                          <div>
                            <div className="text-md font-medium">Main Hand</div>
                            <div className="text-sm text-gray-400">
                              {playerStats.inventory.main_hand.name.replace(/_/g, ' ')
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                              {playerStats.inventory.main_hand.amount > 1 && (
                                <span className="ml-1">×{playerStats.inventory.main_hand.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Inventory grid */}
                      <MinecraftInventory 
                        items={generateInventoryItems(playerStats.inventory)}
                        columns={9}
                        slotSize={50}
                        className="mx-auto"
                        showLabels={true}
                      />
                      
                      {/* Armor display */}
                      {playerStats.inventory.armor && Object.values(playerStats.inventory.armor).some(item => item) && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <h3 className="text-md font-medium mb-4">Equipped Armor</h3>
                          <div className="flex justify-center space-x-4">
                            {['helmet', 'chestplate', 'leggings', 'boots'].map(piece => (
                              playerStats.inventory.armor[piece] ? (
                                <div key={piece} className="bg-minecraft-navy-light p-2 rounded-md text-center">
                                  <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center mx-auto">
                                    <img 
                                      src={`https://minecraft-api.com/api/items/${playerStats.inventory.armor[piece].name.replace(/_/g, '')}/image`}
                                      alt={piece}
                                      className="w-10 h-10"
                                      onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=MC' }}
                                    />
                                  </div>
                                  <p className="text-xs mt-1 capitalize">{piece}</p>
                                </div>
                              ) : (
                                <div key={piece} className="bg-minecraft-navy-light p-2 rounded-md text-center">
                                  <div className="w-12 h-12 bg-gray-800/50 rounded-md flex items-center justify-center mx-auto opacity-50">
                                    <span className="text-gray-500">✖</span>
                                  </div>
                                  <p className="text-xs mt-1 text-gray-500 capitalize">{piece}</p>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Valuables summary */}
                      {playerStats.inventory.valuables && (
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <h3 className="text-md font-medium mb-4">Valuable Resources</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-blue-400">Diamonds</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.diamond || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-green-500">Emeralds</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.emerald || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-yellow-500">Gold</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.gold || 0}</div>
                            </div>
                            <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
                              <div className="font-medium text-gray-500">Iron</div>
                              <div className="text-2xl">{playerStats.inventory.valuables.iron || 0}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <p className="text-lg text-gray-400">No inventory data available</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                        Player inventory data is updated when they are online or manually sync their data.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Achievements Tab */}
              {selectedTab === 'achievements' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                    <span>Player Achievements</span>
                    <span className="text-minecraft-habbo-yellow">
                      {playerStats?.achievement_percentage ? 
                        `${playerStats.achievements}/${playerStats.advancements?.total || 30} (${playerStats.achievement_percentage}%)` : 
                        `${playerStats?.achievements || 0}/30 Completed`}
                    </span>
                  </h2>
                  
                  {/* Progress bar */}
                  <div className="habbo-progress-bar mb-6">
                    <div style={{ 
                      width: `${playerStats?.achievement_percentage || ((playerStats?.achievements || 0) / 30) * 100}%`,
                      background: 'linear-gradient(to right, #54AA54, #9C44DC)'
                    }}></div>
                  </div>
                  
                  {/* Advancement list */}
                  {playerStats?.advancements && playerStats.advancements.list && playerStats.advancements.list.length > 0 ? (
                    <MinecraftAchievements 
                      advancements={playerStats.advancements.list}
                      count={playerStats.achievements || 0}
                      total={playerStats.advancements.total || 30}
                      percentage={playerStats.achievement_percentage || 0}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="text-lg text-gray-400">No achievement data available</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                        Achievement data will be displayed here once the player has earned some achievements.
                      </p>
                    </div>
                  )}
                  
                  {/* Recent achievements */}
                  {playerStats?.recent_achievements && playerStats.recent_achievements.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <h3 className="text-md font-medium mb-4">Recently Earned</h3>
                      <div className="space-y-3">
                        {playerStats.recent_achievements.map((achievement, idx) => (
                          <div key={idx} className="bg-minecraft-navy-light p-3 rounded-md flex items-center">
                            <div className="w-10 h-10 bg-yellow-600/30 rounded-md flex items-center justify-center mr-3">
                              <GiftIcon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium">{achievement.name}</p>
                              <p className="text-xs text-gray-400">{timeAgo(achievement.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Photos/Screenshots Tab */}
              {selectedTab === 'photos' && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                    <span>Screenshots</span>
                    <button className="text-sm text-minecraft-habbo-green hover:underline">
                      Upload New
                    </button>
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      'https://i.imgur.com/dfDOOu3.jpg',
                      'https://i.imgur.com/LSJzTH9.jpg',
                      'https://i.imgur.com/XlsCkd5.jpg',
                      'https://i.imgur.com/5Kh7LI1.jpg',
                      'https://i.imgur.com/pHRUbFI.jpg',
                      'https://i.imgur.com/rEKwsGZ.jpg'
                    ].map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imageUrl}
                          alt={`Minecraft Screenshot ${index+1}`}
                          className="w-full h-40 object-cover rounded-md group-hover:brightness-75 transition-all duration-200"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="bg-black/70 text-white px-3 py-1 rounded-md text-sm">
                            View
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(Date.now() - ((index+1) * 86400000))}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty state (commented out) */}
                  {/*
                  <div className="text-center py-12">
                    <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-400">No screenshots yet</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                      Upload some screenshots of your Minecraft adventures to show them off here!
                    </p>
                    <button className="habbo-btn mt-4 px-4 py-2">
                      Upload Screenshot
                    </button>
                  </div>
                  */}
                </div>
              )}
            </div>
            
            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Quick Stats
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span>{playerStats?.level || 1}</span>
                  </div>
                  
                  {/* Show active title if available */}
                  {profileUser.activeTitle && playerStats && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Title:</span>
                      <TitleSystem 
                        playerData={playerStats} 
                        compact={true}
                        selectedTitle={profileUser.activeTitle}
                      />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-minecraft-habbo-yellow">${playerStats?.balance || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blocks Mined:</span>
                    <span>{(playerStats?.blocks_mined || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mobs Killed:</span>
                    <span>{(playerStats?.mobs_killed || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deaths:</span>
                    <span>{(playerStats?.deaths || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Achievements:</span>
                    <span>{(playerStats?.achievements || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Online Status */}
              <div className="habbo-card p-5 rounded-md">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${playerStats?.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue">
                    Status
                  </h2>
                </div>
                <p className="text-sm">
                  {playerStats?.online ? (
                    <span className="text-green-400">Online Now</span>
                  ) : (
                    <span className="text-gray-400">
                      Last seen: {playerStats?.lastSeen || 'Never'}
                    </span>
                  )}
                </p>
                
                {playerStats?.online && playerStats?.world && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current World:</span>
                      <span>{playerStats.world}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Gamemode:</span>
                      <span>{playerStats.gamemode}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Plugin Integrations */}
              {(playerStats?.mcmmo_data || playerStats?.jobs_data || playerStats?.towny_data) && (
                <div className="habbo-card p-5 rounded-md">
                  <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                    Plugin Data
                  </h2>
                  
                  <MinecraftPluginIntegrations 
                    integrationData={{
                      mcmmo_data: playerStats.mcmmo_data,
                      jobs_data: playerStats.jobs_data,
                      towny_data: playerStats.towny_data
                    }}
                  />
                </div>
              )}
              
              {/* Links to other profiles */}
              <div className="habbo-card p-5 rounded-md">
                <h2 className="text-lg font-minecraft text-minecraft-habbo-blue mb-4 border-b border-white/10 pb-2">
                  Other Players
                </h2>
                
                <div className="space-y-3">
                  {friends.map((friend, index) => (
                    <Link 
                      key={index}
                      to={`/profile/${friend.username}`}
                      className="flex items-center p-2 rounded-md hover:bg-minecraft-navy-light"
                    >
                      <MinecraftAvatar 
                        username={friend.username}
                        size={32}
                        className="mr-3"
                        type="head"
                      />
                      <span>{friend.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Celebration Button - Only visible for admins or in development */}
      {(process.env.NODE_ENV === 'development' || (user && user.role === 'admin')) && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* Test celebration button removed to ensure it only shows when verified on Minecraft */}
        </div>
      )}
      
      {/* Wallpaper Confirmation Modal */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">Change Wallpaper?</h3>
            <p className="text-gray-300 mb-4">
              This will change your profile wallpaper and also affect how your posts appear in forums.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmWallpaperChange}
                className="habbo-btn px-4 py-2"
              >
                Change Wallpaper
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">Delete Post?</h3>
            <p className="text-gray-300 mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={cancelDeleteWallPost}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWallPost}
                className="habbo-btn px-4 py-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showManagePostsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-minecraft-navy-dark rounded-md p-5 max-w-md w-full border border-minecraft-habbo-blue shadow-lg">
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue mb-3">Manage Posts</h3>
            <p className="text-gray-300 mb-4">You can delete <b>all</b> your wall posts at once. This action cannot be undone.</p>
            {bulkDeleteError && <div className="text-red-400 mb-2">{bulkDeleteError}</div>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeManagePostsModal}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                disabled={bulkDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllPosts}
                className="habbo-btn px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={bulkDeleteLoading || wallPosts.length === 0}
              >
                {bulkDeleteLoading ? 'Deleting...' : 'Delete All Posts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-minecraft-navy-light p-3 rounded-md text-center">
    <div className="flex items-center justify-center mb-2">
      {icon}
    </div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default Profile;