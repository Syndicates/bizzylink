/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Home.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MinecraftItem from '../components/MinecraftItem';
import MinecraftAvatar from '../components/MinecraftAvatar';
import minecraftApi from '../services/minecraft-api';
import { 
  ChevronRightIcon, 
  UserIcon, 
  LinkIcon, 
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ServerIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import diamondIcon from '../assets/images/minecraft-content/diamond.svg';
import emeraldIcon from '../assets/images/minecraft-content/emerald.svg';
import goldIngotIcon from '../assets/images/minecraft-content/gold-ingot.svg';
import ironIngotIcon from '../assets/images/minecraft-content/iron-ingot.svg';
import chestIcon from '../assets/images/minecraft-content/chest.svg';
import swordIcon from '../assets/images/minecraft-content/sword.svg';
import pickaxeIcon from '../assets/images/minecraft-content/pickaxe.svg';
import xpOrbIcon from '../assets/images/minecraft-content/xp-orb.svg';
import grassBlockIcon from '../assets/images/minecraft-content/grass-block.svg';

// Minecraft player data with usernames and speech bubbles
const minecraftPlayers = [
  { 
    username: 'n0t_awake', 
    message: 'Hey, I\'m Bizzy! Welcome to my Minecraft server!', 
    messages: [
      'Hey, I\'m Bizzy! Welcome to my Minecraft server!',
      'Join my Discord community at discord.gg/bizzynation',
      'Check out my YouTube channel: youtube.com/@bizzys',
      'Follow me on TikTok: @bizzynation',
      'Subscribe for special in-game perks & rewards!',
      'We have custom plugins made just for this server!',
      'I stream server events LIVE every weekend!',
      'BizzyNation is all about community & creativity!',
      'New TikTok videos weekly with Minecraft tips!',
      'My YouTube has exclusive Minecraft tutorials!',
      'New members get a special welcome gift in-game!',
      'Thanks for supporting the BizzyNation server!',
      'Want to see cool builds? Join the server now!',
    ],
    size: 75, 
    position: { top: '110px', right: '-15px' }, 
    translateX: '0', 
    translateY: '0', 
    rotate: '45deg', 
    zIndex: 50, 
    isFeatured: true 
  }
  // Removed all other player heads
];

// Minecraft Player Head component with speech bubble
const MinecraftPlayerHead = ({ player, delay }) => {
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(player.message);
  const [showMessage, setShowMessage] = useState(true);
  // Only show speech bubble for n0t_awake by default or when hovered
  const [showSpeechBubble, setShowSpeechBubble] = useState(player.username === 'n0t_awake');
  // State for Easter egg
  const [easterEggActivated, setEasterEggActivated] = useState(false);
  
  // Log when component renders - REMOVED to prevent console spam
  // console.log(`Rendering head for ${player.username} at position:`, player.position);
  
  // Show speech bubble on hover for players other than n0t_awake
  useEffect(() => {
    if (player.username !== 'n0t_awake') {
      setShowSpeechBubble(isHovered);
    }
  }, [isHovered, player.username]);

  // Cycle through messages for n0t_awake
  useEffect(() => {
    if (player.username === 'n0t_awake' && player.messages) {
      // console.log(`Setting up message cycle for ${player.username}`);
      
      // Initialize with first message
      setCurrentMessage(player.messages[0]);
      setShowMessage(true);
      
      const messageInterval = setInterval(() => {
        // console.log(`Cycling message for ${player.username}`);
        
        // Fade out current message
        setShowMessage(false);
        
        // Wait for fade out and then change message
        setTimeout(() => {
          // If Easter egg is activated, show special message
          if (easterEggActivated) {
            const easterEggMessages = [
              "You found the Easter egg! Nice click!",
              "Secret message unlocked! You're awesome!",
              "Bizzy's secret: I love building redstone contraptions!",
              "Psst! The best ore is definitely emerald!",
              "Hidden fact: I once built a 1:1 scale castle!"
            ];
            const randomIndex = Math.floor(Math.random() * easterEggMessages.length);
            setCurrentMessage(easterEggMessages[randomIndex]);
          } else {
            const randomIndex = Math.floor(Math.random() * player.messages.length);
            const newMessage = player.messages[randomIndex];
            // console.log(`New message: ${newMessage}`);
            setCurrentMessage(newMessage);
          }
          
          setShowMessage(true);
        }, 800); // Wait 800ms for fade out - increased from 500ms
        
      }, 6000); // Show each message for 6 seconds instead of 5
      
      return () => clearInterval(messageInterval);
    }
  }, [player.username, player.messages, easterEggActivated]);
  
  // Determine speech bubble position based on the player's position
  const getSpeechBubblePosition = () => {
    const username = player.username;
    
    // Special case for n0t_awake with rotation
    if (username === 'n0t_awake') {
      return { 
        left: 'auto', 
        right: '90px',
        top: '-40px',
        transform: 'none',
        zIndex: 60
      };
    }
    // For Notch on the left side
    else if (username === 'Notch') {
      return { 
        left: '55px', 
        right: 'auto',
        top: '5px',
        zIndex: 41
      };
    }
    // For other players, position based on their location
    else if (player.position.right) {
      return { 
        left: 'auto', 
        right: `${player.size + 10}px`,
        top: '5px',
        zIndex: player.zIndex + 1
      };
    }
    else {
      return { 
        left: `${player.size + 10}px`, 
        right: 'auto',
        top: '5px',
        zIndex: player.zIndex + 1
      };
    }
  };

  // Get speech bubble position directly
  const speechBubblePosition = getSpeechBubblePosition();
  
  // Determine arrow position for speech bubble
  const getArrowPosition = () => {
    const username = player.username;
    
    // Special case for n0t_awake with rotation
    if (username === 'n0t_awake') {
      return { 
        left: '50%',
        right: 'auto', 
        bottom: '-10px',
        top: 'auto',
        marginLeft: '-10px',
        transform: 'rotate(45deg)'
      };
    }
    else if (player.position.right) {
      return { 
        left: 'auto', 
        right: '-6px',
        top: '15px',
        transform: 'rotate(-45deg)'
      };
    } else {
      return { 
        right: 'auto',
        left: '-6px', 
        top: '15px',
        transform: 'rotate(45deg)'
      };
    }
  };

  // Get arrow position
  const arrowPosition = getArrowPosition();
  
  // For debugging - log message changes
  useEffect(() => {
    if (player.username === 'n0t_awake') {
      // console.log(`Current message for ${player.username}: ${currentMessage}`);
      // console.log(`Show message state: ${showMessage}`);
    }
  }, [currentMessage, showMessage, player.username]);
  
  // Add a key to the text div to trigger animation when message changes
  const textKey = player.username === 'n0t_awake' ? `message-${currentMessage}` : `message-${player.message}`;

  return (
    <motion.div 
      className={player.username === 'n0t_awake' ? "absolute z-[100]" : "absolute"}
      style={{ 
        top: player.position.top, 
        left: player.position.left,
        right: player.position.right,
        transform: `translate(${player.translateX || '0'}, ${player.translateY || '0'})${player.rotate ? ` rotate(${player.rotate})` : ''}`,
        zIndex: player.zIndex || 1
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        ...player.animation
      }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        ...player.transition
      }}
      whileHover={{ scale: 1.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Player Head */}
        <img 
          src={`https://mc-heads.net/avatar/${player.username}/${player.size || 40}`} 
          alt={`${player.username}'s Minecraft head`} 
          className="rounded-sm shadow-lg"
          style={{ 
            border: player.username === 'n0t_awake' ? '4px solid lime' : '2px solid rgba(84, 170, 84, 0.5)',
            minWidth: `${player.size || 40}px`,
            minHeight: `${player.size || 40}px`,
            backgroundColor: 'rgba(20, 20, 20, 0.3)'
          }}
          onLoad={() => {
            // console.log(`Image loaded for ${player.username}`);
            setImageLoaded(true);
          }}
          onError={(e) => {
            // console.error(`Failed to load image for ${player.username}`, e);
            setImageError(true);
          }}
        />
        
        {imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-sm"
            style={{ 
              width: `${player.size || 40}px`, 
              height: `${player.size || 40}px` 
            }}
          >
            <span className="text-xs text-white">Error</span>
          </div>
        )}
        
        <AnimatePresence>
          {showSpeechBubble && (
            <>
              <motion.div 
                className={`speech-bubble absolute bg-white rounded-lg border-2 border-gray-800 shadow-lg font-minecraft 
                  ${player.username === 'n0t_awake' ? 'text-md p-4' : 'text-sm p-3'} z-20`}
                style={{
                  width: player.username === 'n0t_awake' ? '380px' : '220px', // Increased from 350px to 380px
                  maxWidth: '90vw', // Prevent overflow on small screens
                  ...speechBubblePosition,
                  color: 'black', // Ensure text is black for contrast
                  fontWeight: '600', // Make text bolder for better visibility
                  textShadow: 'none', // Remove any text shadow that might affect visibility
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque background
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' // Stronger shadow for better visibility
                }}
                onClick={() => {
                  if (player.username === 'n0t_awake') {
                    setEasterEggActivated(!easterEggActivated);
                    // Visual feedback for click
                    const bubble = document.querySelector('.speech-bubble');
                    if (bubble) {
                      bubble.style.transform = 'scale(1.05)';
                      setTimeout(() => {
                        bubble.style.transform = 'scale(1)';
                      }, 200);
                    }
                  }
                }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ 
                  opacity: showMessage ? 1 : 0, 
                  scale: showMessage ? 1 : 0.9, 
                  y: showMessage ? 0 : 10,
                  transition: { duration: 0.8 } // Increased from 0.3 to 0.8 for more pronounced fade
                }}
                exit={{ opacity: 0, scale: 0.8, y: 10, transition: { duration: 0.5 } }} // Increased from 0.2 to 0.5
              >
                <div className="text-black font-medium" style={{ minHeight: '1.5em' }}>
                  <motion.span
                    key={textKey}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }} // Increased from 0.3 to 0.6
                  >
                    {player.username === 'n0t_awake' ? currentMessage : player.message}
                  </motion.span>
                </div>
                {easterEggActivated && player.username === 'n0t_awake' && (
                  <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500">
                    Easter egg mode activated! Click again to return to normal messages.
                  </div>
                )}
              </motion.div>
              {player.username !== 'n0t_awake' && (
                <motion.div 
                  className="absolute w-4 h-4 bg-white border-l-2 border-b-2 border-gray-800" 
                  style={arrowPosition}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                ></motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [floatingHeads, setFloatingHeads] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [renderTime, setRenderTime] = useState(null);
  const [serverLoad, setServerLoad] = useState(Math.floor(Math.random() * 25) + 5); // Random server load between 5-30%
  const renderStartTime = useRef(Date.now());
  
  // Server status
  const [serverStatus, setServerStatus] = useState({
    online: true,
    playerCount: 0,
    maxPlayers: 100,
    version: '1.19.2',
    motd: '',
    players: [],
    lastUpdated: new Date()
  });
  const [serverStatusLoading, setServerStatusLoading] = useState(true);
  
  // New state variables for social media content
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [tiktokVideos, setTiktokVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoError, setVideoError] = useState(null);
  
  // Use useMemo for video arrays to fix dependency warnings
  const youtubeVideoIds = useMemo(() => [
    "1DQL3yUdEBo", // Minecraft Trailer
    "MmB9b5njVbA", // Minecraft YouTube video
    "Rla3FUlxJdE"  // Minecraft Caves & Cliffs update
  ], []);
  
  // TikTok video IDs - real Minecraft TikToks
  const tiktokVideoIds = useMemo(() => [
    "7042566468978319662", // Minecraft TikTok
    "7079802040155697450", // Another Minecraft TikTok
    "7079526950567215406"  // Another Minecraft TikTok
  ], []);
  
  // Function to copy server address to clipboard
  const copyServerAddress = () => {
    const serverAddress = "play.bizzynation.co.uk";
    
    // Try to use the modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(serverAddress)
        .then(() => {
          // Show success message
          setCopySuccess(true);
          
          // Hide success message after 2 seconds
          setTimeout(() => {
            setCopySuccess(false);
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy server address: ', err);
          // Fallback to legacy method
          legacyCopyToClipboard(serverAddress);
        });
    } else {
      // Fallback for browsers without clipboard API
      legacyCopyToClipboard(serverAddress);
    }
  };
  
  // Legacy method for clipboard copying
  const legacyCopyToClipboard = (text) => {
    try {
      // Create a temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Execute copy command
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Fallback: Failed to copy server address', err);
    }
  };

  // Function to fetch YouTube videos - made into useCallback to fix dependency issues
  const fetchYoutubeVideos = useCallback(async () => {
    try {
      console.log("Fetching YouTube videos...");
      // In a real implementation, you would use the YouTube Data API to fetch videos
      setLoadingVideos(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demonstration, we'll create objects with the video IDs and some mock data
      const videos = youtubeVideoIds.map(id => ({
        id,
        title: `Minecraft Gameplay - ${id.substring(0, 5)}`,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        views: Math.floor(Math.random() * 10000) + 1000,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      }));
      
      console.log("YouTube videos fetched:", videos);
      setYoutubeVideos(videos);
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      setVideoError("Failed to load YouTube videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [youtubeVideoIds]);
  
  // Function to fetch TikTok videos - simplified to avoid reloadEmbeds calls
  const fetchTikTokVideos = useCallback(async () => {
    try {
      console.log("Fetching TikTok videos...");
      setLoadingVideos(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration, create objects with the video IDs and some mock data
      const videos = tiktokVideoIds.map(id => ({
        id,
        author: "@minecraft",
        description: `Cool Minecraft tip #${id.substring(0, 2)}`,
        likes: Math.floor(Math.random() * 5000) + 100
      }));
      
      console.log("TikTok videos fetched:", videos);
      setTiktokVideos(videos);
    } catch (error) {
      console.error("Error fetching TikTok videos:", error);
      setVideoError("Failed to load TikTok videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [tiktokVideoIds]);

  useEffect(() => {
    console.log("Home component mounted, initializing player heads");
    
    // Create animated heads
    const animatedHeads = minecraftPlayers.map((player, index) => {
      console.log(`Creating animated head for ${player.username}`);
      return {
        ...player,
        animation: {
          y: [-(Math.random() * 4), (Math.random() * 4)],
          rotate: [-(Math.random() * 2), (Math.random() * 2)]
        },
        transition: {
          y: {
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          },
          rotate: {
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }
        }
      };
    });
    
    // Measure render time
    const endTime = Date.now();
    setRenderTime(endTime - renderStartTime.current);
    
    console.log(`Created ${animatedHeads.length} animated heads`);
    setFloatingHeads(animatedHeads);
    setIsLoading(false);
    
    // Simulate changing server load
    const loadInterval = setInterval(() => {
      setServerLoad(Math.floor(Math.random() * 25) + 5);
    }, 5000);
    
    // Fetch videos when component mounts
    fetchYoutubeVideos();
    fetchTikTokVideos();
    
    // Fetch server status
    const fetchServerStatus = async () => {
      try {
        setServerStatusLoading(true);
        const status = await minecraftApi.getServerStatus('play.bizzynation.co.uk');
        console.log('Server status fetched:', status);
        setServerStatus(status);
      } catch (error) {
        console.error('Failed to fetch server status:', error);
      } finally {
        setServerStatusLoading(false);
      }
    };
    
    fetchServerStatus();
    
    // Refresh server status every 2 minutes
    const statusInterval = setInterval(fetchServerStatus, 120000);
    
    return () => {
      clearInterval(loadInterval);
      clearInterval(statusInterval);
    };
  }, [fetchYoutubeVideos, fetchTikTokVideos]); // Fixed dependency array

  // Log when floating heads are updated
  useEffect(() => {
    console.log(`Floating heads updated: ${floatingHeads.length} heads`);
  }, [floatingHeads]);

  // Helper function to retry loading - simplified version that just refetches videos
  const retryLoading = () => {
    console.log("Retrying video loading...");
    fetchTikTokVideos();
    fetchYoutubeVideos();
  };

  return (
    <div className="min-h-screen bg-minecraft-navy flex flex-col relative">
      {/* New Navbar */}
      <header className="bg-minecraft-navy-dark border-b border-minecraft-green/30 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <CommandLineIcon className="h-6 w-6 mr-2 text-minecraft-green" />
              <span className="font-minecraft text-minecraft-green text-xl">BIZZY</span>
              <span className="font-minecraft text-white text-xl">LINK</span>
            </div>
            
            <div className="flex items-center">
              {/* Players online indicator moved here */}
              <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
                <div className={`h-2 w-2 rounded-full mr-2 animate-pulse ${serverStatus.online ? 'bg-minecraft-green' : 'bg-red-500'}`}></div>
                <span className="text-gray-300 text-xs sm:text-sm">
                  {serverStatusLoading ? (
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full border-t-white border-2 border-transparent animate-spin mr-1"></div>
                      <span>LOADING...</span>
                    </div>
                  ) : (
                    serverStatus.online ? `${serverStatus.playerCount} PLAYERS ONLINE NOW` : 'SERVER OFFLINE'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed navbar */}
      <div className="pt-14"></div>
      
      {/* Container for floating player heads - removed since we're only keeping n0t_awake */}
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-32 hero-waves">
        <div className="absolute inset-0 minecraft-grid-bg opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              {/* Redesigned header area without BIZZYNATION text */}
              <motion.div
                className="mb-8 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Minecraft block design elements */}
                <div className="mb-6 relative hidden md:block">
                  <div className="absolute -left-8 top-2 w-14 h-14 bg-minecraft-green/10 border-2 border-minecraft-green minecraft-block-shadow transform rotate-12"></div>
                  <div className="absolute left-2 -top-8 w-16 h-16 minecraft-dirt-bg border-2 border-minecraft-green/40 minecraft-block-shadow transform rotate-3"></div>
                </div>
                
                {/* New server title with Minecraft aesthetic */}
                <div className="bg-black/40 border-l-4 border-minecraft-green p-5 rounded-md">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-minecraft leading-tight">
                    <div className="flex items-center">
                      <img src={grassBlockIcon} alt="Minecraft" className="h-8 w-8 mr-3 inline-block" />
                      <span className="text-white">PREMIUM MINECRAFT</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-minecraft-green">SERVER EXPERIENCE</span>
                    </div>
                  </h1>
                  
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-minecraft-green/20 border border-minecraft-green/40 rounded text-base text-white font-minecraft">SURVIVAL</span>
                    <span className="px-3 py-1 bg-minecraft-blue/20 border border-minecraft-blue/40 rounded text-base text-white font-minecraft">MINIGAMES</span>
                    <span className="px-3 py-1 bg-minecraft-red/20 border border-minecraft-red/40 rounded text-base text-white font-minecraft">EVENTS</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {/* Server features with Minecraft icons */}
                <div className="bg-black/30 rounded-md p-5">
                  <p className="text-lg text-gray-200 mb-4">
                    Join Bizzy's epic Minecraft adventure! As seen on TikTok and YouTube, I've created an incredible server with my signature chaos, creativity, and community vibes. Experience my custom plugins, join my live events, and become part of the BizzyNation family!
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center">
                      <img src={chestIcon} alt="Custom Items" className="h-5 w-5 mr-2" />
                      <span className="text-gray-300">Custom Items</span>
                    </div>
                    <div className="flex items-center">
                      <img src={grassBlockIcon} alt="Custom Worlds" className="h-5 w-5 mr-2" />
                      <span className="text-gray-300">Custom Worlds</span>
                    </div>
                    <div className="flex items-center">
                      <img src={swordIcon} alt="PvP Arenas" className="h-5 w-5 mr-2" />
                      <span className="text-gray-300">PvP Arenas</span>
                    </div>
                  </div>

                  {/* Streamer Highlight */}
                  <div className="mt-4 bg-minecraft-green/10 border border-minecraft-green/30 rounded-md p-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-minecraft-green/20 flex items-center justify-center">
                            <ServerIcon className="h-6 w-6 text-minecraft-green" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">LIVE</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-minecraft-green font-minecraft text-sm">BIZZY'S SERVER</div>
                        <div className="text-gray-300 text-xs">Watch my streams to see server events live and get special in-game rewards for subscribers!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-6 sm:flex sm:justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {isAuthenticated ? (
                  <div className="btn-3d">
                    <Link to="/dashboard" className="minecraft-btn rounded-md px-8 py-3 text-lg font-medium flex items-center">
                      Go to Dashboard
                      <ChevronRightIcon className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="btn-3d transform hover:scale-105 transition">
                      <Link to="/register" className="minecraft-btn rounded-md px-8 py-3 text-lg font-medium flex items-center justify-center">
                        Get Started
                        <ChevronRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                    <div className="btn-3d transform hover:scale-105 transition">
                      <Link to="/login" className="habbo-btn rounded-md px-8 py-3 text-lg font-medium flex items-center justify-center">
                        Login
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            
            <motion.div 
              className="mt-10 md:mt-0 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative mx-auto w-full">
                {/* "FOLLOW BIZZY" section as a separate component above server info */}
                <div className="mb-4 bg-minecraft-navy-dark border-[3px] border-minecraft-green/90 rounded-lg shadow-lg p-4 relative">
                  {/* Minecraft texture overlay */}
                  <div className="absolute inset-0 minecraft-dirt-bg opacity-10 rounded-lg"></div>
                  
                  {/* Bizzy's head positioned at the top right of FOLLOW BIZZY */}
                  <div className="absolute -top-16 right-4 z-50">
                    {floatingHeads.filter(head => head.username === 'n0t_awake').map((player, index) => (
                      <div key={player.username}>
                        <MinecraftPlayerHead
                          player={{
                            ...player,
                            position: { top: '0', right: '0' },
                            size: 80,
                            rotate: '0deg',
                            zIndex: 100
                          }}
                          delay={0}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative z-10 bg-black/40 border-l-4 border-minecraft-green p-4 rounded-md">
                    <h3 className="text-lg font-minecraft text-minecraft-green mb-2">FOLLOW BIZZY</h3>
                    <div className="flex flex-wrap gap-3">
                      <a 
                        href="https://www.tiktok.com/@bizzynation" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center bg-[#EE1D52]/20 hover:bg-[#EE1D52]/40 p-2 rounded-md transition-all border border-[#EE1D52]/40"
                      >
                        <svg className="w-6 h-6 text-white mr-2" fill="currentColor" viewBox="0 0 448 512">
                          <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                        </svg>
                        <span className="text-white font-minecraft text-sm">@bizzynation</span>
                        <span className="ml-2 bg-[#EE1D52] text-white text-xs px-1.5 py-0.5 rounded-md">FOLLOW</span>
                      </a>
                      <a 
                        href="https://www.youtube.com/@bizzys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center bg-[#FF0000]/20 hover:bg-[#FF0000]/40 p-2 rounded-md transition-all border border-[#FF0000]/40"
                      >
                        <svg className="w-6 h-6 text-white mr-2" fill="currentColor" viewBox="0 0 576 512">
                          <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>
                        </svg>
                        <span className="text-white font-minecraft text-sm">@bizzys</span>
                        <span className="ml-2 bg-[#FF0000] text-white text-xs px-1.5 py-0.5 rounded-md">SUBSCRIBE</span>
                      </a>
                      <a 
                        href="https://discord.gg/bizzynation" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center bg-[#5865F2]/20 hover:bg-[#5865F2]/40 p-2 rounded-md transition-all border border-[#5865F2]/40"
                      >
                        <svg className="w-6 h-6 text-white mr-2" fill="currentColor" viewBox="0 0 640 512">
                          <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"/>
                        </svg>
                        <span className="text-white font-minecraft text-sm">Discord</span>
                        <span className="ml-2 bg-[#5865F2] text-white text-xs px-1.5 py-0.5 rounded-md">JOIN</span>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Completely redesigned server info section */}
                <motion.div 
                  className="relative rounded-xl bg-gradient-to-br from-minecraft-navy via-minecraft-navy-dark to-minecraft-navy-light border-2 border-minecraft-green/70 shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Animated background patterns */}
                  <div className="absolute inset-0 minecraft-grid-bg opacity-5 z-0"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-minecraft-green/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/3 animate-pulse-slower"></div>
                  
                  {/* Glass panel with glowing borders */}
                  <div className="backdrop-blur-sm bg-black/30 p-8 relative z-10">
                    {/* Animated floating player heads in background */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 opacity-20 animate-float-slow1">
                      <MinecraftAvatar username="Notch" size={48} animate={false} />
                    </div>
                    <div className="absolute top-1/3 -right-4 w-10 h-10 opacity-20 animate-float-slow2">
                      <MinecraftAvatar username="jeb_" size={40} animate={false} />
                    </div>
                    <div className="absolute bottom-10 left-1/3 w-8 h-8 opacity-20 animate-float-slow3">
                      <MinecraftAvatar username="Ph1LzA" size={32} animate={false} />
                    </div>
                    <div className="absolute bottom-20 right-1/4 w-10 h-10 opacity-20 animate-float-slow1">
                      <MinecraftAvatar username="GeorgeNotFound" size={40} animate={false} />
                    </div>
                    
                    {/* Header with glowing effect */}
                    <motion.div 
                      className="text-center mb-7"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <h3 className="font-minecraft text-3xl bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-glow-green">
                        SERVER INFO
                      </h3>
                    </motion.div>
                    
                    {/* Server address card with hover animation */}
                    <motion.div 
                      className="relative glass-panel-dark border-2 border-minecraft-green/60 rounded-lg p-5 px-6 mb-6 overflow-hidden"
                      whileHover={{ boxShadow: "0 0 20px rgba(84, 170, 84, 0.3)" }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Decorative corners */}
                      <div className="absolute top-0 left-0 w-2 h-2 bg-minecraft-green"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 bg-minecraft-green"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 bg-minecraft-green"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-minecraft-green"></div>
                      
                      <div className="text-center">
                        <motion.div 
                          className="font-minecraft text-sm text-gray-300 mb-1 uppercase"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          JOIN US AT
                        </motion.div>
                        <motion.div 
                          className="font-minecraft text-xl tracking-wide mb-4 whitespace-nowrap"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
                          <span className="address-glow">play.bizzynation.co.uk</span>
                        </motion.div>
                        <motion.div 
                          className="flex justify-center"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          <button 
                            className={`btn-3d px-4 py-2 rounded font-minecraft text-sm transition-all duration-300 ${
                              copySuccess 
                                ? 'bg-minecraft-green text-white' 
                                : 'glass-button-green text-minecraft-green hover:bg-black'
                            }`}
                            onClick={copyServerAddress}
                          >
                            <div className="flex items-center">
                              {copySuccess ? 
                                <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" /> : 
                                <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                              }
                              {copySuccess ? "COPIED!" : "COPY SERVER IP"}
                            </div>
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Server stats with animated entrance */}
                    <div className="grid grid-cols-3 gap-4 mb-7">
                      {/* Version card */}
                      <motion.div 
                        className="glass-panel-navy border border-minecraft-green/40 rounded-lg p-4 text-center relative overflow-hidden"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                        whileHover={{ y: -5, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)" }}
                      >
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                          <MinecraftAvatar 
                            username="Dinnerbone" 
                            size={50} 
                            animate={false}
                          />
                        </div>
                        <div className="font-minecraft text-gray-300 text-xs uppercase">VERSION</div>
                        <div className="font-minecraft text-minecraft-green text-lg mt-2">
                          {serverStatusLoading ? (
                            <div className="flex justify-center">
                              <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-minecraft-green animate-spin"></div>
                            </div>
                          ) : (
                            serverStatus.version || '1.19.2'
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Players card */}
                      <motion.div 
                        className="glass-panel-navy border border-minecraft-green/40 rounded-lg p-4 text-center relative overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        whileHover={{ y: -5, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)" }}
                      >
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                          <MinecraftAvatar 
                            username="Dream" 
                            size={50} 
                            animate={false}
                          />
                        </div>
                        <div className="font-minecraft text-gray-300 text-xs uppercase">PLAYERS</div>
                        <div className="font-minecraft text-minecraft-green text-lg mt-2">
                          {serverStatusLoading ? (
                            <div className="flex justify-center">
                              <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-minecraft-green animate-spin"></div>
                            </div>
                          ) : (
                            <>
                              <span className="inline-block animate-count">{serverStatus.playerCount}</span>/{serverStatus.maxPlayers}
                            </>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Status card */}
                      <motion.div 
                        className="glass-panel-navy border border-minecraft-green/40 rounded-lg p-4 text-center relative overflow-hidden"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                        whileHover={{ y: -5, boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)" }}
                      >
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                          <MinecraftAvatar 
                            username="Technoblade" 
                            size={50} 
                            animate={false}
                          />
                        </div>
                        <div className="font-minecraft text-gray-300 text-xs uppercase">STATUS</div>
                        {serverStatusLoading ? (
                          <div className="flex justify-center mt-2">
                            <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-minecraft-green animate-spin"></div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center mt-2">
                            <motion.span 
                              className={`h-3 w-3 rounded-full mr-2 ${serverStatus.online ? 'bg-minecraft-green' : 'bg-red-500'}`}
                              animate={{ 
                                boxShadow: serverStatus.online 
                                  ? ["0 0 5px #54AA54", "0 0 15px #54AA54", "0 0 5px #54AA54"]
                                  : ["0 0 5px #f44336", "0 0 15px #f44336", "0 0 5px #f44336"]
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 2 
                              }}
                            ></motion.span>
                            <span className={`font-minecraft text-lg ${serverStatus.online ? 'text-minecraft-green' : 'text-red-500'}`}>
                              {serverStatus.online ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Large JOIN SERVER button with enhanced animation */}
                    <motion.div 
                      className="btn-3d w-full scale-105 transform"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button 
                        className="minecraft-btn w-full rounded-md py-5 text-xl font-minecraft flex items-center justify-center relative overflow-hidden"
                        onClick={copyServerAddress}
                      >
                        {/* Button shine effect */}
                        <motion.div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{
                            x: ["-200%", "200%"],
                          }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "mirror",
                            duration: 4,
                            ease: "easeInOut"
                          }}
                        />
                        
                        <div className="flex items-center relative z-10">
                          <ServerIcon className="h-7 w-7 mr-3" />
                          <span className="text-2xl tracking-wide">
                            JOIN SERVER
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-minecraft-navy-light relative">
        <div className="absolute inset-0 minecraft-grid-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <motion.h2 
              className="text-3xl font-minecraft text-minecraft-green mb-4 minecraft-text-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              How BizzyLink Works
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Connect your Minecraft identity with our web platform in three simple steps
            </motion.p>
          </div>
          
          {/* Minecraft-styled linking process visualization */}
          <div className="relative mb-10 hidden md:block">
            <motion.div 
              className="h-2 bg-minecraft-green/30 absolute top-1/2 left-[18%] right-[18%] -translate-y-1/2 z-0"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            ></motion.div>
            
            <div className="flex justify-between relative z-10">
              <motion.div 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-minecraft-green text-white font-minecraft text-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                viewport={{ once: true }}
              >
                1
              </motion.div>
              <motion.div 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-minecraft-green text-white font-minecraft text-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
                viewport={{ once: true }}
              >
                2
              </motion.div>
              <motion.div 
                className="flex items-center justify-center w-12 h-12 rounded-full bg-minecraft-green text-white font-minecraft text-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 1 }}
                viewport={{ once: true }}
              >
                3
              </motion.div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="minecraft-card relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {/* Pixelated border decoration */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-minecraft-green"></div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-minecraft-green"></div>
              
              <div className="p-8 bg-minecraft-navy-dark border-2 border-minecraft-green/40">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-minecraft-green/20 rounded-full animate-pulse"></div>
                    <div className="relative z-10 mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-minecraft-green/30 mb-6 p-4 border-2 border-minecraft-green/60">
                      <UserIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-minecraft text-minecraft-green text-center mb-4">CREATE ACCOUNT</h3>
                
                <div className="minecraft-inset-panel p-4 mb-4">
                  <p className="text-gray-300 text-center">Register with your email and password to get started with BizzyLink.</p>
                </div>
                
                <div className="text-sm text-gray-400 border-t border-minecraft-green/20 pt-4 mt-4">
                  <div className="flex items-center">
                    <img src={diamondIcon} alt="Diamond" className="w-4 h-4 mr-2" />
                    <span>Takes less than 1 minute</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="minecraft-card relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {/* Pixelated border decoration */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-minecraft-green"></div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-minecraft-green"></div>
              
              <div className="p-8 bg-minecraft-navy-dark border-2 border-minecraft-green/40">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-minecraft-green/20 rounded-full animate-pulse"></div>
                    <div className="relative z-10 mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-minecraft-green/30 mb-6 p-4 border-2 border-minecraft-green/60">
                      <LinkIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-minecraft text-minecraft-green text-center mb-4">GENERATE CODE</h3>
                
                <div className="minecraft-inset-panel p-4 mb-4">
                  <p className="text-gray-300 text-center">Enter your Minecraft username to receive a unique linking code for your account.</p>
                </div>
                
                <div className="text-sm text-gray-400 border-t border-minecraft-green/20 pt-4 mt-4">
                  <div className="flex items-center">
                    <img src={emeraldIcon} alt="Emerald" className="w-4 h-4 mr-2" />
                    <span>Securely connects your identity</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="minecraft-card relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {/* Pixelated border decoration */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-minecraft-green"></div>
              <div className="absolute top-0 right-0 w-3 h-3 bg-minecraft-green"></div>
              
              <div className="p-8 bg-minecraft-navy-dark border-2 border-minecraft-green/40">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-minecraft-green/20 rounded-full animate-pulse"></div>
                    <div className="relative z-10 mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-minecraft-green/30 mb-6 p-4 border-2 border-minecraft-green/60">
                      <CheckCircleIcon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-minecraft text-minecraft-green text-center mb-4">VERIFY IN-GAME</h3>
                
                <div className="minecraft-inset-panel p-4 mb-4">
                  <p className="text-gray-300 text-center">Join our Minecraft server and type <span className="font-mono bg-black/50 px-1">/link [your-code]</span> to complete verification.</p>
                </div>
                
                <div className="text-sm text-gray-400 border-t border-minecraft-green/20 pt-4 mt-4">
                  <div className="flex items-center">
                    <img src={xpOrbIcon} alt="XP Orb" className="w-4 h-4 mr-2" />
                    <span>Unlock all BizzyNation features</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Command example */}
          <motion.div 
            className="mt-12 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="bg-black/80 rounded-lg border border-minecraft-green/30 p-4 font-mono text-sm text-gray-300">
              <div className="flex items-start mb-2">
                <CommandLineIcon className="h-5 w-5 mr-2 text-minecraft-green flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-bold mb-1">Example in-game command:</div>
                  <div className="px-3 py-2 bg-black rounded flex items-center">
                    <span className="text-minecraft-green mr-2">&gt;</span>
                    <span className="text-gray-400">/link </span>
                    <span className="text-yellow-500">ABC123</span>
                  </div>
                </div>
              </div>
              <div className="pl-7 text-gray-400 text-xs">
                After linking, you'll have access to your player stats, server rewards, and community features!
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative minecraft-dirt-bg overflow-hidden">
        <div className="absolute inset-0 bg-minecraft-navy/80"></div>
        
        {/* Floating Minecraft particles effect */}
        <div className="absolute inset-0 pointer-events-none minecraft-particles" id="particle-container">
          {/* Particles will be generated with JavaScript */}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <motion.div
              className="inline-block relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              {/* Diamond ore decoration */}
              <div className="absolute -top-8 -left-8 minecraft-ore-block diamond hidden md:block"></div>
              <h2 className="text-4xl font-minecraft text-minecraft-green minecraft-text-shadow">
                Premium Benefits
              </h2>
              {/* Emerald ore decoration */}
              <div className="absolute -top-8 -right-8 minecraft-ore-block emerald hidden md:block"></div>
            </motion.div>
            
            <motion.p 
              className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Linking your Minecraft account unlocks a treasure chest of exclusive features
            </motion.p>
          </div>
          
          {/* Interactive benefit display - reworked for better alignment */}
          <div className="flex justify-center mb-16">
            {/* Benefits cards with improved alignment */}
            <div className="w-full max-w-4xl space-y-4">
              <motion.div
                className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                id="rewards-benefit"
              >
                {/* Easter egg: Hidden chest loot that appears on hover */}
                <div className="absolute -right-4 -top-4 opacity-0 transition-opacity duration-300 hover-reveal">
                  <img src={diamondIcon} alt="Diamond" className="w-8 h-8 animate-bounce" />
                </div>
                
                <div className="flex items-start">
                  <div className="minecraft-item-frame mr-5 flex-shrink-0">
                    <img src={chestIcon} alt="Chest" className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-minecraft text-minecraft-green mb-2">EXCLUSIVE REWARDS</h3>
                    <div className="minecraft-tooltip-container">
                      <p className="text-gray-300 mb-3">Link your account to receive special in-game items, currency bonuses, and unique cosmetics unavailable to unlinked players.</p>
                      
                      {/* Expandable loot list */}
                      <div className="bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 hidden reward-details">
                        <h4 className="text-white font-minecraft text-sm mb-2">POSSIBLE REWARDS:</h4>
                        <ul className="text-sm text-gray-300">
                          <li className="flex items-center mb-1">
                            <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                            <span>Daily login bonuses (5 diamonds/week)</span>
                          </li>
                          <li className="flex items-center mb-1">
                            <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                            <span>Exclusive Bizzy's custom armor skin</span>
                          </li>
                          <li className="flex items-center mb-1">
                            <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                            <span>Special chat prefix [LINKED]</span>
                          </li>
                          <li className="flex items-center">
                            <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                            <span className="text-yellow-400">Mystery bonus items</span>
                          </li>
                        </ul>
                      </div>
                      
                      <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center reward-toggle">
                        <span>Show reward details</span>
                        <ChevronRightIcon className="ml-1 h-4 w-4 reward-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                id="stats-benefit"
              >
                {/* Easter egg: Animated XP orbs */}
                <div className="absolute -right-4 -top-4 opacity-0 transition-opacity duration-300 hover-reveal">
                  <img src={xpOrbIcon} alt="XP Orb" className="w-8 h-8 animate-ping" />
                </div>
                
                <div className="flex items-start">
                  <div className="minecraft-item-frame mr-5 flex-shrink-0">
                    <img src={xpOrbIcon} alt="XP Orb" className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-minecraft text-minecraft-green mb-2">PLAYER STATISTICS</h3>
                    <div>
                      <p className="text-gray-300 mb-3">Track your complete gameplay statistics through our web dashboard. Monitor your achievements, playtime, and server rankings.</p>
                      
                      {/* Mini stat dashboard preview */}
                      <div className="bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 hidden stats-details">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                            <div className="text-xs text-gray-400">BLOCKS MINED</div>
                            <div className="text-white font-minecraft">14,382</div>
                          </div>
                          <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                            <div className="text-xs text-gray-400">PLAYER KILLS</div>
                            <div className="text-white font-minecraft">267</div>
                          </div>
                          <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                            <div className="text-xs text-gray-400">PLAYTIME</div>
                            <div className="text-white font-minecraft">128h 22m</div>
                          </div>
                          <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                            <div className="text-xs text-gray-400">SERVER RANK</div>
                            <div className="text-yellow-400 font-minecraft">#42</div>
                          </div>
                        </div>
                      </div>
                      
                      <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center stats-toggle">
                        <span>View sample statistics</span>
                        <ChevronRightIcon className="ml-1 h-4 w-4 stats-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                id="community-benefit"
              >
                {/* Easter egg: Animate community icon */}
                <div className="absolute -right-4 -top-4 opacity-0 transition-opacity duration-300 hover-reveal">
                  <img src={emeraldIcon} alt="Emerald" className="w-8 h-8 animate-spin" />
                </div>
                
                <div className="flex items-start">
                  <div className="minecraft-item-frame mr-5 flex-shrink-0">
                    <img src={emeraldIcon} alt="Emerald" className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-minecraft text-minecraft-green mb-2">COMMUNITY ACCESS</h3>
                    <div>
                      <p className="text-gray-300 mb-3">Join exclusive community events, participate in voting for server features, and get early access to new content updates.</p>
                      
                      {/* Upcoming events calendar */}
                      <div className="bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 hidden community-details">
                        <h4 className="text-white font-minecraft text-sm mb-2">UPCOMING EVENTS:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-yellow-400 font-minecraft mb-1">SATURDAY</div>
                            <div className="text-gray-300">Bizzy's Weekly Build Battle (6PM EST)</div>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-yellow-400 font-minecraft mb-1">SUNDAY</div>
                            <div className="text-gray-300">PvP Tournament - Diamond Rewards</div>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <div className="text-yellow-400 font-minecraft mb-1">WEDNESDAY</div>
                            <div className="text-gray-300">New Content Vote (Members Only)</div>
                          </div>
                        </div>
                      </div>
                      
                      <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center community-toggle">
                        <span>See upcoming events</span>
                        <ChevronRightIcon className="ml-1 h-4 w-4 community-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                id="security-benefit"
              >
                {/* Easter egg: Security lock animation */}
                <div className="absolute -right-4 -top-4 opacity-0 transition-opacity duration-300 hover-reveal">
                  <img src={diamondIcon} alt="Diamond" className="w-8 h-8 animate-pulse" />
                </div>
                
                <div className="flex items-start">
                  <div className="minecraft-item-frame mr-5 flex-shrink-0">
                    <img src={diamondIcon} alt="Diamond" className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-minecraft text-minecraft-green mb-2">SECURE IDENTITY</h3>
                    <div>
                      <p className="text-gray-300 mb-3">Protect your Minecraft identity with our secure linking system. Prevent impersonation and secure your in-game progress and items.</p>
                      
                      {/* Security features */}
                      <div className="bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 hidden security-details">
                        <h4 className="text-white font-minecraft text-sm mb-2">SECURITY FEATURES:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="bg-black/30 p-2 rounded flex items-start">
                            <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                            <span className="text-gray-300 text-sm">Two-factor authentication for important actions</span>
                          </div>
                          <div className="bg-black/30 p-2 rounded flex items-start">
                            <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                            <span className="text-gray-300 text-sm">Automatic IP verification</span>
                          </div>
                          <div className="bg-black/30 p-2 rounded flex items-start">
                            <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                            <span className="text-gray-300 text-sm">Unique verification codes for each login</span>
                          </div>
                        </div>
                      </div>
                      
                      <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center security-toggle">
                        <span>View security features</span>
                        <ChevronRightIcon className="ml-1 h-4 w-4 security-arrow" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="text-center mt-10">
            <motion.div
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Animated glow effect behind button */}
              <div className="absolute inset-0 bg-minecraft-green/20 rounded-lg filter blur-md animate-pulse"></div>
              <div className="btn-3d relative">
                <Link 
                  to={isAuthenticated ? "/dashboard" : "/register"} 
                  className="minecraft-btn rounded-md px-10 py-4 text-xl font-minecraft inline-flex items-center"
                >
                  <span>CLAIM YOUR BENEFITS</span>
                  <ChevronRightIcon className="ml-2 h-6 w-6" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Add JavaScript for interactive elements */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
          // Benefit card detail toggles
          setupToggle('reward-toggle', 'reward-details', 'reward-arrow');
          setupToggle('stats-toggle', 'stats-details', 'stats-arrow');
          setupToggle('community-toggle', 'community-details', 'community-arrow');
          setupToggle('security-toggle', 'security-details', 'security-arrow');
          
          // Show tooltips on hover
          const benefitCards = document.querySelectorAll('[id$="-benefit"]');
          benefitCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
              const revealEl = card.querySelector('.hover-reveal');
              if (revealEl) revealEl.style.opacity = '1';
            });
            
            card.addEventListener('mouseleave', function() {
              const revealEl = card.querySelector('.hover-reveal');
              if (revealEl) revealEl.style.opacity = '0';
            });
          });
          
          // Create initial particles
          createParticles();
        });
        
        // Helper function to toggle details sections
        function setupToggle(toggleClass, detailsClass, arrowClass) {
          const toggleButtons = document.querySelectorAll('.' + toggleClass);
          toggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
              const details = btn.parentElement.querySelector('.' + detailsClass);
              const arrow = btn.querySelector('.' + arrowClass);
              
              if (details) {
                details.classList.toggle('hidden');
                if (!details.classList.contains('hidden')) {
                  btn.querySelector('span').textContent = 'Hide details';
                  if (arrow) arrow.style.transform = 'rotate(90deg)';
                } else {
                  btn.querySelector('span').textContent = btn.getAttribute('data-show-text') || 'Show details';
                  if (arrow) arrow.style.transform = 'rotate(0)';
                }
              }
            });
            
            // Store original text
            btn.setAttribute('data-show-text', btn.querySelector('span').textContent);
          });
        }
        
        // Create Minecraft-style particles
        function createParticles() {
          const container = document.getElementById('particle-container');
          if (!container) return;
          
          // Clear existing particles
          container.innerHTML = '';
          
          // Create random particles
          for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('minecraft-particle');
            
            // Random position
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            
            // Random size
            const size = Math.random() * 3 + 1;
            
            // Random color - mostly greens for Minecraft theme
            const colors = ['#54aa54', '#3a873a', '#7bba3c', '#79c05a', '#fff', '#80c71f'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Apply styles
            particle.style.left = \`\${left}%\`;
            particle.style.top = \`\${top}%\`;
            particle.style.width = \`\${size}px\`;
            particle.style.height = \`\${size}px\`;
            particle.style.backgroundColor = color;
            
            // Animation duration and delay
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            
            particle.style.animation = \`float \${duration}s \${delay}s infinite ease-in-out\`;
            
            container.appendChild(particle);
          }
        }
      ` }}></script>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Minecraft styled blocks */
        .minecraft-ore-block {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0,0,0,0.3);
        }
        .minecraft-ore-block.diamond {
          background-color: #29ACBF;
          box-shadow: 0 0 10px #29ACBF;
        }
        .minecraft-ore-block.emerald {
          background-color: #00A82B;
          box-shadow: 0 0 10px #00A82B;
        }
        
        /* Item frames */
        .minecraft-item-frame {
          width: 48px;
          height: 48px;
          background-color: rgba(0,0,0,0.3);
          border: 2px solid rgba(84, 170, 84, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        /* Particle effects */
        .minecraft-particle {
          position: absolute;
          opacity: 0.7;
          border-radius: 0;
          pointer-events: none;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
        
        /* Hover reveal animations */
        .hover-reveal {
          transition: opacity 0.3s ease;
          z-index: 10;
        }
      ` }}></style>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div 
    className="glass-panel rounded-lg p-8 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-minecraft-green mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
);

const BenefitCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div 
    className="bg-minecraft-navy-light p-6 rounded-lg border border-minecraft-green/20"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.03, borderColor: 'rgba(84, 170, 84, 0.5)' }}
  >
    <div className="flex items-center mb-4">
      <div className="bg-minecraft-green/20 p-2 rounded-md text-minecraft-green mr-3">
        {icon}
      </div>
      <h3 className="font-bold text-white text-lg">{title}</h3>
    </div>
    <p className="text-gray-300">{description}</p>
  </motion.div>
);

export default Home;