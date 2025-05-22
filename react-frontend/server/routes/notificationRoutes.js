// Import dependencies and services
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const NotificationService = require('../services/MinecraftNotificationService');
const notificationService = new NotificationService();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    const notifications = await notificationService.getUserNotifications(userId, skip, limit);
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    return res.json({ 
      notifications, 
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(notifications.total / limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.post('/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user.id;
    
    if (!notificationId) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }
    
    const result = await notificationService.markAsRead(userId, notificationId);
    
    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ message: result.error || 'Failed to mark notification as read' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.post('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    
    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ message: result.error || 'Failed to mark all notifications as read' });
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create notification
router.post('/create', authenticate, async (req, res) => {
  try {
    const { type, recipientId, threadId, threadTitle, authorName, postId, categoryName } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!type || !recipientId) {
      return res.status(400).json({ message: 'Type and recipient ID are required' });
    }
    
    let result;
    
    // Handle different notification types
    switch (type) {
      case 'forum_thread':
        if (!threadId || !threadTitle || !categoryName) {
          return res.status(400).json({ message: 'Thread ID, title, and category name are required for forum thread notifications' });
        }
        result = await notificationService.createForumThreadNotification(recipientId, threadId, threadTitle, categoryName);
        break;
      
      case 'thread_reply':
        if (!threadId || !threadTitle || !authorName || !postId) {
          return res.status(400).json({ message: 'Thread ID, title, author name, and post ID are required for thread reply notifications' });
        }
        result = await notificationService.createThreadReplyNotification(recipientId, threadId, threadTitle, authorName, postId);
        break;
      
      case 'user_mention':
        if (!threadId || !threadTitle || !authorName || !postId) {
          return res.status(400).json({ message: 'Thread ID, title, author name, and post ID are required for user mention notifications' });
        }
        result = await notificationService.createUserMentionNotification(recipientId, threadId, threadTitle, authorName, postId);
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }
    
    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ message: result.error || 'Failed to create notification' });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 