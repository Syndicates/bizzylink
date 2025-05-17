/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file useLinkVerification.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEventSource } from '../contexts/EventSourceContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling Minecraft account link verification via SSE
 * @returns {Object} - { verifying, verificationError }
 */
export default function useLinkVerification() {
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const { user, forceDataRefresh } = useAuth();
  const { addEventListener, connected } = useEventSource();
  const navigate = useNavigate();

  // Set up listener for account_linked events
  useEffect(() => {
    if (!user) return;
    
    console.log('[Link Verification] Setting up listener for account_linked events');
    
    const handleAccountLinked = (data) => {
      if (data.type === 'account_linked' && data.userId === user.id) {
        console.log('[Link Verification] Account linked event received:', data);
        setVerifying(true);
        
        // Show success toast
        toast.success('🎮 Your Minecraft account has been linked successfully!');
        
        // Force refresh user data and UI
        forceDataRefresh().catch(err => {
          console.error('[Link Verification] Error refreshing user data:', err);
        });
        
        // We no longer navigate to the success page since we'll show the celebration modal
        // The celebration will be handled by the useVerificationCelebration hook
        setTimeout(() => {
          setVerifying(false);
        }, 500);
      }
    };
    
    // Register the event listener
    const cleanup = addEventListener('account_linked', handleAccountLinked);
    
    // Clean up the listener when component unmounts or user changes
    return cleanup;
  }, [user, addEventListener, navigate, forceDataRefresh]);

  // Reset error when component unmounts or user changes
  useEffect(() => {
    return () => {
      setVerificationError(null);
    };
  }, [user]);

  return { verifying, verificationError, connected };
}