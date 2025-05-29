/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file validators.js
 * @description Input validation utilities
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 */

const URL = require('url').URL;

/**
 * Validate if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate if a string contains profanity
 * @param {string} text - The text to check
 * @returns {boolean} Whether the text contains profanity
 */
const containsProfanity = (text) => {
  if (!text) return false;
  
  const forbidden = [
    'porn', 'sex', 'nude', 'naked', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy',
    'asshole', 'fag', 'slut', 'whore', 'rape', 'cum', 'cock', 'boob', 'boobs', 'anal',
    'blowjob', 'handjob', 'orgy', 'hentai', 'xxx', 'nsfw', 'nigger', 'nigga', 'kike',
    'spic', 'chink', 'faggot', 'retard', 'pedo', 'child porn', 'zoophilia', 'beastiality',
    'incest', 'gore', 'kill yourself', 'suicide'
  ];
  
  const lower = text.toLowerCase();
  return forbidden.some(word => lower.includes(word));
};

/**
 * Validate if a string contains spam/forbidden domains
 * @param {string} text - The text to check
 * @returns {boolean} Whether the text contains spam
 */
const containsSpam = (text) => {
  if (!text) return false;
  
  const forbidden = [
    'discord.gg', 'http://', 'https://', 'www.', '.com', '.net', '.org', '.io', '.gg',
    '.xyz', '.porn', '.sex', '.xxx', '.tube', '.cam', '.live', '.bet', '.casino',
    '.crypto', '.eth', '.btc', '.doge', '.binance', '.exchange', '.wallet', '.loan',
    '.click', '.link', '.download', '.exe', '.apk', '.zip', '.rar', '.7z', '.torrent'
  ];
  
  const lower = text.toLowerCase();
  return forbidden.some(word => lower.includes(word));
};

/**
 * Validate if a string contains mentions
 * @param {string} text - The text to check
 * @returns {string[]} Array of mentioned usernames
 */
const extractMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = new Set();
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) {
      mentions.add(match[1]);
    }
  }
  
  return Array.from(mentions);
};

module.exports = {
  isValidURL,
  containsProfanity,
  containsSpam,
  extractMentions
}; 