import React, { useState } from 'react';
import MinecraftAvatar from '../MinecraftAvatar';
import { useNavigate } from 'react-router-dom';
import ForumAPI from '../../services/ForumAPI';
import MinimalUserReputation from '../MinimalUserReputation.jsx';

// Try to import real toast, or use our mock version
let toast;
try {
  toast = require('react-toastify').toast;
} catch (error) {
  console.warn('react-toastify not found, using mock version');
  toast = require('../../services/mockToast').toast;
}

// We're using MinimalUserReputation component directly now

/**
 * ForumPost component
 * 
 * Displays a post in a forum thread with author info, content, and actions
 */
const ForumPost = ({ post, currentUser, onReply }) => {
  const navigate = useNavigate();
  // Initialize like status properly with likes array length and check if current user has liked
  const [likeStatus, setLikeStatus] = useState(() => {
    // Ensure likes exists as an array
    const likesArray = Array.isArray(post.likes) ? post.likes : [];
    
    // Check if current user has liked this post
    const userHasLiked = currentUser && likesArray.some(like => 
      like._id ? like._id.toString() === currentUser._id : like.toString() === currentUser._id
    );
    
    return {
      liked: userHasLiked,
      count: likesArray.length
    };
  });

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

  // Get badge class based on user rank
  const getRankBadgeClass = (rank) => {
    if (!rank) return 'bg-gray-700 text-gray-300';
    
    const rankLower = rank.toLowerCase();
    
    if (rankLower.includes('admin')) {
      return 'bg-red-900 text-red-200';
    } else if (rankLower.includes('moderator') || rankLower.includes('mod')) {
      return 'bg-blue-900 text-blue-200';
    } else if (rankLower.includes('veteran') || rankLower.includes('vip')) {
      return 'bg-purple-900 text-purple-200';
    } else if (rankLower.includes('builder') || rankLower.includes('contributor')) {
      return 'bg-green-900 text-green-200';
    } else if (rankLower.includes('donator') || rankLower.includes('premium')) {
      return 'bg-amber-900 text-amber-200';
    } else {
      return 'bg-gray-700 text-gray-300';
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
  
  // Handle like toggle with API call
  const handleLikeToggle = async () => {
    try {
      // Call the API to toggle like
      const result = await ForumAPI.toggleLike(post.id);
      
      // Update local state based on API response
      setLikeStatus({
        liked: result.liked,
        count: result.likeCount
      });
      
      // Show notification
      toast.success(result.liked ? 'Post liked!' : 'Like removed');
      
      // If we have allPostLikes data from the API, we could update other post likes in the thread
      // This would require lifting state to the parent component
      if (result.allPostLikes && typeof window !== 'undefined') {
        // Dispatch an event that parent components can listen for to update all post likes
        const event = new CustomEvent('forumPostLikesUpdated', { 
          detail: { postLikes: result.allPostLikes } 
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Error updating like status');
    }
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

  return (
    <div 
      className={`
        bg-gray-700 rounded-md overflow-hidden border 
        ${post.isOriginalPost ? 'border-green-700' : 'border-gray-600'}
      `}
    >
      <div className="flex flex-col md:flex-row">
        {/* Author info sidebar - LeakForums style */}
        <div className="bg-gray-800 p-4 md:w-56 flex flex-col border-b md:border-b-0 md:border-r border-gray-600">
          {/* Username and avatar section */}
          <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-gray-700">
            <div 
              className="mb-3 cursor-pointer w-16 h-16"
              onClick={() => {
                const username = typeof post.author === 'object' ? post.author.username : post.author;
                if (username && username !== 'Unknown') {
                  navigate(`/profile/${username}`);
                }
              }}
            >
              <MinecraftAvatar 
                username={typeof post.author === 'object' ? post.author.username : post.author}
                uuid={typeof post.author === 'object' ? post.author.mcUUID : null}
                size={64}
                type="head"
                animate={true}
              />
            </div>
            
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
            
            <div className="text-xs text-gray-400">
              {post.author.forum_rank && (
                <span className={`px-2 py-0.5 rounded ${getRankBadgeClass(post.author.forum_rank)}`}>
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
            <div className="text-xs text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Posted {formatDate(post.createdAt || post.date)}
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
          <div className="text-white whitespace-pre-line flex-grow bg-gray-800/50 rounded-md p-4 mb-4 border border-gray-700">
            {post.content}
          </div>
          
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
                {/* Like/Thanks button */}
                <button 
                  onClick={handleLikeToggle}
                  className={`
                    flex items-center px-2 py-1 rounded text-xs
                    ${likeStatus.liked 
                      ? 'bg-green-900 text-green-100' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{likeStatus.liked ? 'Thanked' : 'Thanks'}</span>
                  <span className="ml-1 bg-gray-800 px-1.5 py-0.5 rounded-full text-xs">
                    {likeStatus.count}
                  </span>
                </button>
                
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
              
              <div className="flex gap-2">
                {/* Edit button - only for the post author */}
                {currentUser && post.author.username === currentUser.username && (
                  <button className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-200 hover:bg-blue-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                )}
                
                {/* Moderator actions - only for admins/mods */}
                {currentUser && (currentUser.isAdmin || currentUser.isModerator) && (
                  <div className="relative group">
                    <button className="text-xs px-2 py-1 rounded bg-red-900 text-red-200 hover:bg-red-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Mod Actions
                    </button>
                    
                    {/* Dropdown menu for mod actions */}
                    <div className="absolute right-0 mt-1 w-36 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 invisible group-hover:visible">
                      <div className="py-1 text-xs">
                        <button className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Delete Post</button>
                        <button className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Edit Post</button>
                        <button className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Warn User</button>
                        <button className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700">Ban User</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;