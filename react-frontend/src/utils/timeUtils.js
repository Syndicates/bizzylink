/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file timeUtils.js
 * @description Time formatting and manipulation utilities
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

/**
 * Formats a timestamp into a human-readable "time ago" string
 * @param {string|number|Date} timestamp - The timestamp to format
 * @returns {string} A human-readable string like "2 hours ago"
 */
export const timeAgo = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 5) {
    return 'just now';
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes === 1) {
    return 'a minute ago';
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours === 1) {
    return 'an hour ago';
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days === 1) {
    return 'yesterday';
  } else if (days < 30) {
    return `${days} days ago`;
  } else if (months === 1) {
    return 'a month ago';
  } else if (months < 12) {
    return `${months} months ago`;
  } else if (years === 1) {
    return 'a year ago';
  } else {
    return `${years} years ago`;
  }
};

/**
 * Formats a date into a readable string
 * @param {string|number|Date} date - The date to format
 * @returns {string} A formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 