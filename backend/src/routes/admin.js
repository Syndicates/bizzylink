/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file admin.js
 * @description Admin-only endpoints for user, forum, and permissions management
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { ForumThread, ForumPost, ForumCategory } = require('../models/Forum');
const AuditLog = require('../models/AuditLog');

// --- User Management ---

// GET /api/admin/users?page=1&limit=10&search=term&status=active&rank=admin
router.get('/users', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    const query = {};
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { mcUsername: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      query.accountStatus = req.query.status;
    }
    if (req.query.rank) {
      query.webRank = req.query.rank;
    }
    if (req.query.linked) {
      query.isLinked = req.query.linked === 'true';
    }

    const [users, count] = await Promise.all([
      User.find(query)
        .select('-password -__v')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v')
      .populate('followers', 'username mcUsername')
      .populate('following', 'username mcUsername');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's audit log
    const auditLog = await AuditLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ user, auditLog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (await isBizzyUser(req.params.id)) {
      return res.status(403).json({ error: 'This user is immune to admin actions.' });
    }
    const allowedUpdates = [
      'username', 'email', 'webRank', 'isPrivate', 'verified',
      'preferences', 'activeTitle', 'wallpaperId'
    ];
    
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the update
    await AuditLog.create({
      userId: user._id,
      adminId: req.user._id,
      action: 'update_user',
      details: {
        fields: Object.keys(updates),
        oldValues: req.body.oldValues,
        newValues: updates
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (await isBizzyUser(req.params.id)) {
      return res.status(403).json({ error: 'This user is immune to admin actions.' });
    }
    const { reason, duration } = req.body;
    const banExpiry = duration ? new Date(Date.now() + duration) : null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          accountStatus: 'banned',
          banReason: reason,
          banExpiry,
          bannedBy: req.user._id,
          bannedAt: new Date()
        }
      },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the ban
    await AuditLog.create({
      userId: user._id,
      adminId: req.user._id,
      action: 'ban_user',
      details: {
        reason,
        duration,
        expiry: banExpiry
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (await isBizzyUser(req.params.id)) {
      return res.status(403).json({ error: 'This user is immune to admin actions.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          accountStatus: 'active',
          banReason: null,
          banExpiry: null,
          bannedBy: null,
          bannedAt: null
        }
      },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the unban
    await AuditLog.create({
      userId: user._id,
      adminId: req.user._id,
      action: 'unban_user'
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// PUT /api/admin/users/:id/reset-password
router.put('/users/:id/reset-password', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (await isBizzyUser(req.params.id)) {
      return res.status(403).json({ error: 'This user is immune to admin actions.' });
    }
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Log the password reset
    await AuditLog.create({
      userId: user._id,
      adminId: req.user._id,
      action: 'reset_password'
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('owner'), async (req, res) => {
  try {
    if (await isBizzyUser(req.params.id)) {
      return res.status(403).json({ error: 'This user is immune to admin actions.' });
    }
    if (req.user.webRank !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete users.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the deletion
    await AuditLog.create({
      userId: user._id,
      adminId: req.user._id,
      action: 'delete_user',
      details: {
        username: user.username,
        email: user.email
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- Audit Logs ---

// GET /api/admin/audit-logs?page=1&limit=50
router.get('/audit-logs', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, count] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username mcUsername')
        .populate('adminId', 'username'),
      AuditLog.countDocuments()
    ]);

    res.json({
      logs,
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// --- Forum Moderation ---

// PUT /api/admin/forum/threads/:id/moderate
router.put('/forum/threads/:id/moderate', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { action, reason } = req.body;
    const thread = await ForumThread.findById(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    switch (action) {
      case 'lock':
        thread.locked = true;
        thread.lockReason = reason;
        break;
      case 'unlock':
        thread.locked = false;
        thread.lockReason = null;
        break;
      case 'pin':
        thread.pinned = true;
        break;
      case 'unpin':
        thread.pinned = false;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await thread.save();

    // Log the moderation action
    await AuditLog.create({
      userId: thread.author,
      adminId: req.user._id,
      action: `forum_${action}`,
      details: {
        threadId: thread._id,
        threadTitle: thread.title,
        reason
      }
    });

    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to moderate thread' });
  }
});

// DELETE /api/admin/forum/threads/:id
router.delete('/forum/threads/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const thread = await ForumThread.findByIdAndDelete(req.params.id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Log the deletion
    await AuditLog.create({
      userId: thread.author,
      adminId: req.user._id,
      action: 'delete_thread',
      details: {
        threadId: thread._id,
        threadTitle: thread.title
      }
    });

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// --- Forum Threads Management ---
// GET /api/admin/threads?page=1&limit=20&search=term&category=catid&author=userid&status=locked|pinned
router.get('/threads', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    if (req.query.status) {
      if (req.query.status === 'locked') query.$or = [{ isLocked: true }, { locked: true }];
      if (req.query.status === 'pinned') query.$or = [{ isPinned: true }, { pinned: true }];
    }
    const [threads, count] = await Promise.all([
      ForumThread.find(query)
        .populate('author', 'username')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ForumThread.countDocuments(query)
    ]);
    res.json({ threads, total: count, page, pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// GET /api/admin/threads/:id
router.get('/threads/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id)
      .populate('author', 'username')
      .populate('category', 'name');
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// PUT /api/admin/threads/:id/moderate
router.put('/threads/:id/moderate', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { action, value } = req.body;
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    let update = {};
    switch (action) {
      case 'lock': update = { isLocked: true, locked: true }; break;
      case 'unlock': update = { isLocked: false, locked: false }; break;
      case 'pin': update = { isPinned: true, pinned: true }; break;
      case 'unpin': update = { isPinned: false, pinned: false }; break;
      case 'edit':
        if (value?.title) update.title = value.title;
        if (value?.content) update.content = value.content;
        if (value?.category) update.category = value.category;
        break;
      default: return res.status(400).json({ error: 'Invalid action' });
    }
    Object.assign(thread, update);
    await thread.save();
    await AuditLog.create({
      userId: thread.author,
      adminId: req.user._id,
      action: `thread_${action}`,
      details: { threadId: thread._id, ...update }
    });
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to moderate thread' });
  }
});

// DELETE /api/admin/threads/:id
router.delete('/threads/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (req.user.webRank !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete threads.' });
    }
    const thread = await ForumThread.findByIdAndDelete(req.params.id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    // Optionally delete posts in thread
    await ForumPost.deleteMany({ thread: thread._id });
    await AuditLog.create({
      userId: thread.author,
      adminId: req.user._id,
      action: 'delete_thread',
      details: { threadId: thread._id, title: thread.title }
    });
    res.json({ message: 'Thread and its posts deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// --- Forum Posts Management ---
// GET /api/admin/posts?page=1&limit=20&search=term&thread=threadid&author=userid
router.get('/posts', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.search) {
      query.content = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.thread) {
      query.thread = req.query.thread;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    const [posts, count] = await Promise.all([
      ForumPost.find(query)
        .populate('author', 'username')
        .populate('thread', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ForumPost.countDocuments(query)
    ]);
    res.json({ posts, total: count, page, pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/admin/posts/:id
router.get('/posts/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'username')
      .populate('thread', 'title');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// PUT /api/admin/posts/:id
router.put('/posts/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { content } = req.body;
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.content = content;
    post.edited = true;
    post.editDate = new Date();
    post.editedBy = req.user._id;
    await post.save();
    await AuditLog.create({
      userId: post.author,
      adminId: req.user._id,
      action: 'edit_post',
      details: { postId: post._id, content }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (req.user.webRank !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete posts.' });
    }
    const post = await ForumPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await AuditLog.create({
      userId: post.author,
      adminId: req.user._id,
      action: 'delete_post',
      details: { postId: post._id, thread: post.thread }
    });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// --- Forum Categories Management ---
// GET /api/admin/categories
router.get('/categories', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const categories = await ForumCategory.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});
// POST /api/admin/categories
router.post('/categories', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const category = await ForumCategory.create({ name, description, order });
    await AuditLog.create({
      adminId: req.user._id,
      action: 'add_category',
      details: { categoryId: category._id, name }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add category' });
  }
});
// PUT /api/admin/categories/:id
router.put('/categories/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const category = await ForumCategory.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description, order } },
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await AuditLog.create({
      adminId: req.user._id,
      action: 'edit_category',
      details: { categoryId: category._id, name }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit category' });
  }
});
// DELETE /api/admin/categories/:id
router.delete('/categories/:id', protect, authorize('admin', 'owner'), async (req, res) => {
  try {
    if (req.user.webRank !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete categories.' });
    }
    // Safety: Only allow delete if no threads in category
    const threadCount = await ForumThread.countDocuments({ category: req.params.id });
    if (threadCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with threads' });
    }
    const category = await ForumCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await AuditLog.create({
      adminId: req.user._id,
      action: 'delete_category',
      details: { categoryId: category._id, name: category.name }
    });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Helper to check if user is 'bizzy' (immune)
async function isBizzyUser(userId) {
  const user = await User.findById(userId);
  return user && user.username === 'bizzy';
}

module.exports = router; 