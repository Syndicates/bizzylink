/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file sanitizer.js
 * @description Input sanitization utilities
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 */

const xss = require('xss');
const { isValidURL } = require('./validators');

/**
 * Sanitize user input
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (!input) return '';
  // Remove any HTML tags and XSS attempts
  return xss(input.trim());
};

/**
 * Validate and sanitize image URL
 * @param {string} url - The image URL to validate
 * @returns {boolean} Whether the URL is valid
 */
const isValidImageUrl = (url) => {
  if (!url) return false;
  if (!isValidURL(url)) return false;
  
  // Check if URL points to an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.endsWith(ext));
};

/**
 * Sanitize and validate wall post content
 * @param {string} content - The post content
 * @returns {Object} { isValid: boolean, sanitized: string, error?: string }
 */
const sanitizeWallPostContent = (content) => {
  if (!content) {
    return { isValid: false, error: 'Content cannot be empty' };
  }

  const sanitized = sanitizeInput(content);
  
  if (sanitized.length > 500) {
    return { isValid: false, error: 'Content cannot exceed 500 characters' };
  }

  return { isValid: true, sanitized };
};

/**
 * Sanitize and validate comment content
 * @param {string} content - The comment content
 * @returns {Object} { isValid: boolean, sanitized: string, error?: string }
 */
const sanitizeCommentContent = (content) => {
  if (!content) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }

  const sanitized = sanitizeInput(content);
  
  if (sanitized.length > 300) {
    return { isValid: false, error: 'Comment cannot exceed 300 characters' };
  }

  return { isValid: true, sanitized };
};

module.exports = {
  sanitizeInput,
  isValidImageUrl,
  sanitizeWallPostContent,
  sanitizeCommentContent
}; 