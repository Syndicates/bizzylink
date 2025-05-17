/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file LinkSuccess.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MinecraftAvatar from '../components/MinecraftAvatar';
import { 
  CheckCircleIcon, 
  UserIcon, 
  LinkIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ServerIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Benefit card component
const BenefitCard = ({ icon, title, description }) => (
  <div className="bg-black/40 p-4 rounded-lg border border-green-500/20 text-center">
    <div className="flex items-center justify-center mb-3">
      <div className="bg-green-500/20 p-2 rounded-full">
        {icon}
      </div>
    </div>
    <h4 className="text-white font-bold mb-2">{title}</h4>
    <p className="text-gray-300 text-sm">{description}</p>
  </div>
);

const LinkSuccess = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Use effect to add particle effects when the component mounts
  useEffect(() => {
    const createParticles = () => {
      const container = document.getElementById('success-particles');
      if (!container) return;
      
      // Clear existing particles
      container.innerHTML = '';
      
      // Create random particles
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('minecraft-particle');
        
        // Random position
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3 + 1;
        
        // Random color - mostly greens for Minecraft theme
        const colors = ['#54aa54', '#3a873a', '#7bba3c', '#79c05a', '#fff', '#80c71f'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Apply styles
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        
        // Animation duration and delay
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        
        particle.style.animation = `float ${duration}s ${delay}s infinite ease-in-out`;
        
        container.appendChild(particle);
      }
    };
    
    createParticles();
  }, []);

  // Handle copy button click
  const handleCopyCommand = () => {
    navigator.clipboard.writeText('/link sync');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !user.mcUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 border-2 border-green-500/40 rounded-lg p-6 text-center max-w-md">
          <div className="text-white mb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-600/20 rounded-full p-3">
                <LinkIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Link Not Found</h2>
            <p className="mt-2 text-gray-300">No linked Minecraft account was found. Please complete the linking process first.</p>
          </div>
          <Link to="/dashboard" className="bg-green-600 hover:bg-green-700 w-full block text-center mt-4 text-white font-bold py-2 px-4 rounded-lg">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minecraft particle effects */}
        <div className="absolute inset-0 pointer-events-none" id="success-particles">
          {/* Particles will be generated with JavaScript */}
        </div>
        
        {/* Success header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-green-500">
            Account Linked Successfully!
          </h1>
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Success card */}
          <motion.div 
            className="bg-gray-800 p-6 rounded-lg lg:col-span-3 border border-green-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-center mb-6">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-4 -left-4 -right-4 -bottom-4 rounded-full border-4 border-green-500 border-dashed animate-spin-slow"
                ></motion.div>
                <div className="relative">
                  <MinecraftAvatar
                    username={user.mcUsername}
                    uuid={user.mcUUID}
                    size={128}
                    type="bust"
                    animate={true}
                    showUsername={false}
                  />
                </div>
              </div>
              <div className="text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    <span className="text-green-400">Welcome, {user.mcUsername}!</span>
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Your Minecraft account is now linked to BizzyLink.
                  </p>
                  <div className="flex justify-center md:justify-start items-center bg-green-900/30 px-4 py-2 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-300">Verification Complete</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-6"></div>

            {/* Benefits unlocked section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-green-400 mb-4">Benefits Unlocked</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <BenefitCard 
                  icon={<ServerIcon className="h-6 w-6 text-green-400" />}
                  title="Exclusive Rewards"
                  description="Receive special in-game items and perks only available to linked accounts."
                />
                <BenefitCard 
                  icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-400" />}
                  title="Player Statistics"
                  description="Track your gameplay stats and achievements through the web dashboard."
                />
                <BenefitCard 
                  icon={<UsersIcon className="h-6 w-6 text-blue-400" />}
                  title="Community Features"
                  description="Participate in special events and connect with other players."
                />
              </div>
            </motion.div>

            {/* Sync command section */}
            <motion.div 
              className="bg-black/60 border border-green-500/30 p-4 rounded-lg mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="flex items-center mb-2">
                <ServerIcon className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="font-bold text-green-500">Sync Your Data</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                To ensure your latest in-game data is synced with the dashboard, run this command in-game:
              </p>
              <div className="bg-black p-3 rounded-lg font-mono flex items-center justify-between">
                <code className="text-green-500 text-sm">/link sync</code>
                <button 
                  onClick={handleCopyCommand}
                  className="text-gray-400 hover:text-gray-300"
                >
                  {copied ? (
                    <div className="flex items-center text-green-400">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Copied!</span>
                    </div>
                  ) : (
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Call to action buttons */}
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link 
            to="/dashboard" 
            className="bg-green-600 hover:bg-green-700 py-3 text-center text-white font-bold rounded-lg flex items-center justify-center"
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
          <Link 
            to="/friends" 
            className="bg-purple-600 hover:bg-purple-700 py-3 text-center text-white font-bold rounded-lg flex items-center justify-center"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Connect with Friends
          </Link>
        </motion.div>
      </div>

      {/* Add styles for Minecraft particles */}
      <style jsx="true">{`
        .minecraft-particle {
          position: absolute;
          opacity: 0.7;
          border-radius: 0;
          pointer-events: none;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LinkSuccess;