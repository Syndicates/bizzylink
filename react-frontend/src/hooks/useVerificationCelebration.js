/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useVerificationCelebration.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { useEventSource } from '../contexts/EventSourceContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling the verification celebration when a user links their Minecraft account
 * @returns {Object} - { showCelebration, mcUsername, handleCloseCelebration, handleStartTour, tourActive, triggerCelebration, setTourActive }
 */
export default function useVerificationCelebration() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [mcUsername, setMcUsername] = useState('');
  const [tourActive, setTourActive] = useState(false);
  const { eventSource, connected } = useEventSource();
  const { user, forceDataRefresh } = useAuth();

  // Handle account_linked event
  const handleAccountLinked = useCallback((event) => {
    try {
      console.log('Raw account_linked event received:', event);
      
      // Check if event.data is a string that needs parsing
      let data;
      if (typeof event === 'string') {
        data = JSON.parse(event);
      } else if (typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else {
        data = event.data || event;
      }
      
      console.log('Parsed account_linked data:', data);
      
      // Check if this event is for the current user - compare IDs properly
      // The user object might have _id or id property
      const currentUserId = user?._id?.toString() || user?.id?.toString();
      const eventUserId = data.userId?.toString();
      
      console.log('User ID comparison:', {
        currentUserId,
        eventUserId,
        user,
        match: currentUserId === eventUserId
      });
      
      if (user && currentUserId === eventUserId) {
        console.log('Account linked for current user!', {
          user,
          data,
          match: currentUserId === eventUserId
        });
        
        // Immediately refresh user data to update the UI
        if (forceDataRefresh) {
          console.log('Force refreshing user data and UI...');
          forceDataRefresh().catch(err => console.error('Error refreshing user data:', err));
        }
        
        // Use mcUsername from the event or fall back to the existing username in the user object
        setMcUsername(data.mcUsername || '');
        
        // Force the celebration to show with a slight delay to ensure DOM is ready
        setTimeout(() => {
          console.log('Showing celebration modal...');
          setShowCelebration(true);
          
          // Make sure the modal is visible in the DOM
          const modal = document.querySelector('.verification-celebration-modal');
          if (modal) {
            console.log('Modal found in DOM, ensuring visibility');
            modal.style.display = 'block';
            modal.style.opacity = '1';
            modal.style.zIndex = '9999';
          } else {
            console.log('Modal not found in DOM');
          }
        }, 500);
        
        // Play a sound effect
        try {
          const audio = new Audio('/sounds/level-up.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
        } catch (e) {
          console.log('Audio not supported', e);
        }
        
        // Store verification state in localStorage to prevent showing again on refresh
        localStorage.setItem('account_verified', 'true');
        localStorage.setItem('account_verified_time', Date.now().toString());
      } else {
        console.log('Account linked event not for current user', {
          currentUserId,
          eventUserId,
          match: currentUserId === eventUserId
        });
      }
    } catch (error) {
      console.error('Error handling account_linked event:', error);
    }
  }, [user, forceDataRefresh]);

  // Set up event listener for account_linked events
  useEffect(() => {
    if (!connected || !eventSource) {
      console.log('[VerificationCelebration] Not connected to event source or no event source available');
      return;
    }
    
    console.log('[VerificationCelebration] Setting up event listener for account_linked events');
    
    // Check if we've already shown the celebration recently
    const alreadyVerified = localStorage.getItem('account_verified') === 'true';
    const verifiedTime = parseInt(localStorage.getItem('account_verified_time') || '0', 10);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // If verified in the last hour, don't show again
    if (alreadyVerified && verifiedTime > oneHourAgo) {
      console.log('[VerificationCelebration] Already showed celebration recently, not showing again');
      return;
    }
    
    // Add event listener
    eventSource.addEventListener('account_linked', handleAccountLinked);
    console.log('[VerificationCelebration] Added event listener for account_linked events');
    
    // Clean up
    return () => {
      console.log('[VerificationCelebration] Removing event listener for account_linked events');
      eventSource.removeEventListener('account_linked', handleAccountLinked);
    };
  }, [connected, eventSource, handleAccountLinked]);

  // Handle closing the celebration modal
  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Handle starting the guided tour
  const handleStartTour = useCallback(() => {
    setShowCelebration(false);
    setTourActive(true);
  }, []);

  // Function to manually trigger the celebration (for testing)
  const triggerCelebration = useCallback((username) => {
    console.log('[VerificationCelebration] Manually triggering celebration with username:', username);
    setMcUsername(username || 'Player');
    
    // Force the celebration to show with a slight delay to ensure DOM is ready
    setTimeout(() => {
      console.log('Showing celebration modal...');
      setShowCelebration(true);
      
      // Make sure the modal is visible in the DOM
      const modal = document.querySelector('.verification-celebration-modal');
      if (modal) {
        console.log('Modal found in DOM, ensuring visibility');
        modal.style.display = 'block';
        modal.style.opacity = '1';
        modal.style.zIndex = '9999';
      } else {
        console.log('Modal not found in DOM');
      }
    }, 500);
    
    // Play a sound effect
    try {
      const audio = new Audio('/sounds/level-up.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
    } catch (e) {
      console.log('Audio not supported', e);
    }
    
    // For testing purposes, we don't set the localStorage flag here
    // so that we can trigger it multiple times
  }, []);

  return {
    showCelebration,
    mcUsername,
    handleCloseCelebration,
    handleStartTour,
    tourActive,
    triggerCelebration,
    setTourActive
  };
} 