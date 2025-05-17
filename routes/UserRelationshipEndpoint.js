/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file UserRelationshipEndpoint.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Get relationship status with another user
router.get('/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }
        
        // Find target user
        const targetUser = await User.findOne({ username });
        
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Get friend and follow status
        const user = await User.findById(req.user.id)
            .populate('friends.list', '_id')
            .populate('friends.sent', '_id')
            .populate('friends.received', '_id');
            
        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Determine relationship statuses
        const isFriend = user.friends.list.includes(targetUser._id);
        const requestSent = user.friends.sent.includes(targetUser._id);
        const requestReceived = user.friends.received.includes(targetUser._id);
        const isFollowing = user.following.includes(targetUser._id);
        const isFollower = targetUser.following.includes(user._id);
        
        // Determine friend status
        let friendStatus = 'none';
        if (isFriend) {
            friendStatus = 'friends';
        } else if (requestSent) {
            friendStatus = 'requested';
        } else if (requestReceived) {
            friendStatus = 'pending';
        }
        
        // Get visibility settings
        const canSendRequest = targetUser.settings?.privacy?.allowFriendRequests !== false;
        const canFollow = targetUser.settings?.privacy?.allowFollowers !== false;
        
        res.json({
            userId: targetUser._id,
            username: targetUser.username,
            mcUsername: targetUser.mcUsername,
            mcUUID: targetUser.mcUUID,
            isFriend,
            friendStatus,
            isFollowing,
            isFollower,
            canSendRequest,
            canFollow
        });
    } catch (error) {
        console.error('Get relationship error:', error);
        res.status(500).json({ error: "Failed to get relationship status" });
    }
});

module.exports = router; 