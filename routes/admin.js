/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file admin.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { admin, forumAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Category = require('../models/Category');
const Thread = require('../models/Thread');
const Post = require('../models/Post');

// Get all users with pagination (admin only)
router.get('/users', admin, async (req, res) => {
  try {
    console.log("Admin requested users list");
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Find the requesting user to verify permissions
    const adminId = req.user.id;
    const adminUser = await User.findById(adminId);
    
    if (!adminUser) {
      console.error('Admin user not found:', adminId);
      return res.status(403).json({ message: 'Admin authorization failed' });
    }
    
    // Double-check admin permissions
    if (adminUser.role !== 'admin' && 
        adminUser.forum_rank !== 'admin' && 
        !(adminUser.permissions && adminUser.permissions.canAccessAdmin)) {
      console.error(`User ${adminUser.username} is not authorized to view users list`);
      return res.status(403).json({ message: 'Not authorized to view users' });
    }
    
    // If authorized, proceed with user list
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users (admin only)
router.get('/users/search/:query', admin, async (req, res) => {
  try {
    const query = req.params.query;
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
    
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint for testing rank changes
router.post('/debug/change-rank/:id', async (req, res) => {
  try {
    console.log("DEBUG CHANGE RANK REQUEST:", JSON.stringify(req.body, null, 2));
    
    const userId = req.params.id;
    const { role, forum_rank, luckperms_group } = req.body;
    
    const beforeUser = await User.findById(userId);
    if (!beforeUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log("USER BEFORE UPDATE:", JSON.stringify({
      id: beforeUser._id,
      username: beforeUser.username,
      role: beforeUser.role,
      forum_rank: beforeUser.forum_rank,
      luckperms_group: beforeUser.luckperms_group
    }, null, 2));
    
    // Just directly apply the changes
    if (role) beforeUser.role = role;
    if (forum_rank) beforeUser.forum_rank = forum_rank;
    if (luckperms_group) beforeUser.luckperms_group = luckperms_group;
    
    await beforeUser.save();
    
    console.log("USER AFTER UPDATE:", JSON.stringify({
      id: beforeUser._id,
      username: beforeUser.username,
      role: beforeUser.role,
      forum_rank: beforeUser.forum_rank,
      luckperms_group: beforeUser.luckperms_group
    }, null, 2));
    
    res.json({
      success: true,
      message: 'User rank updated via debug endpoint',
      user: {
        id: beforeUser._id,
        username: beforeUser.username,
        role: beforeUser.role,
        forum_rank: beforeUser.forum_rank,
        luckperms_group: beforeUser.luckperms_group
      }
    });
  } catch (err) {
    console.error('Debug change rank error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Check if user has admin access
router.get('/check-access', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    
    // Extract user ID based on token structure
    let userId;
    if (decoded.user && decoded.user.id) {
      userId = decoded.user.id;
    } else if (decoded.id) {
      userId = decoded.id;
    } else {
      return res.status(401).json({ error: 'Invalid token structure' });
    }
    
    // Find user and check permissions
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has admin access
    const hasAdminAccess = 
      user.role === 'admin' || 
      (user.permissions && user.permissions.canAccessAdmin) ||
      user.forum_rank === 'admin';
    
    console.log(`User ${user.username} admin access check: ${hasAdminAccess}`);
    
    // TEMPORARY DEBUG: Always grant access for testing
    /*
    res.json({
      hasAccess: true,
      role: user.role,
      forum_rank: user.forum_rank,
      permissions: user.permissions || {},
      luckperms_group: user.luckperms_group
    });
    return;
    */
    
    res.json({
      hasAccess: hasAdminAccess,
      role: user.role,
      forum_rank: user.forum_rank,
      permissions: user.permissions || {},
      luckperms_group: user.luckperms_group
    });
  } catch (err) {
    console.error('Error checking admin access:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a user by ID (admin only)
router.get('/users/:id', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user (admin only)
router.put('/users/:id', admin, async (req, res) => {
  try {
    console.log("REQUEST PATH:", req.path);
    console.log("REQUEST BODY FOR USER UPDATE:", JSON.stringify(req.body, null, 2));
    
    const updates = {};
    const allowedUpdates = ['username', 'email', 'role', 'forum_rank', 'avatar', 'permissions', 'luckperms_group'];
    
    // First collect all direct updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Then handle permissions updates based on roles
    if (updates.role === 'admin' || updates.forum_rank === 'admin') {
      // Admin gets all permissions
      updates.permissions = {
        canAccessAdmin: true,
        canModerateForums: true,
        canManageUsers: true,
        canEditServer: true
      };
    } else if (updates.forum_rank === 'moderator') {
      // Moderator gets moderation permissions
      updates.permissions = {
        canAccessAdmin: true,
        canModerateForums: true,
        canManageUsers: false,
        canEditServer: false
      };
    } else if (updates.role === 'user' && updates.forum_rank === 'user') {
      // Regular user gets no special permissions
      updates.permissions = {
        canAccessAdmin: false,
        canModerateForums: false,
        canManageUsers: false,
        canEditServer: false
      };
    }
    
    console.log('Updating user with:', JSON.stringify(updates, null, 2));
    
    // Debug the user before update
    const beforeUser = await User.findById(req.params.id);
    console.log("USER BEFORE UPDATE:", JSON.stringify({
      username: beforeUser.username,
      role: beforeUser.role,
      forum_rank: beforeUser.forum_rank,
      luckperms_group: beforeUser.luckperms_group
    }, null, 2));
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`User ${user.username} updated successfully with new role: ${user.role}, forum_rank: ${user.forum_rank}`);
    
    // Return a successful response
    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Specific endpoint for changing user permissions
router.put('/users/:id/permissions', admin, async (req, res) => {
  try {
    console.log("REQUEST BODY FOR PERMISSIONS UPDATE:", JSON.stringify(req.body, null, 2));
    
    const { role, forum_rank, luckperms_group, permissions } = req.body;
    const updates = {};
    
    // Update role and ranks
    if (role) updates.role = role;
    if (forum_rank) updates.forum_rank = forum_rank;
    if (luckperms_group) updates.luckperms_group = luckperms_group;
    
    // Set appropriate permissions based on role/rank if not explicitly provided
    if (permissions) {
      updates.permissions = permissions;
    } else {
      // Auto-set permissions based on role/rank
      const newPermissions = {
        canAccessAdmin: false,
        canModerateForums: false,
        canManageUsers: false,
        canEditServer: false
      };
      
      // Admin gets all permissions
      if (role === 'admin' || forum_rank === 'admin') {
        newPermissions.canAccessAdmin = true;
        newPermissions.canModerateForums = true;
        newPermissions.canManageUsers = true;
        newPermissions.canEditServer = true;
      } 
      // Moderator gets moderation permissions
      else if (forum_rank === 'moderator') {
        newPermissions.canAccessAdmin = true;
        newPermissions.canModerateForums = true;
      }
      
      updates.permissions = newPermissions;
    }
    
    console.log(`Changing permissions for user ${req.params.id}:`, JSON.stringify(updates, null, 2));
    
    // Debug the user before update
    const beforeUser = await User.findById(req.params.id);
    console.log("USER BEFORE UPDATE:", JSON.stringify({
      username: beforeUser.username,
      role: beforeUser.role,
      forum_rank: beforeUser.forum_rank,
      luckperms_group: beforeUser.luckperms_group
    }, null, 2));
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`User ${user.username} permissions updated to: role=${user.role}, forum_rank=${user.forum_rank}, luckperms_group=${user.luckperms_group || 'none'}`);
    
    res.json({
      success: true,
      message: 'User permissions updated successfully',
      user
    });
  } catch (err) {
    console.error('Error updating user permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await User.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//================= MINECRAFT PERMISSIONS ENDPOINTS ===================//

// Get user's Minecraft permissions
router.get('/minecraft/user-permissions/:id', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.mcUUID) {
      return res.status(400).json({ message: 'User does not have a linked Minecraft account' });
    }
    
    // Return current permissions
    res.json({
      username: user.username,
      mcUsername: user.mcUsername,
      mcUUID: user.mcUUID,
      luckperms_group: user.luckperms_group || 'default',
      linked: user.linked
    });
  } catch (err) {
    console.error('Error fetching user Minecraft permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's Minecraft permissions
router.put('/minecraft/user-permissions/:id', admin, async (req, res) => {
  try {
    const { luckperms_group } = req.body;
    
    if (!luckperms_group) {
      return res.status(400).json({ message: 'LuckPerms group is required' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.mcUUID) {
      return res.status(400).json({ message: 'User does not have a linked Minecraft account' });
    }
    
    // Update user's LuckPerms group
    user.luckperms_group = luckperms_group;
    await user.save();
    
    // TODO: In a real implementation, this would make an API call to your Minecraft server
    // to update the user's permissions in LuckPerms
    console.log(`Updated Minecraft permissions for ${user.mcUsername} (${user.mcUUID}) to group: ${luckperms_group}`);
    
    res.json({
      success: true,
      message: `Updated Minecraft permissions for ${user.mcUsername}`,
      username: user.username,
      mcUsername: user.mcUsername,
      mcUUID: user.mcUUID,
      luckperms_group: user.luckperms_group
    });
  } catch (err) {
    console.error('Error updating user Minecraft permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//================= FORUM ADMIN ENDPOINTS ===================//

// Get forum statistics
router.get('/forum/stats', forumAdmin, async (req, res) => {
  try {
    const categoryCount = await Category.countDocuments();
    const threadCount = await Thread.countDocuments();
    const postCount = await Post.countDocuments();
    const userCount = await User.countDocuments();
    
    // Get recent activity
    const recentThreads = await Thread.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username avatar')
      .populate('category', 'name');
      
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username avatar')
      .populate({
        path: 'thread',
        select: 'title',
        populate: {
          path: 'category',
          select: 'name'
        }
      });
    
    // Get most active users
    const mostActivePosts = await Post.aggregate([
      { $group: { _id: '$author', postCount: { $sum: 1 } } },
      { $sort: { postCount: -1 } },
      { $limit: 5 }
    ]);
    
    const activeUserIds = mostActivePosts.map(item => item._id);
    const activeUsers = await User.find({ _id: { $in: activeUserIds } })
      .select('username avatar');
      
    // Match users with their post counts
    const mostActiveUsers = activeUsers.map(user => {
      const postData = mostActivePosts.find(item => item._id.toString() === user._id.toString());
      return {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        postCount: postData ? postData.postCount : 0
      };
    }).sort((a, b) => b.postCount - a.postCount);
    
    res.json({
      stats: {
        categories: categoryCount,
        threads: threadCount,
        posts: postCount,
        users: userCount
      },
      recentActivity: {
        threads: recentThreads,
        posts: recentPosts
      },
      mostActiveUsers
    });
  } catch (err) {
    console.error('Error fetching forum stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Moderate a thread (pin, lock, move)
router.put('/forum/threads/:id/moderate', forumAdmin, async (req, res) => {
  try {
    const { pinned, locked, categoryId } = req.body;
    
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Update thread properties
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
    
    await thread.save();
    
    const updatedThread = await Thread.findById(req.params.id)
      .populate('author', 'username avatar forum_rank')
      .populate('category', 'name');
      
    res.json({
      message: 'Thread moderated successfully',
      thread: updatedThread
    });
  } catch (err) {
    console.error('Error moderating thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a thread and all its posts
router.delete('/forum/threads/:id', forumAdmin, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Delete all posts in the thread
    await Post.deleteMany({ thread: req.params.id });
    
    // Update category thread count
    const category = await Category.findById(thread.category);
    if (category) {
      category.threadCount = Math.max((category.threadCount || 0) - 1, 0);
      await category.save();
    }
    
    // Delete the thread
    await Thread.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Thread and all posts deleted successfully' });
  } catch (err) {
    console.error('Error deleting thread:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a post content
router.put('/forum/posts/:id', forumAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    post.content = content;
    post.edited = {
      date: new Date(),
      by: req.user.id
    };
    
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'username avatar forum_rank')
      .populate('edited.by', 'username');
    
    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/forum/posts/:id', forumAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const thread = await Thread.findById(post.thread);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    // Check if this is the first post in the thread
    if (thread.firstPost && thread.firstPost.toString() === req.params.id) {
      return res.status(400).json({ 
        message: 'Cannot delete the first post. Delete the entire thread instead.'
      });
    }
    
    // Delete the post
    await Post.deleteOne({ _id: req.params.id });
    
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

module.exports = router;