/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file LinkPage.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/LinkPage.css';

const LinkPage = () => {
  const { user, hasLinkedAccount, refreshUserData } = useAuth();
  const [linkCode, setLinkCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Redirect if already linked
  useEffect(() => {
    if (hasLinkedAccount) {
      navigate('/profile');
    }
  }, [hasLinkedAccount, navigate]);

  // Fetch active link code on load
  useEffect(() => {
    const fetchLinkCode = async () => {
      try {
        setLoading(true);
        const response = await api.minecraft.getActiveLinkCode();
        
        if (response.data.linkCode) {
          setLinkCode(response.data.linkCode);
          
          // Calculate countdown
          const expiresAt = new Date(response.data.linkCodeExpires).getTime();
          const now = new Date().getTime();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          
          setCountdown(timeLeft);
          
          // Start countdown timer
          if (timeLeft > 0) {
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            
            return () => clearInterval(timer);
          }
        }
      } catch (error) {
        console.error('Error fetching link code:', error);
        toast.error('Failed to fetch link code. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLinkCode();
  }, []);

  // Generate new link code
  const generateLinkCode = async () => {
    try {
      setGenerating(true);
      const response = await api.minecraft.generateLinkCode();
      
      if (response.data.linkCode) {
        setLinkCode(response.data.linkCode);
        
        // Set countdown
        const expiresAt = new Date(response.data.linkCodeExpires).getTime();
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        setCountdown(timeLeft);
        
        // Start countdown timer
        if (timeLeft > 0) {
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          toast.success('New link code generated!');
          
          return () => clearInterval(timer);
        }
      }
    } catch (error) {
      console.error('Error generating link code:', error);
      toast.error('Failed to generate link code. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Format countdown time
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy link code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(linkCode);
    toast.success('Link code copied to clipboard!');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="link-page">
      <div className="link-container">
        <h1>Link Your Minecraft Account</h1>
        
        <div className="link-instructions">
          <h2>How to Link Your Account</h2>
          <ol>
            <li>
              <span className="step-number">1</span>
              <span className="step-text">Copy your unique link code</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span className="step-text">Join our Minecraft server at <strong>play.bizzynation.com</strong></span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span className="step-text">Type <code>/link code {linkCode || 'YOUR_CODE'}</code> in the game chat</span>
            </li>
            <li>
              <span className="step-number">4</span>
              <span className="step-text">Wait for confirmation in-game and on the website</span>
            </li>
          </ol>
        </div>
        
        <div className="link-code-section">
          <h2>Your Link Code</h2>
          
          {linkCode && countdown > 0 ? (
            <div className="active-code">
              <div className="code-display">
                <span className="code">{linkCode}</span>
                <button 
                  className="copy-button" 
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
              <div className="code-info">
                <p>Code expires in: <span className="countdown">{formatCountdown(countdown)}</span></p>
              </div>
            </div>
          ) : (
            <div className="no-active-code">
              <p>No active link code. Generate a new one to link your account.</p>
            </div>
          )}
          
          <button 
            className="generate-button" 
            onClick={generateLinkCode}
            disabled={generating || (countdown > 0)}
          >
            {generating ? 'Generating...' : countdown > 0 ? 'Code Active' : 'Generate New Code'}
          </button>
        </div>
        
        <div className="link-benefits">
          <h2>Benefits of Linking</h2>
          <ul>
            <li>View your in-game stats on the website</li>
            <li>Track your achievements and progress</li>
            <li>Participate in community events</li>
            <li>Receive 2x rewards when voting</li>
            <li>Access exclusive website features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LinkPage; 