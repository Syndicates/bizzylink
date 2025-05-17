/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftCard.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';

const MinecraftCard = ({
  children,
  variant = 'glass', // glass, solid, habbo
  hover = true,
  className = '',
  onClick = null,
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    glass: 'bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg',
    solid: 'bg-minecraft-navy-light border-2 border-minecraft-green/20 rounded-lg',
    habbo: 'bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-habbo'
  };

  // Hover classes
  const hoverClasses = hover ? 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1' : '';

  // Click classes
  const clickClasses = onClick ? 'cursor-pointer' : '';

  // Base classes
  const baseClasses = `
    shadow-card
    ${variantClasses[variant]}
    ${hoverClasses}
    ${clickClasses}
    ${className}
  `;

  return (
    <motion.div
      className={baseClasses}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Card components
MinecraftCard.Header = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-b border-white/10 ${className}`} {...props}>
    {children}
  </div>
);

MinecraftCard.Body = ({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

MinecraftCard.Footer = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-t border-white/10 ${className}`} {...props}>
    {children}
  </div>
);

MinecraftCard.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-white mb-2 ${className}`} {...props}>
    {children}
  </h3>
);

MinecraftCard.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-300 ${className}`} {...props}>
    {children}
  </p>
);

MinecraftCard.Image = ({ src, alt = '', className = '', ...props }) => (
  <div className="relative overflow-hidden rounded-t-lg">
    <img 
      src={src} 
      alt={alt} 
      className={`w-full h-auto object-cover ${className}`} 
      {...props} 
    />
  </div>
);

export default MinecraftCard; 