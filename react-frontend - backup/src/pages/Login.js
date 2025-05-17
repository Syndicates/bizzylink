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
  
  const { login, loading, isAuthenticated } = useAuth();
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
      const response = await login(username, password);
      console.log('Login successful with response:', response);
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Login successful!'
      });
      
      // Redirect immediately instead of using setTimeout
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Login failed. Please try again.'
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
            <MinecraftItem name="grass_block" size={92} animate={false} />
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
        <div className="glass-panel backdrop-blur-lg px-4 py-8 sm:px-10 rounded-lg border border-white/10 shadow-minecraft">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                Username
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
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-minecraft placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-green focus:border-minecraft-green/50 sm:text-sm transition-all duration-200"
                />
                <AnimatePresence>
                  {username && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-minecraft-green text-xs"
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                Password
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
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-minecraft placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-green focus:border-minecraft-green/50 sm:text-sm transition-all duration-200"
                />
                <AnimatePresence>
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-minecraft-green text-xs"
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
                className="w-full minecraft-btn py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-minecraft-green relative overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <LoadingSpinner /> : (
                  <>
                    Log In
                    <div className="absolute right-full w-full h-full bg-white/20 transform skew-x-12 group-hover:translate-x-[200%] transition-all duration-1000"></div>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-minecraft-navy text-gray-400">Or</span>
              </div>
            </div>

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
          
          {/* Pixel decoration */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-minecraft-green rotate-45 opacity-70"></div>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-minecraft-green rotate-45 opacity-70"></div>
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
        <img src="/minecraft-assets/diamond.svg" alt="Diamond" className="w-full h-full animate-pulse-glow" />
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