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
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ForumCategory from './ForumCategory';
import ForumThread from './ForumThread';
import ForumTopicList from './ForumTopicList';
import ForumPost from './ForumPost';
import CreateThread from './CreateThread';
import api from '../../services/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

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
  const [categoryTopics, setCategoryTopics] = useState([]);
  
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
        console.log('[FORUM DEBUG] Raw API response:', response.data);
        // Log the actual data property
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          const formattedCategories = response.data.data.map(category => ({
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
          console.log('[FORUM DEBUG] Formatted categories:', formattedCategories);
          setCategories(formattedCategories);
          setIsLoading(false);
        } else {
          // No categories found, show error (no mock data per RULES.md)
          console.log('[FORUM DEBUG] No categories found, error triggered.');
          setError('No forum categories found. Please contact an administrator.');
          setCategories([]);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('[FORUM DEBUG] Error fetching forum categories from API:', error);
        setError('Error loading forum categories. Please try again later.');
        setCategories([]);
        setIsLoading(false);
      });
  };
  
  // Fetch threads within a category directly from database
  const fetchTopics = (categoryId) => {
    setIsLoading(true);
    api.get(`/api/forum/categories/${categoryId}/threads`)
      .then(response => {
        if (response.data && response.data.threads) {
          const formattedThreads = response.data.threads.map(thread => ({
            id: thread.id || thread._id,
            slug: thread.slug,
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
          setThreads([]);
          setTotalPages(1);
        }
        setIsLoading(false);
      })
      .catch(error => {
        setError('Error loading threads. Please try again later.');
        setIsLoading(false);
      });
  };
  
  // Fetch threads within a category (renamed function) - using real API
  const fetchThreads = (categoryId) => {
    setIsLoading(true);
    api.get(`/api/forum/categories/${categoryId}/threads`, {
      params: {
        page: pageNumber,
        limit: 10,
        sort: sortOrder === 'newest' ? '-updatedAt' : (sortOrder === 'oldest' ? 'createdAt' : '-views')
      }
    })
      .then(response => {
        if (response.data && response.data.threads && response.data.threads.length > 0) {
          const formattedThreads = response.data.threads.map(thread => ({
            id: thread.id || thread._id,
            slug: thread.slug,
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
          setThreads([]);
          setTotalPages(1);
        }
        setIsLoading(false);
      })
      .catch(error => {
        setThreads([]);
        setTotalPages(1);
        setIsLoading(false);
      });
  };
  
  // Alias for compatibility with existing code
  const fetchTopicThreads = fetchThreads;
  
  // Patch: Helper to get thread key and navigation target
  const getThreadKey = (thread) => thread.slug || thread.id;
  const getThreadNavTarget = (thread) => thread.slug ? { type: 'slug', value: thread.slug } : { type: 'id', value: thread.id };

  // Patch: Update handleThreadSelect to accept thread object
  const handleThreadSelect = (thread) => {
    setActiveThread(thread.id);
    setView('thread');
    // Try fetching by slug if present, else by id
    if (thread.slug) {
      fetchThreadPosts({ slug: thread.slug });
    } else {
      fetchThreadPosts({ id: thread.id });
    }
  };
  
  // Patch: Update fetchThreadPosts to accept either slug or id
  const fetchThreadPosts = (threadRef) => {
    setIsLoading(true);
    let url = '';
    if (threadRef.slug) {
      url = `/api/forum/thread/${threadRef.slug}`;
    } else if (threadRef.id) {
      url = `/api/forum/threads/${threadRef.id}`;
    } else if (typeof threadRef === 'string') {
      url = `/api/forum/threads/${threadRef}`;
    } else {
      setError('Invalid thread reference');
      setIsLoading(false);
      return;
    }
    api.get(url, {
      params: {
        page: pageNumber,
        limit: 20
      }
    })
      .then(response => {
        console.log('Thread posts response:', response.data);
        if (response.data) {
          if (response.data.thread) {
            const t = response.data.thread;
            const formattedThread = {
              id: t.id || t._id,
              slug: t.slug,
              title: t.title,
              author: t.author || { username: 'Unknown', avatar: null, forum_rank: 'member' },
              category: t.category,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              replyCount: t.replyCount || 0,
              views: t.views || 0,
              pinned: t.pinned || false,
              locked: t.locked || false
            };
            setThreads([formattedThread]);
          }
          if (response.data.posts && Array.isArray(response.data.posts)) {
            const formattedPosts = response.data.posts.map(post => ({
              id: post.id || post._id,
              content: post.content,
              author: post.author || { username: 'Unknown', avatar: null, forum_rank: 'member', createdAt: post.createdAt },
              createdAt: post.createdAt,
              edited: post.edited || null,
              isOriginalPost: post.isOriginalPost,
              thanks: post.thanks || []
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
    // NOTE: Backend expects singular '/thread' for creation, even though the collection is 'threads'
    api.post('/api/forum/thread', payload)
      .then(response => {
        console.log('Thread created response:', response.data);
        if (response.data && response.data.data && response.data.data.thread) {
          // Navigate to the newly created thread
          setActiveThread(response.data.data.thread.id || response.data.data.thread._id);
          setView('thread');
          fetchThreadPosts(response.data.data.thread.id || response.data.data.thread._id);
          toast.success('Thread created successfully!');
        } else {
          console.error('Unexpected response format:', response.data);
          toast.error('Error creating thread: Unexpected server response');
        }
      })
      .catch(error => {
        console.error('Error creating thread:', error);
        
        // If we get an authorization error, we need to log in
        if (error.response?.status === 401) {
          toast.error('You need to be logged in to create a thread. Please log in and try again.');
        } else {
          toast.error('Error creating thread: ' + (error.response?.data?.message || 'Please try again later'));
        }
        
        setIsLoading(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Submit new reply to a thread
  const handleSubmitReply = (replyData) => {
    api.post(`/api/forum/threads/${activeThread}/posts`, { content: replyData.content })
      .then(response => {
        if (response.data && response.data.post) {
          setTimeout(() => {
            setPosts(prev => [...prev, { ...response.data.post, author: loggedInUser }]);
          }, 700);
          toast.success('Reply posted successfully!');
        }
      })
      .catch(error => {
        toast.error('Error posting reply: ' + (error.response?.data?.message || 'Please try again later'));
      });
  };
  
  // Get reply content from textarea and post to database
  const handlePostReply = () => {
    const textarea = document.querySelector('.forum-reply-textarea');
    if (textarea && textarea.value.trim()) {
      api.post(`/api/forum/threads/${activeThread}/posts`, { content: textarea.value.trim() })
        .then(response => {
          if (response.data && response.data.post) {
            setTimeout(() => {
              setPosts(prev => [...prev, { ...response.data.post, author: loggedInUser }]);
            }, 700);
            textarea.value = '';
            toast.success('Reply posted successfully!');
          }
        })
        .catch(error => {
          toast.error('Error posting reply: ' + (error.response?.data?.message || 'Please try again later'));
        });
    } else {
      toast.error('Please enter a reply before posting');
    }
  };

  // Fetch topics for the active category when entering 'create' view
  useEffect(() => {
    if (view === 'create' && activeCategory) {
      api.get(`/api/forum/category/${activeCategory}`)
        .then(res => {
          if (res.data && res.data.data && Array.isArray(res.data.data.topics)) {
            setCategoryTopics(res.data.data.topics.map(t => ({
              id: t._id,
              name: t.name
            })));
          } else {
            setCategoryTopics([]);
          }
        })
        .catch(() => setCategoryTopics([]));
    }
  }, [view, activeCategory]);

  // In thread view, handle thread/post deletion
  const handleThreadDeleted = () => {
    toast.success('Thread deleted');
    setView('threads');
    setActiveThread(null);
    setPosts([]);
    setThreads([]); // Clear threads immediately
    if (activeCategory) {
      fetchThreads(activeCategory);
    }
  };
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  };

  // Add handler to update post in state
  const handlePostEdited = (updatedPost) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
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
                        key={getThreadKey(thread)}
                        thread={thread}
                        onClick={() => handleThreadSelect(thread)}
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
              <button
                onClick={() => fetchThreadPosts(activeThread)}
                className="ml-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    className="forum-post"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ForumPost
                      post={post}
                      currentUser={loggedInUser}
                      onReply={() => {}}
                      threadAuthorId={threads[0]?.author?.id || threads[0]?.author?._id}
                      threadId={threads[0]?.id}
                      onThreadDeleted={handleThreadDeleted}
                      onPostDeleted={handlePostDeleted}
                      onPostEdited={handlePostEdited}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
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
          <CreateThread onSubmit={handleSubmitThread} onCancel={handleBack} activeCategory={activeCategory} topics={categoryTopics} />
        )}
      </div>
    </div>
  );
};

export default ForumSystem;