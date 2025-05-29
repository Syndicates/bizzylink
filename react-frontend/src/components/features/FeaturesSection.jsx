import React from 'react';
import { motion } from 'framer-motion';
import { UserIcon, LinkIcon, CheckCircleIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import diamondIcon from '../../assets/images/minecraft-content/diamond.svg';
import emeraldIcon from '../../assets/images/minecraft-content/emerald.svg';
import xpOrbIcon from '../../assets/images/minecraft-content/xp-orb.svg';
import FeatureCard from './FeatureCard';

const features = [
  {
    icon: <UserIcon className="h-10 w-10 text-white" />, 
    title: 'CREATE ACCOUNT',
    description: 'Register with your email and password to get started with BizzyLink.',
    footerIcon: diamondIcon,
    footerText: 'Takes less than 1 minute',
    delay: 0.2
  },
  {
    icon: <LinkIcon className="h-10 w-10 text-white" />, 
    title: 'GENERATE CODE',
    description: 'Enter your Minecraft username to receive a unique linking code for your account.',
    footerIcon: emeraldIcon,
    footerText: 'Securely connects your identity',
    delay: 0.4
  },
  {
    icon: <CheckCircleIcon className="h-10 w-10 text-white" />, 
    title: 'VERIFY IN-GAME',
    description: 'Join our Minecraft server and type /link [your-code] to complete verification.',
    footerIcon: xpOrbIcon,
    footerText: 'Unlock all BizzyNation features',
    delay: 0.6
  }
];

const FeaturesSection = () => (
  <section className="py-16 bg-minecraft-navy-light relative">
    <div className="absolute inset-0 minecraft-grid-bg opacity-10" aria-hidden="true"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-8">
        <motion.h2 
          className="text-3xl font-minecraft text-minecraft-green mb-4 minecraft-text-shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          How BizzyLink Works
        </motion.h2>
        <motion.p
          className="text-xl text-gray-300 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Connect your Minecraft identity with our web platform in three simple steps
        </motion.p>
      </div>
      {/* Linking process visualization */}
      <div className="relative mb-10 hidden md:block" aria-hidden="true">
        <motion.div 
          className="h-2 bg-minecraft-green/30 absolute top-1/2 left-[18%] right-[18%] -translate-y-1/2 z-0"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        ></motion.div>
        <div className="flex justify-between relative z-10">
          {[1,2,3].map((n, i) => (
            <motion.div 
              key={n}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-minecraft-green text-white font-minecraft text-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i*0.2 }}
              viewport={{ once: true }}
            >
              {n}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
      {/* Command example */}
      <motion.div 
        className="mt-12 max-w-xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="bg-black/80 rounded-lg border border-minecraft-green/30 p-4 font-mono text-sm text-gray-300">
          <div className="flex items-start mb-2">
            <CommandLineIcon className="h-5 w-5 mr-2 text-minecraft-green flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-bold mb-1">Example in-game command:</div>
              <div className="px-3 py-2 bg-black rounded flex items-center">
                <span className="text-minecraft-green mr-2">&gt;</span>
                <span className="text-gray-400">/link </span>
                <span className="text-yellow-500">ABC123</span>
              </div>
            </div>
          </div>
          <div className="pl-7 text-gray-400 text-xs">
            After linking, you'll have access to your player stats, server rewards, and community features!
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection; 