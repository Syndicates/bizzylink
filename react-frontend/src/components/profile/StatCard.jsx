/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file StatCard.jsx
 * @description Stat card component for profile statistics
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';

// Stat card component
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 rounded-md p-4 flex items-center justify-between">
    <div className="flex items-center">
      <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center mr-3">
        {icon}
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <span className="text-xl font-minecraft text-minecraft-habbo-blue">{value}</span>
  </div>
);

export default StatCard; 