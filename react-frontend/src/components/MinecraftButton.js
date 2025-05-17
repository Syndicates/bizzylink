/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file MinecraftButton.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MinecraftButton = ({ 
  children, 
  onClick, 
  to, 
  type = 'button',
  variant = 'minecraft', // minecraft, habbo, outline
  size = 'md', // sm, md, lg
  fullWidth = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props 
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    minecraft: 'bg-minecraft-green text-white border-[3px] border-black shadow-minecraft hover:bg-minecraft-green-light active:bg-minecraft-green-dark active:shadow-none active:translate-y-0.5',
    habbo: 'bg-minecraft-habbo-blue text-white border-2 border-white/20 shadow-habbo rounded-habbo hover:shadow-habbo-intense active:shadow-none active:translate-y-0.5',
    outline: 'bg-transparent border-2 border-minecraft-green text-minecraft-green hover:bg-minecraft-green/10 active:bg-minecraft-green/20'
  };

  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-minecraft-green
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? disabledClasses : ''}
    ${className}
  `;

  // Button content
  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  // Render as Link if 'to' prop is provided
  if (to) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        transition={{ duration: 0.1 }}
      >
        <Link
          to={to}
          className={baseClasses}
          {...props}
        >
          {buttonContent}
        </Link>
      </motion.div>
    );
  }

  // Render as button
  return (
    <motion.div
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { y: 2 } : {}}
      transition={{ duration: 0.1 }}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={baseClasses}
        {...props}
      >
        {buttonContent}
      </button>
    </motion.div>
  );
};

export default MinecraftButton; 