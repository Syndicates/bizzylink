/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file linkcode-debug.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Debug utility for BizzyLink Minecraft integration
 * 
 * This file provides debugging functionality for the BizzyLink Minecraft plugin
 * and server communication. It is designed to help identify and fix issues with
 * the link/unlink process.
 */

const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const linkCodeManager = require('./linkcode-manager');
const LinkCode = require('../backend/src/models/LinkCode');

// Directory for logs
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, 'minecraft-debug.log');

// Log a message to the debug log file
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Log to console
    console.log(`[MC-DEBUG] ${message}`);
    
    // Append to log file
    fs.appendFileSync(logFile, logEntry);
}

// Create a test link code for debugging
async function createTestLinkCode(userId, code = "TEST123", expiryMinutes = 1440) {
    try {
        const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
        
        // First try to use the LinkCode model via the manager (preferred)
        try {
            // Clean up any existing test codes
            await LinkCode.deleteOne({ code });
            
            // Create a new test code
            await LinkCode.create({
                code,
                userId,
                expires: new Date(expiryTime),
                created: new Date()
            });
            
            logMessage(`Created test link code ${code} in database for user ${userId}, expires in ${expiryMinutes} minutes`);
        } catch (dbError) {
            logMessage(`Warning: Could not create test code in database: ${dbError.message}`);
            
            // Store the code directly in the link code manager's memory map as fallback
            linkCodeManager.activeCodes.set(code, {
                userId,
                expires: expiryTime
            });
            
            logMessage(`Created test link code ${code} in memory for user ${userId}, expires in ${expiryMinutes} minutes`);
        }
        
        return {
            success: true,
            code,
            expires: new Date(expiryTime).toISOString(),
            expiryMinutes
        };
    } catch (error) {
        logMessage(`Error creating test link code: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// Log the current link status for all users
async function logAllLinkStatus() {
    try {
        logMessage('======== CURRENT LINK STATUS FOR ALL USERS ========');
        
        const users = await User.find({}).select('username email mcUsername mcUUID linked');
        
        users.forEach(user => {
            logMessage(`User: ${user.username} (${user.email})`);
            logMessage(`  Minecraft: ${user.mcUsername || 'Not linked'}`);
            logMessage(`  UUID: ${user.mcUUID || 'None'}`);
            logMessage(`  Linked: ${user.linked ? 'Yes' : 'No'}`);
            logMessage('----------------------------------------');
        });
        
        logMessage('======== END LINK STATUS ========');
    } catch (error) {
        logMessage(`Error getting user link status: ${error.message}`);
    }
}

// Log all active link codes
async function logActiveLinkCodes() {
    try {
        logMessage('======== ACTIVE LINK CODES ========');
        
        const codes = await linkCodeManager.getAllCodes();
        
        if (codes.length === 0) {
            logMessage('No active link codes found');
        } else {
            codes.forEach(code => {
                logMessage(`Code: ${code.code}`);
                logMessage(`  For User: ${code.userId}`);
                logMessage(`  Expires: ${new Date(code.expires).toLocaleString()}`);
                logMessage(`  Source: ${code.source || 'Unknown'}`);
                logMessage(`  Expired: ${code.isExpired ? 'Yes' : 'No'}`);
                logMessage('----------------------------------------');
            });
        }
        
        logMessage('======== END ACTIVE CODES ========');
    } catch (error) {
        logMessage(`Error getting active link codes: ${error.message}`);
    }
}

// Log authentication status for a specific user
async function logUserAuthStatus(userId) {
    try {
        const user = await User.findById(userId).select('username email sessionToken lastLogin');
        
        if (!user) {
            logMessage(`User with ID ${userId} not found`);
            return;
        }
        
        logMessage('======== USER AUTH STATUS ========');
        logMessage(`User: ${user.username} (${user.email})`);
        logMessage(`Session Token: ${user.sessionToken ? 'Present' : 'None'}`);
        logMessage(`Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
        logMessage('======== END USER AUTH STATUS ========');
    } catch (error) {
        logMessage(`Error getting user auth status: ${error.message}`);
    }
}

// Check if a user is properly linked
async function checkUserLinkStatus(userId) {
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return {
                found: false,
                message: 'User not found'
            };
        }
        
        // Check for inconsistent linking state
        const inconsistentState = 
            (user.mcUsername && user.mcUUID && !user.linked) || 
            ((!user.mcUsername || !user.mcUUID) && user.linked);
        
        return {
            found: true,
            username: user.username,
            email: user.email,
            mcUsername: user.mcUsername,
            mcUUID: user.mcUUID,
            linked: user.linked,
            inconsistent: inconsistentState,
            message: inconsistentState ? 'Inconsistent link state detected' : 'Link state is consistent'
        };
    } catch (error) {
        return {
            error: true,
            message: error.message
        };
    }
}

// Fix inconsistent link state
async function fixUserLinkState(userId) {
    try {
        const status = await checkUserLinkStatus(userId);
        
        if (!status.found) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        
        if (!status.inconsistent) {
            return {
                success: true,
                message: 'No inconsistency to fix'
            };
        }
        
        // Fix the inconsistency
        let update = {};
        
        if (status.mcUsername && status.mcUUID && !status.linked) {
            // Has MC data but not marked as linked
            update = { linked: true };
            logMessage(`Fixing user ${status.username}: Setting linked=true`);
        } else if ((!status.mcUsername || !status.mcUUID) && status.linked) {
            // Marked as linked but missing MC data
            update = { 
                linked: false,
                mcUsername: null,
                mcUUID: null,
                mcStats: {}
            };
            logMessage(`Fixing user ${status.username}: Setting linked=false and clearing MC data`);
        }
        
        await User.updateOne({ _id: userId }, { $set: update });
        
        return {
            success: true,
            message: 'Fixed inconsistent link state',
            update
        };
    } catch (error) {
        logMessage(`Error fixing user link state: ${error.message}`);
        return {
            success: false,
            error: true,
            message: error.message
        };
    }
}

// Export the debug utilities
module.exports = {
    logMessage,
    logAllLinkStatus,
    logActiveLinkCodes,
    logUserAuthStatus,
    checkUserLinkStatus,
    fixUserLinkState,
    createTestLinkCode
}; 