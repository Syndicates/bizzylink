/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file config.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Configuration file for the server
 */

// Load environment variables
require('dotenv').config();

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    sessionSecret: process.env.SESSION_SECRET || 'bizzylink-session-secret',
    jwtSecret: process.env.JWT_SECRET || 'bizzylink-jwt-secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
  },
  
  // Database configuration
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bizzylink',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    }
  },
  
  // Website configuration
  website: {
    url: process.env.WEBSITE_URL || 'http://localhost:3000'
  },
  
  // Minecraft server API configuration
  minecraft: {
    apiUrl: process.env.MC_API_URL || 'http://localhost:25565/api',
    apiKey: process.env.MC_API_KEY || 'development-api-key',
    serverIp: process.env.MC_SERVER_IP || 'mc.bizzynation.com',
    serverPort: process.env.MC_SERVER_PORT || 25565
  },
  
  // Forum configuration
  forum: {
    postsPerPage: 10,
    threadsPerPage: 15,
    allowedTags: ['IMPORTANT', 'QUESTION', 'GUIDE', 'NEWS', 'ANNOUNCEMENT', 'BUG', 'SUGGESTION']
  },
  
  // Rate limiting
  rateLimit: {
    // General API rate limit (requests per minute)
    standard: {
      windowMs: 60 * 1000,
      max: 60
    },
    // Authentication rate limit (login/register attempts per 15 minutes)
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10
    },
    // Forum posting rate limit (posts per hour)
    forumPost: {
      windowMs: 60 * 60 * 1000,
      max: 20
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};