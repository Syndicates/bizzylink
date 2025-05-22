/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file wallpost.js
 * @description Wall post API endpoints
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const WallPost = require('../models/WallPost');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const eventEmitter = require('../eventEmitter');

/**
 * Get wall posts for a user's profile
 * GET /api/wall/:username
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find the recipient user
    const recipient = await User.findOne({ username }).select('_id');
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const total = await WallPost.countDocuments({ recipient: recipient._id });
    
    // Get wall posts with populated author data
    const posts = await WallPost.find({ recipient: recipient._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar mcUsername')
      .lean();
    
    // Populate comment authors for each post
    const populatedPosts = await Promise.all(posts.map(async post => {
      if (post.comments && post.comments.length > 0) {
        // Get all unique author IDs from comments
        const authorIds = [...new Set(post.comments.map(c => c.author?.toString()).filter(Boolean))];
        // Fetch all authors in one go
        const authors = await User.find({ _id: { $in: authorIds } }).select('username mcUsername minecraftUsername avatar displayName');
        const authorMap = {};
        authors.forEach(a => {
          authorMap[a._id.toString()] = {
            _id: a._id,
            username: a.username,
            mcUsername: a.mcUsername || a.minecraftUsername || a.username,
            minecraftUsername: a.minecraftUsername,
            avatar: a.avatar,
            displayName: a.displayName
          };
        });
        // Replace comment author IDs with full objects
        post.comments = post.comments.map(comment => {
          if (comment.author && authorMap[comment.author.toString()]) {
            return { ...comment, author: authorMap[comment.author.toString()] };
          }
          return comment;
        });
      }
      return post;
    }));
    
    // Return response
    res.json({
      success: true,
      posts: populatedPosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching wall posts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch wall posts' 
    });
  }
});

/**
 * Create a new wall post
 * POST /api/wall/:username
 */
router.post('/:username', protect, async (req, res) => {
  try {
    const { username } = req.params;
    const { content, image } = req.body;
    
    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Post content cannot be empty' 
      });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ 
        success: false, 
        error: 'Post content cannot exceed 500 characters' 
      });
    }
    
    // Find the recipient user
    const recipient = await User.findOne({ username }).select('_id');
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Create the wall post
    const newPost = new WallPost({
      author: req.user._id,
      recipient: recipient._id,
      content,
      image,
      type: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newPost.save();
    
    // Populate author data for response
    const populatedPost = await WallPost.findById(newPost._id)
      .populate('author', 'username displayName avatar mcUsername')
      .lean();
    
    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (error) {
    console.error('Error creating wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create wall post' 
    });
  }
});

/**
 * Delete a wall post
 * DELETE /api/wall/post/:postId
 */
router.delete('/post/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Verify the post exists
    const post = await WallPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    // Check if user is authorized to delete (either author or recipient)
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isRecipient = post.recipient.toString() === req.user._id.toString();
    
    if (!isAuthor && !isRecipient) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to delete this post' 
      });
    }
    
    // Delete the post
    await WallPost.findByIdAndDelete(postId);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete wall post' 
    });
  }
});

/**
 * Like a wall post
 * POST /api/wall/post/:postId/like
 */
router.post('/post/:postId/like', protect, async (req, res) => {
  console.log('[WALL LIKE] Like endpoint hit by user:', req.user.username, 'userId:', req.user._id.toString(), 'for post:', req.params.postId);
  try {
    const { postId } = req.params;
    
    // Verify post exists
    const post = await WallPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.likes.some(like => like.toString() === req.user._id.toString());
    
    if (alreadyLiked) {
      return res.json({
        success: true,
        message: 'Post already liked'
      });
    }
    
    // Add like
    post.likes.push(req.user._id);
    await post.save();
    
    // Notify the original poster if not self-like
    console.log('[WALL LIKE] post.author:', post.author.toString(), 'req.user._id:', req.user._id.toString());
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          message: `${req.user.username} liked your wall post!`,
          type: 'WALL_LIKE',
          data: { postId: post._id },
        });
        // Log eventEmitter type before emit
        console.log('[WALL LIKE] eventEmitter:', typeof eventEmitter, 'emit:', typeof eventEmitter?.emit);
        // Emit SSE event for real-time notification
        if (eventEmitter && typeof eventEmitter.emit === 'function') {
          console.log('[WALL LIKE] Emitting SSE notification for user:', post.author.toString(), 'postId:', post._id.toString());
          eventEmitter.emit('userEvent', {
            userId: post.author.toString(),
            event: 'notification',
            data: {
              subtype: 'WALL_LIKE',
              sender: {
                _id: req.user._id,
                username: req.user.username,
                mcUsername: req.user.mcUsername || req.user.minecraftUsername || req.user.username,
                avatar: req.user.avatar
              },
              message: `${req.user.username} liked your wall post!`,
              postId: post._id,
              createdAt: new Date()
            }
          });
        }
      } catch (e) { console.error('Failed to create wall like notification:', e); }
    } else {
      console.log('[WALL LIKE] Skipping notification emit: self-like detected.');
    }
    
    res.json({
      success: true,
      message: 'Post liked successfully'
    });
  } catch (error) {
    console.error('Error liking wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to like wall post' 
    });
  }
});

/**
 * Unlike a wall post
 * POST /api/wall/post/:postId/unlike
 */
router.post('/post/:postId/unlike', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Verify post exists
    const post = await WallPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    // Remove like
    post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
    await post.save();
    
    res.json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Error unliking wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unlike wall post' 
    });
  }
});

/**
 * Create a system post (for achievements, friend actions, etc.)
 * POST /api/wall/system
 * Admin/System only
 */
router.post('/system', protect, async (req, res) => {
  try {
    const { recipientUsername, type, content, metadata } = req.body;
    
    // This endpoint is for system use only, validate admin rights
    if (req.user.webRank !== 'admin' && req.user.webRank !== 'owner') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to create system posts' 
      });
    }
    
    if (!['system', 'achievement', 'friend', 'game'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid post type' 
      });
    }
    
    // Find recipient user
    const recipient = await User.findOne({ username: recipientUsername }).select('_id');
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipient user not found' 
      });
    }
    
    // Create system post
    const systemPost = new WallPost({
      // System posts are authored by the admin account
      author: req.user._id,
      recipient: recipient._id,
      content,
      type,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await systemPost.save();
    
    res.status(201).json({
      success: true,
      message: 'System post created successfully',
      post: systemPost
    });
  } catch (error) {
    console.error('Error creating system wall post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create system wall post' 
    });
  }
});

const filterProfanity = (text) => {
  // Simple profanity and forbidden content filter
  const forbidden = [
    'porn', 'sex', 'nude', 'naked', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'fag', 'slut', 'whore', 'rape', 'cum', 'cock', 'boob', 'boobs', 'anal', 'blowjob', 'handjob', 'orgy', 'hentai', 'xxx', 'nsfw', 'nigger', 'nigga', 'kike', 'spic', 'chink', 'faggot', 'retard', 'pedo', 'child porn', 'zoophilia', 'beastiality', 'incest', 'gore', 'kill yourself', 'suicide', 'discord.gg', 'http://', 'https://', 'www.', '.com', '.net', '.org', '.io', '.gg', '.xyz', '.porn', '.sex', '.xxx', '.tube', '.cam', '.live', '.bet', '.casino', '.crypto', '.eth', '.btc', '.doge', '.binance', '.exchange', '.wallet', '.loan', '.click', '.link', '.download', '.exe', '.apk', '.zip', '.rar', '.7z', '.torrent', '.mp4', '.avi', '.mov', '.mkv', '.flv', '.webm', '.mp3', '.wav', '.ogg', '.flac', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv', '.json', '.xml', '.html', '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb', '.go', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.sass', '.less', '.styl', '.ini', '.conf', '.cfg', '.env', '.git', '.svn', '.hg', '.bzr', '.cvs', '.bak', '.tmp', '.swp', '.lock', '.log', '.db', '.sqlite', '.mdb', '.accdb', '.sql', '.dbf', '.dat', '.bin', '.hex', '.img', '.iso', '.dmg', '.vmdk', '.vdi', '.qcow2', '.ova', '.ovf', '.vhd', '.vhdx', '.vmdk', '.vdi', '.qcow2', '.ova', '.ovf', '.vhd', '.vhdx', '.torrent', '.magnet', '.ed2k', '.dc++', '.soulseek', '.sls', '.sls2', '.sls3', '.sls4', '.sls5', '.sls6', '.sls7', '.sls8', '.sls9', '.sls10', '.sls11', '.sls12', '.sls13', '.sls14', '.sls15', '.sls16', '.sls17', '.sls18', '.sls19', '.sls20', '.sls21', '.sls22', '.sls23', '.sls24', '.sls25', '.sls26', '.sls27', '.sls28', '.sls29', '.sls30', '.sls31', '.sls32', '.sls33', '.sls34', '.sls35', '.sls36', '.sls37', '.sls38', '.sls39', '.sls40', '.sls41', '.sls42', '.sls43', '.sls44', '.sls45', '.sls46', '.sls47', '.sls48', '.sls49', '.sls50', '.sls51', '.sls52', '.sls53', '.sls54', '.sls55', '.sls56', '.sls57', '.sls58', '.sls59', '.sls60', '.sls61', '.sls62', '.sls63', '.sls64', '.sls65', '.sls66', '.sls67', '.sls68', '.sls69', '.sls70', '.sls71', '.sls72', '.sls73', '.sls74', '.sls75', '.sls76', '.sls77', '.sls78', '.sls79', '.sls80', '.sls81', '.sls82', '.sls83', '.sls84', '.sls85', '.sls86', '.sls87', '.sls88', '.sls89', '.sls90', '.sls91', '.sls92', '.sls93', '.sls94', '.sls95', '.sls96', '.sls97', '.sls98', '.sls99', '.sls100', '.sls101', '.sls102', '.sls103', '.sls104', '.sls105', '.sls106', '.sls107', '.sls108', '.sls109', '.sls110', '.sls111', '.sls112', '.sls113', '.sls114', '.sls115', '.sls116', '.sls117', '.sls118', '.sls119', '.sls120', '.sls121', '.sls122', '.sls123', '.sls124', '.sls125', '.sls126', '.sls127', '.sls128', '.sls129', '.sls130', '.sls131', '.sls132', '.sls133', '.sls134', '.sls135', '.sls136', '.sls137', '.sls138', '.sls139', '.sls140', '.sls141', '.sls142', '.sls143', '.sls144', '.sls145', '.sls146', '.sls147', '.sls148', '.sls149', '.sls150', '.sls151', '.sls152', '.sls153', '.sls154', '.sls155', '.sls156', '.sls157', '.sls158', '.sls159', '.sls160', '.sls161', '.sls162', '.sls163', '.sls164', '.sls165', '.sls166', '.sls167', '.sls168', '.sls169', '.sls170', '.sls171', '.sls172', '.sls173', '.sls174', '.sls175', '.sls176', '.sls177', '.sls178', '.sls179', '.sls180', '.sls181', '.sls182', '.sls183', '.sls184', '.sls185', '.sls186', '.sls187', '.sls188', '.sls189', '.sls190', '.sls191', '.sls192', '.sls193', '.sls194', '.sls195', '.sls196', '.sls197', '.sls198', '.sls199', '.sls200'];
  const lower = text.toLowerCase();
  for (const word of forbidden) {
    if (lower.includes(word)) return true;
  }
  return false;
};

/**
 * Add a comment to a wall post
 * POST /api/wall/post/:postId/comment
 */
router.post('/post/:postId/comment', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length < 1 || content.length > 300) {
      return res.status(400).json({ success: false, error: 'Comment must be 1-300 characters.' });
    }
    if (filterProfanity(content)) {
      return res.status(400).json({ success: false, error: 'Comment contains forbidden or unsafe content.' });
    }
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const comment = {
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'username displayName avatar mcUsername');

    // Notify the original poster if not self-comment
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          message: `${req.user.username} commented on your wall post!`,
          type: 'WALL_COMMENT',
          data: { postId: post._id },
        });
        // Emit SSE event for real-time notification
        if (eventEmitter && typeof eventEmitter.emit === 'function') {
          console.log('[WALL COMMENT] Emitting SSE notification for user:', post.author.toString(), 'postId:', post._id.toString());
          eventEmitter.emit('userEvent', {
            userId: post.author.toString(),
            event: 'notification',
            data: {
              subtype: 'WALL_COMMENT',
              sender: {
                _id: req.user._id,
                username: req.user.username,
                mcUsername: req.user.mcUsername || req.user.minecraftUsername || req.user.username,
                avatar: req.user.avatar
              },
              message: `${req.user.username} commented on your wall post!`,
              postId: post._id,
              createdAt: new Date()
            }
          });
        }
      } catch (e) { console.error('Failed to create wall comment notification:', e); }
    }

    // Notify mentioned users
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedUsernames = new Set();
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1] && match[1] !== req.user.username) {
        mentionedUsernames.add(match[1]);
      }
    }
    if (mentionedUsernames.size > 0) {
      const mentionedUsers = await User.find({ username: { $in: Array.from(mentionedUsernames) } });
      for (const mentionedUser of mentionedUsers) {
        if (mentionedUser._id.toString() !== req.user._id.toString()) {
          try {
            await Notification.create({
              recipient: mentionedUser._id,
              sender: req.user._id,
              message: `${req.user.username} mentioned you in a wall post comment!`,
              type: 'WALL_MENTION',
              data: { postId: post._id },
            });
            // Emit SSE event for real-time notification
            if (eventEmitter && typeof eventEmitter.emit === 'function') {
              console.log('[WALL MENTION] Emitting SSE notification for user:', mentionedUser._id.toString(), 'postId:', post._id.toString());
              eventEmitter.emit('userEvent', {
                userId: mentionedUser._id.toString(),
                event: 'notification',
                data: {
                  subtype: 'WALL_MENTION',
                  sender: {
                    _id: req.user._id,
                    username: req.user.username,
                    mcUsername: req.user.mcUsername || req.user.minecraftUsername || req.user.username,
                    avatar: req.user.avatar
                  },
                  message: `${req.user.username} mentioned you in a wall post comment!`,
                  postId: post._id,
                  createdAt: new Date()
                }
              });
            }
          } catch (e) { console.error('Failed to create wall mention notification:', e); }
        }
      }
    }

    res.json({ success: true, comments: post.comments });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

/**
 * Delete a comment from a wall post
 * DELETE /api/wall/post/:postId/comment/:commentId
 */
router.delete('/post/:postId/comment/:commentId', protect, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    // Do NOT populate here
    const post = await WallPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }
    // Fix: handle both ObjectId and populated object
    const isAuthor = (comment.author && comment.author._id ? comment.author._id.toString() : comment.author.toString()) === req.user._id.toString();
    const isPostOwner = post.author.toString() === req.user._id.toString() || post.recipient.toString() === req.user._id.toString();
    if (!isAuthor && !isPostOwner) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }
    // Remove the comment
    post.comments.pull({ _id: commentId });
    await post.save();
    // Now populate for the response
    await post.populate('comments.author', 'username displayName avatar mcUsername');
    res.json({ success: true, comments: post.comments });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

module.exports = router; 