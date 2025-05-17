/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useVerificationListener.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEventSource } from '../contexts/EventSourceContext';

/**
 * Hook to listen for account verification events and show a celebration modal
 * @returns {Object} - { showCelebration, setShowCelebration, verifiedUsername }
 */
const useVerificationListener = () => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [verifiedUsername, setVerifiedUsername] = useState('');
  const { user } = useAuth();
  const { eventSource, connected } = useEventSource();

  // Handle account_linked event
  const handleAccountLinked = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Account linked event received:', data);
      
      // Check if this event is for the current user
      if (user && data.userId === user._id) {
        console.log('Account linked for current user!');
        setVerifiedUsername(data.mcUsername || '');
        setShowCelebration(true);
        
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
      }
    } catch (error) {
      console.error('Error handling account_linked event:', error);
    }
  }, [user]);

  // Set up event listener for account_linked events
  useEffect(() => {
    if (!connected || !eventSource) return;
    
    // Check if we've already shown the celebration recently
    const alreadyVerified = localStorage.getItem('account_verified') === 'true';
    const verifiedTime = parseInt(localStorage.getItem('account_verified_time') || '0', 10);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // If verified in the last hour, don't show again
    if (alreadyVerified && verifiedTime > oneHourAgo) {
      return;
    }
    
    // Add event listener
    eventSource.addEventListener('account_linked', handleAccountLinked);
    
    // Clean up
    return () => {
      eventSource.removeEventListener('account_linked', handleAccountLinked);
    };
  }, [connected, eventSource, handleAccountLinked]);

  return { showCelebration, setShowCelebration, verifiedUsername };
};

export default useVerificationListener; 