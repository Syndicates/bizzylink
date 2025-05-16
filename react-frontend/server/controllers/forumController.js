/**
 * Forum Controller
 * Handles business logic for forum routes
 */
const ForumCategory = require('../models/ForumCategory');
const ForumTopic = require('../models/ForumTopic');
const ForumThread = require('../models/ForumThread');
const ForumPost = require('../models/ForumPost');
const MinecraftNotificationService = require('../services/MinecraftNotificationService');

// Create a URL-friendly slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

/**
 * Get all categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await ForumCategory.find()
      .sort({ order: 1, name: 1 })
      .lean();
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    res.status(500).json({ message: 'Error fetching forum categories' });
  }
};

/**
 * Get a specific category with its topics
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find the category
    const category = await ForumCategory.findById(categoryId).lean();
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Find all topics in this category
    const topics = await ForumTopic.find({ categoryId })
      .sort({ order: 1, name: 1 })
      .lean();
    
    res.json({
      ...category,
      topics
    });
  } catch (error) {
    console.error('Error fetching category details:', error);
    res.status(500).json({ message: 'Error fetching category details' });
  }
};

/**
 * Get threads within a topic
 */
exports.getTopicThreads = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Validate the topic exists
    const topic = await ForumTopic.findById(topicId);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Determine the sort order
    let sortOptions = {};
    
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'popular':
        sortOptions = { 'stats.replies': -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // First find all pinned threads
    const pinnedThreads = await ForumThread.find({
      topicId,
      pinned: true
    })
      .sort({ createdAt: -1 })
      .lean()
      .populate('authorId', 'username role forum_rank avatarUrl');
    
    // Then find regular threads with pagination
    const regularThreads = await ForumThread.find({
      topicId,
      pinned: false
    })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean()
      .populate('authorId', 'username role forum_rank avatarUrl');
    
    // Combine pinned and regular threads
    const threads = [...pinnedThreads, ...regularThreads];
    
    // Get total count for pagination
    const totalThreads = await ForumThread.countDocuments({
      topicId,
      pinned: false
    });
    
    const totalPages = Math.ceil(totalThreads / limitNum);
    
    res.json({
      topic,
      threads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalThreads,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching topic threads:', error);
    res.status(500).json({ message: 'Error fetching topic threads' });
  }
};

/**
 * Get a thread with its posts
 */
exports.getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Find the thread and increment views
    const thread = await ForumThread.findByIdAndUpdate(
      threadId,
      { $inc: { 'stats.views': 1 } },
      { new: true }
    )
      .populate('authorId', 'username role forum_rank avatarUrl')
      .populate('topicId', 'name slug categoryId')
      .lean();
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Get category info for breadcrumbs
    const category = await ForumCategory.findById(thread.topicId.categoryId)
      .select('name slug')
      .lean();
    
    // Find posts with pagination, always include first post
    let posts = [];
    
    if (pageNum === 1) {
      // For first page, always include original post
      posts = await ForumPost.find({ threadId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('authorId', 'username role forum_rank avatarUrl createdAt')
        .lean();
    } else {
      // For subsequent pages, exclude original post
      const originalPost = await ForumPost.findOne({
        threadId,
        isOriginalPost: true
      }).lean();
      
      // Get other posts with pagination
      const otherPosts = await ForumPost.find({
        threadId,
        isOriginalPost: false
      })
        .sort({ createdAt: 1 })
        .skip(skip - 1) // Adjust for original post
        .limit(limitNum)
        .populate('authorId', 'username role forum_rank avatarUrl createdAt')
        .lean();
      
      posts = otherPosts;
    }
    
    // Get total count for pagination
    const totalPosts = await ForumPost.countDocuments({ threadId });
    const totalPages = Math.ceil(totalPosts / limitNum);
    
    res.json({
      thread,
      category,
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPosts,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ message: 'Error fetching thread' });
  }
};

/**
 * Create a new thread
 */
exports.createThread = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, content, tags = [], isPinned = false, isLocked = false, notifyInGame = false } = req.body;
    const userId = req.user._id;
    
    // Check if user has permission to pin/lock threads
    const canPinLock = (req.user.role === 'admin' || req.user.role === 'moderator' ||
                         req.user.forum_rank === 'admin' || req.user.forum_rank === 'moderator');
    
    if ((isPinned || isLocked || notifyInGame) && !canPinLock) {
      return res.status(403).json({ 
        message: 'You do not have permission to pin or lock threads or send in-game notifications'
      });
    }
    
    // Create slug from title
    const slug = createSlug(title);
    
    // Check if topic exists
    const topic = await ForumTopic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    // Create the thread
    const thread = new ForumThread({
      topicId,
      title,
      slug,
      authorId: userId,
      pinned: canPinLock ? isPinned : false,
      locked: canPinLock ? isLocked : false,
      notifyInGame: canPinLock ? notifyInGame : false,
      tags: tags || [],
      stats: {
        views: 0,
        replies: 0
      }
    });
    
    await thread.save();
    
    // Create the first post
    const post = new ForumPost({
      threadId: thread._id,
      authorId: userId,
      content,
      isOriginalPost: true
    });
    
    await post.save();
    
    // Update thread with post reference
    thread.stats.lastReply = {
      author: req.user.username,
      date: new Date(),
      postId: post._id
    };
    
    await thread.save();
    
    // Update topic stats
    await ForumTopic.findByIdAndUpdate(topicId, {
      $inc: { 'stats.threads': 1, 'stats.posts': 1 },
      $set: {
        'stats.lastPost.title': title,
        'stats.lastPost.author': req.user.username,
        'stats.lastPost.date': new Date(),
        'stats.lastPost.threadId': thread._id
      }
    });
    
    // Update category stats
    await ForumCategory.findByIdAndUpdate(topic.categoryId, {
      $inc: { 'stats.threads': 1, 'stats.posts': 1 },
      $set: {
        'stats.lastPost.title': title,
        'stats.lastPost.author': req.user.username,
        'stats.lastPost.date': new Date()
      }
    });
    
    // Send Minecraft notification if enabled
    if (thread.notifyInGame) {
      try {
        await MinecraftNotificationService.notifyForumThread(thread, req.user);
        
        // Update notification status
        thread.notifiedAt = new Date();
        thread.notificationCount = 1;
        await thread.save();
      } catch (notifyErr) {
        console.error('Failed to send Minecraft notification:', notifyErr);
        // Don't fail the request if notification fails
      }
    }
    
    res.status(201).json({
      thread,
      post,
      message: 'Thread created successfully'
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ message: 'Error creating thread', error: error.message });
  }
};

/**
 * Create a reply to a thread
 */
exports.createPost = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    
    // Check if thread exists and is not locked
    const thread = await ForumThread.findById(threadId)
      .populate('authorId', 'username mcUsername');
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Check if thread is locked (and user is not admin/moderator)
    const isAdminOrMod = (req.user.role === 'admin' || req.user.role === 'moderator' ||
                         req.user.forum_rank === 'admin' || req.user.forum_rank === 'moderator');
      
    if (thread.locked && !isAdminOrMod) {
      return res.status(403).json({ message: 'This thread is locked' });
    }
    
    // Create the post
    const post = new ForumPost({
      threadId,
      authorId: userId,
      content,
      isOriginalPost: false
    });
    
    await post.save();
    
    // Update thread stats
    await ForumThread.findByIdAndUpdate(threadId, {
      $inc: { 'stats.replies': 1 },
      $set: {
        'stats.lastReply.author': req.user.username,
        'stats.lastReply.date': new Date(),
        'stats.lastReply.postId': post._id
      }
    });
    
    // Update topic stats
    const topic = await ForumTopic.findById(thread.topicId);
    await ForumTopic.findByIdAndUpdate(thread.topicId, {
      $inc: { 'stats.posts': 1 },
      $set: {
        'stats.lastPost.title': thread.title,
        'stats.lastPost.author': req.user.username,
        'stats.lastPost.date': new Date(),
        'stats.lastPost.threadId': thread._id
      }
    });
    
    // Update category stats
    await ForumCategory.findByIdAndUpdate(topic.categoryId, {
      $inc: { 'stats.posts': 1 },
      $set: {
        'stats.lastPost.title': thread.title,
        'stats.lastPost.author': req.user.username,
        'stats.lastPost.date': new Date()
      }
    });
    
    // If the author is not the one replying, send notification
    if (thread.authorId._id.toString() !== userId.toString()) {
      try {
        await MinecraftNotificationService.notifyThreadReply(
          post, 
          thread, 
          req.user, 
          thread.authorId
        );
      } catch (notifyErr) {
        console.error('Failed to send reply notification:', notifyErr);
        // Don't fail the request if notification fails
      }
    }
    
    res.status(201).json({
      post,
      message: 'Reply posted successfully'
    });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ message: 'Error posting reply', error: error.message });
  }
};

/**
 * Toggle like on a post
 */
exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    
    // Find the post
    const post = await ForumPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);
    
    if (alreadyLiked) {
      // Remove like
      await ForumPost.findByIdAndUpdate(postId, {
        $pull: { likes: userId }
      });
      
      return res.json({ liked: false, message: 'Like removed' });
    } else {
      // Add like
      await ForumPost.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId }
      });
      
      return res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

/**
 * Edit a post
 */
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    
    // Find the post
    const post = await ForumPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is author, moderator, or admin
    const isAuthor = post.authorId.toString() === userId.toString();
    const isAdminOrMod = (req.user.role === 'admin' || req.user.role === 'moderator' ||
                         req.user.forum_rank === 'admin' || req.user.forum_rank === 'moderator');
      
    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ message: 'You do not have permission to edit this post' });
    }
    
    // Update the post
    post.content = content;
    post.edited = true;
    post.editDate = new Date();
    
    await post.save();
    
    res.json({
      post,
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

/**
 * Admin/Moderator functions
 */

/**
 * Pin or unpin a thread
 */
exports.togglePinThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { pinned } = req.body;
    
    const thread = await ForumThread.findById(threadId);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    thread.pinned = !!pinned;
    await thread.save();
    
    res.json({
      thread,
      message: pinned ? 'Thread pinned successfully' : 'Thread unpinned successfully'
    });
  } catch (error) {
    console.error('Error updating thread pin status:', error);
    res.status(500).json({ message: 'Error updating thread pin status' });
  }
};

/**
 * Lock or unlock a thread
 */
exports.toggleLockThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { locked } = req.body;
    
    const thread = await ForumThread.findById(threadId);
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    thread.locked = !!locked;
    await thread.save();
    
    res.json({
      thread,
      message: locked ? 'Thread locked successfully' : 'Thread unlocked successfully'
    });
  } catch (error) {
    console.error('Error updating thread lock status:', error);
    res.status(500).json({ message: 'Error updating thread lock status' });
  }
};

/**
 * Send in-game notification for a thread
 */
exports.sendThreadNotification = async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const thread = await ForumThread.findById(threadId)
      .populate('authorId', 'username role forum_rank avatarUrl');
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Enable notification flag if not already enabled
    thread.notifyInGame = true;
    
    // Send notification to Minecraft server
    await MinecraftNotificationService.notifyForumThread(thread, req.user);
    
    // Update notification count and timestamp
    thread.notificationCount = (thread.notificationCount || 0) + 1;
    thread.notifiedAt = new Date();
    await thread.save();
    
    res.json({
      thread,
      message: 'In-game notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending in-game notification:', error);
    res.status(500).json({ message: 'Error sending in-game notification' });
  }
};

/**
 * Admin functions for forum structure management
 */

/**
 * Create a new category (admin only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, order } = req.body;
    
    // Create slug from name
    const slug = createSlug(name);
    
    // Create the category
    const category = new ForumCategory({
      name,
      description,
      icon,
      slug,
      order: order || 0,
      stats: {
        topics: 0,
        threads: 0,
        posts: 0
      }
    });
    
    await category.save();
    
    res.status(201).json({
      category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

/**
 * Create a new topic (admin only)
 */
exports.createTopic = async (req, res) => {
  try {
    const { categoryId, name, description, icon, order } = req.body;
    
    // Check if category exists
    const category = await ForumCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Create slug from name
    const slug = createSlug(name);
    
    // Create the topic
    const topic = new ForumTopic({
      categoryId,
      name,
      description,
      icon,
      slug,
      order: order || 0,
      stats: {
        threads: 0,
        posts: 0
      }
    });
    
    await topic.save();
    
    // Update category stats
    await ForumCategory.findByIdAndUpdate(categoryId, {
      $inc: { 'stats.topics': 1 }
    });
    
    res.status(201).json({
      topic,
      message: 'Topic created successfully'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Error creating topic', error: error.message });
  }
};