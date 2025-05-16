import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

// Mock auction data
const MOCK_AUCTIONS = [
  {
    id: 1,
    title: "Diamond Pickaxe (Efficiency V)",
    description: "A powerful diamond pickaxe with Efficiency V, Unbreaking III, and Fortune III.",
    seller: "MinerSteve",
    currentBid: 1500,
    minBidIncrement: 100,
    endTime: new Date(Date.now() + 3600000 * 3), // 3 hours from now
    image: "https://via.placeholder.com/150?text=DiamondPickaxe",
    bids: [
      { bidder: "Notch123", amount: 1500, time: new Date(Date.now() - 120000) },
      { bidder: "Herobrine", amount: 1400, time: new Date(Date.now() - 360000) },
      { bidder: "Alex42", amount: 1200, time: new Date(Date.now() - 720000) }
    ],
    featured: true
  },
  {
    id: 2,
    title: "Enchanted Netherite Sword",
    description: "Netherite sword with Sharpness V, Looting III, and Fire Aspect II.",
    seller: "PvPMaster",
    currentBid: 3000,
    minBidIncrement: 250,
    endTime: new Date(Date.now() + 3600000 * 24), // 24 hours from now
    image: "https://via.placeholder.com/150?text=NetheriteSword",
    bids: [
      { bidder: "Warrior99", amount: 3000, time: new Date(Date.now() - 60000) },
      { bidder: "FightKing", amount: 2750, time: new Date(Date.now() - 180000) },
      { bidder: "SwordCollector", amount: 2500, time: new Date(Date.now() - 480000) }
    ],
    featured: false
  },
  {
    id: 3,
    title: "Elysian Estate Plot (30x30)",
    description: "Premium plot in the Elysian Estate district near spawn. Perfect for building a shop or showcase.",
    seller: "LandLord",
    currentBid: 10000,
    minBidIncrement: 500,
    endTime: new Date(Date.now() + 3600000 * 48), // 48 hours from now
    image: "https://via.placeholder.com/150?text=PremiumPlot",
    bids: [
      { bidder: "Builder123", amount: 10000, time: new Date(Date.now() - 30000) },
      { bidder: "Architect", amount: 9500, time: new Date(Date.now() - 90000) },
      { bidder: "DesignPro", amount: 9000, time: new Date(Date.now() - 200000) }
    ],
    featured: true
  },
  {
    id: 4,
    title: "Rare Dragon Egg",
    description: "An extremely rare dragon egg, perfect for display or collection.",
    seller: "DragonSlayer",
    currentBid: 5000,
    minBidIncrement: 300,
    endTime: new Date(Date.now() + 3600000 * 12), // 12 hours from now
    image: "https://via.placeholder.com/150?text=DragonEgg",
    bids: [
      { bidder: "Collector42", amount: 5000, time: new Date(Date.now() - 45000) },
      { bidder: "RareFinder", amount: 4700, time: new Date(Date.now() - 150000) },
      { bidder: "TreasureHunter", amount: 4400, time: new Date(Date.now() - 300000) }
    ],
    featured: false
  },
  {
    id: 5,
    title: "Beacon Set with Base",
    description: "Complete beacon with full pyramid base (all 164 blocks).",
    seller: "BeaconMaster",
    currentBid: 8000,
    minBidIncrement: 400,
    endTime: new Date(Date.now() + 3600000 * 6), // 6 hours from now
    image: "https://via.placeholder.com/150?text=Beacon",
    bids: [
      { bidder: "WealthyMiner", amount: 8000, time: new Date(Date.now() - 20000) },
      { bidder: "IronFarmer", amount: 7600, time: new Date(Date.now() - 80000) },
      { bidder: "MineKing", amount: 7200, time: new Date(Date.now() - 180000) }
    ],
    featured: false
  }
];

// Format time remaining
const formatTimeRemaining = (endTime) => {
  const now = new Date();
  const diff = endTime - now;
  
  if (diff <= 0) return "Auction ended";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

// Auction item card component
const AuctionItem = ({ item, onView, onBid }) => {
  const timeRemaining = formatTimeRemaining(item.endTime);
  const isActive = new Date() < item.endTime;
  
  return (
    <motion.div 
      className={`auction-item overflow-hidden ${item.featured ? 'featured-item' : ''}`}
      whileHover={{ y: -5 }}
    >
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-48 object-cover"
        />
        {item.featured && (
          <div className="absolute top-2 right-2 bg-minecraft-gold text-black px-2 py-1 rounded-full text-xs font-bold">
            Featured
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-bold mb-1 truncate">{item.title}</h3>
        <p className="text-sm text-gray-300 mb-2 h-12 overflow-hidden">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400">Current Bid</p>
            <p className="text-lg font-bold text-minecraft-gold">
              ${item.currentBid}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Seller</p>
            <p className="text-minecraft-habbo-blue">{item.seller}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm ${
            timeRemaining === "Auction ended" 
              ? "text-minecraft-habbo-red" 
              : "text-minecraft-habbo-yellow"
          }`}>
            {timeRemaining}
          </p>
          <p className="text-sm text-gray-400">
            {item.bids.length} bids
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onView(item)}
            className="habbo-btn flex-1"
          >
            View Details
          </button>
          {isActive && (
            <button 
              onClick={() => onBid(item)}
              className="minecraft-btn flex-1"
            >
              Place Bid
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Auction details modal
const AuctionModal = ({ item, onClose, onBid }) => {
  const [bidAmount, setBidAmount] = useState(item.currentBid + item.minBidIncrement);
  const timeRemaining = formatTimeRemaining(item.endTime);
  const isActive = new Date() < item.endTime;
  
  const handleBidSubmit = (e) => {
    e.preventDefault();
    onBid(item, bidAmount);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Description</h3>
                  <p className="text-gray-300">{item.description}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-1">Seller</h3>
                  <p className="text-minecraft-habbo-blue">{item.seller}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-1">Auction Ends</h3>
                  <p className={`${
                    timeRemaining === "Auction ended" 
                      ? "text-minecraft-habbo-red" 
                      : "text-minecraft-habbo-yellow"
                  }`}>
                    {item.endTime.toLocaleString()} ({timeRemaining})
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white/5 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">Current Bid</h3>
                  <p className="text-2xl font-bold text-minecraft-gold">${item.currentBid}</p>
                </div>
                
                <p className="text-sm text-gray-400 mb-4">
                  Minimum bid increment: ${item.minBidIncrement}
                </p>
                
                {isActive && (
                  <form onSubmit={handleBidSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Your Bid Amount
                      </label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        min={item.currentBid + item.minBidIncrement}
                        step={item.minBidIncrement}
                        className="habbo-input w-full"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={bidAmount < item.currentBid + item.minBidIncrement}
                      className="minecraft-btn w-full py-3"
                    >
                      Place Bid
                    </button>
                  </form>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-3">Bid History</h3>
                {item.bids.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {item.bids.map((bid, index) => (
                      <div
                        key={index}
                        className="bg-white/5 p-3 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{bid.bidder}</p>
                          <p className="text-xs text-gray-400">
                            {bid.time.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-minecraft-gold">
                          ${bid.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No bids yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Create Auction modal
const CreateAuctionModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingBid: 100,
    minBidIncrement: 10,
    duration: 24, // hours
    image: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Create New Auction</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="habbo-input w-full"
                  placeholder="e.g. Diamond Pickaxe with Enchantments"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="habbo-input w-full"
                  placeholder="Describe your item in detail..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Starting Bid ($)
                  </label>
                  <input
                    type="number"
                    name="startingBid"
                    value={formData.startingBid}
                    onChange={handleChange}
                    min={1}
                    required
                    className="habbo-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Minimum Bid Increment ($)
                  </label>
                  <input
                    type="number"
                    name="minBidIncrement"
                    value={formData.minBidIncrement}
                    onChange={handleChange}
                    min={1}
                    required
                    className="habbo-input w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Duration (hours)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="habbo-input w-full"
                >
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="habbo-input w-full"
                  placeholder="https://example.com/image.jpg (optional)"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  className="minecraft-btn w-full py-3"
                >
                  Create Auction
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const Auction = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, ending-soon, my-bids, my-auctions
  
  // Get auctions on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAuctions(MOCK_AUCTIONS);
      setLoading(false);
    }, 1000);
    
    // Set up timer to update time remaining
    const timer = setInterval(() => {
      // Force re-render to update time displays
      setAuctions(prev => [...prev]);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Filter auctions based on selected filter
  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'all') return true;
    if (filter === 'active') return new Date() < auction.endTime;
    if (filter === 'ending-soon') {
      const hoursRemaining = (auction.endTime - new Date()) / (1000 * 60 * 60);
      return hoursRemaining > 0 && hoursRemaining < 6;
    }
    if (filter === 'my-bids') {
      return auction.bids.some(bid => bid.bidder === user?.username);
    }
    if (filter === 'my-auctions') {
      return auction.seller === user?.username;
    }
    return true;
  });
  
  // View auction details
  const handleViewAuction = (auction) => {
    setSelectedAuction(auction);
  };
  
  // Place bid
  const handlePlaceBid = (auction, amount) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update auction with new bid
      const updatedAuctions = auctions.map(a => {
        if (a.id === auction.id) {
          const newBid = {
            bidder: user?.username || 'CurrentUser',
            amount: amount,
            time: new Date()
          };
          
          return {
            ...a,
            currentBid: amount,
            bids: [newBid, ...a.bids]
          };
        }
        return a;
      });
      
      setAuctions(updatedAuctions);
      setLoading(false);
      setSelectedAuction(null);
      
      setNotification({
        show: true,
        type: 'success',
        message: `Your bid of $${amount} has been placed successfully!`
      });
    }, 1500);
  };
  
  // Create new auction
  const handleCreateAuction = (formData) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newAuction = {
        id: auctions.length + 1,
        title: formData.title,
        description: formData.description,
        seller: user?.username || 'CurrentUser',
        currentBid: formData.startingBid,
        minBidIncrement: formData.minBidIncrement,
        endTime: new Date(Date.now() + formData.duration * 60 * 60 * 1000),
        image: formData.image || "https://via.placeholder.com/150?text=Item",
        bids: [],
        featured: false
      };
      
      setAuctions([newAuction, ...auctions]);
      setLoading(false);
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Your auction has been created successfully!'
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
            <GavelIcon className="h-8 w-8 text-minecraft-habbo-yellow mr-4" />
            <div>
              <h1 className="text-3xl font-minecraft text-minecraft-habbo-yellow">Auction House</h1>
              <p className="text-gray-400">Buy and sell items with other players</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="minecraft-btn py-2 px-4"
          >
            + Create Auction
          </button>
        </motion.div>
        
        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex overflow-x-auto space-x-4 mb-8 pb-2"
        >
          <button
            onClick={() => setFilter('all')}
            className={`dashboard-tab whitespace-nowrap ${filter === 'all' ? 'active' : ''}`}
          >
            All Auctions
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`dashboard-tab whitespace-nowrap ${filter === 'active' ? 'active' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('ending-soon')}
            className={`dashboard-tab whitespace-nowrap ${filter === 'ending-soon' ? 'active' : ''}`}
          >
            Ending Soon
          </button>
          <button
            onClick={() => setFilter('my-bids')}
            className={`dashboard-tab whitespace-nowrap ${filter === 'my-bids' ? 'active' : ''}`}
          >
            My Bids
          </button>
          <button
            onClick={() => setFilter('my-auctions')}
            className={`dashboard-tab whitespace-nowrap ${filter === 'my-auctions' ? 'active' : ''}`}
          >
            My Auctions
          </button>
        </motion.div>
        
        {/* Auctions grid */}
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <LoadingSpinner />
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="habbo-card p-8 text-center">
            <p className="text-xl mb-4">No auctions found</p>
            <p className="text-gray-400">
              {filter === 'my-auctions' ? 
                "You haven't created any auctions yet." : 
                filter === 'my-bids' ? 
                  "You haven't placed any bids yet." :
                  "No auctions match the selected filter."}
            </p>
            {filter === 'my-auctions' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="minecraft-btn mt-4 py-2 px-4"
              >
                Create Your First Auction
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAuctions.map(auction => (
              <AuctionItem
                key={auction.id}
                item={auction}
                onView={handleViewAuction}
                onBid={() => handleViewAuction(auction)}
              />
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Auction detail modal */}
      {selectedAuction && (
        <AuctionModal
          item={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onBid={handlePlaceBid}
        />
      )}
      
      {/* Create auction modal */}
      {showCreateModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAuction}
        />
      )}
      
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
const GavelIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

export default Auction;