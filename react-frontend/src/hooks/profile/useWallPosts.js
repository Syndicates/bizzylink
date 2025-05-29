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
  const { addEventListener, eventEmitter } = useEventSource();
  
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
  const profileUserRef = useRef(profileUser);
  
  // Like animation state map (postId => true/false)
  const [likeAnimStates, setLikeAnimStates] = useState({});
  
  // Track which posts have been viewed in this session
  const viewedRef = useRef({});
  
  // Update ref when profileUser changes
  useEffect(() => {
    profileUserRef.current = profileUser;
  }, [profileUser]);

  // Fetch repost statuses for posts
  const fetchRepostStatuses = useCallback(async (posts) => {
    if (!posts || posts.length === 0 || !user) return;

    try {
      const statusMap = {};
      posts.forEach(post => {
        // For original posts, check if user ID is in the reposts array
        const reposts = post.reposts || [];
        const repostCount = post.repostCount || 0;
        const hasReposted = reposts.includes(user._id) || reposts.includes(user.id);
        
        statusMap[post._id] = {
          hasReposted,
          repostCount,
          reposts
        };

        // If this is a repost wrapper, also set status for the original post
        if (post.isRepost && post.originalPost) {
          const originalReposts = post.originalPost.reposts || [];
          const originalRepostCount = post.originalPost.repostCount || 0;
          const originalHasReposted = originalReposts.includes(user._id) || originalReposts.includes(user.id);
          
          statusMap[post.originalPost._id] = {
            hasReposted: originalHasReposted,
            repostCount: originalRepostCount,
            reposts: originalReposts
        };
        }
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
      setWallLoading(false);
      return;
    }
    setWallLoading(true);
    setWallError(null);
    try {
      const response = await WallService.getWallPosts(profileUser.username, page, 10);
      if (response && response.posts) {
        const { posts } = response;
        setWallPosts(prev => {
          // Create a map of current posts for efficient lookup
          const prevMap = new Map(prev.map(p => [p._id, p]));
          
          // Process new posts
          const updated = posts.map(post => {
            const existingPost = prevMap.get(post._id);
            let newComments = (post.comments || []).filter(Boolean);
            let prevComments = (existingPost?.comments || []).filter(Boolean);
            const prevCommentIds = new Set(prevComments.map(c => c._id));
            newComments = newComments.map(c => {
              if (!c || !c._id) return c; // skip if undefined or missing _id
              const prevC = prevComments.find(pc => pc._id === c._id);
              if (!prevC) {
                // Only set fadeIn: true if not already animating
                return { ...c, fadeIn: true };
              } else {
                // Always preserve fadeIn/removing state for existing comments
                return { ...c, fadeIn: prevC.fadeIn, removing: prevC.removing };
              }
            });
            let likeAnimating = false;
            let prevLikes = (existingPost?.likes || []).filter(like => like && like.user && like.user.username);
            let newLikes = (post.likes || []).filter(like => like && like.user && like.user.username);
            const prevLikeUsernames = new Set(prevLikes.map(like => like.user.username));
            const newLikeUsernames = new Set(newLikes.map(like => like.user.username));
            // If a new like was added or removed, trigger animation
            if (
              newLikes.length !== prevLikes.length ||
              [...newLikeUsernames].some(u => !prevLikeUsernames.has(u)) ||
              [...prevLikeUsernames].some(u => !newLikeUsernames.has(u))
            ) {
              likeAnimating = true;
              // Set a timer to reset likeAnimating after 500ms
              setTimeout(() => {
                setWallPosts(current => current.map(p =>
                  p._id === post._id ? { ...p, likeAnimating: false } : p
                ));
              }, 500);
            } else if (existingPost) {
              likeAnimating = existingPost.likeAnimating;
            }
            if (existingPost) {
              // If post exists, preserve its fadeIn state and merge updates
              return { ...existingPost, ...post, comments: newComments, likeAnimating };
            } else {
              // New post, add fadeIn flag
              return { ...post, fadeIn: true, comments: newComments, likeAnimating };
            }
          });

          // --- PATCH: Sync original post's repostCount/reposts if repost wrapper present ---
          let synced = [...updated];
          updated.forEach(post => {
            if (post.isRepost && post.originalPost) {
              synced = synced.map(p => {
                if (p._id === post.originalPost._id) {
                  return {
                    ...p,
                    repostCount: post.originalPost.repostCount,
                    reposts: post.originalPost.reposts
                  };
                }
                return p;
              });
            }
          });
          // --- END PATCH ---

          // If appending, add any posts from prev that aren't in the new page
          if (append) {
            const existingIds = new Set(synced.map(p => p._id));
            return [...synced, ...prev.filter(p => !existingIds.has(p._id))];
          } else {
            return synced;
          }
        });
        setWallPage(page);
        setWallTotalPages(response.pagination?.totalPages || 1);
        if (posts.length > 0) {
          await fetchRepostStatuses(posts);
        }
        return;
      }
      throw new Error('API response missing posts data');
    } catch (error) {
      setWallError(error.message || 'Failed to fetch wall posts');
    } finally {
      setWallLoading(false);
    }
  }, [profileUser?.username, fetchRepostStatuses]);

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

      // Optimistically update repost count and reposts array
      setWallPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            repostCount: (post.repostCount || 0) + 1,
            reposts: [...(post.reposts || []), user._id]
          };
        } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
          return {
            ...post,
            originalPost: {
              ...post.originalPost,
              repostCount: (post.originalPost.repostCount || 0) + 1,
              reposts: [...(post.originalPost.reposts || []), user._id]
            }
          };
        }
        return post;
      }));

      const response = await SocialService.repostWallPost(postId);
      console.log('[DEBUG] Repost response:', response);

      if (response.success) {
        // Update repost status and count
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
      } else {
        // Revert optimistic update on failure
        setWallPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              repostCount: Math.max((post.repostCount || 1) - 1, 0),
              reposts: (post.reposts || []).filter(id => id !== user._id)
            };
          } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
            return {
              ...post,
              originalPost: {
                ...post.originalPost,
                repostCount: Math.max((post.originalPost.repostCount || 1) - 1, 0),
                reposts: (post.originalPost.reposts || []).filter(id => id !== user._id)
              }
            };
          }
          return post;
        }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setWallPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            repostCount: Math.max((post.repostCount || 1) - 1, 0),
            reposts: (post.reposts || []).filter(id => id !== user._id)
          };
        } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
          return {
            ...post,
            originalPost: {
              ...post.originalPost,
              repostCount: Math.max((post.originalPost.repostCount || 1) - 1, 0),
              reposts: (post.originalPost.reposts || []).filter(id => id !== user._id)
            }
          };
        }
        return post;
      }));
      console.error('[DEBUG] Repost error:', error);
      console.error('[DEBUG] Error response:', error.response?.data);
      return { success: false, error: error.response?.data?.error || error.message || 'Failed to repost' };
    } finally {
      setRepostLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [user, refreshWallPosts]);

  const handleUnrepost = useCallback(async (postId) => {
    if (!user || !postId) return;

    // Optimistically update repost count and reposts array
    setWallPosts(prev => prev.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          repostCount: Math.max((post.repostCount || 1) - 1, 0),
          reposts: (post.reposts || []).filter(id => id !== user._id)
        };
      } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
        return {
          ...post,
          originalPost: {
            ...post.originalPost,
            repostCount: Math.max((post.originalPost.repostCount || 1) - 1, 0),
            reposts: (post.originalPost.reposts || []).filter(id => id !== user._id)
          }
        };
      }
      return post;
    }));

    try {
      setRepostLoading(prev => ({ ...prev, [postId]: true }));

      const response = await SocialService.unrepostWallPost(postId);

      if (response.success) {
        // Update repost status and count
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
      } else {
        // Revert optimistic update on failure
        setWallPosts(prev => prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              repostCount: (post.repostCount || 0) + 1,
              reposts: [...(post.reposts || []), user._id]
            };
          } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
            return {
              ...post,
              originalPost: {
                ...post.originalPost,
                repostCount: (post.originalPost.repostCount || 0) + 1,
                reposts: [...(post.originalPost.reposts || []), user._id]
              }
            };
          }
          return post;
        }));
      }
    } catch (error) {
      // Revert optimistic update on error
      setWallPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            repostCount: (post.repostCount || 0) + 1,
            reposts: [...(post.reposts || []), user._id]
          };
        } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
          return {
            ...post,
            originalPost: {
              ...post.originalPost,
              repostCount: (post.originalPost.repostCount || 0) + 1,
              reposts: [...(post.originalPost.reposts || []), user._id]
            }
          };
        }
        return post;
      }));
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
      fadeIn: true // for animation
    };
    setWallPosts(prev => [optimisticPost, ...prev]);
    setNewWallPost('');

    try {
      const response = await WallService.createWallPost(profileUser.username, newWallPost.trim());
      // Replace optimistic post with real post
      setWallPosts(prev => [
        { ...response.post, fadeIn: true },
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

  // Helper to trigger post removal animation
  const animateRemovePost = useCallback((postId) => {
    setWallPosts(prev => prev.map(post =>
      post._id === postId ? { ...post, removing: true } : post
    ));
    setTimeout(() => {
      setWallPosts(prev => prev.filter(post => post._id !== postId));
    }, 1200); // Match fade-out duration
  }, []);

  // Helper to trigger like animation
  const animateLikePulse = useCallback((postId) => {
    setWallPosts(prev => prev.map(post =>
      post._id === postId ? { ...post, likeAnimating: true } : post
    ));
    setTimeout(() => {
      setWallPosts(prev => prev.map(post =>
        post._id === postId ? { ...post, likeAnimating: false } : post
      ));
    }, 500); // Match like pulse duration
  }, []);

  // Helper to trigger like animation for any post
  const triggerLikeAnimation = useCallback((postId) => {
    setLikeAnimStates(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setLikeAnimStates(prev => ({ ...prev, [postId]: false }));
    }, 500);
  }, []);

  // Delete wall post (with animation)
  const handleDeleteWallPost = useCallback(async (postId) => {
    try {
      await WallService.deleteWallPost(postId);
      animateRemovePost(postId);
      setShowDeletePostModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Failed to delete wall post:', error);
    }
  }, [animateRemovePost]);

  // Like wall post (with animation)
  const handleLikeWallPost = useCallback(async (postId) => {
    setWallPosts(prev => prev.map(post => {
      if (!post) return post;
      if (post._id === postId) {
        return {
          ...post,
          likes: [...(post.likes || []), { user: { username: user.username } }],
          isLiked: true
        };
      } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
        return {
          ...post,
          originalPost: {
            ...post.originalPost,
            likes: [...(post.originalPost.likes || []), { user: { username: user.username } }],
            isLiked: true
          }
        };
      }
      return post;
    }));
    try {
      await WallService.likeWallPost(postId);
    } catch (error) {
      // Optionally revert optimistic update on error
    }
  }, [user?.username]);

  // Unlike wall post (with animation)
  const handleUnlikeWallPost = useCallback(async (postId) => {
    setWallPosts(prev => prev.map(post => {
      if (!post) return post;
      if (post._id === postId) {
        return {
          ...post,
          likes: (post.likes || []).filter(like => like && like.user && like.user.username !== user.username),
          isLiked: false
        };
      } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
        return {
          ...post,
          originalPost: {
            ...post.originalPost,
            likes: (post.originalPost.likes || []).filter(like => like && like.user && like.user.username !== user.username),
            isLiked: false
          }
        };
      }
      return post;
    }));
    try {
      await WallService.unlikeWallPost(postId);
    } catch (error) {
      // Optionally revert optimistic update on error
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
    setWallPosts(prev => prev.map(post => {
      if (!post) return post;
      if (post._id === postId) {
        return { ...post, comments: [...(post.comments || []), optimisticComment] };
      } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
        return { ...post, originalComments: [...(post.originalComments || []), optimisticComment] };
      }
      return post;
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      const response = await WallService.addComment(postId, content.trim());
      const newComment = response.data;
      setWallPosts(prev => prev.map(post => {
        if (!post) return post;
        if (post._id === postId) {
          return {
            ...post,
            comments: [
              ...(post.comments || []).filter(c => c && c._id !== tempId),
              newComment
            ]
          };
        } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
          return {
            ...post,
            originalComments: [
              ...(post.originalComments || []).filter(c => c && c._id !== tempId),
              newComment
            ]
          };
        }
        return post;
      }));
    } catch (error) {
      setWallPosts(prev => prev.map(post => {
        if (!post) return post;
        if (post._id === postId) {
          return {
            ...post,
            comments: (post.comments || []).filter(c => c && c._id !== tempId)
          };
        } else if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
          return {
            ...post,
            originalComments: (post.originalComments || []).filter(c => c && c._id !== tempId)
          };
        }
        return post;
      }));
      setCommentError(prev => ({ ...prev, [postId]: 'Failed to add comment' }));
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, [commentInputs, user]);

  // Helper to trigger comment removal animation
  const animateRemoveComment = useCallback((postId, commentId) => {
    setWallPosts(prev => prev.map(post =>
      post._id === postId
        ? {
            ...post,
            comments: (post.comments || []).map(comment =>
              comment._id === commentId ? { ...comment, removing: true } : comment
            )
          }
        : post
    ));
    setTimeout(() => {
      setWallPosts(prev => prev.map(post =>
        post._id === postId
          ? {
              ...post,
              comments: (post.comments || []).filter(comment => comment._id !== commentId)
            }
          : post
      ));
    }, 1200); // Match fade-out duration
  }, []);

  // Delete comment (with animation)
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    try {
      await WallService.deleteComment(postId, commentId);
      animateRemoveComment(postId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, [animateRemoveComment]);

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

    switch (type) {
      case 'wall_post':
        if (data.type === 'new_post' && data.wallOwnerUsername === currentUser.username) {
          refreshWallPosts();
        } else if (data.type === 'delete_post') {
          setWallPosts(prev => prev.filter(post => post._id !== data.postId));
        } else if (data.type === 'repost' && data.wallOwnerUsername === currentUser.username) {
          // Update repost count for the original post
          setWallPosts(prev => prev.map(post => {
            if (post._id === data.originalPostId) {
              return {
                ...post,
                repostCount: (post.repostCount || 0) + 1,
                reposts: [...(post.reposts || []), data.repost.author._id]
              };
            }
            return post;
          }));
          refreshWallPosts();
        } else if (data.type === 'unrepost') {
          // Update repost count for the original post
          setWallPosts(prev => prev.map(post => {
            if (post._id === data.originalPostId) {
              return {
                ...post,
                repostCount: Math.max((post.repostCount || 1) - 1, 0),
                reposts: (post.reposts || []).filter(id => id !== data.authorId)
              };
            }
            return post;
          }));
        setWallPosts(prev => prev.filter(post => post._id !== data.postId));
        }
        break;
      default:
        break;
    }
  }, [refreshWallPosts]);

  const handleWallCommentEvent = useCallback((event) => {
    try {
      // Safely extract event data with fallbacks
      const eventData = event.detail?.data || event.detail || event;
      if (!eventData) {
        console.warn('[SSE][WALL_COMMENT] Received event with no data');
        return;
      }

      // Extract the nested data structure
      const { type, data: nestedData } = eventData;
      if (!nestedData) {
        console.warn('[SSE][WALL_COMMENT] Received event with no nested data');
        return;
      }

      // Extract the actual comment data
      const { type: commentType, postId, comment, commentId, wallOwnerUsername } = nestedData;
    const currentUser = profileUserRef.current;
    if (!currentUser) return;
      
      console.log('[SSE][WALL_COMMENT] Processing event:', { 
        type, 
        commentType, 
        postId, 
        commentId,
        wallOwnerUsername 
      });
      
      // Handle the comment event based on the nested type
      switch (commentType) {
      case 'wall_comment_added':
        case 'comment_added':
        setWallPosts(prev => prev.map(post => {
          if (!post) return post;
            
            // Only update the original post if it matches postId and is not a repost wrapper
            if (post._id === postId && !post.isRepost) {
              const existingComments = post.comments || [];
              // Check if comment already exists (deduplication)
              const commentExists = existingComments.some(c => c && c._id === comment._id);
              if (commentExists) {
                console.log('[SSE][WALL_COMMENT] Comment already exists, skipping duplicate:', comment._id);
                return post;
              }
              return { 
                ...post, 
                comments: [...existingComments, comment], 
                fadeIn: true 
              };
            }
            
            // Only update the repost wrapper's originalComments if its originalPost._id matches postId
            if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
              const existingComments = post.originalComments || [];
              // Check if comment already exists (deduplication)
              const commentExists = existingComments.some(c => c && c._id === comment._id);
              if (commentExists) {
                console.log('[SSE][WALL_COMMENT] Comment already exists in repost, skipping duplicate:', comment._id);
                return post;
              }
              return { 
                ...post, 
                originalComments: [...existingComments, comment] 
              };
          }
            
          return post;
        }));
        break;
      case 'wall_comment_deleted':
        case 'comment_deleted':
        setWallPosts(prev => prev.map(post => {
          if (!post) return post;
            if (post._id === postId && !post.isRepost) {
              return { ...post, comments: (post.comments || []).filter(comment => comment && comment._id !== commentId) };
            }
            if (post.isRepost && post.originalPost && post.originalPost._id === postId) {
              return { ...post, originalComments: (post.originalComments || []).filter(comment => comment && comment._id !== commentId) };
          }
          return post;
        }));
        break;
      default:
          console.log('[SSE][WALL_COMMENT] Unhandled comment type:', commentType);
        break;
      }
    } catch (error) {
      console.error('[SSE][WALL_COMMENT] Error handling wall comment event:', error);
    }
  }, []);

  const handleWallLikeEvent = useCallback((event) => {
    const { type, data } = event.detail;
    const currentUser = profileUserRef.current;
    if (!currentUser) return;
    switch (type) {
      case 'wall_post_liked':
        setWallPosts(prev => prev.map(post => {
          if (!post) return post;
          if (post._id === data.postId) {
            console.log('[SSE] Updating original post likes', post._id);
            return {
              ...post,
              likes: [...(post.likes || []).filter(like => like && like.user && like.user.username), data.like].filter(like => like && like.user && like.user.username),
              isLiked: data.like.user && data.like.user.username === currentUser.username,
              fadeIn: true
            };
          } else if (post.isRepost && post.originalPost && post.originalPost._id === data.postId) {
            console.log('[SSE] Updating repost originalPost.likes for original', post.originalPost._id, 'in post', post._id);
            return {
              ...post,
              originalPost: {
                ...post.originalPost,
                likes: [...(post.originalPost.likes || []).filter(like => like && like.user && like.user.username), data.like].filter(like => like && like.user && like.user.username),
                isLiked: data.like.user && data.like.user.username === currentUser.username
              }
            };
          }
          return post;
        }));
        triggerLikeAnimation(data.postId);
        break;
      case 'wall_post_unliked':
        setWallPosts(prev => prev.map(post => {
          if (!post) return post;
          if (post._id === data.postId) {
            console.log('[SSE] Removing like from original post', post._id);
            return {
              ...post,
              likes: (post.likes || []).filter(like => like && like.user && like.user.username !== data.username),
              isLiked: data.username === currentUser.username ? false : post.isLiked
            };
          } else if (post.isRepost && post.originalPost && post.originalPost._id === data.postId) {
            console.log('[SSE] Removing like from repost originalPost.likes for original', post.originalPost._id, 'in post', post._id);
            return {
              ...post,
              originalPost: {
                ...post.originalPost,
                likes: (post.originalPost.likes || []).filter(like => like && like.user && like.user.username !== data.username),
                isLiked: data.username === currentUser.username ? false : post.originalPost.isLiked
              }
            };
          }
          return post;
        }));
        triggerLikeAnimation(data.postId);
        break;
      default:
        break;
    }
  }, [triggerLikeAnimation]);

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

  // Add the fetchOriginalComments function before the SSE handler for reposts
  const fetchOriginalComments = async (originalPostId) => {
    try {
      const response = await API.get(`/api/wall/post/${originalPostId}/comments`);
      return response.data.comments || [];
    } catch (error) {
      console.error("Failed to fetch original comments:", error);
      return [];
    }
  };

  // SSE handler for reposts
  useEffect(() => {
    if (!eventEmitter) return;
    const handleRepost = (data) => {
      if (data.type === 'repost' && data.repost) {
        const repost = data.repost;
        if (repost.isRepost && (!repost.originalComments || repost.originalComments.length === 0)) {
          // If originalComments is missing, fetch it
          fetchOriginalComments(repost.originalPost._id).then(comments => {
            repost.originalComments = comments;
            setWallPosts(prev => {
              const index = prev.findIndex(p => p._id === repost._id);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = repost;
                return updated;
              }
              return prev;
            });
          });
        } else {
          setWallPosts(prev => {
            const index = prev.findIndex(p => p._id === repost._id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = repost;
              return updated;
            }
            return prev;
          });
        }
      }
    };
    eventEmitter.on('wall_post', handleRepost);
    return () => {
      eventEmitter.off('wall_post', handleRepost);
    };
  }, [eventEmitter]);

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
    fetchRepostStatuses,

    // SSE event handlers
    handleWallPostEvent,
    handleWallCommentEvent,
    handleWallLikeEvent,

    // Like animation state map
    likeAnimStates,

    // Track which posts have been viewed in this session
    viewedRef,
  };
};

export default useWallPosts; 