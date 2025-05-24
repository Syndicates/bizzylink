/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 */

import React from 'react';

const InventoryTab = ({ isOwnProfile }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎒</div>
      <h3 className="text-xl font-minecraft text-white mb-2">Inventory</h3>
      <p className="text-gray-400">
        {isOwnProfile ? "Your inventory will be displayed here" : "Inventory is private"}
      </p>
    </div>
  );
};

export default InventoryTab; 