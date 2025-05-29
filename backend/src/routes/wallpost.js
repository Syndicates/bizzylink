/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file wallpost.js
 * @description Wall post API endpoints
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const WallPost = require('../models/WallPost');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const eventEmitter = require('../eventEmitter');
const rateLimit = require('express-rate-limit');
const { sanitizeInput } = require('../utils/sanitizer');
// const { redis, get: redisGet, set: redisSet } = require('../utils/redis');
const cron = require('node-cron');

/**
 * Rate limiting middleware
 */
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: 'Too many posts created, please try again later' }
});

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many comments, please try again later' }
});

const likeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many likes, please try again later' }
});

const fypLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests per minute per IP
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const SLOW_QUERY_THRESHOLD_MS = 1000;

/**
 * Error handling middleware
 */
const handleError = (res, error, message = 'An error occurred') => {
  console.error(`[ERROR] ${message}:`, error);
  // Stub: send to error tracking service here
  // errorTracking.captureException?.(error);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? message : error.message 
  });
};

/**
 * Get For You Page (FYP) feed
 * GET /api/wall/fyp
 */
router.get('/fyp', fypLimiter, async (req, res) => {
  console.log('[FYP][DEBUG] /api/wall/fyp route hit');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');

  try {
    const { page = 1, limit = 10, sort } = req.query;
    const safeLimit = Math.min(parseInt(limit), 20); // max 20 posts per request
    const startTime = Date.now();
    const skip = (parseInt(page) - 1) * safeLimit;

    // Determine sort order
    let sortOption = { _id: -1 };
    if (sort === 'likes') {
      sortOption = { likes: -1, _id: -1 };
    }

    // Fetch posts from user profiles, similar to the existing wall post endpoint
    const posts = await WallPost.find()
      .sort(sortOption)
      .skip(skip)
      .limit(safeLimit)
      .select('author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes isRepost originalPost')
      .populate('author', 'username displayName avatar mcUsername verified')
      .populate({
        path: 'originalPost',
        select: 'author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes',
        populate: {
          path: 'author',
          select: 'username displayName avatar mcUsername verified'
        }
      })
      .lean();

    // Batch fetch all comment authors
    const commentAuthorIds = [...new Set(posts.flatMap(post => 
      post.comments?.map(comment => comment.author?.toString()).filter(Boolean) || []
    ))];

    const commentAuthors = await User.find({ _id: { $in: commentAuthorIds } })
      .select('username mcUsername minecraftUsername avatar displayName verified')
      .lean();

    const authorMap = Object.fromEntries(
      commentAuthors.map(author => [
        author._id.toString(),
        {
          _id: author._id,
          username: author.username,
          mcUsername: author.mcUsername || author.minecraftUsername || author.username,
          minecraftUsername: author.minecraftUsername,
          avatar: author.avatar,
          displayName: author.displayName,
          verified: author.verified
        }
      ])
    );

    // Map authors to comments
    const populatedPosts = await Promise.all(posts.map(async post => {
      let comments = post.comments?.map(comment => ({
        ...comment,
        author: authorMap[comment.author.toString()] || {
          username: 'Unknown User',
          mcUsername: 'Steve'
        }
      })) || [];
      let originalComments = null;
      if (post.isRepost && post.originalPost && post.originalPost._id) {
        const original = await WallPost.findById(post.originalPost._id)
          .populate('comments.author', 'username displayName avatar mcUsername verified')
          .lean();
        if (original && original.comments) {
          originalComments = original.comments.map(comment => ({
            ...comment,
            author: comment.author || { username: 'Unknown User', mcUsername: 'Steve' }
          }));
        }
      }
      return {
        ...post,
        comments,
        originalComments
      };
    }));

    res.json({
      success: true,
      posts: populatedPosts,
      pagination: {
        total: await WallPost.countDocuments(),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(await WallPost.countDocuments() / parseInt(limit))
      }
    });

    const duration = Date.now() - startTime;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[PERF] FYP feed fetch slow: ${duration}ms for page ${page}`);
    }
  } catch (error) {
    console.error('[FYP][DEBUG] Error in /api/wall/fyp:', error);
    handleError(res, error, 'Failed to fetch FYP feed');
  }
});

/**
 * Server-Sent Events (SSE) for FYP feed
 * GET /api/wall/fyp/stream
 */
router.get('/fyp/stream', protect, async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  // Send a comment to keep the connection alive
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  // Handler for new wall posts
  const onNewPost = async (event) => {
    if (event.type === 'new_post' && event.post) {
      // Only send posts that would appear in the FYP (for now, all new posts)
      res.write(`data: ${JSON.stringify(event.post)}\n\n`);
    }
  };

  eventEmitter.on('wall_post', onNewPost);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    eventEmitter.off('wall_post', onNewPost);
    res.end();
  });
});

/**
 * Get Following feed (posts from users the current user follows)
 * GET /api/wall/following
 */
router.get('/following', protect, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Get following user IDs
    const user = await User.findById(req.user._id).select('following');
    console.log('[DEBUG] Looked up user in /api/wall/following:', user);
    const followingIds = user.following || [];
    // Fetch posts from followed users, exclude reposts
    const posts = await WallPost.find({ author: { $in: followingIds }, isRepost: { $ne: true } })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes isRepost originalPost')
      .populate('author', 'username displayName avatar mcUsername verified')
      .lean();
    // Batch fetch all comment authors
    const commentAuthorIds = [...new Set(posts.flatMap(post => post.comments?.map(comment => comment.author?.toString()).filter(Boolean) || []))];
    const commentAuthors = await User.find({ _id: { $in: commentAuthorIds } })
      .select('username mcUsername minecraftUsername avatar displayName verified')
      .lean();
    const authorMap = Object.fromEntries(
      commentAuthors.map(author => [
        author._id.toString(),
        {
          _id: author._id,
          username: author.username,
          mcUsername: author.mcUsername || author.minecraftUsername || author.username,
          minecraftUsername: author.minecraftUsername,
          avatar: author.avatar,
          displayName: author.displayName,
          verified: author.verified
        }
      ])
    );
    // Map authors to comments
    const populatedPosts = posts.map(post => ({
      ...post,
      comments: post.comments?.map(comment => ({
        ...comment,
        author: authorMap[comment.author.toString()] || { username: 'Unknown User', mcUsername: 'Steve' }
      })) || []
    }));
    res.json({
      success: true,
      posts: populatedPosts,
      pagination: {
        total: await WallPost.countDocuments({ author: { $in: followingIds }, isRepost: { $ne: true } }),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(await WallPost.countDocuments({ author: { $in: followingIds }, isRepost: { $ne: true } }) / parseInt(limit))
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch following feed');
  }
});

/**
 * Get Newest feed (latest posts from all users, excluding reposts)
 * GET /api/wall/newest
 */
router.get('/newest', protect, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Fetch latest posts, exclude reposts
    const posts = await WallPost.find({ isRepost: { $ne: true } })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes isRepost originalPost')
      .populate('author', 'username displayName avatar mcUsername verified')
      .lean();
    // Batch fetch all comment authors
    const commentAuthorIds = [...new Set(posts.flatMap(post => post.comments?.map(comment => comment.author?.toString()).filter(Boolean) || []))];
    const commentAuthors = await User.find({ _id: { $in: commentAuthorIds } })
      .select('username mcUsername minecraftUsername avatar displayName verified')
      .lean();
    const authorMap = Object.fromEntries(
      commentAuthors.map(author => [
        author._id.toString(),
        {
          _id: author._id,
          username: author.username,
          mcUsername: author.mcUsername || author.minecraftUsername || author.username,
          minecraftUsername: author.minecraftUsername,
          avatar: author.avatar,
          displayName: author.displayName,
          verified: author.verified
        }
      ])
    );
    // Map authors to comments
    const populatedPosts = posts.map(post => ({
      ...post,
      comments: post.comments?.map(comment => ({
        ...comment,
        author: authorMap[comment.author.toString()] || { username: 'Unknown User', mcUsername: 'Steve' }
      })) || []
    }));
    res.json({
      success: true,
      posts: populatedPosts,
      pagination: {
        total: await WallPost.countDocuments({ isRepost: { $ne: true } }),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(await WallPost.countDocuments({ isRepost: { $ne: true } }) / parseInt(limit))
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch newest feed');
  }
});

/**
 * Get wall posts for a user's profile
 * GET /api/wall/:username
 */
router.get('/:username', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    // --- Redis caching is currently DISABLED for development ---
    // To enable, uncomment the following lines and ensure Redis is running:
    // const cacheKey = `wall:${username}:${page}:${limit}`;
    // const cacheStart = Date.now();
    // const cached = await redisGet(cacheKey);
    // if (cached) {
    //   const duration = Date.now() - cacheStart;
    //   if (duration > SLOW_QUERY_THRESHOLD_MS) {
    //     console.warn(`[PERF] Redis cache fetch slow: ${duration}ms for ${cacheKey}`);
    //   }
    //   return res.json(cached);
    // }
    const startTime = Date.now();
    const recipient = await User.findOne({ username }).select('_id');
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WallPost.countDocuments({ recipient: recipient._id });
    
    // Optimize query with proper indexing and population
    const posts = await WallPost.find({ recipient: recipient._id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes isRepost originalPost')
      .populate('author', 'username displayName avatar mcUsername verified')
      .populate({
        path: 'originalPost',
        select: 'author username displayName avatar mcUsername verified repostCount reposts content createdAt comments likes',
        populate: {
          path: 'author',
          select: 'username displayName avatar mcUsername verified'
        }
      })
      .lean(); // Use lean() for better performance
    
    // Batch fetch all comment authors
    const commentAuthorIds = [...new Set(posts.flatMap(post => 
      post.comments?.map(comment => comment.author?.toString()).filter(Boolean) || []
    ))];
    
    const commentAuthors = await User.find({ _id: { $in: commentAuthorIds } })
      .select('username mcUsername minecraftUsername avatar displayName verified')
      .lean();
    
    const authorMap = Object.fromEntries(
      commentAuthors.map(author => [
        author._id.toString(),
        {
          _id: author._id,
          username: author.username,
          mcUsername: author.mcUsername || author.minecraftUsername || author.username,
          minecraftUsername: author.minecraftUsername,
          avatar: author.avatar,
          displayName: author.displayName,
          verified: author.verified
        }
      ])
    );
    
    // Map authors to comments
    const populatedPosts = await Promise.all(posts.map(async post => {
      // Visual debug: log repostCount and reposts for each post
      console.log(`[DEBUG][WALL_FEED] Post ${post._id} repostCount:`, post.repostCount, 'reposts:', post.reposts);
      let comments = post.comments?.map(comment => ({
        ...comment,
        author: authorMap[comment.author.toString()] || {
          username: 'Unknown User',
          mcUsername: 'Steve'
        }
      })) || [];
      let originalComments = null;
      if (post.isRepost && post.originalPost && post.originalPost._id) {
        // Fetch original post's comments and populate authors
        const original = await WallPost.findById(post.originalPost._id)
          .populate('comments.author', 'username displayName avatar mcUsername verified')
          .lean();
        if (original && original.comments) {
          originalComments = original.comments.map(comment => ({
            ...comment,
            author: comment.author || { username: 'Unknown User', mcUsername: 'Steve' }
          }));
        }
      }
      return {
        ...post,
        comments,
        originalComments // null unless repost
      };
    }));
    
    res.json({
      success: true,
      posts: populatedPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
    // --- Redis caching is currently DISABLED for development ---
    // To enable, uncomment the following lines:
    // await redisSet(cacheKey, {
    //   success: true,
    //   posts: populatedPosts,
    //   pagination: {
    //     total,
    //     page: parseInt(page),
    //     limit: parseInt(limit),
    //     totalPages: Math.ceil(total / parseInt(limit))
    //   }
    // }, 30);
    // const duration = Date.now() - startTime;
    // if (duration > SLOW_QUERY_THRESHOLD_MS) {
    //   console.warn(`[PERF] Wall post fetch slow: ${duration}ms for ${username} page ${page}`);
    // }
  } catch (error) {
    handleError(res, error, 'Failed to fetch wall posts');
  }
});

/**
 * Create a new wall post
 * POST /api/wall/:username
 */
router.post('/:username', protect, postLimiter, async (req, res) => {
  try {
    const { username } = req.params;
    const { content, image } = req.body;
    
    const sanitizedContent = sanitizeInput(content);
    if (!sanitizedContent || sanitizedContent.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Post content cannot be empty' 
      });
    }
    
    if (sanitizedContent.length > 500) {
      return res.status(400).json({ 
        success: false, 
        error: 'Post content cannot exceed 500 characters' 
      });
    }
    
    // Validate image URL if provided
    if (image && !isValidImageUrl(image)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }
    
    const recipient = await User.findOne({ username }).select('_id');
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const newPost = new WallPost({
      author: req.user._id,
      recipient: recipient._id,
      content: sanitizedContent,
      image,
      type: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newPost.save();
    
    // Populate author data for response
    const rawPost = await WallPost.findById(newPost._id)
      .populate('author', 'username displayName avatar mcUsername verified');
    let populatedPost = rawPost;
    if (rawPost.comments && rawPost.comments.length > 0) {
      const authorIds = [...new Set(rawPost.comments.map(c => c.author?.toString()).filter(Boolean))];
      const authors = await User.find({ _id: { $in: authorIds } }).select('username mcUsername minecraftUsername avatar displayName verified');
      const authorMap = {};
      authors.forEach(a => {
        authorMap[a._id.toString()] = {
          _id: a._id,
          username: a.username,
          mcUsername: a.mcUsername || a.minecraftUsername || a.username,
          minecraftUsername: a.minecraftUsername,
          avatar: a.avatar,
          displayName: a.displayName,
          verified: a.verified
        };
      });
      populatedPost = rawPost.toObject ? rawPost.toObject() : rawPost;
      populatedPost.comments = rawPost.comments.map(comment => {
        if (comment.author && authorMap[comment.author.toString()]) {
          return { ...comment, author: authorMap[comment.author.toString()] };
        }
        return comment.toObject ? comment.toObject() : comment;
      });
    }

    // Create notification for recipient (if not self-post)
    if (recipient._id.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.create({
          recipient: recipient._id,
          sender: req.user._id,
          type: 'WALL_POST',
          message: `${req.user.username} posted on your wall!`,
          data: { postId: newPost._id },
          createdAt: new Date()
        });
        console.log('[WALL POST] Created notification:', notification);
        // Emit SSE userEvent for real-time notification
        const ssePayload = {
          userId: recipient._id.toString(),
          event: 'notification',
          data: {
            type: 'notification',
            subtype: 'WALL_POST',
            sender: { _id: req.user._id, username: req.user.username },
            message: `${req.user.username} posted on your wall!`,
            postId: newPost._id,
            createdAt: new Date()
          }
        };
        console.log('[SSE][WALL_POST] Emitting userEvent for wall post:', ssePayload);
        eventEmitter.emit('userEvent', ssePayload);
      } catch (e) { console.error('[WALL POST] Failed to create wall post notification:', e); }
    }

    // Emit real-time wall_post event for frontend real-time updates
    setTimeout(() => {
      // Broadcast to all clients, include wallOwnerUsername
      eventEmitter.emit('wall_post', {
        type: 'new_post',
        post: populatedPost,
        wallOwnerUsername: username, // the wall being posted on
        authorUsername: req.user.username
      });
    }, 200);

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create wall post' 
    });
  }
});

/**
 * Delete a wall post
 * DELETE /api/wall/post/:postId
 */
router.delete('/post/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Verify the post exists
    const post = await WallPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    // Check if user is authorized to delete (either author or recipient)
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isRecipient = post.recipient.toString() === req.user._id.toString();
    
    if (!isAuthor && !isRecipient) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to delete this post' 
      });
    }
    
    // If this is not a repost, cascade delete all reposts of this post
    if (!post.isRepost) {
      try {
        const reposts = await WallPost.find({ originalPost: postId, isRepost: true });
        console.log(`[CASCADE DELETE] Found ${reposts.length} reposts to delete for original post ${postId}`);
        
        // Delete all reposts
        await WallPost.deleteMany({ originalPost: postId, isRepost: true });
        
        // Emit delete events for each repost
        for (const repost of reposts) {
          try {
            const repostWallOwnerUser = await User.findById(repost.recipient).select('username');
            const repostWallOwnerUsername = repostWallOwnerUser ? repostWallOwnerUser.username : undefined;
            const repostAuthorUser = await User.findById(repost.author).select('username');
            const repostAuthorUsername = repostAuthorUser ? repostAuthorUser.username : undefined;
            
            eventEmitter.emit('wall_post', {
              type: 'delete_post',
              postId: repost._id.toString(),
              wallOwnerUsername: repostWallOwnerUsername,
              authorUsername: repostAuthorUsername,
              cascadeDelete: true,
              originalPostId: postId
            });
          } catch (e) {
            console.error(`[CASCADE DELETE] Failed to emit delete event for repost ${repost._id}:`, e);
          }
        }
      } catch (e) {
        console.error('[CASCADE DELETE] Error deleting reposts:', e);
      }
    }
    
    // Delete the post
    await WallPost.findByIdAndDelete(postId);

    // Emit real-time wall_post event for frontend real-time updates
    if (post) {
      // Find wall owner username
      let wallOwnerUsername;
      try {
        const wallOwnerUser = await User.findById(post.recipient).select('username');
        wallOwnerUsername = wallOwnerUser ? wallOwnerUser.username : undefined;
      } catch (e) { wallOwnerUsername = undefined; }
      // Find author username
      let authorUsername;
      try {
        const authorUser = await User.findById(post.author).select('username');
        authorUsername = authorUser ? authorUser.username : undefined;
      } catch (e) { authorUsername = undefined; }
      eventEmitter.emit('wall_post', {
        type: 'delete_post',
        postId: postId,
        wallOwnerUsername,
        authorUsername
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete wall post' 
    });
  }
});

/**
 * Like a wall post
 * POST /api/wall/post/:postId/like
 */
router.post('/post/:postId/like', protect, async (req, res) => {
  console.log('[WALL LIKE] Like endpoint hit by user:', req.user.username, 'userId:', req.user._id.toString(), 'for post:', req.params.postId);
  try {
    const { postId } = req.params;
    // Verify post exists
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    // Check if user already liked the post
    const alreadyLiked = post.likes.some(like => like.toString() === req.user._id.toString());
    if (alreadyLiked) {
      return res.json({
        success: true,
        message: 'Post already liked'
      });
    }
    // Add like
    post.likes.push(req.user._id);
    await post.save();
    // Notify the original poster if not self-like
    console.log('[WALL LIKE] post.author:', post.author.toString(), 'req.user._id:', req.user._id.toString());
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          message: `${req.user.username} liked your wall post!`,
          type: 'WALL_LIKE',
          data: { postId: post._id },
        });
        // Emit SSE userEvent for real-time notification (to post author only)
        const ssePayload = {
          userId: post.author.toString(),
          event: 'notification',
          data: {
            type: 'notification',
            subtype: 'WALL_LIKE',
            sender: { _id: req.user._id, username: req.user.username },
            message: `${req.user.username} liked your wall post!`,
            postId: post._id,
            createdAt: new Date()
          }
        };
        console.log('[SSE][WALL_LIKE] Emitting userEvent for wall like:', ssePayload);
        eventEmitter.emit('userEvent', ssePayload);
      } catch (e) { console.error('Failed to create wall like notification:', e); }
    } else {
      console.log('[WALL LIKE] Skipping notification emit: self-like detected.');
    }
    // --- PATCH: Emit real-time wall_like event to ALL clients for instant UI updates ---
    try {
      // Find wall owner username
      const wallOwnerUser = await User.findById(post.recipient).select('username');
      const wallOwnerUsername = wallOwnerUser ? wallOwnerUser.username : undefined;
      eventEmitter.emit('wall_like', {
        type: 'like_added',
        postId: post._id.toString(),
        wallOwnerUsername,
        liker: { _id: req.user._id, username: req.user.username }
      });
    } catch (e) { console.error('[SSE][WALL_LIKE] Failed to emit wall_like event:', e); }
    res.json({
      success: true,
      message: 'Post liked successfully'
    });
  } catch (error) {
    console.error('Error liking wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to like wall post' 
    });
  }
});

/**
 * Unlike a wall post
 * POST /api/wall/post/:postId/unlike
 */
router.post('/post/:postId/unlike', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    // Verify post exists
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    // Remove like
    post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
    await post.save();
    // --- PATCH: Emit real-time wall_like event to ALL clients for instant UI updates ---
    try {
      // Find wall owner username
      const wallOwnerUser = await User.findById(post.recipient).select('username');
      const wallOwnerUsername = wallOwnerUser ? wallOwnerUser.username : undefined;
      eventEmitter.emit('wall_like', {
        type: 'like_removed',
        postId: post._id.toString(),
        wallOwnerUsername,
        liker: { _id: req.user._id, username: req.user.username }
      });
    } catch (e) { console.error('[SSE][WALL_LIKE] Failed to emit wall_like event (unlike):', e); }
    res.json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Error unliking wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unlike wall post' 
    });
  }
});

/**
 * Create a system post (for achievements, friend actions, etc.)
 * POST /api/wall/system
 * Admin/System only
 */
router.post('/system', protect, async (req, res) => {
  try {
    const { recipientUsername, type, content, metadata } = req.body;
    
    // This endpoint is for system use only, validate admin rights
    if (req.user.webRank !== 'admin' && req.user.webRank !== 'owner') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to create system posts' 
      });
    }
    
    if (!['system', 'achievement', 'friend', 'game'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid post type' 
      });
    }
    
    // Find recipient user
    const recipient = await User.findOne({ username: recipientUsername }).select('_id');
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipient user not found' 
      });
    }
    
    // Create system post
    const systemPost = new WallPost({
      // System posts are authored by the admin account
      author: req.user._id,
      recipient: recipient._id,
      content,
      type,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await systemPost.save();
    
    // Populate author data for response
    const rawPost = await WallPost.findById(systemPost._id)
      .populate('author', 'username displayName avatar mcUsername verified');
    let populatedPost = rawPost;
    if (rawPost.comments && rawPost.comments.length > 0) {
      const authorIds = [...new Set(rawPost.comments.map(c => c.author?.toString()).filter(Boolean))];
      const authors = await User.find({ _id: { $in: authorIds } }).select('username mcUsername minecraftUsername avatar displayName verified');
      const authorMap = {};
      authors.forEach(a => {
        authorMap[a._id.toString()] = {
          _id: a._id,
          username: a.username,
          mcUsername: a.mcUsername || a.minecraftUsername || a.username,
          minecraftUsername: a.minecraftUsername,
          avatar: a.avatar,
          displayName: a.displayName,
          verified: a.verified
        };
      });
      populatedPost = rawPost.toObject ? rawPost.toObject() : rawPost;
      populatedPost.comments = rawPost.comments.map(comment => {
        if (comment.author && authorMap[comment.author.toString()]) {
          return { ...comment.toObject(), author: authorMap[comment.author.toString()] };
        }
        return comment.toObject ? comment.toObject() : comment;
      });
    }

    res.status(201).json({
      success: true,
      message: 'System post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating system wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create system wall post' 
    });
  }
});

const filterProfanity = (text) => {
  // Simple profanity and forbidden content filter
  const forbidden = [
    'porn', 'sex', 'nude', 'naked', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'fag', 'slut', 'whore', 'rape', 'cum', 'cock', 'boob', 'boobs', 'anal', 'blowjob', 'handjob', 'orgy', 'hentai', 'xxx', 'nsfw', 'nigger', 'nigga', 'kike', 'spic', 'chink', 'faggot', 'retard', 'pedo', 'child porn', 'zoophilia', 'beastiality', 'incest', 'gore', 'kill yourself', 'suicide', 'discord.gg', 'http://', 'https://', 'www.', '.com', '.net', '.org', '.io', '.gg', '.xyz', '.porn', '.sex', '.xxx', '.tube', '.cam', '.live', '.bet', '.casino', '.crypto', '.eth', '.btc', '.doge', '.binance', '.exchange', '.wallet', '.loan', '.click', '.link', '.download', '.exe', '.apk', '.zip', '.rar', '.7z', '.torrent', '.mp4', '.avi', '.mov', '.mkv', '.flv', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv', '.json', '.xml', '.html', '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb', '.go', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.sass', '.less', '.styl', '.ini', '.conf', '.cfg', '.env', '.git', '.svn', '.hg', '.bzr', '.cvs', '.bak', '.tmp', '.swp', '.lock', '.log', '.db', '.sqlite', '.mdb', '.accdb', '.sql', '.dbf', '.dat', '.bin', '.hex', '.img', '.iso', '.dmg', '.vmdk', '.vdi', '.qcow2', '.ova', '.ovf', '.vhd', '.vhdx', '.vmdk', '.vdi', '.qcow2', '.ova', '.ovf', '.vhd', '.vhdx', '.torrent', '.magnet', '.ed2k', '.dc++', '.soulseek', '.sls', '.sls2', '.sls3', '.sls4', '.sls5', '.sls6', '.sls7', '.sls8', '.sls9', '.sls10', '.sls11', '.sls12', '.sls13', '.sls14', '.sls15', '.sls16', '.sls17', '.sls18', '.sls19', '.sls20', '.sls21', '.sls22', '.sls23', '.sls24', '.sls25', '.sls26', '.sls27', '.sls28', '.sls29', '.sls30', '.sls31', '.sls32', '.sls33', '.sls34', '.sls35', '.sls36', '.sls37', '.sls38', '.sls39', '.sls40', '.sls41', '.sls42', '.sls43', '.sls44', '.sls45', '.sls46', '.sls47', '.sls48', '.sls49', '.sls50', '.sls51', '.sls52', '.sls53', '.sls54', '.sls55', '.sls56', '.sls57', '.sls58', '.sls59', '.sls60', '.sls61', '.sls62', '.sls63', '.sls64', '.sls65', '.sls66', '.sls67', '.sls68', '.sls69', '.sls70', '.sls71', '.sls72', '.sls73', '.sls74', '.sls75', '.sls76', '.sls77', '.sls78', '.sls79', '.sls80', '.sls81', '.sls82', '.sls83', '.sls84', '.sls85', '.sls86', '.sls87', '.sls88', '.sls89', '.sls90', '.sls91', '.sls92', '.sls93', '.sls94', '.sls95', '.sls96', '.sls97', '.sls98', '.sls99', '.sls100', '.sls101', '.sls102', '.sls103', '.sls104', '.sls105', '.sls106', '.sls107', '.sls108', '.sls109', '.sls110', '.sls111', '.sls112', '.sls113', '.sls114', '.sls115', '.sls116', '.sls117', '.sls118', '.sls119', '.sls120', '.sls121', '.sls122', '.sls123', '.sls124', '.sls125', '.sls126', '.sls127', '.sls128', '.sls129', '.sls130', '.sls131', '.sls132', '.sls133', '.sls134', '.sls135', '.sls136', '.sls137', '.sls138', '.sls139', '.sls140', '.sls141', '.sls142', '.sls143', '.sls144', '.sls145', '.sls146', '.sls147', '.sls148', '.sls149', '.sls150', '.sls151', '.sls152', '.sls153', '.sls154', '.sls155', '.sls156', '.sls157', '.sls158', '.sls159', '.sls160', '.sls161', '.sls162', '.sls163', '.sls164', '.sls165', '.sls166', '.sls167', '.sls168', '.sls169', '.sls170', '.sls171', '.sls172', '.sls173', '.sls174', '.sls175', '.sls176', '.sls177', '.sls178', '.sls179', '.sls180', '.sls181', '.sls182', '.sls183', '.sls184', '.sls185', '.sls186', '.sls187', '.sls188', '.sls189', '.sls190', '.sls191', '.sls192', '.sls193', '.sls194', '.sls195', '.sls196', '.sls197', '.sls198', '.sls199', '.sls200'];
  const lower = text.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) return true;
  }
  return false;
};

/**
 * Add a comment to a wall post
 * POST /api/wall/post/:postId/comment
 */
router.post('/post/:postId/comment', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length < 1 || content.length > 300) {
      return res.status(400).json({ success: false, error: 'Comment must be 1-300 characters.' });
    }
    if (filterProfanity(content)) {
      return res.status(400).json({ success: false, error: 'Comment contains forbidden or unsafe content.' });
    }
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const comment = {
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();
    // Always refetch and populate comments.author for the response
    const refetchedPost = await WallPost.findById(post._id)
      .populate('comments.author', 'username displayName avatar mcUsername verified');
    res.json({ success: true, comments: refetchedPost.comments });

    // Notify the original poster if not self-comment
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          message: `${req.user.username} commented on your wall post!`,
          type: 'WALL_COMMENT',
          data: { postId: post._id },
        });
        // Emit SSE userEvent for real-time notification
        const ssePayload = {
          userId: post.author.toString(),
          event: 'notification',
          data: {
            type: 'notification',
            subtype: 'WALL_COMMENT',
            sender: { _id: req.user._id, username: req.user.username },
            message: `${req.user.username} commented on your wall post!`,
            postId: post._id,
            createdAt: new Date()
          }
        };
        console.log('[SSE][WALL_COMMENT] Emitting userEvent for wall comment:', ssePayload);
        eventEmitter.emit('userEvent', ssePayload);
      } catch (e) { console.error('Failed to create wall comment notification:', e); }
    }

    // Notify mentioned users
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedUsernames = new Set();
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1] && match[1] !== req.user.username) {
        mentionedUsernames.add(match[1]);
      }
    }
    if (mentionedUsernames.size > 0) {
      const mentionedUsers = await User.find({ username: { $in: Array.from(mentionedUsernames) } });
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser._id.toString() !== req.user._id.toString()) {
          try {
            await Notification.create({
              recipient: mentionedUser._id,
              sender: req.user._id,
              message: `${req.user.username} mentioned you in a wall post comment!`,
              type: 'WALL_MENTION',
              data: { postId: post._id },
            });
            // Emit SSE userEvent for real-time notification
            const ssePayload = {
              userId: mentionedUser._id.toString(),
              event: 'notification',
              data: {
                type: 'notification',
                subtype: 'WALL_MENTION',
                sender: { _id: req.user._id, username: req.user.username },
                message: `${req.user.username} mentioned you in a wall post comment!`,
                postId: post._id,
                createdAt: new Date()
              }
            };
            console.log('[SSE][WALL_MENTION] Emitting userEvent for wall mention:', ssePayload);
            eventEmitter.emit('userEvent', ssePayload);
          } catch (e) { console.error('Failed to create wall mention notification:', e); }
        }
      }
    }

    // After saving a comment, refetch the post and emit wall_comment event
    try {
      const refetchedPost = await WallPost.findById(post._id)
        .populate('comments.author', 'username displayName avatar mcUsername verified');
      const wallOwnerUsername = (await User.findById(post.recipient)).username;
      console.log('[WALL_COMMENT][DEBUG] Emitting wall_comment event after response (refetched):', post._id.toString());
      eventEmitter.emit('wall_comment', {
        type: 'comment_added',
        postId: post._id.toString(),
        wallOwnerUsername,
        comment: refetchedPost.comments[refetchedPost.comments.length - 1] // the newly added comment
      });
    } catch (e) { console.error('[SSE][WALL_COMMENT] Failed to emit wall_comment event:', e); }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

/**
 * Delete a comment from a wall post
 * DELETE /api/wall/post/:postId/comment/:commentId
 */
router.delete('/post/:postId/comment/:commentId', protect, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    // Do NOT populate here
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    // Fix: handle both ObjectId and populated object
    const isAuthor = (comment.author && comment.author._id ? comment.author._id.toString() : comment.author.toString()) === req.user._id.toString();
    const isPostOwner = post.author.toString() === req.user._id.toString() || post.recipient.toString() === req.user._id.toString();
    if (!isAuthor && !isPostOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }
    // Remove the comment
    post.comments.pull({ _id: commentId });
    await post.save();
    // Now populate for the response
    await post.populate('comments.author', 'username displayName avatar mcUsername verified');
    res.json({ success: true, comments: post.comments });

    // After deleting a comment, refetch the post and emit wall_comment event
    try {
      const refetchedPost = await WallPost.findById(post._id)
        .populate('comments.author', 'username displayName avatar mcUsername verified');
      const wallOwnerUsername = (await User.findById(post.recipient)).username;
      console.log('[WALL_COMMENT][DEBUG] Emitting wall_comment event (delete) after response (refetched):', post._id.toString());
      eventEmitter.emit('wall_comment', {
        type: 'comment_deleted',
        postId: post._id.toString(),
        wallOwnerUsername,
        commentId: commentId,
        comments: refetchedPost.comments // send updated comments array for extra safety
      });
    } catch (e) { console.error('[SSE][WALL_COMMENT] Failed to emit wall_comment event (delete):', e); }
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

/**
 * Bulk delete wall posts for a user
 * DELETE /api/wall/:username/bulk-delete
 * Body: { postIds: [array of post IDs] }
 */
router.delete('/:username/bulk-delete', protect, async (req, res) => {
  try {
    const { username } = req.params;
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No post IDs provided.' });
    }
    // Find the profile owner
    const user = await User.findOne({ username }).select('_id');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    // Only allow the profile owner or admin to delete
    if (req.user._id.toString() !== user._id.toString() && req.user.webRank !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }
    const deleted = [];
    const failed = [];
    for (const postId of postIds) {
      const post = await WallPost.findById(postId);
      if (!post) {
        failed.push(postId);
        continue;
      }
      // Only allow deleting posts on this wall
      if (post.recipient.toString() !== user._id.toString()) {
        failed.push(postId);
        continue;
      }
      await WallPost.findByIdAndDelete(postId);
      // Emit real-time delete event (reuse your existing logic)
      let authorUsername;
      try {
        const authorUser = await User.findById(post.author).select('username');
        authorUsername = authorUser ? authorUser.username : undefined;
      } catch (e) { authorUsername = undefined; }
      eventEmitter.emit('wall_post', {
        type: 'delete_post',
        postId,
        wallOwnerUsername: username,
        authorUsername
      });
      deleted.push(postId);
    }
    res.json({ success: true, deleted, failed });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, error: 'Bulk delete failed.' });
  }
});

/**
 * Repost a wall post to your own profile
 * POST /api/wall/post/:postId/repost
 */
router.post('/post/:postId/repost', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const { message } = req.body; // Optional repost message
    
    // Find the original post
    const originalPost = await WallPost.findById(postId)
      .populate('author', 'username displayName avatar mcUsername verified');
    
    if (!originalPost) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    // Can't repost your own posts to your own profile
    if (originalPost.author._id.toString() === req.user._id.toString() && 
        originalPost.recipient.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot repost your own post to your own profile' });
    }
    
    // Check if already reposted
    const existingRepost = await WallPost.findOne({
      author: req.user._id,
      recipient: req.user._id,
      originalPost: postId,
      isRepost: true
    });
    
    if (existingRepost) {
      return res.status(400).json({ success: false, error: 'Already reposted this post' });
    }
    
    // Create repost
    const repost = new WallPost({
      author: req.user._id,
      recipient: req.user._id, // Repost to own profile
      content: message || '', // Optional repost message
      originalPost: postId,
      isRepost: true,
      repostMessage: message,
      type: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await repost.save();
    
    // Update original post repost count and add to reposts array
    await WallPost.findByIdAndUpdate(postId, {
      $addToSet: { reposts: req.user._id },
      $inc: { repostCount: 1 }
    });
    
    // Populate the repost for response
    const populatedRepost = await WallPost.findById(repost._id)
      .populate('author', 'username displayName avatar mcUsername verified')
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'username displayName avatar mcUsername verified'
        }
      });

    // Fetch original post's comments and populate authors
    let originalComments = null;
    if (populatedRepost.isRepost && populatedRepost.originalPost && populatedRepost.originalPost._id) {
      const original = await WallPost.findById(populatedRepost.originalPost._id)
        .populate('comments.author', 'username displayName avatar mcUsername verified')
        .lean();
      if (original && original.comments) {
        originalComments = original.comments.map(comment => ({
          ...comment,
          author: comment.author || { username: 'Unknown User', mcUsername: 'Steve' }
        }));
      }
    }
    populatedRepost.originalComments = originalComments;

    res.json({ success: true, repost: populatedRepost });
    
    // Notify original post author
    if (originalPost.author._id.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: originalPost.author._id,
          sender: req.user._id,
          message: `${req.user.username} reposted your wall post!`,
          type: 'WALL_REPOST',
          data: { postId: originalPost._id, repostId: repost._id },
        });
        
        // Emit SSE event
        const ssePayload = {
          userId: originalPost.author._id.toString(),
          event: 'notification',
          data: {
            type: 'notification',
            subtype: 'WALL_REPOST',
            sender: { _id: req.user._id, username: req.user.username },
            message: `${req.user.username} reposted your wall post!`,
            postId: originalPost._id,
            repostId: repost._id,
            createdAt: new Date()
          }
        };
        eventEmitter.emit('userEvent', ssePayload);
      } catch (e) {
        console.error('Failed to create repost notification:', e);
      }
    }
    
    // Emit wall post event for real-time updates
    try {
      eventEmitter.emit('wall_post', {
        type: 'repost',
        postId: repost._id.toString(),
        originalPostId: postId,
        wallOwnerUsername: req.user.username,
        authorUsername: req.user.username,
        repost: populatedRepost // Include the fully populated repost with originalComments
      });
    } catch (e) {
      console.error('Failed to emit repost event:', e);
    }
    
  } catch (error) {
    console.error('Error reposting:', error);
    res.status(500).json({ success: false, error: 'Failed to repost' });
  }
});

/**
 * Remove a repost (unrepost)
 * DELETE /api/wall/post/:postId/repost
 */
router.delete('/post/:postId/repost', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Find and delete the repost
    const repost = await WallPost.findOneAndDelete({
      author: req.user._id,
      recipient: req.user._id,
      originalPost: postId,
      isRepost: true
    });
    
    if (!repost) {
      return res.status(404).json({ success: false, error: 'Repost not found' });
    }
    
    // Update original post repost count and remove from reposts array
    await WallPost.findByIdAndUpdate(postId, {
      $pull: { reposts: req.user._id },
      $inc: { repostCount: -1 }
    });
    
    res.json({ success: true, message: 'Repost removed' });
    
    // Emit wall post event for real-time updates
    try {
      eventEmitter.emit('wall_post', {
        type: 'unrepost',
        postId: repost._id.toString(),
        originalPostId: postId,
        wallOwnerUsername: req.user.username,
        authorUsername: req.user.username
      });
    } catch (e) {
      console.error('Failed to emit unrepost event:', e);
    }
    
  } catch (error) {
    console.error('Error removing repost:', error);
    res.status(500).json({ success: false, error: 'Failed to remove repost' });
  }
});

/**
 * Track a view on a wall post
 * POST /api/wall/post/:postId/view
 */
router.post('/post/:postId/view', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body; // Optional - for logged in users
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    // Check if this user/IP already viewed this post recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingView = post.views.find(view => {
      if (userId && view.user) {
        return view.user.toString() === userId && view.viewedAt > oneHourAgo;
      }
      return view.ipAddress === ipAddress && view.viewedAt > oneHourAgo;
    });
    
    if (!existingView) {
      // Add new view
      post.views.push({
        user: userId || null,
        viewedAt: new Date(),
        ipAddress: ipAddress
      });
      post.viewCount = post.views.length;
      await post.save();
    }
    
    res.json({ success: true, viewCount: post.viewCount });
    
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, error: 'Failed to track view' });
  }
});

/**
 * Get repost status for a post
 * GET /api/wall/post/:postId/repost-status
 */
router.get('/post/:postId/repost-status', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Check if user has reposted this post
    const repost = await WallPost.findOne({
      author: req.user._id,
      recipient: req.user._id,
      originalPost: postId,
      isRepost: true
    });
    
    // Get original post repost count
    const originalPost = await WallPost.findById(postId).select('repostCount reposts');
    
    res.json({ 
      success: true, 
      hasReposted: !!repost,
      repostCount: originalPost?.repostCount || 0,
      reposts: originalPost?.reposts || []
    });
    
  } catch (error) {
    console.error('Error getting repost status:', error);
    res.status(500).json({ success: false, error: 'Failed to get repost status' });
  }
});

module.exports = router; 