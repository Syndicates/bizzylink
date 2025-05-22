/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file notifications.js
 * @description Notifications system endpoints
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'username displayName avatar')
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Test endpoint to create a notification for the current user
router.post('/test', protect, async (req, res) => {
  try {
    const user = req.user;
    const newNotification = new Notification({
      user: user._id,
      message: `Test notification created at ${new Date().toLocaleTimeString()}`,
      read: false,
      createdAt: new Date()
    });
    
    await newNotification.save();
    res.json({ 
      success: true, 
      message: 'Test notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ success: false, error: 'Failed to create test notification' });
  }
});

// Mark a notification as read
router.post('/read', protect, async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ success: false, error: 'Notification ID is required' });
    }
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to mark this notification' });
    }
    notification.read = true;
    await notification.save();
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this notification' });
    }
    await notification.deleteOne();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

module.exports = router; 