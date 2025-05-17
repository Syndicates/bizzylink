/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file VerificationCelebration.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon as XIcon, CheckCircleIcon, FireIcon, StarIcon, GiftIcon } from '@heroicons/react/24/solid';
import MinecraftAvatar from './MinecraftAvatar';
import GuidedTour from './GuidedTour';
import useGuidedTour from '../hooks/useGuidedTour';

/**
 * A celebration modal that appears when a user verifies their Minecraft account
 * Shows confetti animation, unlocked features, and offers to start a guided tour
 */
const VerificationCelebration = ({ 
  show, 
  onClose, 
  username, 
  mcUsername,
  onStartTour 
}) => {
  const { tourActive, startTour, endTour } = useGuidedTour();
  const navigate = useNavigate();
  
  // Close modal if escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [show, onClose]);
  
  // Start confetti effect when modal opens
  useEffect(() => {
    if (show) {
      // You could add a confetti library here if desired
      // For now we'll use CSS animations
    }
  }, [show]);
  
  const handleStartTour = () => {
    onClose();
    if (onStartTour) {
      // Give the modal time to close before starting the tour
      setTimeout(() => {
        onStartTour();
      }, 300);
    } else {
      // Use our local startTour if no onStartTour prop is provided
      setTimeout(() => {
        startTour();
      }, 300);
    }
  };
  
  const handleGoToProfile = () => {
    onClose();
    navigate('/profile');
  };
  
  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center verification-celebration-modal"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              zIndex: 9999
            }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black bg-opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: 'fixed' }}
            />
            
            {/* Confetti animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ position: 'fixed' }}>
              <div className="confetti-container">
                {[...Array(50)].map((_, i) => (
                  <div 
                    key={i}
                    className="confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Modal content */}
            <motion.div
              className="relative bg-gray-900 border-2 border-minecraft-habbo-blue rounded-xl shadow-minecraft max-w-md w-full overflow-hidden z-10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* Header with diamond pattern */}
              <div className="bg-minecraft-habbo-blue p-4 relative">
                <div className="absolute inset-0 opacity-10 minecraft-diamond-pattern" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-white mr-2" />
                    <h2 className="text-xl font-bold text-white">Account Verified!</h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Main content */}
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="mr-4">
                    <MinecraftAvatar 
                      username={mcUsername || 'n0t_awake'} 
                      size={48} 
                      type="head"
                      animate={true}
                      className="rounded"
                      onClick={() => {}} // Empty function to make it clickable for animation
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {username || 'User'}, your Minecraft account is now linked!
                    </h3>
                    <p className="text-gray-300">
                      Connected to: <span className="font-semibold text-minecraft-habbo-blue">{mcUsername || 'n0t_awake'}</span>
                    </p>
                  </div>
                </div>
                
                {/* Unlocked features */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h4 className="text-white font-bold mb-3 flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    Unlocked Features
                  </h4>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FireIcon className="h-5 w-5 text-minecraft-habbo-red mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Access to your in-game stats and achievements</span>
                    </li>
                    <li className="flex items-start">
                      <FireIcon className="h-5 w-5 text-minecraft-habbo-red mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Ability to participate in server events and competitions</span>
                    </li>
                    <li className="flex items-start">
                      <FireIcon className="h-5 w-5 text-minecraft-habbo-red mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">Exclusive rewards and perks for verified players</span>
                    </li>
                    <li className="flex items-start">
                      <GiftIcon className="h-5 w-5 text-minecraft-habbo-green mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">
                        <strong className="text-minecraft-habbo-green">Bonus:</strong> You've received 500 server coins!
                      </span>
                    </li>
                  </ul>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleStartTour}
                    className="flex-1 bg-minecraft-habbo-blue hover:bg-minecraft-habbo-blue/80 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Take a Tour
                  </button>
                  <button
                    onClick={handleGoToProfile}
                    className="flex-1 bg-minecraft-habbo-green hover:bg-minecraft-habbo-green/80 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Guided tour component */}
      <GuidedTour isOpen={tourActive} onClose={endTour} />
      
      {/* CSS for confetti animation */}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: #f00;
          top: -10px;
          animation: confetti-fall 5s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .minecraft-diamond-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0L40 20L20 40z'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </>
  );
};

export default VerificationCelebration; 