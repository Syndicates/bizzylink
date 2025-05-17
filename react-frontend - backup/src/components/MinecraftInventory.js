import React from 'react';
import { motion } from 'framer-motion';
import MinecraftItem from './MinecraftItem';

/**
 * MinecraftInventory - Displays a grid of Minecraft items similar to the in-game inventory
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of objects with name, count and metadata for Minecraft items
 * @param {number} props.columns - Number of columns in the grid (default: 9)
 * @param {number} props.slotSize - Size of each inventory slot (default: 64)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onItemClick - Function called when an item is clicked
 * @param {boolean} props.showLabels - Whether to show item names below slots
 * @param {number} props.selectedSlot - Index of currently selected slot (optional)
 */
const MinecraftInventory = ({
  items = [],
  columns = 9,
  slotSize = 64,
  className = '',
  onItemClick = null,
  showLabels = false,
  selectedSlot = -1
}) => {
  // Calculate rows based on number of items and columns
  const rows = Math.ceil(items.length / columns);
  
  // Calculate empty slots to fill the grid
  const totalSlots = rows * columns;
  const emptySlots = totalSlots - items.length;
  
  // Create padding items to complete the grid
  const paddedItems = [
    ...items,
    ...Array(emptySlots).fill(null)
  ];
  
  return (
    <div className={`minecraft-inventory ${className}`}>
      <div 
        className="grid gap-1 p-2 bg-gray-900/70 border-2 border-gray-800 rounded-md shadow-minecraft"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          width: `${columns * (slotSize + 8)}px` // Account for padding and border
        }}
      >
        {paddedItems.map((item, index) => (
          <InventorySlot 
            key={index}
            item={item}
            size={slotSize}
            isSelected={selectedSlot === index}
            onClick={() => item && onItemClick && onItemClick(item, index)}
            showLabel={showLabels}
          />
        ))}
      </div>
    </div>
  );
};

// Individual inventory slot component
const InventorySlot = ({ item, size, isSelected, onClick, showLabel }) => {
  // Calculate size adjustments
  const itemSize = Math.floor(size * 0.75); // Item is 75% of slot size
  
  return (
    <motion.div
      className={`inventory-slot relative ${isSelected ? 'border-white' : 'border-gray-700'} ${item ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      whileHover={item ? { scale: 1.05, boxShadow: '0 0 5px rgba(255,255,255,0.3)' } : {}}
      whileTap={item ? { scale: 0.95 } : {}}
      onClick={onClick}
    >
      {item && (
        <>
          <div className="flex items-center justify-center w-full h-full">
            <MinecraftItem 
              name={item.name} 
              size={itemSize}
              showTooltip={!showLabel}
              tooltipText={item.label || item.displayName}
            />
          </div>
          
          {/* Item count */}
          {item.count > 1 && (
            <div className="absolute bottom-1 right-1 text-white text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {item.count}
            </div>
          )}
          
          {/* Durability bar for tools/weapons */}
          {item.durability && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
              <div 
                className={`h-full ${getDurabilityColor(item.durability)}`}
                style={{ width: `${item.durability}%` }}
              ></div>
            </div>
          )}
        </>
      )}
      
      {/* Item label shown below slot */}
      {item && showLabel && (
        <div className="absolute -bottom-5 left-0 right-0 text-center text-xs text-gray-300 truncate px-1">
          {item.displayName || item.label || formatItemName(item.name)}
        </div>
      )}
    </motion.div>
  );
};

// Helper function to format item name for display
const formatItemName = (name) => {
  return name
    .replace(/_/g, ' ')
    .replace(/\\b\\w/g, l => l.toUpperCase());
};

// Helper to get color for durability bar
const getDurabilityColor = (percentage) => {
  if (percentage > 70) return 'bg-green-500';
  if (percentage > 30) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default MinecraftInventory;