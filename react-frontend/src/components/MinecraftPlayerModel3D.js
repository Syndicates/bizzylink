/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftPlayerModel3D.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Interactive 3D Minecraft Player Model and Inventory Component
 * 
 * This component displays an interactive 3D player model with current skin and equipment,
 * and provides an interactive inventory experience.
 * 
 * Features:
 * - 3D player model with current skin
 * - Animated idle/walking poses
 * - Equipment visualization on the player model
 * - Interactive inventory with item inspection
 * - Detailed item tooltips with enchantments
 */
const MinecraftPlayerModel3D = ({ 
  playerData, 
  username,
  initialView = 'model', // 'model', 'inventory', or 'combined'
  interactive = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [view, setView] = useState(initialView);
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [animation, setAnimation] = useState('idle');
  const [selectedItem, setSelectedItem] = useState(null);
  const [highlightedSlot, setHighlightedSlot] = useState(null);
  const modelRef = useRef(null);
  
  // Size configuration for responsive display
  const sizeConfig = {
    small: {
      modelHeight: '200px',
      containerClasses: 'w-full max-w-xs',
      modelScale: 0.8,
      inventoryColumns: 4
    },
    medium: {
      modelHeight: '300px',
      containerClasses: 'w-full max-w-md',
      modelScale: 1,
      inventoryColumns: 8
    },
    large: {
      modelHeight: '400px',
      containerClasses: 'w-full max-w-lg',
      modelScale: 1.2,
      inventoryColumns: 9
    }
  };
  
  // Current size settings
  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // Initialize component with player data
  useEffect(() => {
    if (playerData) {
      setIsLoading(false);
    }
  }, [playerData]);

  // Auto-rotation animation for the player model
  useEffect(() => {
    if (view === 'model' || view === 'combined') {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [view]);

  // Handle model interaction
  const handleModelClick = () => {
    if (!interactive) return;
    
    // Toggle animation between idle and walking
    setAnimation(prev => prev === 'idle' ? 'walking' : 'idle');
  };

  // Handle view switch
  const handleViewSwitch = (newView) => {
    if (!interactive) return;
    setView(newView);
  };

  // Handle inventory item click
  const handleItemClick = (item) => {
    if (!interactive) return;
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  // Get inventory items from player data
  const getInventoryItems = () => {
    const defaultItems = [];
    
    if (!playerData || !playerData.inventory) {
      return defaultItems;
    }
    
    const inventory = [];
    
    // Add main hand item
    if (playerData.inventory.main_hand) {
      inventory.push({
        id: 'main_hand',
        ...playerData.inventory.main_hand,
        slot: 'main_hand',
        displayName: formatItemName(playerData.inventory.main_hand.name),
      });
    }
    
    // Add armor items
    if (playerData.inventory.armor) {
      Object.entries(playerData.inventory.armor).forEach(([slot, item]) => {
        if (item) {
          inventory.push({
            id: `armor_${slot}`,
            ...item,
            slot,
            displayName: formatItemName(item.name),
          });
        }
      });
    }
    
    // Add valuable items
    if (playerData.inventory.valuables) {
      Object.entries(playerData.inventory.valuables).forEach(([name, amount]) => {
        if (amount > 0) {
          inventory.push({
            id: `valuable_${name}`,
            name,
            amount,
            slot: 'valuable',
            displayName: formatItemName(name),
          });
        }
      });
    }
    
    return inventory;
  };

  // Format item name (converting snake_case to Title Case)
  const formatItemName = (name) => {
    if (!name) return 'Unknown Item';
    
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get item icon based on item name
  const getItemIcon = (item) => {
    // Map of item names to icon paths
    const itemIcons = {
      'diamond': '/minecraft-assets/diamond.svg',
      'emerald': '/minecraft-assets/emerald.svg',
      'gold_ingot': '/minecraft-assets/gold-ingot.svg',
      'iron_ingot': '/minecraft-assets/iron-ingot.svg',
      'netherite_sword': '/minecraft-assets/sword.svg',
      'netherite_pickaxe': '/minecraft-assets/pickaxe.svg',
      'chest': '/minecraft-assets/chest.svg',
      'shulker_box': '/minecraft-assets/chest.svg',
      'ender_pearl': '/minecraft-assets/xp-orb.svg',
      'netherite_helmet': '/minecraft-assets/iron-ingot.svg',
      'netherite_chestplate': '/minecraft-assets/iron-ingot.svg',
      'netherite_leggings': '/minecraft-assets/iron-ingot.svg',
      'netherite_boots': '/minecraft-assets/iron-ingot.svg',
      'elytra': '/minecraft-assets/xp-orb.svg',
    };
    
    // Return specific icon or default based on item type
    return itemIcons[item.name] || '/minecraft-assets/grass_block.svg';
  };

  // Get background color based on item rarity/type
  const getItemBackground = (item) => {
    // Determine item rarity based on name and enchantments
    if (!item) return 'bg-gray-700';
    
    const hasEnchants = item.enchantments && item.enchantments.length > 0;
    
    if (item.name?.includes('netherite')) {
      return hasEnchants 
        ? 'bg-gradient-to-br from-purple-900 to-gray-900' 
        : 'bg-gray-900';
    } else if (item.name?.includes('diamond')) {
      return hasEnchants 
        ? 'bg-gradient-to-br from-blue-800 to-cyan-900' 
        : 'bg-cyan-900';
    } else if (item.name?.includes('gold')) {
      return hasEnchants 
        ? 'bg-gradient-to-br from-yellow-700 to-amber-900' 
        : 'bg-amber-900';
    } else if (item.name?.includes('iron')) {
      return hasEnchants 
        ? 'bg-gradient-to-br from-gray-600 to-gray-800' 
        : 'bg-gray-700';
    } else if (item.name === 'emerald') {
      return 'bg-green-900';
    } else if (item.name === 'diamond') {
      return 'bg-blue-900';
    } else if (item.name === 'elytra') {
      return 'bg-gradient-to-br from-purple-900 to-blue-900';
    } else if (item.name?.includes('shulker')) {
      return 'bg-gradient-to-br from-purple-800 to-purple-900';
    }
    
    return 'bg-gray-700';
  };

  // Format enchantment name (from enchantment_level to Enchantment Level)
  const formatEnchantmentName = (enchantment) => {
    if (!enchantment) return '';
    
    // Extract enchantment and level
    const parts = enchantment.split('_');
    const level = parts.pop();
    const name = parts.join(' ');
    
    // Format name
    const formattedName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Convert roman numerals
    const romanNumerals = {
      'i': 'I',
      'ii': 'II',
      'iii': 'III',
      'iv': 'IV',
      'v': 'V'
    };
    
    const formattedLevel = romanNumerals[level.toLowerCase()] || level;
    
    return `${formattedName} ${formattedLevel}`;
  };

  // Get player skin URL
  const getPlayerSkinUrl = () => {
    if (!username) {
      return 'https://mc-heads.net/player/default';
    }
    
    // Use a service that provides 3D skin renders
    return `https://mc-heads.net/player/${username}`;
  };

  // Calculate display rotation with perspective
  const getRotationStyle = () => {
    return {
      transform: `rotateY(${rotation}deg)`,
      transformStyle: 'preserve-3d',
      transition: 'transform 0.1s ease'
    };
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`${currentSize.containerClasses} bg-gray-800 rounded-lg p-4 animate-pulse`}>
        <div className="w-full" style={{ height: currentSize.modelHeight }}>
          <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center">
            <div className="text-gray-500">Loading player model...</div>
          </div>
        </div>
      </div>
    );
  }

  // Inventory items
  const inventoryItems = getInventoryItems();

  return (
    <div className={`minecraft-player-model ${currentSize.containerClasses} bg-gray-800 bg-opacity-90 rounded-lg overflow-hidden shadow-xl border border-gray-700`}>
      {/* Tab switcher */}
      {interactive && (
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => handleViewSwitch('model')}
            className={`flex-1 py-2 px-4 text-sm font-semibold ${view === 'model' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Player Model
          </button>
          <button
            onClick={() => handleViewSwitch('inventory')}
            className={`flex-1 py-2 px-4 text-sm font-semibold ${view === 'inventory' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Inventory
          </button>
          <button
            onClick={() => handleViewSwitch('combined')}
            className={`flex-1 py-2 px-4 text-sm font-semibold ${view === 'combined' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Combined
          </button>
        </div>
      )}
      
      {/* Container for model and inventory */}
      <div className="p-4">
        {/* Player model view */}
        {(view === 'model' || view === 'combined') && (
          <div 
            className="relative player-model-container w-full mb-4 flex items-center justify-center perspective" 
            style={{ 
              height: view === 'combined' ? '200px' : currentSize.modelHeight,
              perspective: '800px' 
            }}
          >
            {/* Model background - minecraft themed */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-700 opacity-20"></div>
            
            {/* Grass block ground */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-800 to-green-900"></div>
            
            {/* Player model */}
            <div 
              ref={modelRef}
              style={getRotationStyle()}
              onClick={handleModelClick}
              className={`relative cursor-pointer transition-all duration-300 ${animation === 'walking' ? 'animate-bounce' : ''}`}
            >
              {/* Player skin image */}
              <img 
                src={getPlayerSkinUrl()} 
                alt={`${username || 'Player'}'s skin`}
                className="h-full object-contain"
                style={{ 
                  transform: `scale(${currentSize.modelScale})`,
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
                }}
              />
              
              {/* Equipment overlays would go here */}
            </div>
            
            {/* Click instruction */}
            {interactive && (
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white opacity-70">
                Click to {animation === 'idle' ? 'walk' : 'stand'}
              </div>
            )}
          </div>
        )}
        
        {/* Inventory view */}
        {(view === 'inventory' || view === 'combined') && (
          <div className="inventory-container">
            <h3 className="text-white text-md font-semibold mb-2 pixel-font">
              Player Inventory
            </h3>
            
            {inventoryItems.length === 0 ? (
              <div className="bg-gray-700 rounded-md p-4 text-center text-gray-400">
                No items in inventory
              </div>
            ) : (
              <div 
                className="grid gap-2 bg-gray-700 bg-opacity-60 p-3 rounded-md" 
                style={{ gridTemplateColumns: `repeat(${Math.min(currentSize.inventoryColumns, inventoryItems.length)}, minmax(0, 1fr))` }}
              >
                {inventoryItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHighlightedSlot(item.id)}
                    onMouseLeave={() => setHighlightedSlot(null)}
                    onClick={() => handleItemClick(item)}
                    className={`
                      relative p-1 rounded-md cursor-pointer border-2
                      ${getItemBackground(item)}
                      ${highlightedSlot === item.id ? 'border-white' : 'border-gray-700'}
                      ${selectedItem?.id === item.id ? 'ring-2 ring-green-500' : ''}
                    `}
                  >
                    <div className="flex items-center justify-center w-full aspect-square">
                      <img 
                        src={getItemIcon(item)} 
                        alt={item.displayName}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    
                    {/* Item amount badge */}
                    {item.amount > 1 && (
                      <span className="absolute bottom-0 right-0 bg-gray-900 bg-opacity-80 text-white text-xs px-1 rounded-tl-md">
                        {item.amount}
                      </span>
                    )}
                    
                    {/* Enchantment glow effect */}
                    {item.enchantments && item.enchantments.length > 0 && (
                      <div className="absolute inset-0 bg-purple-500 bg-opacity-20 rounded-md animate-pulse"></div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Selected item details */}
            {selectedItem && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-gray-800 p-3 rounded-md border border-gray-700"
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-md mr-3 ${getItemBackground(selectedItem)}`}>
                    <img 
                      src={getItemIcon(selectedItem)} 
                      alt={selectedItem.displayName}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{selectedItem.displayName}</h4>
                    
                    {/* Item type */}
                    <p className="text-xs text-gray-400">
                      Type: {selectedItem.slot === 'valuable' ? 'Item' : selectedItem.slot.replace('_', ' ')}
                    </p>
                    
                    {/* Enchantments */}
                    {selectedItem.enchantments && selectedItem.enchantments.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs text-purple-400 font-semibold">Enchantments:</h5>
                        <ul className="text-xs text-purple-300">
                          {selectedItem.enchantments.map((enchant, index) => (
                            <li key={index} className="ml-2">• {formatEnchantmentName(enchant)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinecraftPlayerModel3D;