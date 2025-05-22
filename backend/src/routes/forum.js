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
  ForumPost,
  generateSlug
} = require('../models/Forum');
const { AdminActionLog } = require('../models/SecurityLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * @route   GET /api/forum/categories
 * @desc    Get all forum categories
 * @access  Public
 */
router.get('/categories', async (req, res, next) => {
  try {
    // Find all categories (no isActive filter, for legacy compatibility)
    const categories = await ForumCategory.find({})
      .sort({ order: 1 })
      .lean();
      
    for (const category of categories) {
      // Find all topics for this category
      const topics = await ForumTopic.find({ category: category._id }).select('_id');
      const topicIds = topics.map(t => t._id);

      // Count threads: those linked by topic OR directly by category (legacy)
      category.threadCount = await ForumThread.countDocuments({
        $or: [
          { topic: { $in: topicIds } },
          { category: category._id }
        ]
      });

      // Find all threads for this category (for post counting)
      const threads = await ForumThread.find({
        $or: [
          { topic: { $in: topicIds } },
          { category: category._id }
        ]
      }).select('_id');
      const threadIds = threads.map(t => t._id);

      // Count posts for all threads in this category
      category.postCount = await ForumPost.countDocuments({
        thread: { $in: threadIds }
      });

      // Get last post info (optional, can be added later)
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
        .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
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
    .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
    .lean();
    
    // Get regular threads with pagination
    const threads = await ForumThread.find({ 
      topic: topic._id,
      isPinned: false
    })
    .sort(sortOption)
    .skip(skipNum)
    .limit(limitNum)
    .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
    .populate('lastPost.author', 'username mcUsername mcUUID webRank wallpaperId')
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
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;
    // Find thread by slug (case-insensitive)
    const thread = await ForumThread.findOne({ slug: { $regex: `^${slug}$`, $options: 'i' } })
      .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
      .populate({ path: 'topic', populate: { path: 'category' } });
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    // Increment views
    thread.views = (thread.views || 0) + 1;
    await thread.save();
    // Get posts for this thread
    const posts = await ForumPost.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .skip(skipNum)
      .limit(limitNum)
      .populate('author', 'username mcUsername mcUUID webRank wallpaperId');
    // Map thread and posts to use id and slug
    const threadObj = thread.toObject();
    // Always set mcUsername for thread author and attach counts BEFORE remapping _id
    if (threadObj.author) {
      threadObj.author.mcUsername = threadObj.author.mcUsername || threadObj.author.minecraftUsername || (threadObj.author.minecraft && threadObj.author.minecraft.mcUsername) || null;
      if (threadObj.author._id) {
        threadObj.author = await attachAuthorCounts(threadObj.author);
        threadObj.author.id = threadObj.author._id;
        delete threadObj.author._id;
      }
    }
    threadObj.id = threadObj._id;
    delete threadObj._id;
    if (!threadObj.slug) {
      const { generateSlug } = require('../models/Forum');
      threadObj.slug = generateSlug(threadObj.title || String(threadObj.id));
    }
    if (threadObj.topic && threadObj.topic._id) {
      threadObj.topic.id = threadObj.topic._id;
      delete threadObj.topic._id;
      if (threadObj.topic.category && threadObj.topic.category._id) {
        threadObj.topic.category.id = threadObj.topic.category._id;
        delete threadObj.topic.category._id;
      }
    }
    // Map posts and attach counts BEFORE remapping _id
    const formattedPosts = await Promise.all(posts.map(async post => {
      const postObj = post.toObject();
      // Always set mcUsername for post author and attach counts BEFORE remapping _id
      if (postObj.author) {
        postObj.author.mcUsername = postObj.author.mcUsername || postObj.author.minecraftUsername || (postObj.author.minecraft && postObj.author.minecraft.mcUsername) || null;
        if (postObj.author._id) {
          postObj.author = await attachAuthorCounts(postObj.author);
          postObj.author.id = postObj.author._id;
          delete postObj.author._id;
        }
      }
      postObj.id = postObj._id;
      delete postObj._id;
      // Ensure thanks array is always present and all IDs are strings
      postObj.thanks = (postObj.thanks || []).map(id => id.toString());
      return postObj;
    }));
    if (formattedPosts.length > 0) {
      formattedPosts[0].isOriginalPost = true;
    }
    const thanksCount = Array.isArray(formattedPosts[0]?.thanks) ? formattedPosts[0].thanks.length : 0;
    threadObj.thanksCount = thanksCount;
    res.status(200).json({
      success: true,
      thread: threadObj,
      posts: formattedPosts
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
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, content, topicId, categoryId, tags = [], pinned = false, locked = false } = req.body;

    // If topicId is provided, use new style (thread under topic)
    if (topicId) {
      const topic = await ForumTopic.findById(topicId).populate('category');
      if (!topic) {
        return next(new ErrorResponse('Topic not found', 404));
      }
      if (topic.category.requiredRank && req.user.webRank !== topic.category.requiredRank) {
        return next(new ErrorResponse('You do not have permission to post in this topic', 403));
      }
      // Explicitly generate slug
      const slug = generateSlug(title);
      const thread = new ForumThread({
        title,
        slug,
        topic: topicId,
        author: req.user._id,
        content,
        tags: tags.filter(tag => tag.trim() !== '').map(tag => tag.trim()),
        isPinned: pinned,
        isLocked: locked,
        lastPost: {
          author: req.user._id,
          date: Date.now()
        }
      });
      await thread.save();
      // Create initial post
      const post = await ForumPost.create({
        thread: thread._id,
        author: req.user._id,
        content,
        isOriginalPost: true
      });
      // Set firstPost reference
      thread.firstPost = post._id;
      await thread.save();
      // Create notification
      await createThreadNotification(req.user._id, title, thread._id, topic.name);
      return res.status(201).json({
        success: true,
        data: {
          thread: {
            id: thread._id,
            slug: thread.slug,
            title: thread.title
          }
        }
      });
    }

    // If only categoryId is provided, use legacy style (thread under category)
    if (categoryId) {
      // Validate category
      const category = await ForumCategory.findById(categoryId);
      if (!category) {
        return next(new ErrorResponse('Category not found', 404));
      }
      // Explicitly generate slug
      const slug = generateSlug(title);
      const thread = new ForumThread({
        title,
        slug,
        category: mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : categoryId,
        author: req.user._id,
        content,
        tags: tags.filter(tag => tag.trim() !== '').map(tag => tag.trim()),
        isPinned: pinned,
        isLocked: locked,
        lastPost: {
          author: req.user._id,
          date: Date.now()
        }
      });
      await thread.save();
      // Create initial post
      const post = await ForumPost.create({
        thread: thread._id,
        author: req.user._id,
        content,
        isOriginalPost: true
      });
      // Set firstPost reference
      thread.firstPost = post._id;
      await thread.save();
      // Create notification
      await createThreadNotification(req.user._id, title, thread._id, category.name);
      return res.status(201).json({
        success: true,
        data: {
          thread: {
            id: thread._id,
            title: thread.title
          }
        }
      });
    }

    // If neither topicId nor categoryId is provided, return error
    return res.status(400).json({ success: false, message: 'Either topicId or categoryId is required' });
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
 * @route   POST /api/forum/post/:id/thanks
 * @desc    Toggle thanks for a post (cannot thank own post)
 * @access  Private
 */
router.post('/post/:id/thanks', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Find post
    const post = await ForumPost.findById(id);
    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }
    // Prevent users from thanking their own post (DISABLED FOR TESTING)
    // if (post.author.equals(req.user._id)) {
    //   return res.status(403).json({ success: false, error: 'You cannot thank your own post.' });
    // }
    // Toggle thanks
    const alreadyThanked = post.thanks && post.thanks.some(userId => userId.equals(req.user._id));
    if (alreadyThanked) {
      post.thanks = post.thanks.filter(userId => !userId.equals(req.user._id));
    } else {
      post.thanks = post.thanks || [];
      post.thanks.push(req.user._id);
    }
    await post.save();
    res.status(200).json({
      success: true,
      thanked: !alreadyThanked,
      thanksCount: post.thanks.length
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
router.put('/admin/thread/:id', protect, authorize('owner'), async (req, res, next) => {
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

/**
 * @route   GET /api/forum/categories/:categoryId/threads
 * @desc    Get all threads for a given category (by categoryId)
 * @access  Public
 */
router.get('/categories/:categoryId/threads', async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { sort = 'newest' } = req.query;
    // Convert categoryId to ObjectId if valid
    const categoryObjectId = mongoose.Types.ObjectId.isValid(categoryId)
      ? new mongoose.Types.ObjectId(categoryId)
      : categoryId;
    // Find all topics for this category
    const topics = await ForumTopic.find({ category: categoryObjectId }).select('_id');
    const topicIds = topics.map(t => t._id);
    // Determine sort option
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'popular') sortOption = { views: -1 };
    // Find all threads for these topics OR directly linked to the category (legacy)
    const threads = await ForumThread.find({
      $or: [
        { topic: { $in: topicIds } },
        { category: categoryObjectId }
      ]
    })
      .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
      .sort(sortOption);
    // Format threads for frontend
    const formattedThreads = await Promise.all(threads.map(async thread => {
      // Calculate replyCount as number of posts minus one (the original post)
      const postCount = await ForumPost.countDocuments({ thread: thread._id });
      const replyCount = Math.max(0, postCount - 1); // Never negative
      // Find the first post and get thanks count
      const firstPost = await ForumPost.findOne({ thread: thread._id, isOriginalPost: true });
      const thanksCount = Array.isArray(firstPost?.thanks) ? firstPost.thanks.length : 0;
      return {
        id: thread._id,
        slug: thread.slug,
        title: thread.title,
        author: thread.author,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        replyCount,
        views: thread.views || 0,
        pinned: thread.isPinned || false,
        locked: thread.isLocked || false,
        thanksCount
      };
    }));
    res.status(200).json({
      success: true,
      threads: formattedThreads,
      totalPages: 1 // Pagination can be added later
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/forum/threads/:id
 * @desc    Get thread by ID with posts (legacy/frontend compatibility)
 * @access  Public
 */
router.get('/threads/:id', async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id)
      .populate('author', 'username mcUsername mcUUID webRank wallpaperId')
      .populate({
        path: 'topic',
        populate: { path: 'category' }
      });
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    // Increment views
    thread.views = (thread.views || 0) + 1;
    await thread.save();
    // Get posts for this thread
    const posts = await ForumPost.find({ thread: thread._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username mcUsername mcUUID webRank wallpaperId');
    // Map thread and posts to use 'id' instead of '_id', and always provide slug
    const threadObj = thread.toObject();
    // Always set mcUsername for thread author and attach counts BEFORE remapping _id
    if (threadObj.author) {
      threadObj.author.mcUsername = threadObj.author.mcUsername || threadObj.author.minecraftUsername || (threadObj.author.minecraft && threadObj.author.minecraft.mcUsername) || null;
      if (threadObj.author._id) {
        threadObj.author = await attachAuthorCounts(threadObj.author);
        threadObj.author.id = threadObj.author._id;
        delete threadObj.author._id;
      }
    }
    threadObj.id = threadObj._id;
    delete threadObj._id;
    if (!threadObj.slug) {
      const { generateSlug } = require('../models/Forum');
      threadObj.slug = generateSlug(threadObj.title || String(threadObj.id));
    }
    if (threadObj.topic && threadObj.topic._id) {
      threadObj.topic.id = threadObj.topic._id;
      delete threadObj.topic._id;
      if (threadObj.topic.category && threadObj.topic.category._id) {
        threadObj.topic.category.id = threadObj.topic.category._id;
        delete threadObj.topic.category._id;
      }
    }
    // Map posts and attach counts BEFORE remapping _id
    const formattedPosts = await Promise.all(posts.map(async post => {
      const postObj = post.toObject();
      // Always set mcUsername for post author and attach counts BEFORE remapping _id
      if (postObj.author) {
        postObj.author.mcUsername = postObj.author.mcUsername || postObj.author.minecraftUsername || (postObj.author.minecraft && postObj.author.minecraft.mcUsername) || null;
        if (postObj.author._id) {
          postObj.author = await attachAuthorCounts(postObj.author);
          postObj.author.id = postObj.author._id;
          delete postObj.author._id;
        }
      }
      postObj.id = postObj._id;
      delete postObj._id;
      // Ensure thanks array is always present and all IDs are strings
      postObj.thanks = (postObj.thanks || []).map(id => id.toString());
      return postObj;
    }));
    if (formattedPosts.length > 0) {
      formattedPosts[0].isOriginalPost = true;
    }
    const thanksCount = Array.isArray(formattedPosts[0]?.thanks) ? formattedPosts[0].thanks.length : 0;
    threadObj.thanksCount = thanksCount;
    res.status(200).json({
      success: true,
      thread: threadObj,
      posts: formattedPosts
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/forum/threads/:threadId/posts - Reply to a thread
router.post('/threads/:threadId/posts', protect, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    // Validate thread exists
    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }
    // Create post
    const post = await ForumPost.create({
      thread: thread._id,
      author: req.user._id,
      content: content.trim(),
      isOriginalPost: false
    });
    // Return formatted post
    return res.status(201).json({
      success: true,
      post: {
        id: post._id,
        author: post.author,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        thanks: post.thanks || [],
        isOriginalPost: post.isOriginalPost || false,
        edited: post.edited || false
      }
    });
  } catch (err) {
    next(err);
  }
});

// Allow thread owner or staff to delete a thread
router.delete('/thread/:id', protect, async (req, res, next) => {
  console.log('[DELETE THREAD] Requested ID:', req.params.id);
  const thread = await ForumThread.findById(req.params.id);
  console.log('[DELETE THREAD] Found thread:', thread ? thread._id : 'NOT FOUND');
  if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
  // Only author or staff can delete
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });
    // Only author or staff can delete
    if (!thread.author.equals(req.user._id) && !['admin','moderator','owner'].includes(req.user.webRank)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this thread' });
    }
    // Delete all posts in the thread
    await ForumPost.deleteMany({ thread: thread._id });
    await thread.deleteOne();
    res.json({ success: true, message: 'Thread deleted' });
  } catch (err) {
    next(err);
  }
});

// Allow post owner or staff to delete a post
router.delete('/post/:id', protect, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    // Only author or staff can delete
    if (!post.author.equals(req.user._id) && !['admin','moderator','owner'].includes(req.user.webRank)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// Edit post content (owner or staff only)
router.put('/post/:id', protect, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    // Only author or staff can edit
    if (!post.author.equals(req.user._id) && !['admin','moderator','owner'].includes(req.user.webRank)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    post.content = content.trim();
    post.edited = true;
    post.editDate = Date.now();
    post.editedBy = req.user._id;
    await post.save();
    res.json({ success: true, post: {
      id: post._id,
      content: post.content,
      edited: post.edited,
      editDate: post.editDate,
      editedBy: post.editedBy,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }});
  } catch (err) {
    next(err);
  }
});

// Utility to attach post/thread counts to an author object
async function attachAuthorCounts(author) {
  if (!author || !author._id) return author;
  const [postCount, threadCount] = await Promise.all([
    ForumPost.countDocuments({ author: author._id }),
    ForumThread.countDocuments({ author: author._id })
  ]);
  return { ...author, postCount, threadCount };
}

// Helper function to create a notification when a thread is created
async function createThreadNotification(userId, threadTitle, threadId, categoryName) {
  try {
    const notification = new Notification({
      recipient: userId,
      type: 'forum_thread',
      message: `You created a new thread "${threadTitle}" in ${categoryName}`,
      data: {
        threadId: threadId,
        threadTitle: threadTitle,
        categoryName: categoryName
      },
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    console.log(`Created notification for thread creation: ${threadId}`);
    return notification;
  } catch (error) {
    console.error('Error creating thread notification:', error);
    return null;
  }
}

module.exports = router;