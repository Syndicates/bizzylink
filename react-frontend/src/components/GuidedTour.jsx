/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file GuidedTour.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon as XIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

/**
 * A custom guided tour component that highlights different features of the application
 * Shows tooltips pointing to different UI elements
 */
const GuidedTour = ({ isOpen, onClose, startAt = 0 }) => {
  const [currentStep, setCurrentStep] = useState(startAt);
  const [targetElement, setTargetElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const navigate = useNavigate();
  const tourRef = useRef(null);

  // Define the tour steps using useMemo to prevent recreation on each render
  const steps = useMemo(() => [
    {
      target: '.dashboard-quick-actions',
      altTarget: '.quick-actions-section',
      title: 'Quick Actions',
      content: 'Welcome to your dashboard! Here you can find quick actions to navigate the platform.',
      placement: 'bottom'
    },
    {
      target: '.dashboard-profile-card',
      title: 'Profile Card',
      content: 'This is your account info. You can see your email, role, and edit your profile or change your password here.',
      placement: 'bottom'
    },
    {
      target: '.player-statistics-section',
      title: 'Player Statistics',
      content: 'This section shows your real Minecraft stats, updated live from the server. Track your playtime, balance, achievements, and more!',
      placement: 'bottom'
    },
    {
      target: '.quick-actions-grid [data-title="Shop"]',
      altTarget: '.quick-actions-section [data-title="Shop"]',
      title: 'Shop',
      content: 'Visit our shop to purchase in-game items and perks!',
      placement: 'bottom',
      action: () => navigate('/shop')
    },
    {
      target: '.quick-actions-grid [data-title="Vote"]',
      altTarget: '.quick-actions-section [data-title="Vote"]',
      title: 'Vote',
      content: 'Support our server by voting daily and earn rewards!',
      placement: 'bottom',
      action: () => navigate('/vote')
    },
    {
      target: '.quick-actions-grid [data-title="Leaderboard"]',
      altTarget: '.quick-actions-section [data-title="Leaderboard"]',
      title: 'Leaderboard',
      content: 'Check out the top players on our server!',
      placement: 'bottom',
      action: () => navigate('/leaderboard')
    },
    {
      target: '.quick-actions-grid [data-title="Server Map"]',
      altTarget: '.quick-actions-section [data-title="Server Map"]',
      title: 'Server Map',
      content: 'Explore our server map to see where everyone is building!',
      placement: 'bottom',
      action: () => navigate('/map')
    },
    {
      target: '[href="/profile"]',
      altTarget: 'a[href="/profile"]',
      title: 'Profile',
      content: 'View and edit your profile settings here.',
      placement: 'bottom',
      action: () => navigate('/profile')
    }
  ], [navigate]);

  // Reset current step when tour is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(startAt);
    }
  }, [isOpen, startAt]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, steps, onClose]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handle going to the feature
  const handleGoToFeature = useCallback(() => {
    const step = steps[currentStep];
    if (step.action) {
      step.action();
    }
    onClose();
  }, [currentStep, steps, onClose]);

  // Calculate position of tooltip based on target element
  const calculatePosition = useCallback(() => {
    if (!isOpen || !targetElement) return;
    
    const step = steps[currentStep];
    if (!step) return;

    // Calculate element position
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 300; // Approximate width of tooltip
    const tooltipHeight = 150; // Approximate height of tooltip
    
    // Calculate position based on placement
    let position = {};
    
    switch (step.placement) {
      case 'top':
        position = {
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          top: rect.top - tooltipHeight - 10
        };
        break;
      case 'bottom':
        position = {
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          top: rect.bottom + 10
        };
        break;
      case 'left':
        position = {
          left: rect.left - tooltipWidth - 10,
          top: rect.top + rect.height / 2 - tooltipHeight / 2
        };
        break;
      case 'right':
        position = {
          left: rect.right + 10,
          top: rect.top + rect.height / 2 - tooltipHeight / 2
        };
        break;
      default:
        position = {
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          top: rect.bottom + 10
        };
    }
    
    // Ensure tooltip stays within viewport
    position.left = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, position.left));
    position.top = Math.max(10, Math.min(window.innerHeight - tooltipHeight - 10, position.top));
    
    setTooltipPosition(position);
  }, [isOpen, currentStep, steps, targetElement]);

  // Find target element and calculate tooltip position
  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step) {
      onClose();
      return;
    }

    // Find the target element - try primary target first, then alternative
    let element = document.querySelector(step.target);
    
    // If primary target not found, try alternative
    if (!element && step.altTarget) {
      element = document.querySelector(step.altTarget);
    }
    
    // If still not found, try to find by title text
    if (!element && step.title) {
      const elements = document.querySelectorAll('[data-title], [title]');
      for (const el of elements) {
        const titleAttr = el.getAttribute('data-title') || el.getAttribute('title');
        if (titleAttr && titleAttr.includes(step.title)) {
          element = el;
          break;
        }
      }
    }
    
    setTargetElement(element);

    if (element) {
      calculatePosition();
    } else {
      console.log(`Target element not found: ${step.target}`);
      // Try to find next step that has a valid target
      let nextStepIndex = currentStep + 1;
      let foundNextStep = false;
      
      while (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex];
        let nextElement = document.querySelector(nextStep.target);
        
        if (!nextElement && nextStep.altTarget) {
          nextElement = document.querySelector(nextStep.altTarget);
        }
        
        if (nextElement) {
          setCurrentStep(nextStepIndex);
          foundNextStep = true;
          break;
        }
        nextStepIndex++;
      }
      
      // If no valid targets found, close the tour after a delay
      if (!foundNextStep) {
        console.log('No valid targets found, closing tour');
        setTimeout(() => onClose(), 500);
      }
    }
  }, [isOpen, currentStep, steps, onClose, calculatePosition]);

  // Add scroll and resize event listeners to update tooltip position
  useEffect(() => {
    if (!isOpen) return;
    
    const handleScroll = () => {
      calculatePosition();
    };
    
    const handleResize = () => {
      calculatePosition();
    };
    
    window.addEventListener('scroll', handleScroll, true); // true for capture phase to catch all scroll events
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, calculatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrevious]);

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" ref={tourRef}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Highlight target element */}
      {targetElement && (
        <div 
          className="absolute border-2 border-yellow-400 rounded-lg shadow-lg animate-pulse"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8
          }}
        />
      )}
      
      {/* Tooltip */}
      <AnimatePresence>
        {targetElement && (
          <motion.div
            className="absolute pointer-events-auto bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-6 max-w-xs z-50"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              width: 320
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white">{steps[currentStep].title}</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors duration-150"
                style={{ marginLeft: 8 }}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <p className="text-gray-300 mb-5 leading-relaxed">{steps[currentStep].content}</p>
            
            {/* Step Dots */}
            <div className="flex justify-center mb-4 space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-150 ${
                    index === currentStep ? 'bg-yellow-400 scale-110' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            {/* Button Group */}
            <div className="flex flex-row gap-2 justify-between items-center mt-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center text-gray-400 hover:text-white text-sm px-3 py-2 rounded border border-gray-600 bg-transparent transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minWidth: 90 }}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>
              )}
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={handleGoToFeature}
                  className="border border-green-600 text-green-600 bg-transparent hover:bg-green-600 hover:text-white px-3 py-2 text-sm rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ minWidth: 120 }}
                >
                  Go to {steps[currentStep].title}
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-sm rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minWidth: 90 }}
                >
                  {currentStep < steps.length - 1 ? (
                    <>
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuidedTour; 