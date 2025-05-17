/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Login.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import LoadingSpinner from '../components/LoadingSpinner';
import MinecraftItem from '../components/MinecraftItem';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showParticles, setShowParticles] = useState(false);
  // State to track clicks on the locked box for easter egg
  const [lockedClicks, setLockedClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  
  // Get auth context and directly access the isAuthenticated getter
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const { login, loading } = auth;
  const navigate = useNavigate();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show particles animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowParticles(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Please enter both username and password'
      });
      return;
    }
    
    try {
      console.log('Attempting login with username:', username);
      const response = await login(username, password);
      console.log('Login successful with response:', response);
      
      // Check if the user was authenticated
      if (!response || !response.success) {
        throw new Error(response?.error || 'Login failed');
      }
      
      // Success check based on auth response directly
      if (response && response.success && response.token) {
        console.log('Login successful, token received');
      } else {
        console.warn('Login appeared successful but token may be missing');
      }
      
      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        message: 'Login successful!'
      });
      
      // Use direct window location for navigation after short delay
      console.log('Preparing to navigate to dashboard...');
      // Disable the react-router navigation that might be causing issues
      // navigate('/dashboard');
      
      // Use direct window location for more reliable navigation
      setTimeout(() => {
        console.log('Navigating to dashboard NOW');
        window.location.href = '/dashboard';
      }, 800);
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        console.log('API error response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
        
        if (error.response.status === 429) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.response.status === 404) {
          errorMessage = 'Login service not available. Please try again later.';
        }
      } else if (error.request) {
        console.log('Login request error (no response):', error.request);
        errorMessage = 'Server not responding. Please try again later.';
      } else {
        console.log('Login setup error:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setNotification({
        show: true,
        type: 'error',
        message: errorMessage
      });
    }
  };

  // Generate random blocks for the background
  const generateBlocks = () => {
    const blocks = [];
    const blockTypes = ['grass', 'stone', 'wood', 'dirt'];
    
    for (let i = 0; i < 20; i++) {
      const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      const size = Math.floor(Math.random() * 30) + 20;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const rotation = Math.random() * 20 - 10;
      const delay = Math.random() * 0.5;
      
      blocks.push(
        <motion.div
          key={i}
          className={`absolute minecraft-${type}-bg opacity-10 rounded-sm hidden md:block z-0`}
          style={{
            width: size + 'px',
            height: size + 'px',
            left: x + '%',
            top: y + '%',
            transform: `rotate(${rotation}deg)`
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ delay, duration: 0.5 }}
        />
      );
    }
    
    return blocks;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-minecraft-navy-dark to-minecraft-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Minecraft Grid background with reduced opacity */}
      <div className="absolute inset-0 minecraft-grid-bg opacity-5 z-0"></div>
      
      {/* Random floating blocks in background */}
      {showParticles && generateBlocks()}
      
      {/* Animated grass block logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          className="w-24 h-24 mx-auto mb-6"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 10,
            delay: 0.2
          }}
        >
          <div className="pixel-art w-full h-full block-hover">
            <MinecraftItem name="grass_block.svg" size={96} animate={false} />
          </div>
        </motion.div>
        
        <motion.h2 
          className="text-center text-3xl font-minecraft text-white minecraft-text-shadow mb-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Log In
        </motion.h2>
        
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="h-1 w-20 bg-minecraft-green rounded-full"></div>
        </motion.div>
      </div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="glass-panel backdrop-blur-lg px-6 py-9 sm:px-10 rounded-lg border-2 border-minecraft-green/20 shadow-minecraft relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Background texture effect */}
          <div className="absolute inset-0 minecraft-dirt-bg opacity-5 z-0"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-minecraft-green/30 via-minecraft-green/60 to-minecraft-green/30"></div>
          
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit} style={{ pointerEvents: "auto" }}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200 flex items-center mb-2 font-minecraft tracking-wide">
                <UserIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                USERNAME
              </label>
              <div className="mt-1 relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="habbo-input appearance-none block w-full px-4 py-3 border-2 border-white/20 rounded-md shadow-minecraft placeholder-gray-400 bg-minecraft-navy-dark/80 text-white focus:outline-none focus:ring-minecraft-green focus:border-minecraft-green/50 sm:text-sm transition-all duration-200"
                  style={{ 
                    userSelect: "auto",
                    WebkitUserSelect: "auto",
                    MozUserSelect: "auto",
                    msUserSelect: "auto",
                    pointerEvents: "auto"
                  }}
                />
                <AnimatePresence>
                  {username && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-minecraft-green text-sm"
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 flex items-center mb-2 font-minecraft tracking-wide">
                <LockClosedIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                PASSWORD
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="habbo-input appearance-none block w-full px-4 py-3 border-2 border-white/20 rounded-md shadow-minecraft placeholder-gray-400 bg-minecraft-navy-dark/80 text-white focus:outline-none focus:ring-minecraft-green focus:border-minecraft-green/50 sm:text-sm transition-all duration-200"
                  style={{ 
                    userSelect: "auto",
                    WebkitUserSelect: "auto",
                    MozUserSelect: "auto",
                    msUserSelect: "auto",
                    pointerEvents: "auto"
                  }}
                />
                <AnimatePresence>
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-minecraft-green text-sm"
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full minecraft-btn py-3 px-4 rounded-md text-white font-minecraft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-minecraft-green relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <LoadingSpinner /> : (
                  <>
                    LOG IN
                    <div className="absolute right-full w-full h-full bg-white/20 transform skew-x-12 group-hover:translate-x-[200%] transition-all duration-1000"></div>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Minecraft Account Login - Coming Soon */}
          <div className="mt-8 pt-6 border-t border-white/10 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 bg-minecraft-navy-dark">
              <span className="text-xs text-gray-400 font-minecraft">OR</span>
            </div>
            
            <motion.div 
              className="minecraft-coming-soon-box bg-minecraft-navy-dark/50 border border-yellow-500/30 rounded-md p-4 text-center relative overflow-hidden group cursor-not-allowed select-none"
              whileHover={{ 
                scale: 0.98, 
                transition: { duration: 0.3 } 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setLockedClicks(prev => {
                  const newCount = prev + 1;
                  if (newCount === 7) {
                    setShowEasterEgg(true);
                    // Reset counter so user can trigger it again
                    return 0;
                  }
                  return newCount;
                });
              }}
              style={{
                // Keep user-select: none only for this coming soon box
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none"
              }}
            >
              {/* Overlay that appears on hover */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-80 transition-opacity duration-300 flex items-center justify-center z-10">
                <motion.div 
                  className="text-white select-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  animate={{ rotate: [0, -1, 1, -1, 0], transition: { repeat: Infinity, duration: 1.5 } }}
                  exit={{ opacity: 0 }}
                >
                  <LockClosedIcon className="h-6 w-6 text-yellow-500 mx-auto" />
                  <p className="text-xs mt-1 font-minecraft">FEATURE LOCKED</p>
                </motion.div>
              </div>
              
              <div className="flex items-center justify-center mb-2 relative z-0 select-none">
                <MinecraftItem name="grass_block.svg" size={20} animate={false} />
                <h3 className="text-yellow-400 text-sm font-minecraft">MINECRAFT ACCOUNT LOGIN</h3>
              </div>
              <div className="bg-black/30 py-2 px-3 rounded flex items-center justify-center space-x-2 relative z-0 select-none">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <p className="text-sm text-gray-300">Coming Soon to BizzyNation</p>
              </div>
            </motion.div>
            
            {/* Easter egg popup that appears after 7 clicks */}
            <AnimatePresence>
              {showEasterEgg && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowEasterEgg(false)}>
                  <motion.div 
                    className="relative z-[10000] bg-minecraft-navy-dark/95 border-2 border-minecraft-green rounded-md p-5 shadow-xl max-h-[90vh] overflow-visible"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    style={{ 
                      width: "90%",
                      maxWidth: "350px"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close button */}
                    <button 
                      className="absolute -top-2 -right-2 bg-minecraft-green border-2 border-white rounded-full w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-minecraft-green/80 transition-colors"
                      onClick={() => setShowEasterEgg(false)}
                      aria-label="Close popup"
                    >
                      ×
                    </button>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <img 
                          src={`https://mc-heads.net/avatar/n0t_awake/64`} 
                          alt="Bizzy's Minecraft Head" 
                          className="w-12 h-12 rounded-md border-2 border-minecraft-green/50"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-minecraft-green font-minecraft text-sm mb-2">
                          Message from Bizzy:
                        </h3>
                        <p className="text-gray-200 text-sm mb-3">
                          Thanks for your enthusiasm! I'm working hard on this feature right now. Your clicks have been heard!
                        </p>
                        <div className="flex justify-end flex-col items-end">
                          <div className="flex items-center bg-black/30 px-3 py-1 rounded-full mb-2">
                            <motion.div
                              animate={{ rotate: [0, 20, 0] }}
                              transition={{ repeat: 2, duration: 0.5 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-minecraft-green mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                            </motion.div>
                            <span className="text-white text-xs font-minecraft">+1 SUPPORT LOGGED</span>
                          </div>
                          <p className="text-gray-400 text-xs italic">Click outside or the X button to close</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-minecraft-green hover:text-minecraft-green-light relative group">
                  Register
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-minecraft-green group-hover:w-full transition-all duration-300"></div>
                </Link>
              </p>
            </div>
          </div>
          
          {/* Enhanced pixel decoration */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-minecraft-green rotate-45 opacity-70"></div>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-minecraft-green rotate-45 opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-minecraft-green opacity-70"></div>
          <div className="absolute top-0 left-0 w-2 h-2 bg-minecraft-green opacity-70"></div>
        </div>
      </motion.div>

      {/* Diamond icon for decoration */}
      <motion.div
        className="absolute bottom-10 right-10 w-16 h-16 hidden md:block"
        initial={{ opacity: 0, y: 20, rotate: -20 }}
        animate={{ 
          opacity: 0.7, 
          y: 0,
          rotate: 0,
        }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <MinecraftItem name="diamond.svg" size={64} animate={true} />
      </motion.div>

      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

export default Login;