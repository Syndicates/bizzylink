/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file BizzyLinkHeader.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { CommandLineIcon } from '@heroicons/react/24/outline';

const BizzyLinkHeader = ({ playerCount = 0 }) => {
  return (
    <header className="bizzylink-header bg-minecraft-navy-dark fixed w-full top-[3.5rem]" style={{zIndex: 30}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <CommandLineIcon className="h-6 w-6 mr-2 text-minecraft-green" />
            <span className="text-gray-400 mr-1 text-xs">Powered by</span>
            <span className="font-minecraft text-minecraft-green text-xl">BIZZY</span>
            <span className="font-minecraft text-white text-xl">LINK</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
              <div className="h-2 w-2 rounded-full mr-2 animate-pulse bg-minecraft-green"></div>
              <span className="text-gray-300 text-xs sm:text-sm">{playerCount} PLAYERS ONLINE NOW</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BizzyLinkHeader;