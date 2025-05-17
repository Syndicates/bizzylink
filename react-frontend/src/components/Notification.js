/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Notification.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MinecraftItem from './MinecraftItem';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Notification = ({ 
  show, 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  position = 'top-right'
}) => {
  const [pixels, setPixels] = useState([]);
  
  // Create pixel decorations for Minecraft-themed look
  useEffect(() => {
    if (show) {
      const newPixels = [];
      const pixelCount = 6;
      
      for (let i = 0; i < pixelCount; i++) {
        newPixels.push({
          size: Math.floor(Math.random() * 6) + 4,
          top: Math.random() * 100,
          left: Math.random() * 100,
          delay: Math.random() * 0.5,
          rotate: Math.floor(Math.random() * 45),
        });
      }
      
      setPixels(newPixels);
    }
  }, [show]);
  
  useEffect(() => {
    let timer;
    if (show && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, autoClose, duration, onClose]);

  // Sound effect for notification
  useEffect(() => {
    if (show) {
      // Simulate Minecraft notification sound
      try {
        const audio = new Audio();
        
        // Use different sounds based on notification type
        if (type === 'success') {
          audio.src = 'data:audio/wav;base64,UklGRmgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUQAAAB0j6AAAIB/AAAAgH8AAAB/gAAAAH+AAAAAf4AAAACA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAA==';
        } else if (type === 'error') {
          audio.src = 'data:audio/wav;base64,UklGRmgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUQAAACAj6AAAIB/AAAAgH8AAAB/gAAAAH+AAAAAf4AAAACA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAA==';
        } else {
          audio.src = 'data:audio/wav;base64,UklGRmgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUQAAAB6gKAAAAB/AAAAgH8AAAB/gAAAAH+AAAAAf4AAAACA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAP8AAAAA/wAAAAD/AAAAAA==';
        }
        
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Audio play prevented by browser policy', e));
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [show, type]);

  // Determine icon and colors based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <MinecraftItem name="diamond" size={32} animate={false} />,
          bgColor: 'bg-minecraft-green-dark',
          pixelColor: 'bg-minecraft-green',
          borderColor: 'border-minecraft-green',
          iconColor: 'text-white',
          textColor: 'text-white',
          title: 'Success!'
        };
      case 'error':
        return {
          icon: <MinecraftItem name="diamond_sword" size={28} animate={false} />,
          bgColor: 'bg-minecraft-habbo-red/90',
          pixelColor: 'bg-red-400',
          borderColor: 'border-red-700',
          iconColor: 'text-white',
          textColor: 'text-white',
          title: 'Error!'
        };
      case 'warning':
        return {
          icon: <MinecraftItem name="golden_apple" size={24} animate={false} />,
          bgColor: 'bg-minecraft-gold',
          pixelColor: 'bg-yellow-300',
          borderColor: 'border-yellow-500',
          iconColor: 'text-yellow-100',
          textColor: 'text-gray-900',
          title: 'Warning!'
        };
      case 'info':
      default:
        return {
          icon: <MinecraftItem name="grass_block" size={28} animate={false} />,
          bgColor: 'bg-minecraft-habbo-blue/90',
          pixelColor: 'bg-blue-400',
          borderColor: 'border-blue-700',
          iconColor: 'text-blue-100',
          textColor: 'text-white',
          title: 'Info'
        };
    }
  };

  const styles = getTypeStyles();
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed ${positionClasses[position]} z-50 max-w-md`}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`${styles.bgColor} shadow-minecraft backdrop-blur-sm border-2 border-black overflow-hidden relative`}>
            {/* Pixel decorations */}
            {pixels.map((pixel, index) => (
              <motion.div
                key={`pixel-${type}-${index}-${Math.random().toString(36).substr(2, 9)}`}
                className={`absolute ${styles.pixelColor}`}
                style={{
                  width: pixel.size + 'px',
                  height: pixel.size + 'px',
                  top: pixel.top + '%',
                  left: pixel.left + '%',
                  transform: `rotate(${pixel.rotate}deg)`
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ delay: pixel.delay, duration: 0.3 }}
              />
            ))}
          
            <div className="p-4 flex items-start relative z-10">
              <motion.div 
                className={`flex-shrink-0 ${styles.iconColor} mr-3`}
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {styles.icon}
              </motion.div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-minecraft minecraft-text-shadow mb-1">{styles.title}</p>
                <p className={`text-sm ${styles.textColor}`}>{message}</p>
              </div>
              <div className="ml-2 flex-shrink-0">
                <motion.button
                  className={`inline-flex minecraft-btn p-1 focus:outline-none`}
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>
            
            {autoClose && (
              <div className="h-2 bg-black/20">
                <div className={`h-full ${styles.pixelColor} pixel-progress`}
                  style={{ 
                    animationDuration: `${duration / 1000}s` 
                  }}
                />
              </div>
            )}
            
            {/* Pixel corner decorations */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-black rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-black rotate-45 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-black rotate-45 -translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-black rotate-45 translate-x-1/2 translate-y-1/2"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;