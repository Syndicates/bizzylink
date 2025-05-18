/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file server.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev', { stream: logger.stream }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
app.use('/api', apiLimiter);

// Admin routes rate limiter (more lenient)
const adminLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.ADMIN_RATE_LIMIT_MAX || 200, // Higher limit for admin routes
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/admin', adminLimiter);

// Route files
const authRoutes = require('./routes/auth');
const minecraftRoutes = require('./routes/minecraft');
const forumRoutes = require('./routes/forum');
const achievementsRoutes = require('./routes/achievements');
const titlesRoutes = require('./routes/titles');
const linkcodeRoutes = require('../../routes/linkcode');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/minecraft', minecraftRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/titles', titlesRoutes);
app.use('/api/linkcode', linkcodeRoutes);

// Basic root route
app.get('/', (req, res) => {
  res.json({ 
    name: 'BizzyLink API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle unhandled exceptions
process.on('uncaughtException', err => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;