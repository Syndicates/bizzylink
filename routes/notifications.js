const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all notifications for this user
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username displayName avatar')
      .limit(50);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * Mark a notification as read
 * POST /api/notifications/read
 */
router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      });
    }
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    // Verify this user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this notification'
      });
    }
    
    // Update notification
    notification.read = true;
    await notification.save();
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    // Verify this user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notification'
      });
    }
    
    // Delete notification
    await notification.deleteOne();
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

/**
 * Create a notification (internal function)
 * @param {string} recipientId - User ID of recipient
 * @param {string} senderId - User ID of sender (optional)
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {Object} data - Additional data for the notification
 */
async function createNotification(recipientId, senderId, type, message, data = {}) {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      data,
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

module.exports = router;
module.exports.createNotification = createNotification; 