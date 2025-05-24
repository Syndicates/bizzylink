/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file wallpaperUtils.js
 * @description Wallpaper utility functions for profile backgrounds
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// Predefined wallpaper options (id, label)
export const WALLPAPERS = [
  { id: "herobrine_hill", label: "Herobrine Hill", external: true },
  { id: "quick_hide", label: "Quick Hide", external: true },
  { id: "malevolent", label: "Malevolent", external: true },
  { id: "sunset_lake", label: "Sunset Lake", custom: true },
  { id: "pink_sky", label: "Pink Sky", custom: true },
  { id: "night_adventure", label: "Night Adventure", custom: true },
];

// Helper to get wallpaper URL for a given id and username
export const getWallpaperUrl = (id, username) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  // Use the external service for standard wallpapers if we mark it as external
  if (wallpaper.external) {
    // If no username provided, use Steve as default
    const safeUsername = username || "Steve";
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/${safeUsername}`;
  }

  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Helper to get thumbnail (use a default player for preview)
export const getWallpaperThumb = (id) => {
  // Check if wallpaper exists
  const wallpaper = WALLPAPERS.find((wp) => wp.id === id);

  // If wallpaper doesn't exist, use default
  if (!wallpaper) {
    return `/minecraft-assets/wallpapers/night_adventure.jpg`;
  }

  // Check if this is one of our custom wallpapers
  if (wallpaper.custom) {
    return `/minecraft-assets/wallpapers/${id}.jpg`;
  }

  // Use the external service for standard wallpapers
  if (wallpaper.external) {
    return `https://starlightskins.lunareclipse.studio/render/wallpaper/${id}/Steve?thumb=1`;
  }

  // Fallback to default wallpaper
  return `/minecraft-assets/wallpapers/night_adventure.jpg`;
};

// Map usernames to default covers to make each profile feel unique
export const getDefaultCover = (username) => {
  // Always use a valid wallpaperId and username
  return getWallpaperUrl("herobrine_hill", username || "Steve");
}; 