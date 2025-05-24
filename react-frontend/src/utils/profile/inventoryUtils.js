/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file inventoryUtils.js
 * @description Inventory utility functions for Minecraft player data
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

// Generate inventory items from player data
export const generateInventoryItems = (inventoryData) => {
  if (!inventoryData) return [];

  const items = [];

  // Add main hand item if available
  if (inventoryData.main_hand && inventoryData.main_hand.name) {
    items.push({
      name: inventoryData.main_hand.name,
      count: inventoryData.main_hand.amount || 1,
      durability: inventoryData.main_hand.durability,
      label: inventoryData.main_hand.name
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    });
  }

  // Add hotbar and inventory items if available
  if (inventoryData.contents && Array.isArray(inventoryData.contents)) {
    inventoryData.contents.forEach((item) => {
      if (item && item.name) {
        items.push({
          name: item.name,
          count: item.amount || 1,
          durability: item.durability,
          label: item.name
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        });
      }
    });
  }

  // Add valuables as items if available and not already added
  if (inventoryData.valuables) {
    if (inventoryData.valuables.diamond > 0) {
      items.push({
        name: "diamond",
        count: inventoryData.valuables.diamond,
        label: "Diamond",
      });
    }

    if (inventoryData.valuables.emerald > 0) {
      items.push({
        name: "emerald",
        count: inventoryData.valuables.emerald,
        label: "Emerald",
      });
    }

    if (inventoryData.valuables.gold > 0) {
      items.push({
        name: "gold_ingot",
        count: inventoryData.valuables.gold,
        label: "Gold Ingot",
      });
    }

    if (inventoryData.valuables.netherite > 0) {
      items.push({
        name: "netherite_ingot",
        count: inventoryData.valuables.netherite,
        label: "Netherite Ingot",
      });
    }
  }

  return items;
}; 