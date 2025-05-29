import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

const PAGE_SIZE = 10;

const useFYPFeed = (filter = 'fyp') => {
  // State for posts, loading, error, pagination, SSE
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const eventSourceRef = useRef(null);

  // Helper to filter out reposts (for FYP only)
  const filterReposts = (posts) => {
    return posts.filter(post => !post.isRepost);
  };

  // Fetch posts from API
  const fetchPosts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/api/wall/fyp';
      if (filter === 'following') endpoint = '/api/wall/following';
      if (filter === 'newest') endpoint = '/api/wall/newest';
      
      console.log(`[useFYPFeed] Fetching ${filter} feed from ${endpoint}, page ${pageNum}`);
      
      const res = await API.get(`${endpoint}?page=${pageNum}&limit=${PAGE_SIZE}`);
      const data = res.data;
      let fetchedPosts = data.posts || [];
      
      // Only filter reposts for FYP (backend already filters for others)
      if (filter === 'fyp') {
        fetchedPosts = filterReposts(fetchedPosts);
      }
      
      if (pageNum === 1) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      
      setHasMore(!!data.hasMore || (data.pagination && data.pagination.page < data.pagination.totalPages));
    } catch (err) {
      console.error(`[useFYPFeed] Error fetching ${filter} feed:`, err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Reset state and fetch when filter changes
  useEffect(() => {
    console.log(`[useFYPFeed] Filter changed to ${filter}, resetting state`);
    setPage(1);
    setPosts([]);
    setHasMore(true);
    setError(null);
    fetchPosts(1);
  }, [filter, fetchPosts]);

  // Fetch on page change
  useEffect(() => {
    if (page > 1) {
    fetchPosts(page);
    }
  }, [page, fetchPosts]);

  // SSE connection for real-time updates (FYP only)
  useEffect(() => {
    if (filter !== 'fyp') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      eventSourceRef.current = new EventSource('/api/wall/fyp/stream');
      eventSourceRef.current.onmessage = (event) => {
        const newPost = JSON.parse(event.data);
        // Only add non-repost posts
        if (!newPost.isRepost) {
        setPosts(prev => [newPost, ...prev]);
        }
      };
      eventSourceRef.current.onerror = () => {
        eventSourceRef.current.close();
        setTimeout(connectSSE, 5000); // Reconnect after 5 seconds
      };
    };
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [filter]);

  return {
    posts,
    loading,
    error,
    page,
    hasMore,
    setPage,
  };
};

export default useFYPFeed; 