/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useLinkVerification.js
 * @description Hook for handling Minecraft account link verification via SSE
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useEventSource } from '../contexts/EventSourceContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling Minecraft account link verification via SSE
 * @returns {Object} - { verifying, verificationError, connected }
 */
export default function useLinkVerification() {
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const { user, forceDataRefresh, updateTokenAndUser } = useAuth();
  const { addEventListener, connected } = useEventSource();
  
  // Use ref to track component mount state
  const isMountedRef = useRef(true);
  
  // Setup effect for event listeners
  useEffect(() => {
    // Only set up listener if we have a user
    if (!user) return;
    
    // Function to handle account link events
    const handleAccountLinked = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.type === 'account_linked' && data.userId === (user.id || user._id)) {
        setVerifying(true);
        toast.success('🎮 Your Minecraft account has been linked successfully!');
        // If the event includes a new token and user, update session immediately
        if (data.token && data.user) {
          updateTokenAndUser(data.token, data.user);
        }
        // Fallback: force refresh user data
        if (forceDataRefresh) {
          forceDataRefresh().catch(() => {});
        }
        setTimeout(() => {
          if (isMountedRef.current) {
            setVerifying(false);
          }
        }, 500);
      }
    };
    
    // Set up event listener
    let cleanup = () => {};
    if (typeof addEventListener === 'function') {
      cleanup = addEventListener('account_linked', handleAccountLinked) || (() => {});
    }
    
    // Return cleanup function
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [user, addEventListener, forceDataRefresh, updateTokenAndUser]);
  
  // Return state
  return { verifying, verificationError, connected };
}