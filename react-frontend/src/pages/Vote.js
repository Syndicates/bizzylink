import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MinecraftItem from '../components/MinecraftItem';
import MinecraftAvatar from '../components/MinecraftAvatar';
import {
  GiftIcon,
  ShieldCheckIcon,
  SparklesIcon,
  FireIcon,
  LockClosedIcon,
  LockOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  TrophyIcon,
  StarIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Vote sites data
const voteSites = [
  {
    id: 1,
    name: "MinecraftServers.org",
    url: "https://minecraftservers.org/vote/123456",
    image: "/minecraft-assets/vote-site1.png",
    rewardsGuest: "1 Diamond",
    rewardsLinked: "3 Diamonds + Special Crate",
    cooldown: "24 hours"
  },
  {
    id: 2,
    name: "TopG.org",
    url: "https://topg.org/minecraft-servers/server-123456/vote",
    image: "/minecraft-assets/vote-site2.png",
    rewardsGuest: "5 Iron Ingots",
    rewardsLinked: "15 Iron Ingots + Vote Key",
    cooldown: "24 hours"
  },
  {
    id: 3,
    name: "PlanetMinecraft",
    url: "https://www.planetminecraft.com/server/bizzynation/vote/",
    image: "/minecraft-assets/vote-site3.png",
    rewardsGuest: "1 Golden Apple",
    rewardsLinked: "3 Golden Apples + 500 Server Points",
    cooldown: "24 hours"
  },
  {
    id: 4,
    name: "Minecraft-MP.com",
    url: "https://minecraft-mp.com/server/123456/vote/",
    image: "/minecraft-assets/vote-site4.png",
    rewardsGuest: "2 XP Bottles",
    rewardsLinked: "6 XP Bottles + Random Enchantment Book",
    cooldown: "24 hours"
  },
  {
    id: 5,
    name: "MC-Lists.org",
    url: "https://mc-lists.org/server-bizzynation.1234/vote",
    image: "/minecraft-assets/vote-site5.png",
    rewardsGuest: "1 Ender Pearl",
    rewardsLinked: "3 Ender Pearls + 200 Economy Credits",
    cooldown: "24 hours"
  }
];

const Vote = () => {
  const { isAuthenticated, user, hasLinkedAccount } = useAuth();
  const [activeTab, setActiveTab] = useState("vote");
  const [voteStreak, setVoteStreak] = useState(0);
  const [isLinked, setIsLinked] = useState(false);
  
  // Check if user is authenticated and has a linked Minecraft account
  useEffect(() => {
    // Use the helper from AuthContext to determine link status
    setIsLinked(hasLinkedAccount);
    
    if (isAuthenticated) {
      // Set vote streak (normally you'd fetch this from an API)
      setVoteStreak(user?.voteStreak || Math.floor(Math.random() * 10) + 1);
    } else {
      setVoteStreak(0);
    }
    
    console.log("User authentication status:", isAuthenticated);
    console.log("User linked status:", hasLinkedAccount);
    console.log("User mcUsername:", user?.mcUsername || user?.minecraft?.mcUsername);
    console.log("Final isLinked state:", hasLinkedAccount);
  }, [isAuthenticated, user, hasLinkedAccount]);

  return (
    <div className="min-h-screen bg-minecraft-navy relative">
      {/* Background patterns */}
      <div className="absolute inset-0 minecraft-grid-bg opacity-10"></div>
      
      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Page header with gold gradient title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-minecraft mb-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-transparent bg-clip-text drop-shadow-lg">
              VOTE & EARN REWARDS
            </h1>
            <div className="flex justify-center">
              <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-yellow-300 rounded"></div>
            </div>
            <p className="mt-4 text-gray-300 max-w-3xl mx-auto">
              Support our server by voting daily and earn amazing in-game rewards! Get <span className="text-amber-400 font-bold">2x more rewards</span> when you vote with a linked BizzyLink account.
            </p>
          </div>

          {/* Tabs Section */}
          <div className="flex justify-center mb-8">
            <div className="bg-black/30 rounded-lg p-1 inline-flex">
              <button
                className={`px-6 py-2 rounded-md font-minecraft text-sm transition-all ${
                  activeTab === "vote"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setActiveTab("vote")}
              >
                Vote Now
              </button>
              <button
                className={`px-6 py-2 rounded-md font-minecraft text-sm transition-all ${
                  activeTab === "rewards"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setActiveTab("rewards")}
              >
                Vote Rewards
              </button>
              <button
                className={`px-6 py-2 rounded-md font-minecraft text-sm transition-all ${
                  activeTab === "streaks"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setActiveTab("streaks")}
              >
                Vote Streaks
              </button>
            </div>
          </div>

          {/* Account Status Banner */}
          <motion.div 
            className={`glass-panel-dark rounded-lg border-2 ${isLinked ? 'border-minecraft-green' : 'border-amber-500'} p-5 mb-8`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                {isAuthenticated && isLinked ? (
                  <>
                    <div className="relative">
                      <div className="absolute -top-1 -right-1 bg-minecraft-green text-white rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                        <span className="text-xs">✓</span>
                      </div>
                      <ShieldCheckIcon className="h-8 w-8 text-minecraft-green mr-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-minecraft text-minecraft-green">ACCOUNT LINKED</h3>
                      <p className="text-gray-300">You're eligible for <span className="text-minecraft-green font-bold">2x rewards</span> on all vote sites!</p>
                      <p className="text-gray-400 text-xs mt-1">Minecraft username: <span className="text-minecraft-green font-bold">{user?.mcUsername}</span></p>
                    </div>
                  </>
                ) : isAuthenticated && !isLinked ? (
                  <>
                    <LockClosedIcon className="h-8 w-8 text-amber-500 mr-4" />
                    <div>
                      <h3 className="text-lg font-minecraft text-yellow-500">ACCOUNT NOT LINKED</h3>
                      <p className="text-gray-300">Link your Minecraft account to receive <span className="text-yellow-500 font-bold">2x rewards</span> on all vote sites!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-8 w-8 text-amber-500 mr-4" />
                    <div>
                      <h3 className="text-lg font-minecraft text-yellow-500">GUEST MODE</h3>
                      <p className="text-gray-300">Create an account and link it to receive <span className="text-yellow-500 font-bold">2x rewards</span> on all vote sites!</p>
                    </div>
                  </>
                )}
              </div>
              
              {isAuthenticated && !isLinked ? (
                <Link to="/dashboard" className="btn-3d">
                  <button className="minecraft-btn px-6 py-2 text-base font-minecraft flex items-center">
                    <LinkIcon className="h-5 w-5 mr-2" />
                    Link Account
                  </button>
                </Link>
              ) : !isAuthenticated && (
                <Link to="/register" className="btn-3d">
                  <button className="minecraft-btn px-6 py-2 text-base font-minecraft flex items-center">
                    <LockOpenIcon className="h-5 w-5 mr-2" />
                    Create Account
                  </button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Content based on active tab */}
          {activeTab === "vote" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voteSites.map(site => (
                <VoteSiteCard 
                  key={site.id} 
                  site={site} 
                  isAuthenticated={isAuthenticated}
                  isLinked={isLinked}
                />
              ))}
            </div>
          )}

          {activeTab === "rewards" && (
            <RewardsComparison isAuthenticated={isAuthenticated} isLinked={isLinked} />
          )}

          {activeTab === "streaks" && (
            <VoteStreaks streak={voteStreak} isAuthenticated={isAuthenticated} isLinked={isLinked} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Vote site card component
const VoteSiteCard = ({ site, isAuthenticated, isLinked }) => {
  const [voted, setVoted] = useState(false);
  
  const handleVote = () => {
    window.open(site.url, '_blank');
    setVoted(true);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: site.id * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-minecraft-navy-dark border-2 border-gray-800 rounded-lg overflow-hidden shadow-lg"
    >
      {/* Site header with gold gradient for premium effect */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-500 h-2"></div>
      
      {/* Card content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-minecraft text-xl text-white">{site.name}</h3>
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIconSolid key={star} className="h-4 w-4 text-yellow-400" />
            ))}
          </div>
        </div>
        
        {/* Reward comparison */}
        <div className="mb-6 space-y-3 min-h-[100px]">
          <div className="flex items-start">
            <div className="bg-black/30 p-1 rounded">
              <GiftIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-400">Guest Reward:</p>
              <p className="text-sm text-gray-300">{site.rewardsGuest}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className={`p-1 rounded ${isLinked ? 'bg-minecraft-green/20' : 'bg-amber-500/20'}`}>
              <GiftIcon className={`h-5 w-5 ${isLinked ? 'text-minecraft-green' : 'text-amber-500'}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${isLinked ? 'text-minecraft-green' : 'text-amber-500'}`}>
                Linked Account:
              </p>
              <p className={`text-sm font-medium ${isLinked ? 'text-minecraft-green' : 'text-amber-500'}`}>
                {site.rewardsLinked} 
                {isLinked ? (
                  <span className="text-xs text-minecraft-green"> ✓ UNLOCKED</span>
                ) : (
                  <span className="text-xs">⭐ 2x BONUS</span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Cooldown */}
        <div className="flex items-center mb-5 text-sm text-gray-400">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>Cooldown: {site.cooldown}</span>
        </div>
        
        {/* Vote button */}
        <button
          onClick={handleVote}
          disabled={voted}
          className={`w-full py-3 px-4 rounded font-minecraft text-center flex items-center justify-center transition-all ${
            voted
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "btn-3d bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300"
          }`}
        >
          {voted ? (
            <>
              <CheckIcon className="h-5 w-5 mr-2" />
              Voted Today
            </>
          ) : (
            <>
              <StarIcon className="h-5 w-5 mr-2" />
              Vote Now
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Rewards comparison component
const RewardsComparison = ({ isAuthenticated, isLinked }) => {
  // Reward items comparison
  const rewardItems = [
    {
      name: "Daily Diamonds",
      guest: "1-2",
      linked: "3-5",
      icon: "diamond.svg"
    },
    {
      name: "Vote Keys",
      guest: "1 per 5 votes",
      linked: "1 per 3 votes",
      icon: "gold-ingot.svg"
    },
    {
      name: "XP Bottles",
      guest: "2-3",
      linked: "5-10",
      icon: "xp-orb.svg"
    },
    {
      name: "Food Items",
      guest: "4 Steak",
      linked: "8 Steak + 2 Golden Apples",
      icon: "diamond.svg"
    },
    {
      name: "Economy Cash",
      guest: "$500",
      linked: "$1,500",
      icon: "emerald.svg"
    },
    {
      name: "Random Enchants",
      guest: "Tier I Only",
      linked: "All Tiers",
      icon: "diamond.svg"
    },
    {
      name: "Vote Crates",
      guest: "Common Only",
      linked: "Common, Rare & Epic",
      icon: "chest.svg"
    },
    {
      name: "Weekly Bonus",
      guest: "Not Available",
      linked: "Special Rewards + $5,000",
      icon: "sword.svg"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass-panel-dark border-2 border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-minecraft text-center mb-6 bg-gradient-to-r from-amber-300 to-yellow-400 text-transparent bg-clip-text">
          REWARDS COMPARISON
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-4 gap-2 border-b-2 border-gray-800 pb-2 mb-2">
            <div className="text-gray-400 font-minecraft">REWARD</div>
            <div className="text-center text-gray-400 font-minecraft">ITEM</div>
            <div className="text-center text-gray-400 font-minecraft">GUEST</div>
            <div className="text-center text-amber-400 font-minecraft">BIZZYLINK</div>
          </div>
          
          {rewardItems.map((item, index) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="grid grid-cols-4 gap-2 items-center py-3 border-b border-gray-800/50"
            >
              <div className="text-white font-medium">{item.name}</div>
              <div className="flex justify-center">
                <MinecraftItem name={item.icon} size={32} animate={false} showTooltip={true} tooltipText={item.name} />
              </div>
              <div className="text-center text-gray-300">{item.guest}</div>
              <div className={`text-center font-bold ${isLinked 
                ? 'text-minecraft-green' 
                : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-transparent bg-clip-text'}`}>
                {item.linked} 
                {isLinked ? (
                  <span className="text-xs text-minecraft-green">✓</span>
                ) : (
                  <span className="text-xs text-amber-400">⭐</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Call to action */}
      {!isAuthenticated ? (
        <motion.div 
          className="text-center bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-lg p-6 border-2 border-amber-500/50"
          whileHover={{ scale: 1.02 }}
        >
          <SparklesIcon className="h-12 w-12 mx-auto text-amber-400 mb-3" />
          <h3 className="text-xl font-minecraft text-amber-400 mb-2">UNLOCK 2X REWARDS NOW!</h3>
          <p className="text-gray-300 mb-4">Create a BizzyLink account and connect your Minecraft profile to receive double rewards on ALL vote sites!</p>
          <Link 
            to="/register" 
            className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-2 px-6 rounded font-minecraft hover:from-amber-400 hover:to-yellow-300 transition-all"
          >
            Create Account
          </Link>
        </motion.div>
      ) : !isLinked && (
        <motion.div 
          className="text-center bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-lg p-6 border-2 border-amber-500/50"
          whileHover={{ scale: 1.02 }}
        >
          <LinkIcon className="h-12 w-12 mx-auto text-amber-400 mb-3" />
          <h3 className="text-xl font-minecraft text-amber-400 mb-2">LINK YOUR MINECRAFT ACCOUNT!</h3>
          <p className="text-gray-300 mb-4">You're logged in, but your Minecraft account is not linked. Connect your Minecraft profile to unlock double rewards!</p>
          <Link 
            to="/dashboard" 
            className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-2 px-6 rounded font-minecraft hover:from-amber-400 hover:to-yellow-300 transition-all"
          >
            Link Account
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
};

// Vote streaks component
const VoteStreaks = ({ streak, isAuthenticated, isLinked }) => {
  const { user } = useAuth(); // Get user from auth context
  
  const streakRewards = [
    {
      days: 3,
      reward: "1 Vote Key + $1,000",
      linkedBonus: "+ 3 Random Enchanted Books"
    },
    {
      days: 7,
      reward: "5 Diamonds + 1 Vote Crate",
      linkedBonus: "+ Special Tool with Custom Enchants"
    },
    {
      days: 14,
      reward: "1 Rare Crate Key + $5,000",
      linkedBonus: "+ 1 Epic Crate Key"
    },
    {
      days: 30,
      reward: "1 Monthly Reward Kit",
      linkedBonus: "+ Unique Cosmetic Item & Title"
    }
  ];

  return (
    <div>
      {/* Current streak indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel-dark border-2 border-gray-800 rounded-lg p-6 mb-8 text-center"
      >
        <h2 className="text-2xl font-minecraft mb-4 bg-gradient-to-r from-amber-300 to-yellow-400 text-transparent bg-clip-text">
          YOUR VOTE STREAK
        </h2>
        
        {isAuthenticated && isLinked ? (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-yellow-900/30 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-minecraft-navy-dark flex items-center justify-center">
                    <span className="font-minecraft text-3xl text-amber-400">{streak}</span>
                  </div>
                </div>
              </div>
              {/* Little stars around the streak counter */}
              <StarIconSolid className="absolute top-0 right-0 h-5 w-5 text-yellow-400 animate-pulse" />
              <StarIconSolid className="absolute bottom-2 right-1 h-4 w-4 text-yellow-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <StarIconSolid className="absolute top-2 left-1 h-4 w-4 text-yellow-400 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
            <h3 className="mt-4 text-xl font-minecraft text-amber-400">
              {streak} DAY{streak !== 1 ? 'S' : ''}
            </h3>
            <p className="text-gray-300 mt-2">
              Keep voting daily to increase your streak and earn special rewards!
            </p>
            {user?.mcUsername && (
              <p className="text-green-400 text-xs mt-2">
                Minecraft username: <span className="font-bold">{user.mcUsername}</span>
              </p>
            )}
          </div>
        ) : isAuthenticated && !isLinked ? (
          <div className="flex flex-col items-center">
            <LockClosedIcon className="h-16 w-16 text-amber-500 mb-3" />
            <h3 className="text-xl font-minecraft text-amber-500">STREAK TRACKING UNAVAILABLE</h3>
            <p className="text-gray-300 mt-2 mb-4">
              Your account is not linked to Minecraft. Link your account to track your vote streak!
            </p>
            <Link 
              to="/dashboard" 
              className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-2 px-6 rounded font-minecraft hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              Link Account
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <LockClosedIcon className="h-16 w-16 text-amber-500 mb-3" />
            <h3 className="text-xl font-minecraft text-amber-500">STREAK TRACKING LOCKED</h3>
            <p className="text-gray-300 mt-2 mb-4">
              Create a BizzyLink account to track your vote streak and earn bonus rewards!
            </p>
            <Link 
              to="/register" 
              className="inline-block bg-gradient-to-r from-amber-500 to-yellow-400 text-black py-2 px-6 rounded font-minecraft hover:from-amber-400 hover:to-yellow-300 transition-all"
            >
              Create Account
            </Link>
          </div>
        )}
      </motion.div>
      
      {/* Streak rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {streakRewards.map((reward, index) => (
          <motion.div
            key={reward.days}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`glass-panel-dark rounded-lg border-2 ${
              isAuthenticated && streak >= reward.days 
                ? 'border-minecraft-green'
                : 'border-gray-800'
            } p-5 text-center`}
          >
            <div className="mb-3">
              {isAuthenticated && streak >= reward.days ? (
                <div className="h-10 w-10 mx-auto bg-minecraft-green/20 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-6 w-6 text-minecraft-green" />
                </div>
              ) : (
                <div className="h-10 w-10 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                  <span className="font-minecraft text-amber-500">{reward.days}</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-minecraft text-amber-400 mb-2">
              {reward.days}-DAY STREAK
            </h3>
            <div className="min-h-[60px]">
              <p className="text-gray-300 text-sm mb-1">{reward.reward}</p>
              {isAuthenticated ? (
                <p className="text-minecraft-green text-sm font-medium">{reward.linkedBonus}</p>
              ) : (
                <p className="text-amber-500 text-xs">
                  <LockClosedIcon className="inline h-3 w-3 mr-1" />
                  Link account to unlock bonus
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper icon components 
const CheckIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default Vote;