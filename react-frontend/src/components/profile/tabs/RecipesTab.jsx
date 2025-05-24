/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 */

import React from 'react';

const RecipesTab = ({ isOwnProfile }) => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📖</div>
      <h3 className="text-xl font-minecraft text-white mb-2">Recipes</h3>
      <p className="text-gray-400">
        {isOwnProfile ? "Your known recipes will be displayed here" : "Recipes are private"}
      </p>
    </div>
  );
};

export default RecipesTab; 