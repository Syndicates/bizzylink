/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Navigation.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { motion, AnimatePresence } from 'framer-motion';
import MinecraftAvatar from './MinecraftAvatar';
import NotificationsPanel from './social/NotificationsPanel';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  MapIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  TrophyIcon,
  BellIcon,
  UserGroupIcon,
  BellAlertIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const Navigation = () => {
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated; 
  const { user, logout } = auth;
  
  // Social context integration
  const social = useSocial();
  
  // Calculate unread count from notifications array
  const calculateUnreadCount = () => {
    // Helper function to count unread notifications in an array
    const countUnread = (notifArray) => {
      if (!Array.isArray(notifArray)) return 0;
      
      // First check if notifications have a read property
      if (notifArray.length > 0 && notifArray[0].hasOwnProperty('read')) {
        return notifArray.filter(n => !n.read).length;
      }
      
      // If no read property exists, check for other indicators of unread status
      if (notifArray.length > 0 && notifArray[0].hasOwnProperty('isRead')) {
        return notifArray.filter(n => !n.isRead).length;
      }
      
      // If no read indicators are found, assume all are unread
      return notifArray.length;
    };
    
    // From the screenshot, we can see a direct { success: true, notifications: Array(3) } format
    if (social?.notifications?.notifications && Array.isArray(social.notifications.notifications)) {
      return countUnread(social.notifications.notifications);
    } else if (!social?.notifications?.items && Array.isArray(social?.notifications)) {
      // If notifications is directly an array (API response format)
      return countUnread(social.notifications);
    } else if (social?.notifications?.items && Array.isArray(social?.notifications?.items)) {
      // If notifications has an items property that is an array (context format)
      return countUnread(social.notifications.items);
    } else if (social?.notifications?.unreadCount !== undefined) {
      // If unreadCount is explicitly provided
      return social.notifications.unreadCount;
    }
    // Default to 0 if no valid data
    return 0;
  };
  
  const unreadCount = calculateUnreadCount();
  const hasUnreadNotifications = unreadCount > 0;
  
  // Add debug logging for notifications
  useEffect(() => {
    console.log('[NAVBAR] Social context:', social);
    console.log('[NAVBAR] Unread notifications count calculated:', unreadCount);
    
    // Log additional info to help debug
    if (social?.notifications) {
      if (Array.isArray(social.notifications)) {
        console.log('[NAVBAR] Notifications is an array with length:', social.notifications.length);
        
        // Log the first notification to check its structure
        if (social.notifications.length > 0) {
          console.log('[NAVBAR] First notification structure:', social.notifications[0]);
        }
      } else if (social.notifications.items && Array.isArray(social.notifications.items)) {
        console.log('[NAVBAR] Notifications items array length:', social.notifications.items.length);
        
        // Log the first notification to check its structure
        if (social.notifications.items.length > 0) {
          console.log('[NAVBAR] First notification structure:', social.notifications.items[0]);
        }
      } else {
        // Log the entire notifications object to see its structure
        console.log('[NAVBAR] Notifications object structure:', social.notifications);
      }
    }
  }, [social, unreadCount]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const notificationButtonRef = useRef(null);

  // Debug auth state in Navigation
  useEffect(() => {
    // DISABLED: Remove console spam
    // console.group('🧭 Navigation Auth State');
    // console.log('isAuthenticated:', isAuthenticated);
    // console.log('User:', user ? {
    //   id: user._id || user.id,
    //   username: user.username,
    //   role: user.role
    // } : 'null');
    // console.log('Current path:', location.pathname);
    // console.groupEnd();
    if (user) {
      console.log('[NAVBAR USER DEBUG] Username:', user.username);
      console.log('[NAVBAR USER DEBUG] MC Username:', user.mcUsername);
      console.log('[NAVBAR USER DEBUG] MC UUID:', user.mcUUID);
    } else {
      console.log('[NAVBAR USER DEBUG] User object is null or undefined.');
    }
  }, [isAuthenticated, user, location.pathname]);

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
    setNotificationsOpen(false);
  }, [location]);

  // Removed sword animation effect
  useEffect(() => {
    // Empty useEffect to preserve structure
  }, [isAuthenticated]);
  
  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationButtonRef.current && 
        !notificationButtonRef.current.contains(event.target) && 
        notificationsOpen
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav 
      className={`fixed w-full transition-all duration-300 ${
        scrolled ? 'bg-minecraft-navy/90 backdrop-blur-md shadow-lg py-1' : 'bg-minecraft-navy py-1'
      } border-b border-black`}
      style={{ zIndex: 50 }}
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-minecraft-green/70"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center">
                <div className="w-6 h-6 mr-2">
                  <img 
                    src="/minecraft-assets/grass_block.svg"
                    alt="Grass Block" 
                    className="w-full h-full"
                  />
                </div>
                <div className="text-lg font-minecraft tracking-wide minecraft-text-shadow">
                  <span className="text-emerald-400">BIZZY</span>
                  <span className="text-white">NATION</span>
                </div>
              </div>
            </Link>
            
            <div className="hidden md:block">
              <div className="ml-8 flex items-baseline space-x-1">
                <NavLink to="/" icon={<HomeIcon className="h-3.5 w-3.5" />}>Home</NavLink>
                <NavLink to="/leaderboard" icon={<TrophyIcon className="h-3.5 w-3.5" />}>Ranks</NavLink>
                <NavLink 
                  to="/vote" 
                  icon={<StarIcon className="h-3.5 w-3.5 text-yellow-300" />}
                  isPremium={true}
                >
                  <span className="text-yellow-300">Vote</span>
                </NavLink>
                
                {isAuthenticated ? (
                  <>
                    <NavLink to="/dashboard" icon={<CogwheelIcon className="h-3.5 w-3.5" />}>Dashboard</NavLink>
                    <NavLink to={user?.username ? `/profile/${user.username}` : "/profile"} icon={<UserCircleIcon className="h-3.5 w-3.5" />}>Profile</NavLink>
                    <NavLink to="/friends" icon={<UserGroupIcon className="h-3.5 w-3.5" />}>Friends</NavLink>
                    <NavLink to="/community" icon={<ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />}>Community</NavLink>
                    
                    {/* More dropdown menu for additional links */}
                    <div className="dropdown-menu-container relative" id="more-dropdown-container">
                      <button className="text-white hover:bg-minecraft-green/20 px-4 py-1.5 rounded-md mx-1 text-sm font-minecraft tracking-wider transition-colors duration-200 flex items-center space-x-1">
                        <span>More</span>
                        <svg className="w-4 h-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown content */}
                      <div className="dropdown-menu z-10 w-48 mt-2 bg-minecraft-navy border border-minecraft-green/50 shadow-xl rounded-md overflow-hidden">
                        <div className="py-1">
                          <DropdownLink to="/map" icon={<MapIcon className="h-4 w-4" />}>
                            Server Map
                          </DropdownLink>
                          
                          <DropdownLink to="/shop" icon={<ShoppingCartIcon className="h-4 w-4" />}>
                            Item Shop
                          </DropdownLink>
                          
                          <DropdownLink to="/auction" icon={<CurrencyDollarIcon className="h-4 w-4" />}>
                            Auction House
                          </DropdownLink>
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === 'admin' && (
                      <NavLink to="/admin" icon={<ShieldCheckIcon className="h-3.5 w-3.5" />}>Admin</NavLink>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* User profile or login/register buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                {/* Notification Bell - simplified */}
                <div className="notification-dropdown-container" ref={notificationButtonRef}>
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-md text-white hover:bg-minecraft-navy-light transition-colors"
                  >
                    {hasUnreadNotifications ? (
                      <BellAlertIcon className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <BellIcon className="h-5 w-5" />
                    )}
                    
                    {/* Notification badge */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[1rem] min-h-[1rem]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Panel */}
                  <NotificationsPanel
                    isOpen={notificationsOpen}
                    onClose={() => setNotificationsOpen(false)}
                  />
                </div>
                
                {/* User profile - simplified */}
                <div className="dropdown-menu-container relative">
                  <button 
                    className="flex items-center space-x-2 hover:bg-minecraft-navy-light transition-colors py-1.5 px-3 rounded-md"
                  >
                    <span className="text-sm font-minecraft text-white">{user?.username}</span>
                    <div className="w-6 h-6">
                      {/* Use the same fallback logic as the dashboard for the Minecraft skin */}
                      {user?.mcUsername ? (
                        <img
                          src={`https://visage.surgeplay.com/face/32/${user.mcUsername}`}
                          alt="Minecraft Skin"
                          className="w-6 h-6 rounded-md"
                          onError={(e) => {
                            e.target.onerror = () => {
                              e.target.onerror = () => {
                                e.target.onerror = () => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/32?text=Skin';
                                };
                                e.target.src = `https://minotar.net/avatar/${user.mcUsername}/32.png`;
                              };
                              e.target.src = `https://mc-heads.net/avatar/${user.mcUsername}/32`;
                            };
                            e.target.src = `https://playerdb.co/api/player/minecraft/${user.mcUsername}/avatar`;
                          }}
                        />
                      ) : (
                        <UserCircleIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Dropdown menu with absolute positioning and high z-index */}
                  <div className="dropdown-menu w-40 bg-minecraft-navy-dark shadow-lg rounded overflow-hidden border border-gray-800 z-[100]" style={{ right: '0' }}>
                    <div className="py-1">
                      <Link 
                        to="/edit-profile" 
                        className="flex items-center px-4 py-1.5 text-sm text-gray-300 hover:bg-black/30 hover:text-white"
                      >
                        <Cog6ToothIcon className="h-3.5 w-3.5 mr-2 text-minecraft-green" />
                        Edit Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center px-4 py-1.5 text-sm text-gray-300 hover:bg-black/30 hover:text-white"
                      >
                        <ArrowRightOnRectangleIcon className="h-3.5 w-3.5 mr-2 text-minecraft-green" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-white hover:text-gray-300 transition">
                  Login
                </Link>
                <Link to="/register" className="minecraft-btn px-3 py-1.5 rounded text-sm font-medium">
                  Register
                </Link>
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

      {/* Mobile menu - simplified */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="bg-minecraft-navy-dark/95 backdrop-blur-sm px-2 pt-2 pb-3 space-y-0.5 border-b border-gray-800">
              {/* Core navigation links */}
              <MobileNavLink to="/" icon={<HomeIcon className="h-5 w-5" />}>Home</MobileNavLink>
              <MobileNavLink to="/leaderboard" icon={<TrophyIcon className="h-5 w-5" />}>Leaderboard</MobileNavLink>
              <MobileNavLink to="/vote" icon={<StarIcon className="h-5 w-5 text-yellow-300" />} isPremium={true}>Vote</MobileNavLink>
              
              {isAuthenticated ? (
                <>
                  <MobileNavLink to="/dashboard" icon={<CogwheelIcon className="h-5 w-5" />}>Dashboard</MobileNavLink>
                  <MobileNavLink to={user?.username ? `/profile/${user.username}` : "/profile"} icon={<UserCircleIcon className="h-5 w-5" />}>Profile</MobileNavLink>
                  <MobileNavLink to="/friends" icon={<UserGroupIcon className="h-5 w-5" />}>Friends</MobileNavLink>
                  <MobileNavLink to="/community" icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />}>Community</MobileNavLink>
                  <MobileNavLink to="/notifications" icon={hasUnreadNotifications ? <BellAlertIcon className="h-5 w-5 text-yellow-400" /> : <BellIcon className="h-5 w-5" />}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.5rem] inline-block text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </MobileNavLink>
                  
                  {user?.role === 'admin' && (
                    <MobileNavLink to="/admin" icon={<ShieldCheckIcon className="h-5 w-5" />}>Admin</MobileNavLink>
                  )}
                  
                  {/* User profile info */}
                  <div className="pt-2 pb-2 mt-2 border-t border-gray-700/50">
                    <div className="flex items-center px-3 py-2">
                      <div className="flex-shrink-0 w-8 h-8">
                        <div className="w-6 h-6">
                          {/* Use the same fallback logic as the dashboard for the Minecraft skin */}
                          {user?.mcUsername ? (
                            <img
                              src={`https://visage.surgeplay.com/face/32/${user.mcUsername}`}
                              alt="Minecraft Skin"
                              className="w-6 h-6 rounded-md"
                              onError={(e) => {
                                e.target.onerror = () => {
                                  e.target.onerror = () => {
                                    e.target.onerror = () => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/32?text=Skin';
                                    };
                                    e.target.src = `https://minotar.net/avatar/${user.mcUsername}/32.png`;
                                  };
                                  e.target.src = `https://mc-heads.net/avatar/${user.mcUsername}/32`;
                                };
                                e.target.src = `https://playerdb.co/api/player/minecraft/${user.mcUsername}/avatar`;
                              }}
                            />
                          ) : (
                            <UserCircleIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-minecraft text-white">{user?.username}</div>
                      </div>
                    </div>
                    {/* User actions */}
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center text-gray-300 hover:bg-minecraft-navy px-3 py-2 rounded text-sm"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-minecraft-green" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex mt-3 space-x-2">
                    <Link to="/login" className="flex-1 px-4 py-2 text-center rounded bg-minecraft-navy-light text-white text-sm">
                      Login
                    </Link>
                    <Link to="/register" className="flex-1 minecraft-btn text-center py-2 rounded text-sm">
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

// Desktop navigation link - simplified but still maintains Minecraft feel
const NavLink = ({ to, children, icon, className = '', isSpecial = false, isPremium = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  // Simplified premium styles  
  const premiumStyles = isPremium
    ? "text-yellow-300 hover:text-yellow-200 font-medium"
    : "";
  
  return (
    <Link
      to={to}
      className={`relative text-gray-300 hover:text-white px-2 py-1.5 text-sm font-minecraft transition-colors duration-200 flex items-center ${
        isActive ? 'text-white' : ''
      } ${isPremium ? premiumStyles : ''} ${className}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {/* Simple active indicator */}
      {isActive && (
        <motion.div 
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${isPremium ? 'bg-yellow-300' : 'bg-minecraft-green'}`}
          layoutId="navIndicator"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

// Mobile navigation link - simplified
const MobileNavLink = ({ to, children, icon, className = '', isSpecial = false, isPremium = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  // Simplified premium styles  
  const premiumStyles = isPremium
    ? "text-yellow-300" 
    : "";
  
  return (
    <Link
      to={to}
      className={`block text-gray-300 hover:bg-minecraft-navy/50 hover:text-white px-3 py-2 rounded text-sm flex items-center ${
        isActive ? 'bg-minecraft-navy/30 text-white border-l-2 border-minecraft-green' : ''
      } ${isActive && isPremium ? 'border-l-2 !border-yellow-400' : ''}
      ${premiumStyles} ${className}`}
    >
      {icon && <span className="mr-2 text-minecraft-green">{icon}</span>}
      {children}
    </Link>
  );
};

// Component for dropdown menu items
const DropdownLink = ({ to, children, icon }) => {
  return (
    <Link 
      to={to}
      className="flex items-center px-4 py-1.5 text-sm text-gray-300 hover:bg-black/30 hover:text-white"
    >
      {icon && <span className="mr-2 text-minecraft-green">{icon}</span>}
      {children}
    </Link>
  );
};

// Additional component for player count display
export const OnlinePlayersBar = ({ playerCount = 0, maxPlayers = 100 }) => {
  return (
    <div className="bg-minecraft-navy-dark py-1 border-b border-gray-800 text-center text-xs text-gray-400">
      <span className="inline-flex items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
        <span className="text-white font-medium">{playerCount}</span>
        <span className="mx-1">/</span>
        <span>{maxPlayers}</span>
        <span className="ml-1">players online</span>
      </span>
    </div>
  );
};

export default Navigation;