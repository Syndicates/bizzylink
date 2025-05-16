const express = require('express');
const router = express.Router();
const { protect, authorize, adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const { AdminActionLog } = require('../models/SecurityLog');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @route   GET /api/titles
 * @desc    Get all titles for current user
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
  try {
    // Get user with titles
    const user = await User.findById(req.user._id).select('titles activeTitle');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        titles: user.titles || [],
        activeTitle: user.activeTitle
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/titles/active
 * @desc    Set active title
 * @access  Private
 */
router.post('/active', protect, async (req, res, next) => {
  try {
    const { titleId } = req.body;
    
    if (!titleId) {
      return next(new ErrorResponse('Title ID is required', 400));
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if title exists and is unlocked
    const title = user.titles.find(t => t.id === titleId);
    
    if (!title) {
      return next(new ErrorResponse('Title not found', 404));
    }
    
    if (!title.unlocked) {
      return next(new ErrorResponse('Title is not unlocked', 400));
    }
    
    // Update active title
    user.activeTitle = titleId;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Active title updated',
      data: {
        activeTitle: titleId
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/titles/user/:username
 * @desc    Get titles for a specific user
 * @access  Public
 */
router.get('/user/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username }).select('titles activeTitle');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Only return unlocked titles
    const unlockedTitles = user.titles.filter(title => title.unlocked);
    
    // Only return title details that are meant to be public
    const publicTitles = unlockedTitles.map(title => ({
      id: title.id,
      name: title.name,
      description: title.description,
      rarity: title.rarity,
      category: title.category,
      textColor: title.textColor
    }));
    
    res.status(200).json({
      success: true,
      data: {
        titles: publicTitles,
        activeTitle: user.activeTitle
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
 * @route   POST /api/titles/admin/add
 * @desc    Add a new title to a user
 * @access  Private (Admin only)
 */
router.post('/admin/add', protect, adminMiddleware, async (req, res, next) => {
  try {
    const { userId, title } = req.body;
    
    if (!userId || !title) {
      return next(new ErrorResponse('User ID and title details are required', 400));
    }
    
    if (!title.id || !title.name) {
      return next(new ErrorResponse('Title ID and name are required', 400));
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if title already exists
    const existingTitle = user.titles.find(t => t.id === title.id);
    
    if (existingTitle) {
      return next(new ErrorResponse('Title already exists for this user', 400));
    }
    
    // Add title
    user.titles.push({
      id: title.id,
      name: title.name,
      description: title.description || '',
      rarity: title.rarity || 'common',
      category: title.category || 'admin',
      unlocked: title.unlocked || false,
      unlockedDate: title.unlocked ? new Date() : undefined,
      textColor: title.textColor || 'text-white'
    });
    
    await user.save();
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'ADD_TITLE',
      resource: 'User',
      details: {
        userId: user._id,
        username: user.username,
        title: {
          id: title.id,
          name: title.name
        }
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Title added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/titles/admin/unlock
 * @desc    Unlock a title for a user
 * @access  Private (Admin only)
 */
router.post('/admin/unlock', protect, adminMiddleware, async (req, res, next) => {
  try {
    const { userId, titleId } = req.body;
    
    if (!userId || !titleId) {
      return next(new ErrorResponse('User ID and title ID are required', 400));
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Find title
    const titleIndex = user.titles.findIndex(t => t.id === titleId);
    
    if (titleIndex === -1) {
      return next(new ErrorResponse('Title not found', 404));
    }
    
    // Update title
    user.titles[titleIndex].unlocked = true;
    user.titles[titleIndex].unlockedDate = new Date();
    
    await user.save();
    
    // Log admin action
    await AdminActionLog.create({
      user: req.user._id,
      action: 'UNLOCK_TITLE',
      resource: 'User',
      details: {
        userId: user._id,
        username: user.username,
        titleId,
        titleName: user.titles[titleIndex].name
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      message: 'Title unlocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;