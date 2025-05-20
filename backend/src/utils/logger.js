/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file logger.js
 * @description Visually enhanced logger with emojis and colors
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const winston = require('winston');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Create log directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Emoji/color map for log levels/types
const emojiMap = {
  info: chalk.cyan('ℹ️ '),
  warn: chalk.yellow('⚠️ '),
  error: chalk.red('❌'),
  debug: chalk.magenta('🐞'),
  http: chalk.blue('🌐'),
  auth: chalk.green('🔑'),
  socket: chalk.blueBright('🔌'),
  db: chalk.greenBright('🗄️ '),
  success: chalk.green('✅'),
  event: chalk.cyanBright('📢'),
  startup: chalk.yellowBright('🚀'),
  notification: chalk.yellow('🔔'),
  default: chalk.white('•'),
};

// Legend banner (print once at startup)
if (!global.__BIZZY_LOGGER_LEGEND_SHOWN) {
  console.log(chalk.bold('\n=== BizzyLink Logger Legend ==='));
  Object.entries(emojiMap).forEach(([type, emoji]) => {
    if (type !== 'default') console.log(`${emoji}  ${type}`);
  });
  console.log(chalk.bold('==============================\n'));
  global.__BIZZY_LOGGER_LEGEND_SHOWN = true;
}

// Custom log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let emoji = emojiMap[level] || emojiMap.default;
  // Custom types in message
  if (message.startsWith('[AUTH]')) emoji = emojiMap.auth;
  if (message.startsWith('[SOCKET]')) emoji = emojiMap.socket;
  if (message.startsWith('[DB]')) emoji = emojiMap.db;
  if (message.startsWith('[NOTIFY]')) emoji = emojiMap.notification;
  if (message.startsWith('[EVENT]')) emoji = emojiMap.event;
  if (message.startsWith('[STARTUP]')) emoji = emojiMap.startup;
  if (message.startsWith('[SUCCESS]')) emoji = emojiMap.success;
  return `${chalk.gray(timestamp)} ${emoji} ${chalk.bold(level.toUpperCase())}: ${message} ` +
    (Object.keys(meta).length ? chalk.gray(JSON.stringify(meta, null, 2)) : '');
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'bizzylink-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Add stream for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Helper methods for custom log types
logger.auth = (msg, ...meta) => logger.info(`[AUTH] ${msg}`, ...meta);
logger.socket = (msg, ...meta) => logger.info(`[SOCKET] ${msg}`, ...meta);
logger.db = (msg, ...meta) => logger.info(`[DB] ${msg}`, ...meta);
logger.notify = (msg, ...meta) => logger.info(`[NOTIFY] ${msg}`, ...meta);
logger.event = (msg, ...meta) => logger.info(`[EVENT] ${msg}`, ...meta);
logger.startup = (msg, ...meta) => logger.info(`[STARTUP] ${msg}`, ...meta);
logger.success = (msg, ...meta) => logger.info(`[SUCCESS] ${msg}`, ...meta);

module.exports = logger;