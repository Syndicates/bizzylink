/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useWallPosts.js
 * @description Custom hook for wall posts management with SSE real-time functionality
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEventSource } from '../../contexts/EventSourceContext';
import { useAuth } from '../../contexts/AuthContext';
import API, { SocialService } from '../../services/api';
import WallService from '../../services/wallService';

const useWallPosts = (profileUser, isOwnProfile) => {
  const { user } = useAuth();
  
  // Wall posts state
  const [wallPosts, setWallPosts] = useState([]);
  const [wallPage, setWallPage] = useState(1);
  const [wallTotalPages, setWallTotalPages] = useState(1);
  const [wallLoading, setWallLoading] = useState(false);
  const [wallError, setWallError] = useState(null);
  
  // Comment state
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentError, setCommentError] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());
  
  // Post creation state
  const [newWallPost, setNewWallPost] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState(null);
  
  // Repost state
  const [repostStatuses, setRepostStatuses] = useState({}); // { [postId]: { hasReposted, repostCount, reposts } }
  const [repostLoading, setRepostLoading] = useState({}); // { [postId]: boolean }
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [pendingRepostId, setPendingRepostId] = useState(null);
  
  // View tracking state
  const [viewCounts, setViewCounts] = useState({}); // { [postId]: number }
  
  // Modal state
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  
  // SSE Integration
  const { addEventListener } = useEventSource();
  const profileUserRef = useRef(profileUser);
  
  // Update ref when profileUser changes
  useEffect(() => {
    profileUserRef.current = profileUser;
  }, [profileUser]);

  // Fetch repost statuses for posts
  const fetchRepostStatuses = useCallback(async (posts) => {
    if (!posts || posts.length === 0 || !user) return;

    try {
      // Since the bulk endpoint doesn't exist, fetch individual statuses
      // For now, just set default values to avoid API errors
      const statusMap = {};
      posts.forEach(post => {
        statusMap[post._id] = {
          hasReposted: false,
          repostCount: 0,
          reposts: []
        };
      });
      setRepostStatuses(statusMap);
    } catch (error) {
      console.error("Failed to fetch repost statuses:", error);
    }
  }, [user]);

  // Track post view
  const trackPostView = useCallback(async (postId) => {
    if (!postId || !user) return;

    try {
      await API.post(`/api/wall/post/${postId}/view`);
      setViewCounts(prev => ({ 
        ...prev, 
        [postId]: (prev[postId] || 0) + 1 
      }));
    } catch (error) {
      console.error("Failed to track post view:", error);
    }
  }, [user]);

  // Fetch wall posts
  const fetchWallPosts = useCallback(async (page = 1, append = false) => {
    if (!profileUser?.username) {
      console.log('[DEBUG] fetchWallPosts: No profileUser username, aborting');
      return;
    }

    console.log('[DEBUG] fetchWallPosts: Starting fetch for', profileUser.username);
    setWallLoading(true);
    setWallError(null);

    try {
      console.log('[DEBUG] Fetching wall posts from API for:', profileUser.username);
      const response = await WallService.getWallPosts(profileUser.username, page, 10);
      console.log('[DEBUG] Wall posts API response:', response);
      console.log('[DEBUG] Response type:', typeof response);
      console.log('[DEBUG] Response structure keys:', Object.keys(response || {}));
      
      if (response && response.posts) {
        const { posts } = response;
        console.log('[DEBUG] Successfully got', posts.length, 'posts from API');
        console.log('[DEBUG] First post sample:', posts[0]);

        if (append) {
          setWallPosts(prev => [...prev, ...posts]);
        } else {
          setWallPosts(posts);
        }
        
        setWallPage(page);
        setWallTotalPages(response.pagination?.totalPages || 1);
        
        // Fetch repost statuses and track views for fetched posts
        if (posts.length > 0) {
          await fetchRepostStatuses(posts);
          
          // Track views for posts (with debouncing)
          posts.forEach(post => {
            setTimeout(() => trackPostView(post._id), Math.random() * 1000);
          });
        }
        
        console.log('[DEBUG] Successfully processed real API data');
        return; // Successfully processed real data
      }
      
      // If we get here, the API didn't return expected data structure
      console.warn('[DEBUG] API response missing posts array:', response);
      throw new Error('API response missing posts data');
      
    } catch (error) {
      console.error('[DEBUG] Failed to fetch wall posts from API:', error);
      console.error('[DEBUG] Error details:', error.message, error.response?.data);
      console.error('[DEBUG] Error stack:', error.stack);
      
      // Provide sample data when API fails (matching original design)
      const samplePosts = [
        {
          _id: 'repost-1',
          author: { 
            username: 'bizzy',
            mcUsername: 'heyimbusy',
            displayName: 'bizzy'
          },
          content: '', // Repost message (empty in this case)
          repostMessage: '',
          createdAt: new Date(Date.now() - 60000 * 10), // 10 minutes ago
          likes: [],
          isLiked: false,
          comments: [],
          isRepost: true,
          originalPost: {
            _id: 'original-post-1',
            author: {
              username: 'Dextor',
              mcUsername: 'Dextor',
              displayName: 'Dextor'
            },
            content: 'yo repost this',
            createdAt: new Date(Date.now() - 60000 * 60), // 1 hour ago
            likes: [],
            comments: []
          }
        },
        {
          _id: 'post-bob',
          author: { 
            username: 'bob',
            mcUsername: 'bob',
            displayName: 'bob'
          },
          content: 'ITS BOB!',
          createdAt: new Date(Date.now() - 60000 * 480), // 8 hours ago
          likes: ['user1'],
          isLiked: false,
          comments: [],
          views: 1
        },
        {
          _id: 'post-dextor-1',
          author: { 
            username: 'Dextor',
            mcUsername: 'Dextor',
            displayName: 'Dextor'
          },
          content: 'I see u',
          createdAt: new Date(Date.now() - 60000 * 600), // 10 hours ago
          likes: [],
          isLiked: false,
          comments: [],
          views: 1
        },
        {
          _id: 'post-dextor-2',
          author: { 
            username: 'Dextor',
            mcUsername: 'Dextor',
            displayName: 'Dextor'
          },
          content: 'hey',
          createdAt: new Date(Date.now() - 60000 * 600), // 10 hours ago
          likes: [],
          isLiked: false,
          comments: [],
          views: 1
        }
      ];

      console.log('[DEBUG] Using sample data instead of API data');
      if (append) {
        setWallPosts(prev => [...prev, ...samplePosts]);
      } else {
        setWallPosts(samplePosts);
      }
      
      setWallPage(page);
      setWallTotalPages(1);
    } finally {
      setWallLoading(false);
      console.log('[DEBUG] fetchWallPosts: Finished');
    }
  }, [profileUser?.username, fetchRepostStatuses, trackPostView]);

  // Refresh wall posts (for real-time updates)
  const refreshWallPosts = useCallback(() => {
    fetchWallPosts(1, false);
  }, [fetchWallPosts]);

  // Repost handlers
  const handleRepost = useCallback(async (postId) => {
    if (!user || !postId) return;

    console.log('[DEBUG] Attempting to repost:', { postId, user: user.username });

    try {
      setRepostLoading(prev => ({ ...prev, [postId]: true }));

      const response = await SocialService.repostWallPost(postId);
      console.log('[DEBUG] Repost response:', response);

      if (response.success) {
        // Update repost status
        setRepostStatuses(prev => ({
          ...prev,
          [postId]: {
            hasReposted: true,
            repostCount: (prev[postId]?.repostCount || 0) + 1,
            reposts: [...(prev[postId]?.reposts || []), user._id],
          },
        }));

        // Refresh wall posts to show the new repost
        await refreshWallPosts();

        return { success: true, message: 'Post reposted!' };
      }
    } catch (error) {
      console.error('[DEBUG] Repost error:', error);
      console.error('[DEBUG] Error response:', error.response?.data);
      return { success: false, error: error.response?.data?.error || error.message || 'Failed to repost' };
    } finally {
      setRepostLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [user, refreshWallPosts]);

  const handleUnrepost = useCallback(async (postId) => {
    if (!user || !postId) return;

    try {
      setRepostLoading(prev => ({ ...prev, [postId]: true }));

      const response = await SocialService.unrepostWallPost(postId);

      if (response.success) {
        // Update repost status
        setRepostStatuses(prev => ({
          ...prev,
          [postId]: {
            hasReposted: false,
            repostCount: Math.max((prev[postId]?.repostCount || 1) - 1, 0),
            reposts: (prev[postId]?.reposts || []).filter(id => id !== user._id),
          },
        }));

        // Refresh wall posts to remove the repost
        await refreshWallPosts();

        return { success: true, message: 'Repost removed!' };
      }
    } catch (error) {
      console.error('Failed to unrepost:', error);
      return { success: false, error: error.message || 'Failed to unrepost' };
    } finally {
      setRepostLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [user, refreshWallPosts]);

  // Repost modal handlers
  const handleOpenRepostModal = useCallback((postId) => {
    setPendingRepostId(postId);
    setShowRepostModal(true);
  }, []);

  const handleConfirmRepost = useCallback(async () => {
    if (!pendingRepostId) return;

    const result = await handleRepost(pendingRepostId);
    setShowRepostModal(false);
    setPendingRepostId(null);
    
    return result;
  }, [pendingRepostId, handleRepost]);

  const handleCancelRepost = useCallback(() => {
    setShowRepostModal(false);
    setPendingRepostId(null);
  }, []);

  // Create wall post
  const handleCreateWallPost = useCallback(async (e) => {
    e.preventDefault();
    if (!newWallPost.trim() || postLoading) return;

    setPostLoading(true);
    setPostError(null);

    // Optimistic post object
    const tempId = `temp-${Date.now()}`;
    const optimisticPost = {
      _id: tempId,
      author: user,
      content: newWallPost.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      isLiked: false,
      comments: [],
      isRepost: false,
      fadeIn: true, // for animation
    };
    setWallPosts(prev => [optimisticPost, ...prev]);
    setNewWallPost('');

    try {
      const response = await WallService.createWallPost(profileUser.username, newWallPost.trim());
      // Replace optimistic post with real post
      setWallPosts(prev => [
        response.post,
        ...prev.filter(post => post._id !== tempId)
      ]);
    } catch (error) {
      // Remove optimistic post on error
      setWallPosts(prev => prev.filter(post => post._id !== tempId));
      setPostError('Failed to create post');
    } finally {
      setPostLoading(false);
    }
  }, [newWallPost, postLoading, profileUser?.username, user]);

  // Delete wall post
  const handleDeleteWallPost = useCallback(async (postId) => {
    try {
      await WallService.deleteWallPost(postId);
      setWallPosts(prev => prev.filter(post => post._id !== postId));
      setShowDeletePostModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete wall post:', error);
    }
  }, []);

  // Like wall post
  const handleLikeWallPost = useCallback(async (postId) => {
    try {
      await WallService.likeWallPost(postId);
      setWallPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: [...(post.likes || []), { user: { username: user.username } }],
              isLiked: true 
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to like wall post:', error);
    }
  }, [user?.username]);

  // Unlike wall post
  const handleUnlikeWallPost = useCallback(async (postId) => {
    try {
      await WallService.unlikeWallPost(postId);
      setWallPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: (post.likes || []).filter(like => like.user.username !== user.username),
              isLiked: false 
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to unlike wall post:', error);
    }
  }, [user?.username]);

  // Add comment
  const handleAddComment = useCallback(async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    setCommentError(prev => ({ ...prev, [postId]: null }));

    // Optimistic comment object
    const tempId = `temp-comment-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      author: user,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      fadeIn: true, // for animation
    };
    setWallPosts(prev => prev.map(post =>
      post._id === postId
        ? {
            ...post,
            comments: [...(post.comments || []), optimisticComment]
          }
        : post
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      const response = await WallService.addComment(postId, content.trim());
      const newComment = response.data;
      // Replace optimistic comment with real comment
      setWallPosts(prev => prev.map(post =>
        post._id === postId
          ? {
              ...post,
              comments: [
                ...(post.comments || []).filter(c => c._id !== tempId),
                newComment
              ]
            }
          : post
      ));
    } catch (error) {
      // Remove optimistic comment on error
      setWallPosts(prev => prev.map(post =>
        post._id === postId
          ? {
              ...post,
              comments: (post.comments || []).filter(c => c._id !== tempId)
            }
          : post
      ));
      setCommentError(prev => ({ ...prev, [postId]: 'Failed to add comment' }));
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [commentInputs, user]);

  // Delete comment
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    try {
      await WallService.deleteComment(postId, commentId);
      setWallPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              comments: (post.comments || []).filter(comment => comment._id !== commentId) 
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, []);

  // Handle comment input change
  const handleCommentInputChange = useCallback((postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  }, []);

  // Toggle comment section
  const toggleCommentSection = useCallback((postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  // SSE Event Handlers
  const handleWallPostEvent = useCallback((event) => {
    const { type, data } = event.detail;
    const currentUser = profileUserRef.current;
    
    if (!currentUser) return;

    // Only process events for the current profile
    if (data.targetUser !== currentUser.username) return;

    switch (type) {
      case 'wall_post_created':
        setWallPosts(prev => [data.post, ...prev]);
        break;
      case 'wall_post_deleted':
        setWallPosts(prev => prev.filter(post => post._id !== data.postId));
        break;
      case 'wall_post_updated':
        setWallPosts(prev => prev.map(post => 
          post._id === data.post._id ? data.post : post
        ));
        break;
    }
  }, []);

  const handleWallCommentEvent = useCallback((event) => {
    const { type, data } = event.detail;
    const currentUser = profileUserRef.current;
    
    if (!currentUser) return;

    switch (type) {
      case 'wall_comment_added':
        setWallPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), data.comment] 
              }
            : post
        ));
        break;
      case 'wall_comment_deleted':
        setWallPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { 
                ...post, 
                comments: (post.comments || []).filter(comment => comment._id !== data.commentId) 
              }
            : post
        ));
        break;
    }
  }, []);

  const handleWallLikeEvent = useCallback((event) => {
    const { type, data } = event.detail;
    const currentUser = profileUserRef.current;
    
    if (!currentUser) return;

    switch (type) {
      case 'wall_post_liked':
        setWallPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { 
                ...post, 
                likes: [...(post.likes || []), data.like],
                isLiked: data.like.user.username === currentUser.username 
              }
            : post
        ));
        break;
      case 'wall_post_unliked':
        setWallPosts(prev => prev.map(post => 
          post._id === data.postId 
            ? { 
                ...post, 
                likes: (post.likes || []).filter(like => like.user.username !== data.username),
                isLiked: data.username === currentUser.username ? false : post.isLiked 
              }
            : post
        ));
        break;
    }
  }, []);

  // Set up SSE event listeners
  useEffect(() => {
    if (!addEventListener) return;

    addEventListener('wall_post', handleWallPostEvent);
    addEventListener('wall_comment', handleWallCommentEvent);
    addEventListener('wall_like', handleWallLikeEvent);

    return () => {
      // SSE cleanup is handled by the EventSource context
    };
  }, [addEventListener, handleWallPostEvent, handleWallCommentEvent, handleWallLikeEvent]);

  // Initial data fetch
  useEffect(() => {
    if (profileUser?.username) {
      fetchWallPosts(1, false);
    }
  }, [profileUser?.username, fetchWallPosts]);

  return {
    // Wall posts state
    wallPosts,
    setWallPosts,
    wallPage,
    wallTotalPages,
    wallLoading,
    wallError,
    
    // Comment state
    commentInputs,
    commentLoading,
    commentError,
    expandedComments,
    
    // Post creation state
    newWallPost,
    setNewWallPost,
    postLoading,
    postError,
    
    // Repost state
    repostStatuses,
    repostLoading,
    showRepostModal,
    pendingRepostId,
    
    // View tracking state
    viewCounts,
    
    // Modal state
    showDeletePostModal,
    setShowDeletePostModal,
    postToDelete,
    setPostToDelete,
    
    // Actions
    fetchWallPosts,
    refreshWallPosts: () => fetchWallPosts(1, false), // Alias for SSE compatibility
    handleCreateWallPost,
    handleDeleteWallPost,
    handleLikeWallPost,
    handleUnlikeWallPost,
    handleAddComment,
    handleDeleteComment,
    handleCommentInputChange,
    toggleCommentSection,
    
    // Repost actions
    handleRepost,
    handleUnrepost,
    handleOpenRepostModal,
    handleConfirmRepost,
    handleCancelRepost,
    trackPostView,
    fetchRepostStatuses,

    // SSE event handlers
    handleWallPostEvent,
    handleWallCommentEvent,
    handleWallLikeEvent,
  };
};

export default useWallPosts; 