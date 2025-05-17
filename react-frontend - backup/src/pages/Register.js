import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import LoadingSpinner from '../components/LoadingSpinner';
import MinecraftItem from '../components/MinecraftItem';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSwordAnimation, setShowSwordAnimation] = useState(false);
  
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [password]);

  // Show sword animation when form is valid
  useEffect(() => {
    if (
      username.length >= 3 && 
      password.length >= 8 && 
      password === confirmPassword && 
      passwordStrength >= 75
    ) {
      setShowSwordAnimation(true);
    } else {
      setShowSwordAnimation(false);
    }
  }, [username, password, confirmPassword, passwordStrength]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Passwords do not match'
      });
      return;
    }
    
    if (username.length < 3) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Username must be at least 3 characters'
      });
      return;
    }
    
    if (password.length < 8) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Password must be at least 8 characters'
      });
      return;
    }
    
    try {
      await register(username, password, email);
      setNotification({
        show: true,
        type: 'success',
        message: 'Registration successful! Please log in.'
      });
      
      // Navigate to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Registration failed. Please try again.'
      });
    }
  };

  // Get color for password strength bar
  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Generate floating crafting cubes for background
  const generateCraftingCubes = () => {
    const items = ['dirt', 'stone', 'wood', 'grass'];
    const cubes = [];
    
    for (let i = 0; i < 15; i++) {
      const type = items[Math.floor(Math.random() * items.length)];
      const size = Math.floor(Math.random() * 40) + 20;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 1;
      const duration = 15 + Math.random() * 30;
      
      cubes.push(
        <motion.div
          key={i}
          className={`absolute minecraft-${type}-bg rounded-sm opacity-10 hidden md:block`}
          style={{
            width: size + 'px',
            height: size + 'px',
            left: x + '%',
            top: y + '%',
          }}
          initial={{ opacity: 0, scale: 0, rotate: Math.random() * 360 }}
          animate={{ 
            opacity: 0.1, 
            scale: [0, 1, 1, 0],
            rotate: [Math.random() * 360, Math.random() * 360],
            y: [0, Math.random() * -100 - 50],
          }}
          transition={{ 
            duration: duration,
            delay: delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 10
          }}
        />
      );
    }
    
    return cubes;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-minecraft-navy-dark to-minecraft-navy flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="absolute inset-0 minecraft-grid-bg opacity-5 z-0"></div>
      {generateCraftingCubes()}

      {/* Character with sword animation for decoration */}
      <AnimatePresence>
        {showSwordAnimation && (
          <motion.div
            className="absolute -bottom-16 -left-16 w-52 h-52 hidden lg:block"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <MinecraftItem 
                name="player_head" 
                size={160}
                animate={false}
              />
              <motion.div 
                className="absolute top-0 right-0 w-16 h-16"
                animate={{ rotate: [0, 20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              >
                <MinecraftItem 
                  name="diamond_sword" 
                  size={80}
                  animate={false}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          className="w-24 h-24 mx-auto mb-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2
          }}
        >
          <div className="block-hover">
            <MinecraftItem name="diamond" size={92} animate={false} />
          </div>
        </motion.div>
        
        <motion.h2 
          className="text-center text-3xl font-minecraft text-white minecraft-text-shadow mb-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Create Account
        </motion.h2>
        
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="h-1 w-32 bg-minecraft-habbo-blue rounded-full"></div>
        </motion.div>
      </div>

      <motion.div 
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="glass-panel backdrop-blur-lg px-4 py-8 sm:px-10 rounded-lg border border-white/10 shadow-lg relative z-20">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-minecraft-habbo-blue" />
                Username
              </label>
              <div className="mt-1 relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-sm placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-habbo-blue focus:border-minecraft-habbo-blue/50 sm:text-sm transition-all duration-200"
                />
                <AnimatePresence>
                  {username && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {username.length >= 3 ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-1 text-xs text-gray-400 flex items-center">
                <span className={`h-2 w-2 rounded-full mr-1 ${username.length >= 3 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                Must be 3-20 characters (letters, numbers, underscores)
              </p>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-minecraft-habbo-blue" />
                Email (Optional)
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-sm placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-habbo-blue focus:border-minecraft-habbo-blue/50 sm:text-sm transition-all duration-200"
                />
                {email && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {email.includes('@') && email.includes('.') ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      email && <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-2 text-minecraft-habbo-blue" />
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-sm placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-habbo-blue focus:border-minecraft-habbo-blue/50 sm:text-sm transition-all duration-200"
                />
                {password && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {passwordStrength >= 75 ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </div>
              
              {/* Password strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${getStrengthColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <p className={`${passwordStrength >= 25 ? 'text-gray-300' : 'text-gray-500'}`}>Weak</p>
                    <p className={`${passwordStrength >= 50 ? 'text-gray-300' : 'text-gray-500'}`}>Medium</p>
                    <p className={`${passwordStrength >= 75 ? 'text-gray-300' : 'text-gray-500'}`}>Strong</p>
                  </div>
                </div>
              )}
              
              <div className="mt-2 grid grid-cols-2 gap-2">
                <p className="text-xs text-gray-400 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-1 ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  Min. 8 characters
                </p>
                <p className="text-xs text-gray-400 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-1 ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  Uppercase letter
                </p>
                <p className="text-xs text-gray-400 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-1 ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  Lowercase letter
                </p>
                <p className="text-xs text-gray-400 flex items-center">
                  <span className={`h-2 w-2 rounded-full mr-1 ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  Number
                </p>
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-2 text-minecraft-habbo-blue" />
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="habbo-input appearance-none block w-full px-3 py-3 border-2 border-white/10 rounded-md shadow-sm placeholder-gray-500 bg-minecraft-navy-light text-white focus:outline-none focus:ring-minecraft-habbo-blue focus:border-minecraft-habbo-blue/50 sm:text-sm transition-all duration-200"
                />
                {confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {password === confirmPassword ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full minecraft-btn py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-minecraft-habbo-blue relative overflow-hidden group bg-minecraft-habbo-blue"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <LoadingSpinner /> : (
                  <>
                    Create Account
                    <div className="absolute right-full w-full h-full bg-white/20 transform skew-x-12 group-hover:translate-x-[200%] transition-all duration-1000"></div>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-minecraft-habbo-blue hover:text-blue-400 relative group">
                Log in
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-minecraft-habbo-blue group-hover:w-full transition-all duration-300"></div>
              </Link>
            </p>
          </div>
          
          {/* Pixel decoration */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-minecraft-habbo-blue rotate-45 opacity-70"></div>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-minecraft-habbo-blue rotate-45 opacity-70"></div>
        </div>
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

export default Register;