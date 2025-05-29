import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, footerIcon, footerText, delay = 0 }) => (
  <motion.div 
    className="minecraft-card relative overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    {/* Pixelated border decoration */}
    <div className="absolute top-0 left-0 w-3 h-3 bg-minecraft-green" aria-hidden="true"></div>
    <div className="absolute top-0 right-0 w-3 h-3 bg-minecraft-green" aria-hidden="true"></div>
    <div className="p-8 bg-minecraft-navy-dark border-2 border-minecraft-green/40">
      <div className="flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-minecraft-green/20 rounded-full animate-pulse" aria-hidden="true"></div>
          <div className="relative z-10 mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-minecraft-green/30 mb-6 p-4 border-2 border-minecraft-green/60">
            {icon}
          </div>
        </div>
      </div>
      <h3 className="text-xl font-minecraft text-minecraft-green text-center mb-4">{title}</h3>
      <div className="minecraft-inset-panel p-4 mb-4">
        <p className="text-gray-300 text-center">{description}</p>
      </div>
      <div className="text-sm text-gray-400 border-t border-minecraft-green/20 pt-4 mt-4">
        <div className="flex items-center">
          <img src={footerIcon} alt="" className="w-4 h-4 mr-2" aria-hidden="true" />
          <span>{footerText}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default FeatureCard; 