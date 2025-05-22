/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file useWallPosts.js
 * @description Custom hook for wall post logic
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import WallService from '../services/wallService';

export default function useWallPosts(username, pageSize = 10) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await WallService.getWallPosts(username, pageNum, pageSize);
      setPosts(res.posts || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || 'Failed to load wall posts');
    } finally {
      setLoading(false);
    }
  }, [username, pageSize]);

  useEffect(() => {
    if (username) fetchPosts(1);
  }, [username, fetchPosts]);

  const createPost = async (content, image) => {
    setCreating(true);
    setError(null);
    try {
      await WallService.createWallPost(username, content, image);
      await fetchPosts(1);
    } catch (err) {
      setError(err.message || 'Failed to create wall post');
    } finally {
      setCreating(false);
    }
  };

  const deletePost = async (postId) => {
    setError(null);
    try {
      await WallService.deleteWallPost(postId);
      setPosts(posts => posts.filter(post => post._id !== postId));
    } catch (err) {
      setError(err.message || 'Failed to delete wall post');
    }
  };

  const likePost = async (postId, userId) => {
    setError(null);
    try {
      await WallService.likeWallPost(postId);
      setPosts(posts => posts.map(post => post._id === postId ? { ...post, likes: [...(post.likes || []), userId] } : post));
    } catch (err) {
      setError(err.message || 'Failed to like wall post');
    }
  };

  const unlikePost = async (postId, userId) => {
    setError(null);
    try {
      await WallService.unlikeWallPost(postId);
      setPosts(posts => posts.map(post => post._id === postId ? { ...post, likes: (post.likes || []).filter(id => id !== userId) } : post));
    } catch (err) {
      setError(err.message || 'Failed to unlike wall post');
    }
  };

  return {
    posts,
    loading,
    error,
    page,
    totalPages,
    creating,
    fetchPosts,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    setPage
  };
} 