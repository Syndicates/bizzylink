/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file forum.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const { 
  ForumCategory, 
  ForumTopic, 
  ForumThread, 
  ForumPost 
} = require('../models/Forum');
const { AdminActionLog } = require('../models/SecurityLog');

/**
 * @route   GET /api/forum/categories
 * @desc    Get all forum categories
 * @access  Public
 */
router.get('/categories', async (req, res, next) => {
  try {
    // Find active categories
    const categories = await ForumCategory.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
      
    // For each category, get stats
    for (const category of categories) {
      // Count topics
      category.topicCount = await ForumTopic.countDocuments({ 
        category: category._id,
        isActive: true 
      });
      
      // Count threads
      const topics = await ForumTopic.find({ category: category._id }).select('_id');
      const topicIds = topics.map(t => t._id);
      
      category.threadCount = await ForumThread.countDocuments({
        topic: { $in: topicIds }
      });
      
      // Count posts
      const threads = await ForumThread.find({ topic: { $in: topicIds } }).select('_id');
      const threadIds = threads.map(t => t._id);
      
      category.postCount = await ForumPost.countDocuments({
        thread: { $in: threadIds }
      });
      
      // Get last post info
      const lastPost = await ForumPost.findOne({ thread: { $in: threadIds } })
        .sort({ createdAt: -1 })
        .populate('thread', 'title')
        .populate('author', 'username')
        .lean();
        
      if (lastPost) {
        category.lastPost = {
          title: lastPost.thread.title,
          author: lastPost.author.username,
          date: lastPost.createdAt
        };
      }
    }
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/forum/category/:slug
 * @desc    Get forum category by slug
 * @access  Public/Private (depends on category settings)
 */
router.get('/category/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Find category by slug
    const category = await ForumCategory.findOne({ slug, isActive: true });
    
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
    
    // Check if category requires authentication
    if (category.requiresAuth && !req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }
    
    // Check if category requires specific rank
    if (category.requiredRank && req.user && req.user.webRank !== category.requiredRank) {
      return next(new ErrorResponse('You do not have permission to view this category', 403));
    }
    
    // Get category stats
    const topicCount = await ForumTopic.countDocuments({ 
      category: category._id,
      isActive: true 
    });
    
    // Get topics
    const topics = await ForumTopic.find({ 
      category: category._id,
      isActive: true 
    }).sort({ order: 1 });
    
    // For each topic, get stats
    const topicsWithStats = [];
    for (const topic of topics) {
      // Count threads
      const threadCount = await ForumThread.countDocuments({ topic: topic._id });
      
      // Count posts
      const threads = await ForumThread.find({ topic: topic._id }).select('_id');
      const threadIds = threads.map(t => t._id);
      
      const postCount = await ForumPost.countDocuments({
        thread: { $in: threadIds }
      });
      
      // Get last post info
      const lastPost = await ForumPost.findOne({ thread: { $in: threadIds } })
        .sort({ createdAt: -1 })
        .populate('thread', 'title')
        .populate('author', 'username')
        .lean();
        
      let lastPostInfo = null;
      if (lastPost) {
        lastPostInfo = {
          title: lastPost.thread.title,
          author: lastPost.author.username,
          date: lastPost.createdAt
        };
      }
      
      topicsWithStats.push({
        ...topic.toObject(),
        threadCount,
        postCount,
        lastPost: lastPostInfo
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        category,
        topicCount,
        topics: topicsWithStats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/forum/topic/:slug
 * @desc    Get forum topic by slug
 * @access  Public/Private (depends on parent category settings)
 */
router.get('/topic/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;
    
    // Find topic by slug
    const topic = await ForumTopic.findOne({ slug, isActive: true })
      .populate('category');
      
    if (!topic) {
      return next(new ErrorResponse('Topic not found', 404));
    }
    
    // Check if parent category requires authentication
    if (topic.category.requiresAuth && !req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }
    
    // Check if parent category requires specific rank
    if (topic.category.requiredRank && req.user && req.user.webRank !== topic.category.requiredRank) {
      return next(new ErrorResponse('You do not have permission to view this topic', 403));
    }
    
    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default newest first
    
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }
    
    // First get pinned threads (always on top)
    const pinnedThreads = await ForumThread.find({ 
      topic: topic._id,
      isPinned: true
    })
    .sort(sortOption)
    .populate('author', 'username')
    .lean();
    
    // Get regular threads with pagination
    const threads = await ForumThread.find({ 
      topic: topic._id,
      isPinned: false
    })
    .sort(sortOption)
    .skip(skipNum)
    .limit(limitNum)
    .populate('author', 'username')
    .populate('lastPost.author', 'username')
    .lean();
    
    // Get total thread count for pagination
    const totalThreads = await ForumThread.countDocuments({ 
      topic: topic._id,
      isPinned: false
    });
    
    // Combine pinned and regular threads
    const allThreads = [...pinnedThreads, ...threads];
    
    // Enhance threads with additional info
    for (const thread of allThreads) {
      // Get reply count
      thread.replyCount = await ForumPost.countDocuments({ 
        thread: thread._id,
        isOriginalPost: false
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        topic,
        threads: allThreads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalThreads,
          totalPages: Math.ceil(totalThreads / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/forum/thread/:slug
 * @desc    Get thread by slug with posts
 * @access  Public/Private (depends on parent category settings)
 */
router.get('/thread/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;
    
    // Get thread with related data
    const thread = await ForumThread.findOne({ slug })
      .populate('author', 'username')
      .populate({
        path: 'topic',
        populate: { path: 'category' }
      });
    
    if (!thread) {
      return next(new ErrorResponse('Thread not found', 404));
    }
    
    // Check if parent category requires authentication
    if (thread.topic.category.requiresAuth && !req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }
    
    // Check if parent category requires specific rank
    if (thread.topic.category.requiredRank && req.user && req.user.webRank !== thread.topic.category.requiredRank) {
      return next(new ErrorResponse('You do not have permission to view this thread', 403));
    }
    
    // Increment view count
    thread.views += 1;
    await thread.save();
    
    // Get posts with pagination
    const posts = await ForumPost.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .skip(skipNum)
      .limit(limitNum)
      .populate('author', 'username webRank activeTitle');
      
    // For each post, add author's title
    for (const post of posts) {
      if (post.author.activeTitle) {
        const author = await User.findById(post.author._id);
        const title = author.titles.find(t => t.id === author.activeTitle);
        
        if (title) {
          post.author.titleName = title.name;
          post.author.titleColor = title.textColor;
          post.author.titleRarity = title.rarity;
        }
      }
    }
    
    // Get total post count for pagination
    const totalPosts = await ForumPost.countDocuments({ thread: thread._id });
    
    res.status(200).json({
      success: true,
      data: {
        thread,
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/forum/thread
 * @desc    Create a new thread
 * @access  Private
 */
router.post('/thread', protect, [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('topicId')
    .notEmpty()
    .withMessage('Topic ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { title, content, topicId, tags = [] } = req.body;
    
    // Validate topic
    const topic = await ForumTopic.findById(topicId)
      .populate('category');
      
    if (!topic) {
      return next(new ErrorResponse('Topic not found', 404));
    }
    
    // Check if parent category requires specific rank
    if (topic.category.requiredRank && req.user.webRank !== topic.category.requiredRank) {
      return next(new ErrorResponse('You do not have permission to post in this topic', 403));
    }
    
    // Create thread
    const thread = await ForumThread.create({
      title,
      topic: topicId,
      author: req.user._id,
      content, // Temporarily store content in thread
      tags: tags.filter(tag => tag.trim() !== '').map(tag => tag.trim()),
      lastPost: {
        author: req.user._id,
        date: Date.now()
      }
    });
    
    // Create initial post
    const post = await ForumPost.create({
      thread: thread._id,
      author: req.user._id,
      content,
      isOriginalPost: true
    });
    
    // Remove content from thread (it's now in the post)
    thread.content = undefined;
    await thread.save();
    
    res.status(201).json({
      success: true,
      data: {
        thread: {
          id: thread._id,
          slug: thread.slug,
          title: thread.title
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/forum/post
 * @desc    Create a new post (reply)
 * @access  Private
 */
router.post('/post', protect, [
  body('content')
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('threadId')
    .notEmpty()
    .withMessage('Thread ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { content, threadId } = req.body;
    
    // Validate thread
    const thread = await ForumThread.findById(threadId)
      .populate({
        path: 'topic',
        populate: { path: 'category' }
      });
      
    if (!thread) {
      return next(new ErrorResponse('Thread not found', 404));
    }
    
    // Check if thread is locked
    if (thread.isLocked && !['admin', 'moderator', 'owner'].includes(req.user.webRank)) {
      return next(new ErrorResponse('Thread is locked', 403));
    }
    
    // Check if parent category requires specific rank
    if (thread.topic.category.requiredRank && req.user.webRank !== thread.topic.category.requiredRank) {
      return next(new ErrorResponse('You do not have permission to post in this thread', 403));
    }
    
    // Create post
    const post = await ForumPost.create({
      thread: threadId,
      author: req.user._id,
      content
    });
    
    // Update thread's lastPost
    thread.lastPost = {
      author: req.user._id,
      date: Date.now()
    };
    await thread.save();
    
    res.status(201).json({
      success: true,
      data: {
        post: {
          id: post._id,
          content: post.content,
          createdAt: post.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/forum/post/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.post('/post/:id/like', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find post
    const post = await ForumPost.findById(id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Check if user already liked this post
    if (post.likes.includes(req.user._id)) {
      return next(new ErrorResponse('You already liked this post', 400));
    }
    
    // Add user to likes
    post.likes.push(req.user._id);
    await post.save();
    
    res.status(200).json({
      success: true,
      data: {
        likes: post.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/forum/post/:id/unlike
 * @desc    Unlike a post
 * @access  Private
 */
router.post('/post/:id/unlike', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find post
    const post = await ForumPost.findById(id);
    
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    
    // Remove user from likes
    post.likes = post.likes.filter(userId => !userId.equals(req.user._id));
    await post.save();
    
    res.status(200).json({
      success: true,
      data: {
        likes: post.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ADMIN ROUTES
 */

/**
 * @route   POST /api/forum/admin/category
 * @desc    Create a new category
 * @access  Private (Admin/Moderator only)
 */
router.post('/admin/category', protect, authorize('admin', 'owner', 'moderator'), [
  body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      icon, 
      order, 
      requiresAuth = false, 
      requiredRank = null
    } = req.body;
    
    // Create category
    const category = await ForumCategory.create({
      name,
      description,
      icon,
      order,
      requiresAuth,
      requiredRank
    });
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'CREATE_FORUM_CATEGORY',
      resource: 'ForumCategory',
      details: {
        categoryId: category._id,
        categoryName: category.name
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/forum/admin/topic
 * @desc    Create a new topic
 * @access  Private (Admin/Moderator only)
 */
router.post('/admin/topic', protect, authorize('admin', 'owner', 'moderator'), [
  body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { 
      name, 
      description, 
      icon, 
      order, 
      categoryId 
    } = req.body;
    
    // Validate category
    const category = await ForumCategory.findById(categoryId);
    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }
    
    // Create topic
    const topic = await ForumTopic.create({
      name,
      description,
      icon,
      order,
      category: categoryId
    });
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'CREATE_FORUM_TOPIC',
      resource: 'ForumTopic',
      details: {
        topicId: topic._id,
        topicName: topic.name,
        categoryId: category._id,
        categoryName: category.name
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      data: topic
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/forum/admin/thread/:id
 * @desc    Update thread (pin/unpin, lock/unlock)
 * @access  Private (Admin/Moderator only)
 */
router.put('/admin/thread/:id', protect, authorize('admin', 'owner', 'moderator'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPinned, isLocked } = req.body;
    
    // Find thread
    const thread = await ForumThread.findById(id);
    
    if (!thread) {
      return next(new ErrorResponse('Thread not found', 404));
    }
    
    // Update thread
    if (isPinned !== undefined) {
      thread.isPinned = isPinned;
    }
    
    if (isLocked !== undefined) {
      thread.isLocked = isLocked;
    }
    
    await thread.save();
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'UPDATE_FORUM_THREAD',
      resource: 'ForumThread',
      details: {
        threadId: thread._id,
        threadTitle: thread.title,
        changes: {
          isPinned: isPinned !== undefined ? isPinned : undefined,
          isLocked: isLocked !== undefined ? isLocked : undefined
        }
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;