import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import MinecraftItem from './MinecraftItem';
import MinecraftAvatar from './MinecraftAvatar';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  MapIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Removed sword animation effect
  useEffect(() => {
    // Empty useEffect to preserve structure
  }, [isAuthenticated]);

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-minecraft-navy/90 backdrop-blur-md shadow-lg py-1' : 'bg-minecraft-navy py-2'
      } border-b-2 border-black`}
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-minecraft-green/70"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <motion.div 
              className="flex-shrink-0" 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/" className="flex items-center">
                <div className="flex items-center">
                  <motion.div 
                    className="mr-2 w-8 h-8"
                    whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                  >
                    <MinecraftItem name="grass_block" size={32} animate={false} />
                  </motion.div>
                  <div className="text-xl font-minecraft tracking-widest relative inline-block minecraft-text-shadow">
                    <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500">BIZZY</span>
                    <span className="relative z-10 text-white">NATION</span>
                    <span className="text-yellow-400 text-xs align-top">™</span>
                    <div className="absolute -inset-1 blur-lg bg-emerald-400/20 rounded-lg z-0"></div>
                  </div>
                </div>
              </Link>
            </motion.div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavLink to="/" icon={<HomeIcon className="h-4 w-4" />}>Home</NavLink>
                <NavLink 
                  to="/vote" 
                  icon={<StarIcon className="h-4 w-4 text-yellow-300 drop-shadow-md" />}
                  isSpecial={false}
                  isPremium={true}
                >
                  <span className="text-yellow-300 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Vote</span>
                </NavLink>
                {isAuthenticated ? (
                  <>
                    <NavLink to="/dashboard" icon={<CogwheelIcon className="h-4 w-4" />}>Dashboard</NavLink>
                    <NavLink to="/map" icon={<MapIcon className="h-4 w-4" />}>Map</NavLink>
                    <NavLink to="/shop" icon={<ShoppingCartIcon className="h-4 w-4" />}>Shop</NavLink>
                    <NavLink to="/auction" icon={<CurrencyDollarIcon className="h-4 w-4" />}>Auction</NavLink>
                    {user?.role === 'admin' && (
                      <NavLink to="/admin" icon={<ShieldCheckIcon className="h-4 w-4" />}>Admin</NavLink>
                    )}
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
          
          {/* User profile or login/register buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative group">
                <motion.button 
                  className="flex items-center space-x-2 bg-minecraft-navy-light hover:bg-minecraft-navy-dark transition-colors py-2 pl-4 pr-3 rounded-md border border-black/40"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <span className="text-sm font-minecraft text-white minecraft-text-shadow">{user?.username}</span>
                  
                  {/* Character profile icon with sword animation */}
                  <div className="relative flex-shrink-0">
                    <MinecraftAvatar 
                      username={user?.mcUsername}
                      uuid={user?.mcUUID}
                      type="head"
                      size={32}
                      animate={false}
                    />
                    
                    {/* Removed sword animation */}
                  </div>
                </motion.button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-minecraft-navy-light border-2 border-black shadow-minecraft rounded-sm overflow-hidden z-10 opacity-0 scale-95 transform origin-top-right transition-all duration-200 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible">
                  <div className="py-1">
                    <Link 
                      to="/edit-profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-minecraft-navy-dark hover:text-white"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                      Edit Profile
                    </Link>
                    <Link 
                      to="/change-password" 
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-minecraft-navy-dark hover:text-white"
                    >
                      <KeyIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                      Change Password
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-minecraft-navy-dark hover:text-white"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                      Logout
                    </button>
                  </div>
                  
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-minecraft-green"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-minecraft-green"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-minecraft-green"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-minecraft-green"></div>
                </div>
              </div>
            ) : (
              <>
                <motion.div 
                  className="btn-3d"
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 0 }}
                >
                  <Link to="/login" className="habbo-btn px-4 py-2 rounded-sm text-sm font-minecraft">
                    Login
                  </Link>
                </motion.div>
                <motion.div 
                  className="btn-3d"
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 0 }}
                >
                  <Link to="/register" className="minecraft-btn px-4 py-2 rounded-sm text-sm font-minecraft">
                    Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="mr-2 flex md:hidden">
            <motion.button
              onClick={toggleMobileMenu}
              className="minecraft-btn inline-flex items-center justify-center p-2 rounded-sm focus:outline-none"
              whileTap={{ scale: 0.95 }}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="glass-panel px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t-2 border-b-2 border-black">
              <MobileNavLink to="/" icon={<HomeIcon className="h-5 w-5" />}>Home</MobileNavLink>
              <MobileNavLink to="/vote" icon={<StarIcon className="h-5 w-5 text-yellow-300 drop-shadow-md" />} isPremium={true}>
                <span className="text-yellow-300 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Vote</span>
              </MobileNavLink>
              {isAuthenticated ? (
                <>
                  <MobileNavLink to="/dashboard" icon={<CogwheelIcon className="h-5 w-5" />}>Dashboard</MobileNavLink>
                  <MobileNavLink to="/map" icon={<MapIcon className="h-5 w-5" />}>Map</MobileNavLink>
                  <MobileNavLink to="/shop" icon={<ShoppingCartIcon className="h-5 w-5" />}>Shop</MobileNavLink>
                  <MobileNavLink to="/auction" icon={<CurrencyDollarIcon className="h-5 w-5" />}>Auction</MobileNavLink>
                  {user?.role === 'admin' && (
                    <MobileNavLink to="/admin" icon={<ShieldCheckIcon className="h-5 w-5" />}>Admin</MobileNavLink>
                  )}
                  <div className="pt-4 pb-3 border-t border-gray-700">
                    <div className="flex items-center px-5">
                      <div className="flex-shrink-0">
                        <MinecraftAvatar 
                          username={user?.mcUsername}
                          uuid={user?.mcUUID}
                          type="head"
                          size={40}
                          animate={false}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-minecraft text-white minecraft-text-shadow">{user?.username}</div>
                        <div className="text-sm font-medium text-gray-400">{user?.email || 'No email'}</div>
                      </div>
                    </div>
                    <div className="mt-3 px-2 space-y-1">
                      <MobileNavLink to="/edit-profile" icon={<Cog6ToothIcon className="h-5 w-5" />}>
                        Edit Profile
                      </MobileNavLink>
                      <MobileNavLink to="/change-password" icon={<KeyIcon className="h-5 w-5" />}>
                        Change Password
                      </MobileNavLink>
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center text-gray-300 hover:bg-minecraft-navy-light hover:text-white px-3 py-2 rounded-md text-base font-medium"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-minecraft-green" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2">
                    <Link to="/login" className="block w-full habbo-btn text-center py-2 rounded-sm text-base font-minecraft">
                      Login
                    </Link>
                  </div>
                  <div className="p-2">
                    <Link to="/register" className="block w-full minecraft-btn text-center py-2 rounded-sm text-base font-minecraft">
                      Register
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Custom cogwheel icon
const CogwheelIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
  </svg>
);

// Desktop navigation link - enhanced with icons and improved animation
const NavLink = ({ to, children, icon, className = '', isSpecial = false, isPremium = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  // Additional styles for special links like Vote
  const specialStyles = isSpecial 
    ? "bg-minecraft-green text-white hover:bg-minecraft-green-light font-medium" 
    : "";
    
  // Additional styles for premium links like Vote
  const premiumStyles = isPremium
    ? "bg-gradient-to-r from-amber-700 to-amber-500 text-black hover:from-amber-600 hover:to-amber-400 font-bold shadow-lg border border-yellow-300/50"
    : "";
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      <Link
        to={to}
        className={`relative text-gray-300 hover:bg-minecraft-navy-light hover:text-white px-3 py-2 rounded-sm text-sm font-minecraft transition-all duration-200 flex items-center border border-transparent ${
          isActive ? 'text-white border-white/20 bg-minecraft-navy-light' : ''
        } ${isSpecial && !isPremium ? specialStyles : ''} ${isPremium ? premiumStyles : ''} ${className}`}
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
        {isPremium && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
        )}
        {isActive && !isPremium && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-minecraft-green"
            layoutId="navIndicator"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        {isActive && isPremium && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-300"
            layoutId="navIndicator"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  );
};

// Mobile navigation link - enhanced with icons
const MobileNavLink = ({ to, children, icon, className = '', isSpecial = false, isPremium = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  // Additional styles for special links like Vote
  const specialStyles = isSpecial && !isPremium
    ? "bg-minecraft-green text-white hover:bg-minecraft-green-light" 
    : "";
    
  // Additional styles for premium links like Vote  
  const premiumStyles = isPremium
    ? "bg-gradient-to-r from-amber-700 to-amber-500 text-yellow-300 hover:from-amber-600 hover:to-amber-400 font-bold border border-yellow-300/50"
    : "";
  
  return (
    <Link
      to={to}
      className={`block text-gray-300 hover:bg-minecraft-navy-light hover:text-white px-3 py-2 rounded-sm text-base font-medium flex items-center ${
        isActive && !isPremium ? 'bg-minecraft-navy-light text-white border-l-2 border-minecraft-green' : ''
      } ${isActive && isPremium ? 'border-l-2 border-yellow-500' : ''}
      ${specialStyles} ${premiumStyles} ${className}`}
    >
      {icon && <span className={`mr-3 ${isPremium ? 'text-amber-800' : 'text-minecraft-green'}`}>{icon}</span>}
      {children}
      {isPremium && (
        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-1 py-0.5 text-xs font-medium text-yellow-800">
          Premium
        </span>
      )}
    </Link>
  );
};

export default Navigation;