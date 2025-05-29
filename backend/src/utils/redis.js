/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 *
 * @file redis.js
 * @description Redis connection utility
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err));

const get = async (key) => {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error('[Redis] Get error:', e);
    return null;
  }
};

const set = async (key, value, ttl = 30) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (e) {
    console.error('[Redis] Set error:', e);
  }
};

module.exports = { redis, get, set }; 