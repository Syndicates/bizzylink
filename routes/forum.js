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
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Category = require('../models/Category');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/User');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    console.log('Fetching forum categories from database...');
    // Debug mongoose connection
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Add explicit trace for debugging
    console.log('DB Name:', mongoose.connection.name);
    
    // First, update all users to ensure their post/thread counts are correct
    await updateUserStats();
    
    const categories = await Category.find().sort({ order: 1 });
    console.log(`Found ${categories.length} categories:`, 
      categories.map(c => c.name).join(', '));
    
    // For debugging, log the full objects
    if (categories.length > 0) {
      console.log('First category details:', JSON.stringify(categories[0], null, 2));
    }
    
    // Update category statistics too
    await updateCategoryStats();
    
    // Get updated categories after statistics update
    const updatedCategories = await Category.find().sort({ order: 1 });
    
    res.json(updatedCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update category statistics
async function updateCategoryStats() {
  try {
    // Get all categories
    const categories = await Category.find();
    
    // Process each category
    for (const category of categories) {
      // Count threads in this category
      const threadCount = await Thread.countDocuments({ category: category._id });
      
      // Count all posts in threads in this category
      const threads = await Thread.find({ category: category._id });
      let totalPosts = 0;
      
      for (const thread of threads) {
        const postCount = await Post.countDocuments({ thread: thread._id });
        totalPosts += postCount;
      }
      
      // Update counts if different
      if (category.threadCount !== threadCount || category.postCount !== totalPosts) {
        category.threadCount = threadCount;
        category.postCount = totalPosts;
        await category.save();
      }
    }
  } catch (error) {
    console.error('Error updating category statistics:', error);
  }
}

// Create a new category (admin only)
router.post('/categories', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.forum_rank !== 'admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const newCategory = new Category({
      name,
      description: description || '',
      order: order || 0
    });
    
    const category = await newCategory.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a category (admin only)
router.put('/categories/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.forum_rank !== 'admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, description, order } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    
    await category.save();
    res.json(category);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a category (admin only)
router.delete('/categories/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.forum_rank !== 'admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if there are threads in this category
    const threadsCount = await Thread.countDocuments({ category: req.params.id });
    if (threadsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing threads. Move or delete them first.' 
      });
    }
    
    await category.remove();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get threads by category
router.get('/categories/:categoryId/threads', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const threads = await Thread.find({ category: categoryId })
      .sort({ pinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar forum_rank postCount threadCount reputation vouches')
      .populate('lastPost.author', 'username avatar');
      
    const total = await Thread.countDocuments({ category: categoryId });
    
    res.json({
      threads,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching threads:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new thread
router.post('/threads', auth, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    
    if (!title || !content || !categoryId) {
      return res.status(400).json({ message: 'Title, content and category are required' });
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    const newThread = new Thread({
      title,
      author: req.user.id,
      category: categoryId,
      lastPost: {
        author: req.user.id,
        date: new Date()
      }
    });
    
    const thread = await newThread.save();
    
    // Create the first post in the thread
    const newPost = new Post({
      content,
      author: req.user.id,
      thread: thread._id
    });
    
    await newPost.save();
    
    // Update thread with first post
    thread.firstPost = newPost._id;
    await thread.save();
    
    // Increment the thread count for the category
    category.threadCount = (category.threadCount || 0) + 1;
    await category.save();
    
    // Update user's thread count and post count
    user.threadCount = (user.threadCount || 0) + 1;
    user.postCount = (user.postCount || 0) + 1;
    user.lastActive = new Date();
    await user.save();
    
    res.status(201).json({
      thread: {
        ...thread.toObject(),
        author: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          forum_rank: user.forum_rank,
          postCount: user.postCount,
          threadCount: user.threadCount,
          reputation: user.reputation,
          vouches: user.vouches,
          signature: user.signature
        }
      },
      post: newPost
    });
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a thread with its posts
router.get('/threads/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // First, update all users to ensure their post/thread counts are correct
    await updateUserStats();
    
    const thread = await Thread.findById(threadId)
      .populate('author', 'username avatar forum_rank postCount threadCount reputation vouches signature lastActive')
      .populate('category', 'name');
      
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Get the posts in the thread, including post likes data
    const posts = await Post.find({ thread: threadId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar forum_rank createdAt postCount threadCount reputation vouches signature lastActive')
      .populate({
        path: 'likes',
        select: 'username avatar'
      });
    
    // Make sure likes array exists on each post and populate accurate post counts for authors
    const postsWithLikes = await Promise.all(posts.map(async post => {
      const postObj = post.toObject();
      
      // Ensure likes array exists
      if (!postObj.likes) {
        postObj.likes = [];
      }
      
      // Get up-to-date post counts for this author
      if (postObj.author && postObj.author._id) {
        const authorId = postObj.author._id;
        const authorPostCount = await Post.countDocuments({ author: authorId });
        const authorThreadCount = await Thread.countDocuments({ author: authorId });
        
        // Override with accurate counts from database
        postObj.author.postCount = authorPostCount;
        postObj.author.threadCount = authorThreadCount;
      }
      
      return postObj;
    }));
    
    const total = await Post.countDocuments({ thread: threadId });
    
    // Get count of posts by author in this thread
    const authorPosts = {};
    if (posts.length > 0) {
      const authorIds = [...new Set(posts.map(post => 
        post.author._id ? post.author._id.toString() : post.author.toString()
      ))];
      
      for (const authorId of authorIds) {
        const count = await Post.countDocuments({ 
          thread: threadId, 
          author: authorId 
        });
        authorPosts[authorId] = count;
      }
    }
    
    // Get accurate like counts for each post
    const postLikes = {};
    for (const post of posts) {
      if (post._id) {
        const likesCount = await Post.findById(post._id).then(p => p.likes ? p.likes.length : 0);
        postLikes[post._id.toString()] = likesCount;
      }
    }
    
    // Increment view count
    thread.views += 1;
    await thread.save();
    
    // Update thread author stats
    if (thread.author && thread.author._id) {
      const authorId = thread.author._id;
      const authorPostCount = await Post.countDocuments({ author: authorId });
      const authorThreadCount = await Thread.countDocuments({ author: authorId });
      
      thread.author.postCount = authorPostCount;
      thread.author.threadCount = authorThreadCount;
    }
    
    res.json({
      thread,
      posts: postsWithLikes,
      authorPosts,
      postLikes,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update user stats
async function updateUserStats() {
  try {
    // Get all users
    const users = await User.find({});
    
    // Update each user's post and thread counts
    for (const user of users) {
      const postCount = await Post.countDocuments({ author: user._id });
      const threadCount = await Thread.countDocuments({ author: user._id });
      
      // Only update if different from current counts
      if (user.postCount !== postCount || user.threadCount !== threadCount) {
        user.postCount = postCount;
        user.threadCount = threadCount;
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Update a thread (owner or admin only)
router.put('/threads/:threadId', auth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, pinned, locked, categoryId } = req.body;
    
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const user = await User.findById(req.user.id);
    const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
    const isAuthor = thread.author.toString() === req.user.id;
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Regular users can only edit title
    if (title && (isAdmin || isAuthor)) {
      thread.title = title;
    }
    
    // Only admins can pin/unpin or lock/unlock threads
    if (isAdmin) {
      if (pinned !== undefined) thread.pinned = pinned;
      if (locked !== undefined) thread.locked = locked;
      
      // If moving to a different category
      if (categoryId && categoryId !== thread.category.toString()) {
        const oldCategoryId = thread.category;
        const newCategory = await Category.findById(categoryId);
        
        if (!newCategory) {
          return res.status(404).json({ message: 'Target category not found' });
        }
        
        // Update the thread's category
        thread.category = categoryId;
        
        // Update thread counts for both categories
        const oldCategory = await Category.findById(oldCategoryId);
        if (oldCategory) {
          oldCategory.threadCount = Math.max((oldCategory.threadCount || 0) - 1, 0);
          await oldCategory.save();
        }
        
        newCategory.threadCount = (newCategory.threadCount || 0) + 1;
        await newCategory.save();
      }
    }
    
    await thread.save();
    
    const updatedThread = await Thread.findById(threadId)
      .populate('author', 'username avatar forum_rank')
      .populate('category', 'name');
      
    res.json(updatedThread);
  } catch (err) {
    console.error('Error updating thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a thread (owner or admin only)
router.delete('/threads/:threadId', auth, async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const user = await User.findById(req.user.id);
    const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
    const isAuthor = thread.author.toString() === req.user.id;
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete all posts in the thread
    await Post.deleteMany({ thread: threadId });
    
    // Update category thread count
    const category = await Category.findById(thread.category);
    if (category) {
      category.threadCount = Math.max((category.threadCount || 0) - 1, 0);
      await category.save();
    }
    
    // Delete the thread
    await thread.remove();
    
    res.json({ message: 'Thread deleted successfully' });
  } catch (err) {
    console.error('Error deleting thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a post to a thread
router.post('/threads/:threadId/posts', auth, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    if (thread.locked) {
      return res.status(403).json({ message: 'This thread is locked' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Create empty likes array from the start
    const newPost = new Post({
      content,
      author: req.user.id,
      thread: threadId,
      likes: []
    });
    
    const post = await newPost.save();
    
    // Update the thread's last post info
    thread.lastPost = {
      author: req.user.id,
      date: new Date()
    };
    thread.replyCount = (thread.replyCount || 0) + 1;
    await thread.save();
    
    // Update category's post count
    const category = await Category.findById(thread.category);
    if (category) {
      category.postCount = (category.postCount || 0) + 1;
      await category.save();
    }
    
    // Update user's post count
    user.postCount = (user.postCount || 0) + 1;
    user.lastActive = new Date();
    await user.save();
    
    // Get count of this author's posts in this thread
    const authorPostCount = await Post.countDocuments({
      thread: threadId,
      author: req.user.id
    });
    
    // Populate the author data for response
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username avatar forum_rank createdAt postCount threadCount reputation vouches signature');
    
    // Make sure populatedPost has empty likes array
    const postWithData = populatedPost.toObject();
    if (!postWithData.likes) {
      postWithData.likes = [];
    }
    
    res.status(201).json({
      ...postWithData,
      authorPostCount
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a post (owner or admin only)
router.put('/posts/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const thread = await Thread.findById(post.thread);
    if (thread && thread.locked) {
      const user = await User.findById(req.user.id);
      const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'This thread is locked' });
      }
    }
    
    const isAuthor = post.author.toString() === req.user.id;
    const user = await User.findById(req.user.id);
    const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    post.content = content;
    post.edited = {
      date: new Date(),
      by: req.user.id
    };
    
    await post.save();
    
    const updatedPost = await Post.findById(postId)
      .populate('author', 'username avatar forum_rank createdAt')
      .populate('edited.by', 'username');
    
    res.json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post (owner or admin only)
router.delete('/posts/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const thread = await Thread.findById(post.thread);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    if (thread.locked) {
      const user = await User.findById(req.user.id);
      const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'This thread is locked' });
      }
    }
    
    const isAuthor = post.author.toString() === req.user.id;
    const user = await User.findById(req.user.id);
    const isAdmin = user.forum_rank === 'admin' || user.role === 'admin';
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if this is the first post in the thread
    // If so, delete the entire thread
    if (thread.firstPost && thread.firstPost.toString() === postId) {
      // Delete all posts in the thread
      await Post.deleteMany({ thread: thread._id });
      
      // Update category thread count
      const category = await Category.findById(thread.category);
      if (category) {
        category.threadCount = Math.max((category.threadCount || 0) - 1, 0);
        await category.save();
      }
      
      // Delete the thread
      await thread.remove();
      
      return res.json({ message: 'Thread and all posts deleted successfully', threadDeleted: true });
    }
    
    // Otherwise, just delete this post
    await post.remove();
    
    // Update the thread's reply count
    thread.replyCount = Math.max((thread.replyCount || 0) - 1, 0);
    
    // If this was the last post, update the last post info
    if (thread.lastPost && thread.lastPost.author.toString() === post.author.toString()) {
      // Find the new last post
      const latestPost = await Post.findOne({ thread: thread._id })
        .sort({ createdAt: -1 });
      
      if (latestPost) {
        thread.lastPost = {
          author: latestPost.author,
          date: latestPost.createdAt
        };
      }
    }
    
    await thread.save();
    
    // Update category's post count
    const category = await Category.findById(thread.category);
    if (category) {
      category.postCount = Math.max((category.postCount || 0) - 1, 0);
      await category.save();
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search threads and posts
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Search in thread titles
    const threads = await Thread.find({ 
      title: { $regex: q, $options: 'i' } 
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('author', 'username avatar postCount threadCount reputation vouches')
      .populate('category', 'name');
    
    // Search in post content
    const posts = await Post.find({ 
      content: { $regex: q, $options: 'i' } 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar postCount threadCount reputation vouches')
      .populate({
        path: 'thread',
        select: 'title category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });
    
    const totalPosts = await Post.countDocuments({ 
      content: { $regex: q, $options: 'i' } 
    });
    
    res.json({
      threads,
      posts,
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error searching forum:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Give reputation to a user
router.post('/reputation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { value, postId } = req.body; // value: 1 for positive, -1 for negative
    
    console.log(`Reputation request received - userId: ${userId}, value: ${value}, from user: ${req.user.id}`);
    
    // Parse value to number if it's a string
    const repValue = parseInt(value);
    
    if (repValue !== 1 && repValue !== -1) {
      console.log(`Invalid reputation value: ${value}, parsed as: ${repValue}`);
      return res.status(400).json({ message: 'Invalid reputation value' });
    }
    
    // Prevent users from giving themselves reputation
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot give reputation to yourself' });
    }
    
    // Get target user
    console.log(`Finding target user with ID: ${userId}`);
    const targetUser = await User.findById(userId);
      
    if (!targetUser) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found target user: ${targetUser.username} (${targetUser._id})`);
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    console.log(`Current user: ${currentUser.username} (${currentUser._id})`);
    
    // Initialize reputationFrom array if it doesn't exist
    if (!targetUser.reputationFrom) {
      console.log('Initializing empty reputationFrom array');
      targetUser.reputationFrom = [];
    }
    
    // Check if user has already given reputation to this user
    const existingRepIndex = targetUser.reputationFrom.findIndex(rep => {
      try {
        if (!rep || !rep.user) return false;
        
        // Handle different ways the user ID might be stored
        const repUserId = rep.user._id ? rep.user._id.toString() : 
                         (typeof rep.user === 'string' ? rep.user : 
                         (typeof rep.user === 'object' ? rep.user.toString() : null));
        
        console.log(`Comparing rep user ID: ${repUserId} with current user ID: ${req.user.id}`);
        return repUserId === req.user.id;
      } catch (err) {
        console.error('Error in reputation comparison:', err);
        return false;
      }
    });
    
    const existingRep = existingRepIndex !== -1 ? targetUser.reputationFrom[existingRepIndex] : null;
    console.log(`Existing reputation entry found: ${!!existingRep}`);
    
    if (existingRep) {
      // If the value is the same, prevent duplicate action
      if (existingRep.value === repValue) {
        return res.status(400).json({ 
          message: repValue === 1 ? 'You have already given positive reputation to this user' : 
                              'You have already given negative reputation to this user' 
        });
      }
      
      console.log(`Updating reputation from ${existingRep.value} to ${repValue}`);
      
      // If changing from positive to negative or vice versa, update the value
      targetUser.reputationFrom[existingRepIndex].value = repValue;
      targetUser.reputationFrom[existingRepIndex].date = new Date();
      
      // Update the total reputation count
      // If changing from +1 to -1, that's a -2 change
      // If changing from -1 to +1, that's a +2 change
      const reputationChange = repValue === 1 ? 2 : -2;
      targetUser.reputation = (targetUser.reputation || 0) + reputationChange;
      console.log(`Updated reputation total: ${targetUser.reputation}`);
    } else {
      // Add new reputation entry
      console.log(`Adding new reputation entry with value: ${repValue}`);
      targetUser.reputationFrom.push({
        user: req.user.id,
        value: repValue,
        date: new Date()
      });
      
      // Update total reputation
      targetUser.reputation = (targetUser.reputation || 0) + repValue;
      console.log(`Updated reputation total: ${targetUser.reputation}`);
    }
    
    await targetUser.save();
    console.log('Saved target user with updated reputation');
    
    // For safety, check and initialize reputation stats
    const positiveCount = targetUser.reputationFrom.filter(rep => rep.value === 1).length;
    const negativeCount = targetUser.reputationFrom.filter(rep => rep.value === -1).length;
    
    // Create notification for the target user
    if (targetUser.settings?.notifications?.reputation) {
      try {
        console.log('Sending reputation notification');
        if (typeof global.notifyUser === 'function') {
          global.notifyUser(targetUser._id.toString(), {
            type: 'reputation',
            userId: req.user.id,
            username: currentUser.username,
            value: repValue,
            postId: postId,
            message: `${currentUser.username} has given you ${repValue === 1 ? 'positive' : 'negative'} reputation`,
            timestamp: new Date()
          });
        } else {
          console.log('notifyUser function not available');
        }
      } catch (notifyError) {
        console.error('Error sending reputation notification:', notifyError);
      }
    }
    
    console.log('Sending successful response');
    res.json({
      message: `Successfully ${repValue === 1 ? 'increased' : 'decreased'} reputation for ${targetUser.username}`,
      newReputation: targetUser.reputation,
      details: {
        positiveCount,
        negativeCount,
        total: targetUser.reputation,
        history: targetUser.reputationFrom
      },
      alreadyGave: !!existingRep
    });
  } catch (err) {
    console.error('Error giving reputation:', err);
    console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Give vouch to a user
router.post('/vouch/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { context, postId } = req.body; // Optional context (e.g. thread id or transaction id)
    
    console.log(`Vouch request received - userId: ${userId}, from user: ${req.user.id}`);
    
    // Prevent users from vouching for themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot vouch for yourself' });
    }
    
    // Get target user
    console.log(`Finding target user with ID: ${userId}`);
    const targetUser = await User.findById(userId);
      
    if (!targetUser) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found target user: ${targetUser.username} (${targetUser._id})`);
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    console.log(`Current user: ${currentUser.username} (${currentUser._id})`);
    
    // Initialize vouchesFrom array if it doesn't exist
    if (!targetUser.vouchesFrom) {
      console.log('Initializing empty vouchesFrom array');
      targetUser.vouchesFrom = [];
    }
    
    // Check if user has already vouched for this user
    const existingVouchIndex = targetUser.vouchesFrom.findIndex(vouch => {
      try {
        if (!vouch || !vouch.user) return false;
        
        // Handle different ways the user ID might be stored
        const vouchUserId = vouch.user._id ? vouch.user._id.toString() : 
                          (typeof vouch.user === 'string' ? vouch.user : 
                          (typeof vouch.user === 'object' ? vouch.user.toString() : null));
        
        console.log(`Comparing vouch user ID: ${vouchUserId} with current user ID: ${req.user.id}`);
        return vouchUserId === req.user.id;
      } catch (err) {
        console.error('Error in vouch comparison:', err);
        return false;
      }
    });
    
    const existingVouch = existingVouchIndex !== -1 ? targetUser.vouchesFrom[existingVouchIndex] : null;
    console.log(`Existing vouch entry found: ${!!existingVouch}`);
    
    if (existingVouch) {
      // Allow updating context of existing vouch
      console.log('Updating existing vouch');
      targetUser.vouchesFrom[existingVouchIndex].context = context || existingVouch.context;
      targetUser.vouchesFrom[existingVouchIndex].date = new Date(); // Update timestamp
      await targetUser.save();
      
      console.log('Vouch updated successfully');
      
      return res.json({
        message: `Updated your vouch for ${targetUser.username}`,
        newVouches: targetUser.vouches,
        vouchesFrom: targetUser.vouchesFrom,
        updated: true
      });
    }
    
    // Add new vouch entry
    console.log('Adding new vouch entry');
    targetUser.vouchesFrom.push({
      user: req.user.id,
      date: new Date(),
      context: context
    });
    
    // Update total vouches
    targetUser.vouches = (targetUser.vouches || 0) + 1;
    console.log(`Updated vouches total: ${targetUser.vouches}`);
    
    await targetUser.save();
    console.log('Saved target user with new vouch');
    
    // Create notification for the target user
    if (targetUser.settings?.notifications?.vouches) {
      try {
        console.log('Sending vouch notification');
        if (typeof global.notifyUser === 'function') {
          global.notifyUser(targetUser._id.toString(), {
            type: 'vouch',
            userId: req.user.id,
            username: currentUser.username,
            postId: postId,
            context: context,
            message: `${currentUser.username} has vouched for you`,
            timestamp: new Date()
          });
        } else {
          console.log('notifyUser function not available');
        }
      } catch (notifyError) {
        console.error('Error sending vouch notification:', notifyError);
      }
    }
    
    console.log('Sending successful response');
    res.json({
      message: `Successfully vouched for ${targetUser.username}`,
      newVouches: targetUser.vouches,
      vouchesFrom: targetUser.vouchesFrom,
      updated: false
    });
  } catch (err) {
    console.error('Error vouching for user:', err);
    console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Make a donation to another user
router.post('/donate/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, note } = req.body;
    
    // Validate amount
    const donationAmount = parseInt(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }
    
    // Prevent users from donating to themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot donate to yourself' });
    }
    
    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get current user
    const currentUser = await User.findById(req.user.id);
    
    // Check if current user has enough balance
    if (currentUser.balance < donationAmount) {
      return res.status(400).json({ message: 'Insufficient balance for this donation' });
    }
    
    // Create transaction record
    const transaction = {
      from: currentUser._id,
      to: targetUser._id,
      amount: donationAmount,
      date: new Date(),
      note: note || 'Donation'
    };
    
    // Update balances
    currentUser.balance -= donationAmount;
    targetUser.balance = (targetUser.balance || 0) + donationAmount;
    
    // Add transaction to both users
    currentUser.transactions.push(transaction);
    targetUser.transactions.push(transaction);
    
    // Save changes
    await currentUser.save();
    await targetUser.save();
    
    // Create notification for the target user
    if (targetUser.settings?.notifications?.donations) {
      try {
        global.notifyUser(targetUser._id.toString(), {
          type: 'donation',
          userId: req.user.id,
          username: currentUser.username,
          amount: donationAmount,
          note: note,
          message: `${currentUser.username} has donated ${donationAmount} to you`,
          timestamp: new Date()
        });
      } catch (notifyError) {
        console.error('Error sending donation notification:', notifyError);
      }
    }
    
    res.json({
      message: `Successfully donated ${donationAmount} to ${targetUser.username}`,
      newBalance: currentUser.balance,
      transaction: {
        to: targetUser.username,
        amount: donationAmount,
        date: new Date(),
        note: note || 'Donation'
      }
    });
  } catch (err) {
    console.error('Error making donation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user forum stats
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username avatar forum_rank postCount threadCount reputation vouches balance createdAt lastActive signature');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get recent threads by the user
    const recentThreads = await Thread.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name');
      
    // Get recent posts by the user
    const recentPosts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: 'thread',
        select: 'title category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });
    
    // Count total likes received on all posts by this user
    const userPosts = await Post.find({ author: userId });
    let totalLikes = 0;
    
    for (const post of userPosts) {
      if (post.likes && Array.isArray(post.likes)) {
        totalLikes += post.likes.length;
      }
    }
    
    console.log(`User ${userId} has ${totalLikes} total likes across ${userPosts.length} posts`);
      
    res.json({
      user,
      stats: {
        recentThreads,
        recentPosts,
        totalPosts: user.postCount,
        totalThreads: user.threadCount,
        totalLikes: totalLikes,
        reputation: user.reputation,
        vouches: user.vouches,
        joined: user.createdAt,
        lastActive: user.lastActive
      }
    });
  } catch (err) {
    console.error('Error fetching user forum stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user forum signature
router.put('/signature', auth, async (req, res) => {
  try {
    const { signature } = req.body;
    
    if (!signature && signature !== '') {
      return res.status(400).json({ message: 'Signature is required (can be empty string)' });
    }
    
    if (signature.length > 500) {
      return res.status(400).json({ message: 'Signature is too long (max 500 characters)' });
    }
    
    const user = await User.findById(req.user.id);
    
    user.signature = signature;
    await user.save();
    
    res.json({
      message: 'Signature updated successfully',
      signature
    });
  } catch (err) {
    console.error('Error updating signature:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle like on a post
router.post('/posts/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get the post with populated likes
    const post = await Post.findById(postId)
      .populate({
        path: 'likes',
        select: 'username avatar'
      });
      
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user has already liked the post
    const likesArray = post.likes || [];
    const likedIndex = likesArray.findIndex(like => 
      like._id ? like._id.toString() === req.user.id : like.toString() === req.user.id
    );
    
    if (likedIndex > -1) {
      // User has already liked the post, so unlike it
      post.likes.splice(likedIndex, 1);
      await post.save();
      
      // Refetch post with updated likes to ensure consistency
      const updatedPost = await Post.findById(postId)
        .populate({
          path: 'likes',
          select: 'username avatar'
        });
      
      // Also fetch the thread to get all other posts' likes for consistency
      const thread = await Thread.findOne({ _id: post.thread });
      if (thread) {
        const allThreadPosts = await Post.find({ thread: thread._id })
          .populate({
            path: 'likes',
            select: 'username avatar'
          });
          
        // Get all like counts for posts in this thread
        const threadPostLikes = {};
        for (const p of allThreadPosts) {
          threadPostLikes[p._id.toString()] = p.likes.length;
        }
        
        return res.json({
          message: 'Post unliked successfully',
          liked: false,
          likeCount: updatedPost.likes.length,
          likes: updatedPost.likes,
          allPostLikes: threadPostLikes
        });
      }
      
      return res.json({
        message: 'Post unliked successfully',
        liked: false,
        likeCount: updatedPost.likes.length,
        likes: updatedPost.likes
      });
    } else {
      // User hasn't liked the post yet, so like it
      if (!post.likes) {
        post.likes = [];
      }
      post.likes.push(req.user.id);
      await post.save();
      
      // Refetch post with updated likes to ensure consistency
      const updatedPost = await Post.findById(postId)
        .populate({
          path: 'likes',
          select: 'username avatar'
        });
      
      // Also fetch the thread to get all other posts' likes for consistency
      const thread = await Thread.findOne({ _id: post.thread });
      const threadPostLikes = {};
      
      if (thread) {
        const allThreadPosts = await Post.find({ thread: thread._id })
          .populate({
            path: 'likes',
            select: 'username avatar'
          });
          
        // Get all like counts for posts in this thread
        for (const p of allThreadPosts) {
          threadPostLikes[p._id.toString()] = p.likes.length;
        }
      }
      
      // If this isn't the user's own post, create a notification
      if (post.author.toString() !== req.user.id) {
        const postAuthor = await User.findById(post.author);
        const currentUser = await User.findById(req.user.id);
        
        if (postAuthor && postAuthor.settings?.notifications?.likes) {
          try {
            global.notifyUser(post.author.toString(), {
              type: 'like',
              userId: req.user.id,
              username: currentUser.username,
              postId: postId,
              threadId: post.thread,
              message: `${currentUser.username} liked your post`,
              timestamp: new Date()
            });
          } catch (notifyError) {
            console.error('Error sending like notification:', notifyError);
          }
        }
      }
      
      return res.json({
        message: 'Post liked successfully',
        liked: true,
        likeCount: updatedPost.likes.length,
        likes: updatedPost.likes,
        allPostLikes: threadPostLikes
      });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;