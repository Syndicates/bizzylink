/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file news.js
 * @description News article and comment endpoints for BizzyNation
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const News = require('../models/News');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: Only allow 'bizzy' to create/edit/delete news
async function isBizzy(req) {
  if (!req.user) return false;
  const user = await User.findById(req.user._id);
  return user && user.username === 'bizzy';
}

// GET /api/news?limit=5&page=1
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const [news, count] = await Promise.all([
      News.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username mcUsername'),
      News.countDocuments()
    ]);
    res.json({ news, total: count, page, pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/:id
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'username mcUsername');
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news article' });
  }
});

// POST /api/news (bizzy only)
router.post('/', protect, async (req, res) => {
  try {
    if (!(await isBizzy(req))) {
      return res.status(403).json({ error: 'Only Bizzy can post news.' });
    }
    const { title, summary, body, bannerImage, bannerType, bannerHeadUsername } = req.body;
    const news = await News.create({
      title,
      summary,
      body,
      bannerImage,
      bannerType,
      bannerHeadUsername,
      author: req.user._id
    });
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// PUT /api/news/:id (bizzy only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!(await isBizzy(req))) {
      return res.status(403).json({ error: 'Only Bizzy can edit news.' });
    }
    const { title, summary, body, bannerImage, bannerType, bannerHeadUsername } = req.body;
    const news = await News.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          summary,
          body,
          bannerImage,
          bannerType,
          bannerHeadUsername,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// DELETE /api/news/:id (bizzy only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!(await isBizzy(req))) {
      return res.status(403).json({ error: 'Only Bizzy can delete news.' });
    }
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json({ message: 'News deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// GET /api/news/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('comments.author', 'username mcUsername');
    if (!news) return res.status(404).json({ error: 'News not found' });
    res.json(news.comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/news/:id/comments (logged-in users only)
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required.' });
    }
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'News not found' });
    news.comments.push({ author: req.user._id, body });
    await news.save();
    await news.populate('comments.author', 'username mcUsername');
    res.status(201).json(news.comments[news.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router; 