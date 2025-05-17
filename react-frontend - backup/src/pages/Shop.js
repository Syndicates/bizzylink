import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBagIcon, FunnelIcon as FilterIcon, StarIcon, UserGroupIcon, GiftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

// Mock data for shop items
const SHOP_ITEMS = [
  {
    id: 1,
    name: 'VIP Status',
    description: 'Get VIP status for 30 days with special perks and commands.',
    price: 10,
    category: 'ranks',
    image: 'https://via.placeholder.com/150?text=VIP',
    featured: true,
    popular: true
  },
  {
    id: 2,
    name: 'Diamond Pickaxe Bundle',
    description: 'Get a Diamond Pickaxe with Efficiency V and Unbreaking III.',
    price: 5,
    category: 'items',
    image: 'https://via.placeholder.com/150?text=Pickaxe',
    featured: false,
    popular: true
  },
  {
    id: 3,
    name: 'Plot Extension',
    description: 'Extend your plot size by 10x10 blocks.',
    price: 8,
    category: 'plots',
    image: 'https://via.placeholder.com/150?text=Plot',
    featured: false,
    popular: false
  },
  {
    id: 4,
    name: 'Elite Rank',
    description: 'Get Elite rank for 30 days with even more perks.',
    price: 20,
    category: 'ranks',
    image: 'https://via.placeholder.com/150?text=Elite',
    featured: true,
    popular: false
  },
  {
    id: 5,
    name: 'Ender Chest Kit',
    description: 'Get a portable Ender Chest to access your items anywhere.',
    price: 7,
    category: 'items',
    image: 'https://via.placeholder.com/150?text=EnderChest',
    featured: false,
    popular: true
  },
  {
    id: 6,
    name: 'Starter Kit',
    description: 'Everything you need to get started on the server.',
    price: 3,
    category: 'kits',
    image: 'https://via.placeholder.com/150?text=StarterKit',
    featured: false,
    popular: true
  },
  {
    id: 7,
    name: 'Rainbow Chat Color',
    description: 'Make your chat messages appear in rainbow colors.',
    price: 5,
    category: 'cosmetics',
    image: 'https://via.placeholder.com/150?text=Rainbow',
    featured: false,
    popular: false
  },
  {
    id: 8,
    name: 'Vote Party Booster',
    description: 'Double your rewards from the next vote party.',
    price: 4,
    category: 'boosters',
    image: 'https://via.placeholder.com/150?text=VoteBoost',
    featured: false,
    popular: false
  }
];

// Categories
const CATEGORIES = [
  { id: 'all', name: 'All Items' },
  { id: 'ranks', name: 'Ranks & Privileges' },
  { id: 'items', name: 'Items & Tools' },
  { id: 'plots', name: 'Plot Upgrades' },
  { id: 'kits', name: 'Starter Kits' },
  { id: 'cosmetics', name: 'Cosmetics' },
  { id: 'boosters', name: 'Boosters' }
];

// ShopItem component
const ShopItem = ({ item, onPurchase }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`habbo-card overflow-hidden ${item.featured ? 'featured-item' : ''}`}
      whileHover={{ y: -5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-40 object-cover" 
        />
        {item.featured && (
          <div className="absolute top-2 right-2 bg-minecraft-gold text-black px-2 py-1 rounded-full text-xs font-bold">
            Featured
          </div>
        )}
        {item.popular && (
          <div className="absolute top-2 left-2 bg-minecraft-habbo-red text-white px-2 py-1 rounded-full text-xs font-bold">
            Popular
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
        <p className="text-sm text-gray-300 mb-4 h-12 overflow-hidden">
          {item.description}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold text-minecraft-habbo-blue">
            ${item.price}
          </span>
          <button 
            onClick={() => onPurchase(item)}
            className="habbo-btn text-sm"
          >
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Shop = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // Filter items based on category and search
  const filteredItems = SHOP_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Handle purchase
  const handlePurchase = (item) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      setNotification({
        show: true,
        type: 'success',
        message: `You've successfully purchased ${item.name}!`
      });
    }, 1500);
  };
  
  return (
    <div className="min-h-screen py-8 minecraft-grid-bg bg-habbo-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div className="flex items-center mb-4 md:mb-0">
            <ShoppingBagIcon className="h-8 w-8 text-minecraft-habbo-blue mr-4" />
            <div>
              <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">Server Shop</h1>
              <p className="text-gray-400">Support the server and get awesome perks!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="habbo-input pl-10"
              />
            </div>
            
            <div className="flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-white/20' : 'bg-transparent'} rounded-l-md border border-white/20`}
              >
                <GridIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-white/20' : 'bg-transparent'} rounded-r-md border border-white/20 border-l-0`}
              >
                <ViewListIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Balance Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="habbo-card p-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Your Balance</p>
              <p className="text-2xl font-bold text-minecraft-habbo-yellow">$25.00</p>
            </div>
            <button className="habbo-btn">
              Add Funds
            </button>
          </div>
        </motion.div>
        
        {/* Categories and Products */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/4"
          >
            <div className="habbo-card p-4 sticky top-4">
              <div className="flex items-center mb-4">
                <FilterIcon className="h-5 w-5 mr-2 text-minecraft-habbo-blue" />
                <h2 className="text-xl font-bold">Categories</h2>
              </div>
              
              <div className="space-y-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
                      selectedCategory === category.id 
                        ? 'bg-minecraft-habbo-blue text-white' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center p-3 bg-minecraft-habbo-blue/20 rounded-md">
                  <StarIcon className="h-5 w-5 text-minecraft-habbo-yellow mr-2" />
                  <span className="text-sm">Featured Items</span>
                </div>
                
                <div className="flex items-center p-3 bg-minecraft-habbo-red/20 rounded-md">
                  <UserGroupIcon className="h-5 w-5 text-minecraft-habbo-red mr-2" />
                  <span className="text-sm">Most Popular</span>
                </div>
                
                <div className="flex items-center p-3 bg-minecraft-habbo-purple/20 rounded-md">
                  <GiftIcon className="h-5 w-5 text-minecraft-habbo-purple mr-2" />
                  <span className="text-sm">Special Offers</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-3/4"
          >
            {loading ? (
              <div className="flex justify-center items-center h-60">
                <LoadingSpinner />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="habbo-card p-8 text-center">
                <p className="text-xl mb-4">No items found</p>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredItems.map(item => (
                  viewMode === 'grid' ? (
                    <ShopItem 
                      key={item.id} 
                      item={item} 
                      onPurchase={handlePurchase} 
                    />
                  ) : (
                    <div key={item.id} className="habbo-card p-4 flex">
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-md mr-4" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold">{item.name}</h3>
                          <span className="text-xl font-bold text-minecraft-habbo-blue">${item.price}</span>
                        </div>
                        <p className="text-sm text-gray-300 my-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {item.featured && (
                              <span className="bg-minecraft-gold text-black px-2 py-1 rounded-full text-xs font-bold">
                                Featured
                              </span>
                            )}
                            {item.popular && (
                              <span className="bg-minecraft-habbo-red text-white px-2 py-1 rounded-full text-xs font-bold">
                                Popular
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handlePurchase(item)}
                            className="habbo-btn text-sm"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

// Missing icon components
const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GridIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ViewListIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export default Shop;