/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ForumSystem.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ForumCategory from './ForumCategory';
import ForumThread from './ForumThread';
import ForumTopicList from './ForumTopicList';
import ForumPost from './ForumPost';
import CreateThread from './CreateThread';
import api from '../../services/api';
import axios from 'axios';

// Try to import DonationModal or use a fallback
let DonationModal;
try {
  DonationModal = require('../DonationModal').default;
} catch (error) {
  console.warn('DonationModal not found, using fallback');
  DonationModal = ({ isOpen, onClose }) => isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg text-white">Donation Feature</h3>
        <p className="text-gray-300 my-2">The donation feature is coming soon!</p>
        <button 
          onClick={onClose} 
          className="bg-green-700 text-white px-4 py-2 rounded mt-2"
        >
          Close
        </button>
      </div>
    </div>
  ) : null;
}

// Try to import ToastContainer or use a fallback
let ToastContainer;
try {
  ToastContainer = require('react-toastify').ToastContainer;
  require('react-toastify/dist/ReactToastify.css');
} catch (error) {
  console.warn('react-toastify not found, using fallback');
  ToastContainer = () => null;
}

/**
 * Minecraft-styled Forum System
 * 
 * This component provides a complete forum system with Minecraft-inspired styling.
 * Features:
 * - Categories and subcategories
 * - Thread listing with sorting and filtering
 * - Thread creation with markdown support
 * - Post replies with quotes and formatting
 * - Minecraft-themed UI elements
 */
const ForumSystem = ({ 
  initialView = 'categories',
  selectedCategory = null,
  selectedThread = null,
  currentUser = null
}) => {
  // Get user from context if not provided
  const { user } = useAuth();
  const loggedInUser = currentUser || user;
  console.log("Forum system user:", loggedInUser);
  const navigate = useNavigate();
  const [view, setView] = useState(initialView); // 'categories', 'topics', 'thread', 'create'
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeThread, setActiveThread] = useState(selectedThread);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'popular'
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationRecipient, setDonationRecipient] = useState(null);
  
  // Initialize the component
  useEffect(() => {
    // Always fetch categories on mount
    console.log('ForumSystem initialized with view:', view);
    fetchCategories();
    
    // Add event listener for donation modal
    const handleDonationModalEvent = (event) => {
      setDonationRecipient(event.detail.recipient);
      setShowDonationModal(true);
    };
    
    window.addEventListener('showDonationModal', handleDonationModalEvent);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('showDonationModal', handleDonationModalEvent);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Fetch forum data based on current view
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Fetch appropriate data based on current view
    switch(view) {
      case 'categories':
        fetchCategories();
        break;
      case 'topics':
        if (activeCategory) {
          fetchTopics(activeCategory);
        } else {
          setError('No category selected');
          setIsLoading(false);
        }
        break;
      case 'threads':
        // This view is for displaying threads within a category
        if (activeCategory) {
          // Don't re-fetch if we already have data, just make sure loading is false
          setIsLoading(false);
        } else {
          setError('No category selected');
          setIsLoading(false);
        }
        break;
      case 'thread':
        if (activeThread) {
          fetchThreadPosts(activeThread);
        } else {
          setError('No thread selected');
          setIsLoading(false);
        }
        break;
      case 'create':
        // No data fetching needed for thread creation
        setIsLoading(false);
        break;
      default:
        // For any other view, just set loading to false
        console.log('Unrecognized view:', view);
        setIsLoading(false);
    }
  }, [view, activeCategory, activeThread, pageNumber, sortOrder]);
  
  // Fetch forum categories from the database via API
  const fetchCategories = () => {
    setIsLoading(true);
    console.log('Fetching forum categories from API...');
    
    // Fetch from API with proper error handling
    api.get('/api/forum/categories')
      .then(response => {
        console.log('Categories API response:', response.data);
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Map the response data to the expected format
          const formattedCategories = response.data.map(category => ({
            id: category._id,
            name: category.name,
            description: category.description,
            threadCount: category.threadCount || 0,
            postCount: category.postCount || 0,
            order: category.order || 0,
            lastUpdate: category.createdAt,
            lastPost: category.lastThread ? {
              title: 'Latest thread',
              author: 'Member',
              date: category.updatedAt || category.createdAt
            } : null
          }));
          console.log('API returned categories:', formattedCategories.length);
          // Only update if we actually got categories
          if (formattedCategories.length > 0) {
            setCategories(formattedCategories);
            setIsLoading(false);
            return; // Exit early if we got categories
          }
        }
        
        // If we reach here, we didn't get any categories, try the direct endpoint
        console.log('No categories found, trying direct endpoint...');
        fetchCategoriesDirect();
      })
      .catch(error => {
        console.error('Error fetching forum categories from API:', error);
        // Try the direct endpoint as a fallback
        fetchCategoriesDirect();
      });
  };
  
  // Direct endpoint fallback for fetching categories
  const fetchCategoriesDirect = () => {
    console.log('Trying direct categories endpoint...');
    
    api.get('/api/direct-forum-categories')
      .then(response => {
        console.log('Direct categories API response:', response.data);
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Map the response data to the expected format
          const formattedCategories = response.data.map(category => ({
            id: category._id,
            name: category.name,
            description: category.description,
            threadCount: category.threadCount || 0,
            postCount: category.postCount || 0,
            order: category.order || 0,
            lastUpdate: category.createdAt,
            lastPost: category.lastThread ? {
              title: 'Latest thread',
              author: 'Member',
              date: category.updatedAt || category.createdAt
            } : null
          }));
          console.log('Direct API returned categories:', formattedCategories.length);
          setCategories(formattedCategories);
        } else {
          // If still no categories, use hardcoded defaults
          setCategories([
            {
              id: 'announcement',
              name: 'Announcements',
              description: 'Important server announcements',
              threadCount: 3,
              postCount: 15,
              order: 1
            },
            {
              id: 'general',
              name: 'General Discussion',
              description: 'Talk about anything Minecraft related',
              threadCount: 12,
              postCount: 87,
              order: 2
            },
            {
              id: 'help',
              name: 'Help & Support',
              description: 'Ask for help with any issues',
              threadCount: 8,
              postCount: 42,
              order: 3
            }
          ]);
          console.log('Using hardcoded default categories');
        }
      })
      .catch(error => {
        console.error('Error fetching from direct categories endpoint:', error);
        // Use hardcoded defaults as last resort
        setCategories([
          {
            id: 'announcement',
            name: 'Announcements',
            description: 'Important server announcements',
            threadCount: 3,
            postCount: 15,
            order: 1
          },
          {
            id: 'general',
            name: 'General Discussion',
            description: 'Talk about anything Minecraft related',
            threadCount: 12,
            postCount: 87,
            order: 2
          },
          {
            id: 'help',
            name: 'Help & Support',
            description: 'Ask for help with any issues',
            threadCount: 8,
            postCount: 42,
            order: 3
          }
        ]);
        console.log('Using hardcoded default categories');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Fetch threads within a category directly from database
  const fetchTopics = (categoryId) => {
    setIsLoading(true);
    console.log(`Fetching threads for category ${categoryId}...`);
    
    // Get threads directly from the database
    api.get(`/api/forum/categories/${categoryId}/threads`)
      .then(response => {
        console.log('Category threads response:', response.data);
        if (response.data && response.data.threads) {
          // Map to the expected format in our frontend
          const formattedThreads = response.data.threads.map(thread => ({
            id: thread._id,
            title: thread.title,
            author: thread.author || {
              username: 'Unknown',
              avatar: null,
              forum_rank: 'member'
            },
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            replyCount: thread.replyCount || 0,
            views: thread.views || 0,
            pinned: thread.pinned || false,
            locked: thread.locked || false
          }));
          
          setThreads(formattedThreads);
          setTotalPages(response.data.totalPages || 1);
          // Don't set view here as it may conflict with the parent component's state
        } else {
          console.log('No threads found in this category');
          setThreads([]);
          setTotalPages(1);
          // Don't set view here as it may conflict with the parent component's state
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching category threads:', error);
        setError('Error loading threads. Please try again later.');
        setIsLoading(false);
      });
  };
  
  // Fetch threads within a category (renamed function) - using real API
  const fetchThreads = (categoryId) => {
    setIsLoading(true);
    console.log(`Fetching threads for category ID: ${categoryId}`);
    
    // Fetch from the database with sorting and pagination
    api.get(`/api/forum/categories/${categoryId}/threads`, {
      params: {
        page: pageNumber,
        limit: 10,
        sort: sortOrder === 'newest' ? '-updatedAt' : (sortOrder === 'oldest' ? 'createdAt' : '-views')
      }
    })
      .then(response => {
        console.log('Threads response:', response.data);
        if (response.data && response.data.threads && response.data.threads.length > 0) {
          // Map to the expected format in our frontend
          const formattedThreads = response.data.threads.map(thread => ({
            id: thread._id,
            title: thread.title,
            author: thread.author || {
              username: 'Unknown',
              avatar: null,
              forum_rank: 'member'
            },
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            replyCount: thread.replyCount || 0,
            views: thread.views || 0,
            pinned: thread.pinned || false,
            locked: thread.locked || false
          }));
          
          setThreads(formattedThreads);
          setTotalPages(response.data.totalPages || 1);
        } else {
          // Set empty array if no threads
          console.log('No threads found for category:', categoryId);
          setThreads([]);
          setTotalPages(1);
        }
        // Don't change the view - we already set it in handleCategorySelect
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching threads:', error);
        // Even on error, set empty threads array so the UI can show "no threads" message
        setThreads([]);
        setTotalPages(1);
        // Don't change the view - leave it as it was set in handleCategorySelect
        setIsLoading(false);
        // Don't set error, let the UI show the empty state instead
        // setError('Error loading threads. Please try again.');
      });
  };
  
  // Alias for compatibility with existing code
  const fetchTopicThreads = fetchThreads;
  
  // Fetch posts within a thread directly from database
  const fetchThreadPosts = (threadId) => {
    setIsLoading(true);
    console.log(`Fetching posts for thread ID: ${threadId}`);
    
    // Get thread and posts from database via API
    api.get(`/api/forum/threads/${threadId}`, {
      params: {
        page: pageNumber,
        limit: 20
      }
    })
      .then(response => {
        console.log('Thread posts response:', response.data);
        if (response.data) {
          // Store the active thread details
          if (response.data.thread) {
            // Update our thread listing with the fetched thread
            const formattedThread = {
              id: response.data.thread._id,
              title: response.data.thread.title,
              author: response.data.thread.author || {
                username: 'Unknown',
                avatar: null,
                forum_rank: 'member'
              },
              category: response.data.thread.category,
              createdAt: response.data.thread.createdAt,
              updatedAt: response.data.thread.updatedAt,
              replyCount: response.data.thread.replyCount || 0,
              views: response.data.thread.views || 0,
              pinned: response.data.thread.pinned || false,
              locked: response.data.thread.locked || false
            };
            
            // Replace the threads array with just this thread
            setThreads([formattedThread]);
          }
          
          // Format the posts
          if (response.data.posts && Array.isArray(response.data.posts)) {
            const formattedPosts = response.data.posts.map(post => ({
              id: post._id,
              content: post.content,
              author: post.author || {
                username: 'Unknown',
                avatar: null,
                forum_rank: 'member',
                createdAt: post.createdAt
              },
              createdAt: post.createdAt,
              edited: post.edited || null
            }));
            
            setPosts(formattedPosts);
            setTotalPages(response.data.totalPages || 1);
          } else {
            setPosts([]);
            setTotalPages(1);
          }
        } else {
          console.error('Invalid response format for thread posts');
          setPosts([]);
          setTotalPages(1);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching thread posts:', error);
        setError('Error loading thread posts. Please try again later.');
        setIsLoading(false);
      });
  };
  
  // Navigate to category view - modified to go directly to threads
  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    console.log(`Selected category ID: ${categoryId}`);
    
    // Update category information in the breadcrumb
    const selectedCategory = categories.find(c => c.id === categoryId);
    console.log('Selected category:', selectedCategory ? selectedCategory.name : 'Unknown');
    
    // First set the view to threads IMMEDIATELY - this is critical
    setView('threads');
    
    // Start loading state before fetching threads
    setIsLoading(true);
    
    // Now fetch threads data - view is already set, no need to set it again
    fetchThreads(categoryId);
    
    // Skip router navigation for now
    // navigate(`/community/category/${categoryId}`);
  };
  
  // Navigate to topic threads view
  const handleTopicSelect = (topicId) => {
    setActiveTopic(topicId);
    setView('threads');
    fetchTopicThreads(topicId);
    // navigate(`/forum/topic/${topicId}`);
  };
  
  // Navigate to thread view
  const handleThreadSelect = (threadId) => {
    setActiveThread(threadId);
    setView('thread');
    // navigate(`/forum/thread/${threadId}`);
  };
  
  // Navigate back based on current view
  const handleBack = () => {
    switch(view) {
      case 'topics':
        setView('categories');
        setActiveCategory(null);
        break;
      case 'threads':
        // Modified to go back to categories instead of topics since we skip topics
        setView('categories');
        setActiveTopic(null);
        break;
      case 'thread':
        setView('threads');
        setActiveThread(null);
        break;
      case 'create':
        // Go back to appropriate view
        setView('threads');
        break;
      default:
        setView('categories');
    }
  };
  
  // Handle sort order change
  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
    setPageNumber(1); // Reset to first page when changing sort order
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
  };
  
  // Handle thread creation
  const handleCreateThread = () => {
    setView('create');
  };
  
  // Submit new thread to the database
  const handleSubmitThread = (threadData) => {
    setIsLoading(true);
    console.log('Creating new thread:', threadData);
    
    // Prepare data for API
    const payload = {
      title: threadData.title,
      content: threadData.content,
      categoryId: activeCategory, // This is the actual category ID from selection
      pinned: threadData.isPinned || false,
      locked: threadData.isLocked || false
    };
    
    console.log('Thread payload:', payload);
    
    // Create thread in database using API
    api.post('/api/forum/threads', payload)
      .then(response => {
        console.log('Thread created response:', response.data);
        if (response.data && response.data.thread) {
          // Navigate to the newly created thread
          setActiveThread(response.data.thread._id);
          setView('thread');
          fetchThreadPosts(response.data.thread._id);
          alert('Thread created successfully!');
        } else {
          console.error('Unexpected response format:', response.data);
          alert('Error creating thread: Unexpected server response');
        }
      })
      .catch(error => {
        console.error('Error creating thread:', error);
        
        // If we get an authorization error, we need to log in
        if (error.response?.status === 401) {
          alert('You need to be logged in to create a thread. Please log in and try again.');
        } else {
          alert('Error creating thread: ' + (error.response?.data?.message || 'Please try again later'));
        }
        
        setIsLoading(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Submit new reply to a thread
  const handleSubmitReply = (replyData) => {
    setIsLoading(true);
    console.log('Submitting reply to thread:', activeThread);
    
    api.post(`/api/forum/threads/${activeThread}/posts`, {
      content: replyData.content
    })
      .then(response => {
        console.log('Reply posted response:', response.data);
        // Refresh thread posts to show the new reply
        fetchThreadPosts(activeThread);
        alert('Reply posted successfully!');
      })
      .catch(error => {
        console.error('Error posting reply:', error);
        alert('Error posting reply: ' + (error.response?.data?.message || 'Please try again later'));
        setIsLoading(false);
      });
  };
  
  // Get reply content from textarea and post to database
  const handlePostReply = () => {
    const textarea = document.querySelector('.forum-reply-textarea');
    if (textarea && textarea.value.trim()) {
      // Show loading indicator
      setIsLoading(true);
      
      // Submit the reply to the database through API
      api.post(`/api/forum/threads/${activeThread}/posts`, {
        content: textarea.value.trim()
      })
        .then(response => {
          console.log('Reply posted successfully:', response.data);
          // Refresh thread posts to show the new reply
          fetchThreadPosts(activeThread);
          // Clear textarea after posting
          textarea.value = '';
        })
        .catch(error => {
          console.error('Error posting reply:', error);
          alert('Error posting reply: ' + (error.response?.data?.message || 'Please try again later'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      alert('Please enter a reply before posting');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-gray-700 rounded-md w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded-md w-full"></div>
          <div className="h-32 bg-gray-700 rounded-md w-full"></div>
          <div className="h-32 bg-gray-700 rounded-md w-full"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center">
        <div className="bg-red-900 bg-opacity-50 rounded-md p-4 text-white max-w-4xl w-full">
          <h3 className="text-xl font-bold mb-2">Error</h3>
          <p>{error}</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate view
  return (
    <div className="forum-system w-full max-w-6xl mx-auto">
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Donation Modal */}
      {showDonationModal && donationRecipient && (
        <DonationModal
          isOpen={showDonationModal}
          onClose={() => setShowDonationModal(false)}
          recipient={donationRecipient}
          onSuccess={() => {
            setShowDonationModal(false);
            // You could reload user data here if needed
          }}
        />
      )}
      {/* Navigation breadcrumbs */}
      <div className="bg-gray-800 p-4 rounded-t-md mb-1 flex items-center">
        <div className="flex-1 flex items-center space-x-2">
          <button 
            onClick={() => setView('categories')}
            className={`text-sm px-3 py-1 rounded-md ${view === 'categories' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            Forum Home
          </button>
          
          {activeCategory && (
            <>
              <span className="text-gray-500">/</span>
              <button 
                onClick={() => {
                  // Don't go to topics view, go directly to threads view
                  setView('threads');
                  setActiveTopic(null);
                  setActiveThread(null);
                }}
                className={`text-sm px-3 py-1 rounded-md ${view === 'threads' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {categories.find(c => c.id === activeCategory)?.name || activeCategory}
              </button>
            </>
          )}
          
          {activeTopic && (
            <>
              <span className="text-gray-500">/</span>
              <button 
                onClick={() => {
                  setView('threads');
                  setActiveThread(null);
                }}
                className={`text-sm px-3 py-1 rounded-md ${view === 'threads' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {topics.find(t => t.id === activeTopic)?.name || activeTopic}
              </button>
            </>
          )}
          
          {activeThread && view === 'thread' && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-sm px-3 py-1 bg-green-700 text-white rounded-md truncate max-w-xs">
                {threads.find(t => t.id === activeThread)?.title || 'Thread'}
              </span>
            </>
          )}
          
          {view === 'create' && (
            <>
              <span className="text-gray-500">/</span>
              <span className="text-sm px-3 py-1 bg-green-700 text-white rounded-md">
                Create New Thread
              </span>
            </>
          )}
        </div>
        
        {view !== 'categories' && view !== 'create' && (
          <button 
            onClick={handleBack}
            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md ml-2"
          >
            Back
          </button>
        )}
      </div>
      
      {/* Main content area */}
      <div className="bg-gray-800 p-6 rounded-b-md mb-4">
        {/* Categories view */}
        {view === 'categories' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Forum Categories</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map(category => (
                <ForumCategory 
                  key={category.id}
                  category={category}
                  onClick={() => handleCategorySelect(category.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Topics view */}
        {view === 'topics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {categories.find(c => c.id === activeCategory)?.name || 'Topics'}
              </h2>
            </div>
            
            <div className="space-y-3">
              {topics.map(topic => (
                <ForumTopicList 
                  key={topic.id}
                  topic={topic}
                  onClick={() => handleTopicSelect(topic.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Threads view */}
        {view === 'threads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
              <h2 className="text-2xl font-bold text-white">
                {categories.find(c => c.id === activeCategory)?.name || 'Threads'}
              </h2>
              
              <div className="flex items-center space-x-2">
                <div className="bg-gray-700 rounded-md p-1 flex text-sm">
                  <button 
                    onClick={() => handleSortChange('newest')}
                    className={`px-3 py-1 rounded-md ${sortOrder === 'newest' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                  >
                    Newest
                  </button>
                  <button 
                    onClick={() => handleSortChange('oldest')}
                    className={`px-3 py-1 rounded-md ${sortOrder === 'oldest' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                  >
                    Oldest
                  </button>
                  <button 
                    onClick={() => handleSortChange('popular')}
                    className={`px-3 py-1 rounded-md ${sortOrder === 'popular' ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                  >
                    Popular
                  </button>
                </div>
                
                <button 
                  onClick={handleCreateThread}
                  className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md"
                >
                  New Thread
                </button>
              </div>
            </div>
            
            {threads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No threads found in {categories.find(c => c.id === activeCategory)?.name || 'this category'}.</p>
                <p className="text-gray-500 mt-2 mb-4">Be the first to start a discussion!</p>
                <button 
                  onClick={handleCreateThread}
                  className="mt-4 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md"
                >
                  Create the First Thread
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {threads
                    .slice((pageNumber - 1) * 10, pageNumber * 10)
                    .map(thread => (
                      <ForumThread 
                        key={thread.id}
                        thread={thread}
                        onClick={() => handleThreadSelect(thread.id)}
                      />
                    ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="inline-flex items-center rounded-md bg-gray-700">
                      <button 
                        onClick={() => handlePageChange(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber === 1}
                        className={`px-3 py-2 rounded-l-md ${pageNumber === 1 ? 'text-gray-500' : 'text-gray-300 hover:bg-gray-600'}`}
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages).keys()].map(i => (
                        <button 
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`px-3 py-2 ${pageNumber === i + 1 ? 'bg-green-700 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button 
                        onClick={() => handlePageChange(Math.min(totalPages, pageNumber + 1))}
                        disabled={pageNumber === totalPages}
                        className={`px-3 py-2 rounded-r-md ${pageNumber === totalPages ? 'text-gray-500' : 'text-gray-300 hover:bg-gray-600'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Thread view */}
        {view === 'thread' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white break-words">
                {threads.find(t => t.id === activeThread)?.title || 'Thread'}
              </h2>
            </div>
            
            <div className="space-y-4">
              {posts.map((post, index) => (
                <ForumPost 
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onReply={() => {}} // Handle reply to specific post
                />
              ))}
            </div>
            
            {/* Reply form */}
            <div className="bg-gray-700 rounded-md p-4 mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Post a Reply</h3>
              
              <textarea 
                className="forum-reply-textarea w-full bg-gray-800 text-white rounded-md p-3 min-h-32 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
                placeholder="Write your reply here..."
              ></textarea>
              
              <div className="flex justify-end mt-3">
                <button 
                  onClick={handlePostReply}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md"
                >
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Create thread view */}
        {view === 'create' && (
          <CreateThread onSubmit={handleSubmitThread} onCancel={handleBack} />
        )}
      </div>
    </div>
  );
};

export default ForumSystem;