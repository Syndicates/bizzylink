import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useFYPFeed from '../../hooks/useFYPFeed';
import FYPPost from './FYPPost';
import WallService from '../../services/wallService';
import { useAuth } from '../../contexts/AuthContext';
// import FYPRepost from './FYPRepost';
// import FYPPostSkeleton from './FYPPostSkeleton';
// import FYPError from './FYPError';
// import FYPEmpty from './FYPEmpty';

const FEED_LABELS = {
  fyp: 'For You',
  following: 'Following',
  newest: 'Newest',
};

const FYPFeed = ({ filter }) => {
  const { posts, loading, error, hasMore, setPage } = useFYPFeed(filter);
  const [localPosts, setLocalPosts] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Debug logging for auth state
  useEffect(() => {
    console.log('[FYPFeed] Auth state:', { 
      isAuthenticated, 
      user: user ? { 
        id: user._id || user.id,
        username: user.username,
        // Don't log sensitive data
      } : null 
    });
  }, [isAuthenticated, user]);

  // Helper to safely update posts state
  const safeUpdatePosts = (updater) => {
    setLocalPosts((prev) => {
      // Defensive check for undefined/null posts
      if (!Array.isArray(prev)) {
        console.error('[FYPFeed][safeUpdatePosts] prev is not an array:', prev);
        return [];
      }
      
      // Filter out any invalid posts before updating
      const safePrev = prev.filter((p) => p && (p._id || p.id));
      if (safePrev.length !== prev.length) {
        console.error('[FYPFeed][safeUpdatePosts] Filtered out invalid posts:', {
          original: prev,
          filtered: safePrev
        });
      }
      
      try {
      return updater(safePrev);
      } catch (err) {
        console.error('[FYPFeed][safeUpdatePosts] Error in updater:', err);
        return safePrev;
      }
    });
  };

  // Initialize posts with proper like state
  React.useEffect(() => {
    console.log('[FYPFeed] Setting localPosts from posts:', posts);
    // Ensure we only set valid posts
    if (!Array.isArray(posts)) {
      console.error('[FYPFeed] posts is not an array:', posts);
      setLocalPosts([]);
      return;
    }

    // Process posts to include isLiked state
    const validPosts = posts.map(post => {
      if (!post) return null;
      
      // Check if the current user has liked this post
      const isLiked = Array.isArray(post.likes) && user && user._id 
        ? post.likes.includes(user._id)
        : false;

      return {
        ...post,
        isLiked
      };
    }).filter(Boolean);

    if (validPosts.length !== posts.length) {
      console.error('[FYPFeed] Filtered out invalid posts:', {
        original: posts,
        filtered: validPosts
      });
    }

    console.log('[FYPFeed] Processed posts with like state:', validPosts);
    setLocalPosts(validPosts);
  }, [posts, user]);

  // Helper to get the correct postId for like/repost (original for reposts)
  const getPostId = (post) => {
    if (!post) return null;
    // Commenting out repost handling for now
    // if (post.isRepost && post.originalPost && (post.originalPost._id || post.originalPost.id)) {
    //   return post.originalPost._id || post.originalPost.id;
    // }
    return post._id || post.id;
  };

  // Helper to get the correct post object (original for reposts)
  // const getPostObject = (post) => {
  //   if (!post) return null;
  //   if (post.isRepost && post.originalPost) {
  //     return post.originalPost;
  //   }
  //   return post;
  // };

  // Optimistic like handler
  const handleLike = async (postId) => {
    if (!postId) {
      console.error('[FYPFeed][handleLike] No postId provided');
      return;
    }
    if (!isAuthenticated) {
      console.error('[FYPFeed][handleLike] User is not authenticated');
      alert('Please log in to like posts');
      return;
    }
    if (!user || !user._id) {
      console.error('[FYPFeed][handleLike] No user or user ID:', user);
      return;
    }
    setLikeLoading(true);
    try {
      // First check if the post is already liked
      const post = localPosts.find(p => getPostId(p) === postId);
      if (!post) {
        console.error('[FYPFeed][handleLike] Post not found:', postId);
        return;
      }

      // If already liked, call unlike instead
      if (post.isLiked) {
        await handleUnlike(postId);
        return;
      }

      const response = await WallService.likeWallPost(postId);
      console.log('[FYP][handleLike] Response:', response);
      if (response.success) {
        safeUpdatePosts((safePrev) => {
          return safePrev.map((p) => {
            if (!p) {
              console.error('[FYPFeed][handleLike] Invalid post in map');
              return p;
            }
            const currentPostId = getPostId(p);
            if (!currentPostId) {
              console.error('[FYPFeed][handleLike] Invalid post ID in map:', p);
              return p;
            }
            if (currentPostId !== postId) return p;
            
            // Create a new post object with updated likes
            const updatedPost = {
              ...p,
              isLiked: true,
              likes: Array.isArray(p.likes) ? [...p.likes, user._id] : [user._id]
            };

            console.log('[FYPFeed][handleLike] Updated post:', updatedPost);
            return updatedPost;
          });
        });
      }
    } catch (err) {
      console.error('[FYP][handleLike] Error:', err);
      alert('Failed to like post');
    }
    setLikeLoading(false);
  };

  const handleUnlike = async (postId) => {
    if (!postId) {
      console.error('[FYPFeed][handleUnlike] No postId provided');
      return;
    }
    if (!isAuthenticated) {
      console.error('[FYPFeed][handleUnlike] User is not authenticated');
      alert('Please log in to unlike posts');
      return;
    }
    if (!user || !user._id) {
      console.error('[FYPFeed][handleUnlike] No user or user ID:', user);
      return;
    }
    setLikeLoading(true);
    try {
      // First check if the post is actually liked
      const post = localPosts.find(p => getPostId(p) === postId);
      if (!post) {
        console.error('[FYPFeed][handleUnlike] Post not found:', postId);
        return;
      }
      if (!post.isLiked) {
        console.log('[FYPFeed][handleUnlike] Post is not liked, nothing to do');
        return;
      }

      const response = await WallService.unlikeWallPost(postId);
      console.log('[FYP][handleUnlike] Response:', response);
      if (response.success) {
        safeUpdatePosts((safePrev) => {
          return safePrev.map((p) => {
            if (!p) {
              console.error('[FYPFeed][handleUnlike] Invalid post in map');
              return p;
            }
            const currentPostId = getPostId(p);
            if (!currentPostId) {
              console.error('[FYPFeed][handleUnlike] Invalid post ID in map:', p);
              return p;
            }
            if (currentPostId !== postId) return p;
            
            // Create a new post object with updated likes
            const updatedPost = {
              ...p,
              isLiked: false,
              likes: Array.isArray(p.likes) ? p.likes.filter(id => id !== user._id) : []
            };

            console.log('[FYPFeed][handleUnlike] Updated post:', updatedPost);
            return updatedPost;
          });
        });
      }
    } catch (err) {
      console.error('[FYP][handleUnlike] Error:', err);
      alert('Failed to unlike post');
    }
    setLikeLoading(false);
  };

  const handleRepost = async (post) => {
    if (!isAuthenticated) {
      console.error('[FYPFeed][handleRepost] User is not authenticated');
      alert('Please log in to repost');
      return;
    }
    if (!user || !user._id) {
      console.error('[FYPFeed][handleRepost] No user or user ID:', user);
      return;
    }

    try {
    const postId = getPostId(post);
      console.log('[FYPFeed][handleRepost] Reposting post:', postId);
      
      const response = await WallService.repostWallPost(postId);
      console.log('[FYPFeed][handleRepost] Response:', response);
      
      if (response.success) {
        // Update the post to show it's been reposted
        safeUpdatePosts((safePrev) => {
          return safePrev.map((p) => {
            if (!p) return p;
            const currentPostId = getPostId(p);
            if (currentPostId !== postId) return p;
            
            return {
              ...p,
              isReposted: true,
              repostCount: (p.repostCount || 0) + 1
            };
          });
        });
      }
    } catch (err) {
      console.error('[FYPFeed][handleRepost] Error:', err);
      alert('Failed to repost');
    }
  };

  const handleUnrepost = async (post) => {
    if (!isAuthenticated) {
      console.error('[FYPFeed][handleUnrepost] User is not authenticated');
      alert('Please log in to unrepost');
      return;
    }
    if (!user || !user._id) {
      console.error('[FYPFeed][handleUnrepost] No user or user ID:', user);
      return;
    }

    try {
    const postId = getPostId(post);
      console.log('[FYPFeed][handleUnrepost] Unreposting post:', postId);
      
      const response = await WallService.unrepostWallPost(postId);
      console.log('[FYPFeed][handleUnrepost] Response:', response);
      
      if (response.success) {
        // Update the post to show it's been unreposted
        safeUpdatePosts((safePrev) => {
          return safePrev.map((p) => {
            if (!p) return p;
            const currentPostId = getPostId(p);
            if (currentPostId !== postId) return p;
            
            return {
              ...p,
              isReposted: false,
              repostCount: Math.max(0, (p.repostCount || 0) - 1)
            };
          });
        });
      }
    } catch (err) {
      console.error('[FYPFeed][handleUnrepost] Error:', err);
      alert('Failed to unrepost');
    }
  };

  // Update comments for a post in localPosts
  const handleCommentChange = (postId, newComments) => {
    if (!postId) {
      console.error('[FYPFeed][handleCommentChange] No postId provided');
      return;
    }
    safeUpdatePosts((safePrev) => {
      safePrev.forEach((p, i) => {
        console.log(`[FYPFeed][handleCommentChange] post[${i}]:`, p, 'id:', p && p._id);
      });
      return safePrev.map(post => {
        const id = (post.isRepost && post.originalPost && post.originalPost._id)
          ? post.originalPost._id
          : post._id || post.id;
        return id === postId ? { ...post, comments: newComments } : post;
      });
    });
  };

  // Render loading state
  if (loading && posts.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 text-center text-minecraft-green font-minecraft text-2xl">
        Loading...
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 text-center text-red-500 font-minecraft text-2xl">
        Error: {error}
      </div>
    );
  }

  // Render empty state
  if (posts.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 text-center text-minecraft-green font-minecraft text-2xl">
        No posts found.
      </div>
    );
  }

  // Debug logs for rendering
  console.log('[FYPFeed] Rendering localPosts:', localPosts);
  localPosts.forEach((p, i) => {
    console.log(`[FYPFeed][render] post[${i}]:`, p, 'id:', p && p._id);
  });

  // Render posts with defensive filtering
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full font-minecraft text-sm shadow ${
          filter === 'fyp'
            ? 'bg-gradient-to-r from-green-400 to-blue-400 text-minecraft-dark'
            : filter === 'following'
            ? 'bg-gradient-to-r from-yellow-300 to-green-400 text-minecraft-dark'
            : 'bg-gradient-to-r from-blue-400 to-purple-400 text-minecraft-dark'
        }`}>
          {FEED_LABELS[filter] || 'Feed'}
        </span>
        <span className="text-minecraft-green font-minecraft text-xs opacity-70">Community Feed</span>
      </div>
      <div className="flex flex-col gap-6">
        {localPosts
          .filter((post) => !!post && !!post._id)
          .map((post) => (
            <FYPPost
              key={post.id || post._id}
              post={post}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onRepost={() => handleRepost(post)}
              onUnrepost={() => handleUnrepost(post)}
              onCommentChange={handleCommentChange}
              likeLoading={likeLoading}
            />
          ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="w-full py-2 mt-6 bg-minecraft-green text-minecraft-dark font-minecraft rounded shadow hover:bg-minecraft-green/90"
        >
          Load More
        </button>
      )}
    </div>
  );
};

FYPFeed.propTypes = {
  filter: PropTypes.string.isRequired,
};

export default FYPFeed; 