/**
 * Application configuration
 */

// API URL - uses the same host as the frontend in development
export const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

// Default avatar
export const DEFAULT_AVATAR = '/images/default-avatar.png';

// JWT Token storage key
export const TOKEN_KEY = 'bizzylink_token';

// User data storage key
export const USER_KEY = 'bizzylink_user';

// Default pagination limits
export const PAGE_SIZES = {
  FORUM_THREADS: 10,
  FORUM_POSTS: 20,
  LEADERBOARD: 10,
  NOTIFICATIONS: 15
};

// Maximum lengths
export const MAX_LENGTHS = {
  THREAD_TITLE: 100,
  POST_CONTENT: 5000,
  SIGNATURE: 500
};

// Feature flags
export const FEATURES = {
  DONATIONS: true,
  REPUTATION: true,
  VOUCHES: true,
  LEADERBOARD: true
};