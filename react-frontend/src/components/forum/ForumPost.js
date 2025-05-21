/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumPost.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import MinecraftAvatar from '../MinecraftAvatar';
import { useNavigate } from 'react-router-dom';
import ForumAPI from '../../services/ForumAPI';
import MinimalUserReputation from '../MinimalUserReputation.jsx';
import { motion } from 'framer-motion';

// Try to import real toast, or use our mock version
let toast;
try {
  toast = require('react-toastify').toast;
} catch (error) {
  console.warn('react-toastify not found, using mock version');
  toast = require('../../services/mockToast').toast;
}

// We're using MinimalUserReputation component directly now

// Redefine rankStyles for Minecraft theme
const rankStyles = {
  owner:    'bg-gradient-to-r from-yellow-300 to-yellow-600 text-gray-900 border-2 border-yellow-500 shadow-lg minecraft-pixel',
  admin:    'bg-gradient-to-r from-red-500 to-red-800 text-white border-2 border-red-600 shadow-lg minecraft-pixel',
  moderator:'bg-gradient-to-r from-blue-400 to-blue-700 text-white border-2 border-blue-500 shadow-lg minecraft-pixel',
  helper:   'bg-gradient-to-r from-green-400 to-green-700 text-white border-2 border-green-500 shadow-lg minecraft-pixel',
  vip:      'bg-gradient-to-r from-purple-400 to-purple-700 text-white border-2 border-purple-500 shadow-lg minecraft-pixel',
  member:   'bg-gradient-to-r from-gray-600 to-gray-800 text-white border-2 border-gray-500 shadow minecraft-pixel',
  user:     'bg-gradient-to-r from-gray-600 to-gray-800 text-white border-2 border-gray-500 shadow minecraft-pixel',
  content_creator: 'bg-gradient-to-r from-pink-400 to-pink-700 text-white border-2 border-pink-500 shadow-lg minecraft-pixel',
  developer: 'bg-gradient-to-r from-cyan-400 to-cyan-700 text-white border-2 border-cyan-500 shadow-lg minecraft-pixel',
  donor:    'bg-gradient-to-r from-amber-400 to-amber-700 text-white border-2 border-amber-500 shadow-lg minecraft-pixel',
  tiktok_sub: 'bg-gradient-to-r from-fuchsia-400 to-fuchsia-700 text-white border-2 border-fuchsia-500 shadow-lg minecraft-pixel'
};

// Add this function near the top
const getDashboardRankColor = (rank) => {
  if (!rank) return 'text-gray-400';
  const r = rank.toLowerCase();
  if (r === 'owner' || r === 'admin') return 'text-red-400';
  if (r === 'vip' || r === 'vip+') return 'text-minecraft-habbo-yellow';
  if (r === 'moderator' || r === 'mod') return 'text-minecraft-habbo-blue';
  if (r === 'helper') return 'text-minecraft-habbo-green';
  return 'text-gray-400';
};

// Add this function for tooltip text
const getRankTooltip = (rank) => {
  if (!rank) return '';
  const r = rank.toLowerCase();
  if (r === 'owner') return 'Owner: The creator and leader of Bizzy Nation! All-powerful, all-knowing, and super cool.';
  if (r === 'admin') return 'Admin: A trusted staff member who helps manage the community and keep things running smoothly.';
  if (r === 'moderator' || r === 'mod') return 'Moderator: A trusted community guardian who keeps the forums safe and friendly.';
  if (r === 'helper') return 'Helper: A trustworthy player who assists others and supports the community.';
  if (r === 'vip' || r === 'vip+') return 'VIP: A supporter who helps keep the server running. Thank you!';
  if (r === 'member' || r === 'user') return 'Member: A regular player and valued part of the community.';
  return 'Player: Enjoy your stay!';
};

// Simple in-memory cache for wallpaper images (key: wallpaperId:mcUsername)
const wallpaperCache = new Map();

// Allowed wallpaper IDs
const ALLOWED_WALLPAPERS = ['herobrine_hill', 'quick_hide', 'malevolent'];

// Helper to get wallpaper URL for a given id and username
const getWallpaperUrl = (id, username) =>
  `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${username}`;

/**
 * ForumPost component
 * 
 * Displays a post in a forum thread with author info, content, and actions
 */
const ForumPost = ({ post, currentUser, onReply, threadAuthorId, threadId, onThreadDeleted, onPostDeleted, onPostEdited }) => {
  const navigate = useNavigate();
  // Initialize thanks status properly with thanks array length and check if current user has thanked
  const [thanksStatus, setThanksStatus] = useState(() => {
    const thanksArray = Array.isArray(post.thanks) ? post.thanks : [];
    const userId = currentUser && (currentUser._id || currentUser.id);
    const userHasThanked = userId && thanksArray.includes(String(userId));
    // Debug output
    console.log('DEBUG thanksArray:', thanksArray, 'currentUserId:', userId, 'userHasThanked:', userHasThanked);
    return {
      thanked: userHasThanked,
      count: thanksArray.length
    };
  });

  // Determine wallpaperId and username for background
  const author = post.author || {};
  let wallpaperId = author.wallpaperId;
  if (!ALLOWED_WALLPAPERS.includes(wallpaperId)) {
    wallpaperId = 'herobrine_hill';
  }
  const playerName = author.mcUsername || author.username || 'Steve';
  const wallpaperUrl = getWallpaperUrl(wallpaperId, playerName);
  const wallpaperKey = `${wallpaperId}:${playerName}`;
  const [wallpaperLoaded, setWallpaperLoaded] = useState(() => wallpaperCache.has(wallpaperKey));
  const [wallpaperError, setWallpaperError] = useState(false);
  const [wallpaperRetry, setWallpaperRetry] = useState(0);

  // On successful load, cache the wallpaper
  const handleWallpaperLoad = () => {
    wallpaperCache.set(wallpaperKey, wallpaperUrl);
    setWallpaperLoaded(true);
  };

  // Retry handler
  const handleWallpaperError = () => {
    if (wallpaperRetry < 2) {
      setTimeout(() => setWallpaperRetry(r => r + 1), 800); // Retry after 800ms
    } else {
      setWallpaperError(true);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now'; // Default to "Just now" instead of "Unknown"
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently'; // Fallback if date is invalid
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return diffMinutes <= 0 ? 'Just now' : `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently'; // Fallback if there's any error
    }
  };

  // Format join date
  const formatJoinDate = (dateString) => {
    // If no date, use registration timestamp or current date
    const fallbackDate = post.author?.createdAt || new Date().toISOString();
    const dateToUse = dateString || fallbackDate;
    
    try {
      const date = new Date(dateToUse);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Member'; // Fallback if date is invalid
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short'
      });
    } catch (e) {
      console.error('Error formatting join date:', e);
      return 'Member'; // Fallback if there's any error
    }
  };

  // Get reputation color based on count
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
  
  // Add state for unthank confirmation modal
  const [showUnthankModal, setShowUnthankModal] = useState(false);
  const [pendingUnthank, setPendingUnthank] = useState(false);

  // Handle thanks toggle with confirmation for unthank
  const handleThanksToggle = async () => {
    if (thanksStatus.thanked) {
      // Show confirmation modal before unthanking
      setShowUnthankModal(true);
      return;
    }
    // Thank as normal
    try {
      const result = await ForumAPI.toggleThanks(post.id);
      setThanksStatus({
        thanked: result.thanked,
        count: result.thanksCount
      });
      toast.success(result.thanked ? 'Post thanked!' : 'Thanks removed');
    } catch (error) {
      console.error('Error toggling thanks:', error);
      toast.error('Error updating thanks status');
    }
  };

  // Confirm unthank action
  const confirmUnthank = async () => {
    setPendingUnthank(true);
    try {
      const result = await ForumAPI.toggleThanks(post.id);
      setThanksStatus({
        thanked: result.thanked,
        count: result.thanksCount
      });
      toast.success('Thanks removed');
    } catch (error) {
      console.error('Error removing thanks:', error);
      toast.error('Error updating thanks status');
    }
    setPendingUnthank(false);
    setShowUnthankModal(false);
  };

  // Handle quote post
  const handleQuote = () => {
    if (onReply) {
      onReply({
        type: 'quote',
        author: post.author.username,
        content: post.content
      });
    }
  };

  // Helper: is OP
  const isOP = post.author && threadAuthorId && (post.author.id === threadAuthorId || post.author._id === threadAuthorId);
  // Helper: can delete post
  const canDeletePost = currentUser && post.author && (currentUser.id === post.author.id || currentUser._id === post.author.id || ['admin','moderator','owner'].includes(currentUser.webRank));
  // Helper: can delete thread (only on original post)
  const canDeleteThread = post.isOriginalPost && currentUser && threadAuthorId && (currentUser.id === threadAuthorId || currentUser._id === threadAuthorId || ['admin','moderator','owner'].includes(currentUser.webRank));

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'post' or 'thread'
  const [deleteDebug, setDeleteDebug] = useState(null);

  // Delete post handler
  const handleDeletePost = () => {
    setDeleteType('post');
    setShowDeleteModal(true);
  };
  // Delete thread handler
  const handleDeleteThread = () => {
    setDeleteType('thread');
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setDeleteDebug({
      status: 'pending',
      type: deleteType,
      id: deleteType === 'post' ? post.id : threadId,
      endpoint: deleteType === 'post'
        ? `/api/forum/post/${post.id}`
        : `/api/forum/thread/${threadId}`
    });
    if (deleteType === 'post') {
      try {
        await ForumAPI.deletePost(post.id);
        setDeleteDebug(prev => ({ ...prev, status: 'success' }));
        if (onPostDeleted) onPostDeleted(post.id);
      } catch (err) {
        setDeleteDebug(prev => ({ ...prev, status: 'error', error: err?.message || 'Unknown error' }));
        toast.error('Failed to delete post');
      }
    } else if (deleteType === 'thread') {
      try {
        await ForumAPI.deleteThread(threadId);
        setDeleteDebug(prev => ({ ...prev, status: 'success' }));
        if (onThreadDeleted) onThreadDeleted();
      } catch (err) {
        setDeleteDebug(prev => ({ ...prev, status: 'error', error: err?.message || 'Unknown error' }));
        toast.error('Failed to delete thread');
      }
    }
    setTimeout(() => setDeleteDebug(null), 4000);
  };

  // Add edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Helper: can edit post (same as canDeletePost)
  const canEditPost = canDeletePost;

  const handleEditPost = () => {
    setIsEditing(true);
    setEditContent(post.content);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await ForumAPI.updatePost(post.id, editContent);
      setIsEditing(false);
      setEditLoading(false);
      if (res && res.post) {
        if (onPostEdited) onPostEdited(res.post);
      }
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update post');
      setEditLoading(false);
    }
  };

  return (
    <div className="forum-post-container relative">
      <div className="flex flex-col md:flex-row">
        {/* Author info sidebar - LeakForums style */}
        <div className="bg-gray-800 p-4 md:w-56 flex flex-col border-b md:border-b-0 md:border-r border-gray-600">
          {/* Username and avatar section */}
          <div
            className="relative mb-6 cursor-pointer w-full h-44 flex items-center justify-center"
            onClick={() => {
              const username = typeof post.author === 'object' ? post.author.username : post.author;
              if (username && username !== 'Unknown') {
                navigate(`/profile/${username}`);
              }
            }}
          >
            {/* Wallpaper background only behind avatar */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl z-0"
              style={{ backgroundImage: `url(${wallpaperUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.85) blur(0.5px)' }}
            />
            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -10, 0, 10, 0],
                boxShadow: [
                  '0 4px 16px rgba(0,0,0,0.18)',
                  '0 12px 32px rgba(0,0,0,0.28)',
                  '0 4px 16px rgba(0,0,0,0.18)',
                  '0 -12px 32px rgba(0,0,0,0.22)',
                  '0 4px 16px rgba(0,0,0,0.18)'
                ]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ marginBottom: '-1.5rem' }}
            >
              <div className="rounded-xl bg-gray-900/70 shadow-2xl p-1"
                   style={{
                     boxShadow: '0 0 32px 6px rgba(84,170,255,0.18), 0 2px 8px rgba(0,0,0,0.18)'
                   }}>
                <MinecraftAvatar
                  username={typeof post.author === 'object' ? (post.author.mcUsername || post.author.username) : post.author}
                  size={88}
                  type="head"
                  animate={true}
                  className="rounded-xl"
                  style={{
                    border: '2px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 0 16px 2px rgba(84,170,255,0.12)'
                  }}
                />
              </div>
            </motion.div>
          </div>
          {/* --- Restore all original sidebar content below this line --- */}
          <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-gray-700">
            {/* Username and OP tag */}
            <div className="flex items-center justify-center gap-2">
              <div
                className="text-white text-lg font-semibold hover:text-green-400 hover:underline cursor-pointer mb-1"
                onClick={() => {
                  const username = typeof post.author === 'object' ? post.author.username : post.author;
                  if (username && username !== 'Unknown') {
                    navigate(`/profile/${username}`);
                  }
                }}
              >
                {typeof post.author === 'object' ? post.author.username : post.author}
              </div>
            </div>
            {/* Add this mapping near the top of the file (after imports): */}
            {post.author.webRank && (
              <div className="relative group mt-1 mb-2 flex flex-col items-center">
                <div
                  className={`font-minecraft text-sm ${getDashboardRankColor(post.author.webRank)} cursor-help`}
                  style={{letterSpacing: '0.5px', textShadow: '0 1px 0 #222, 0 0 2px #000'}}>
                  {post.author.webRank.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                {/* Tooltip with robust edge handling */}
                <div className="absolute left-0 top-full z-30 min-w-max max-w-xs px-3 py-2 rounded-lg bg-gray-900/95 text-white text-xs shadow-lg border border-minecraft-habbo-blue pointer-events-auto transition-all duration-300 opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-4 group-hover:pointer-events-auto"
                     style={{whiteSpace: 'pre-line'}}>
                  {getRankTooltip(post.author.webRank)}
                  {/* Arrow */}
                  <div className="absolute left-6 -top-2 w-3 h-3 bg-gray-900 border-l border-t border-minecraft-habbo-blue rotate-45 z-40"></div>
                </div>
              </div>
            )}
            <div className="text-xs text-gray-400">
              {post.author.forum_rank && (
                <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                  {post.author.forum_rank}
                </span>
              )}
              {/* Online status */}
              <div className="mt-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-green-400">Online</span>
              </div>
            </div>
          </div>
          {/* User stats section - grid layout */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
            {/* Join date */}
            <div className="text-gray-400">
              <span className="block text-gray-500">Joined:</span>
              <span>{formatJoinDate(post.author.createdAt || post.author.joinDate)}</span>
            </div>
            {/* Post count */}
            <div className="text-gray-400">
              <span className="block text-gray-500">Posts:</span>
              <span>{post.author.postCount || 0}</span>
            </div>
            {/* Thread count */}
            <div className="text-gray-400">
              <span className="block text-gray-500">Threads:</span>
              <span>{post.author.threadCount || 0}</span>
            </div>
            {/* Reputation */}
            <div className={getReputationColor(post.author.reputation)}>
              <span className="block text-gray-500">Reputation:</span>
              <span className="font-bold">{post.author.reputation || 0}</span>
            </div>
            {/* Vouches received */}
            <div className="text-gray-400">
              <span className="block text-gray-500">Vouches:</span>
              <span className="text-green-400 font-bold">{post.author.vouches || 0}</span>
            </div>
            {/* Last active */}
            <div className="text-gray-400">
              <span className="block text-gray-500">Last seen:</span>
              <span>{formatDate(post.author.lastActive || post.author.lastSeen || 'Just now')}</span>
            </div>
          </div>
          {/* Action buttons */}
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-700 pt-4">
            {/* User Reputation Component - use MinimalUserReputation as fallback */}
            <MinimalUserReputation user={post.author} />
            <button 
              onClick={() => {
                // Open donation modal - integrated with parent component
                try {
                  if (typeof window !== 'undefined') {
                    // Create a custom event that parent components can listen for
                    const event = new CustomEvent('showDonationModal', { 
                      detail: { recipient: post.author }
                    });
                    window.dispatchEvent(event);
                    // Fallback - alert in case the modal isn't implemented yet
                    console.log('Donation event dispatched. If nothing happens, the parent component may not be listening.');
                    // Optional: Show a toast message as fallback
                    if (typeof toast !== 'undefined') {
                      toast.info('Donation feature coming soon!');
                    }
                  }
                } catch (error) {
                  console.error('Error opening donation modal:', error);
                  alert('Donation feature coming soon!');
                }
              }}
              className="bg-green-900 hover:bg-green-800 text-green-100 text-xs rounded py-1 px-2 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Donate
            </button>
            <button className="bg-blue-900 hover:bg-blue-800 text-blue-100 text-xs rounded py-1 px-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Add Friend
            </button>
            <button className="bg-purple-900 hover:bg-purple-800 text-purple-100 text-xs rounded py-1 px-2 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Send Message
            </button>
          </div>
        </div>
        
        {/* Post content - LeakForums style */}
        <div className="p-4 flex-1 flex flex-col h-full">
          {/* Post header with post ID and date */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Posted {formatDate(post.createdAt || post.date)}
              {isOP && (
                <div className="relative group ml-2 flex items-center">
                  <span
                    className="px-1.5 py-0.5 rounded-full bg-orange-400/90 text-white font-minecraft text-[11px] font-bold cursor-pointer shadow-sm group-hover:opacity-80 transition-opacity duration-200"
                    style={{letterSpacing: '0.5px', textShadow: '0 1px 0 #222, 0 0 2px #000'}}
                  >
                    OP
                  </span>
                  {/* Custom tooltip to the right */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 min-w-max max-w-xs px-2 py-1 rounded bg-gray-900/95 text-white text-xs shadow-lg border border-minecraft-habbo-blue opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200"
                       style={{whiteSpace: 'nowrap'}}>
                    Original Poster
                    {/* Left arrow */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-t border-l border-minecraft-habbo-blue rotate-45 z-40"></div>
                  </div>
                </div>
              )}
              {post.edited && (
                <span className="ml-2 text-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edited {formatDate(post.edited.date || post.editDate)}
                </span>
              )}
            </div>
            
            {/* Post number/link with copyable link */}
            <div className="flex items-center">
              <div 
                className="text-xs text-gray-400 bg-gray-700 rounded px-2 py-1 hover:bg-gray-600 cursor-pointer"
                onClick={() => {
                  // Copy post link to clipboard
                  const postId = typeof post.id === 'string' ? post.id : (post._id ? post._id.toString() : '1');
                  const url = `${window.location.origin}/community/thread/${postId}`;
                  navigator.clipboard.writeText(url);
                  alert('Post link copied to clipboard!');
                }}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  #{typeof post.id === 'string' ? post.id.split('-').pop() : (post._id ? post._id.toString().substring(16) : '1')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Post content */}
          {isEditing ? (
            <div className="mb-4">
              <textarea
                className="w-full bg-gray-800 text-white rounded-md p-2 border border-gray-600 min-h-24"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                disabled={editLoading}
              />
              {editError && <div className="text-red-400 text-xs mt-1">{editError}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveEdit} disabled={editLoading} className="px-3 py-1 rounded bg-green-700 text-white hover:bg-green-600 text-xs font-bold">
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancelEdit} disabled={editLoading} className="px-3 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white whitespace-pre-line flex-grow bg-gray-800/50 rounded-md p-4 mb-4 border border-gray-700">
              {post.content}
            </div>
          )}
          
          {/* Post signature - if user has one */}
          {post.author.signature && (
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-auto italic">
              {post.author.signature}
            </div>
          )}
          
          {/* Post actions */}
          <div className="mt-auto pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                {/* Thanks button */}
                {currentUser && post.author && (
                  <button 
                    onClick={handleThanksToggle}
                    className={
                      `flex items-center px-2 py-1 rounded text-xs ` +
                      (thanksStatus.thanked 
                        ? 'bg-green-900 text-green-100' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600')
                    }
                    disabled={pendingUnthank}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{thanksStatus.thanked ? 'Thanked' : 'Thanks'}</span>
                    <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded-full text-xs">
                      {thanksStatus.count}
                    </span>
                  </button>
                )}
                
                {/* Vouch button - if relevant context (user has something for sale or offering service) */}
                <button 
                  className="bg-teal-900 hover:bg-teal-800 text-teal-100 text-xs rounded px-2 py-1 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Vouch</span>
                </button>
                
                {/* Quote button */}
                <button 
                  onClick={handleQuote}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded px-2 py-1 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Quote</span>
                </button>
                
                {/* Report button */}
                <button 
                  className="bg-red-900 hover:bg-red-800 text-red-100 text-xs rounded px-2 py-1 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                  <span>Report</span>
                </button>
              </div>
              
              <div className="flex gap-2 ml-auto">
                {canEditPost && !isEditing && (
                  <button onClick={handleEditPost} className="text-xs px-2 py-1 rounded flex items-center font-semibold bg-blue-900 text-blue-200 hover:bg-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0l-9.5 9.5A2 2 0 004 14v2a1 1 0 001 1h2a2 2 0 001.414-.586l9.5-9.5a2 2 0 000-2.828zM5 16v-2h2l9.293-9.293a1 1 0 00-1.414-1.414L5 12.586V16z" /></svg>
                    Edit
                  </button>
                )}
                {canDeletePost && (
                  <button onClick={handleDeletePost} className="text-xs px-2 py-1 rounded bg-red-900 text-red-200 hover:bg-red-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 4a1 1 0 100 2h2a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                    Delete Post
                  </button>
                )}
                {canDeleteThread && (
                  <button onClick={handleDeleteThread} className="text-xs px-2 py-1 rounded bg-orange-900 text-orange-200 hover:bg-orange-800 flex items-center ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm2 4a1 1 0 100 2h2a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                    Delete Thread
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full border border-red-700">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-gray-300 mb-4">
              {deleteType === 'post' ? 'Are you sure you want to delete this post?' : 'Are you sure you want to delete this thread? This cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800 font-bold shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteDebug && (
        <div className={`mb-2 p-2 rounded text-xs font-mono ${deleteDebug.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : deleteDebug.status === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          <b>Delete Debug:</b> {deleteDebug.type} | id: {deleteDebug.id} | endpoint: {deleteDebug.endpoint} | status: {deleteDebug.status}
          {deleteDebug.status === 'error' && <span> | error: {deleteDebug.error}</span>}
        </div>
      )}
      {/* Unthank Confirmation Modal */}
      {showUnthankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full border border-green-700">
            <h3 className="text-lg font-bold text-white mb-2">Remove Thanks?</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to remove your thanks from this post?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUnthankModal(false)}
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                disabled={pendingUnthank}
              >
                Cancel
              </button>
              <button
                onClick={confirmUnthank}
                className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800 font-bold shadow"
                disabled={pendingUnthank}
              >
                Remove Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPost;