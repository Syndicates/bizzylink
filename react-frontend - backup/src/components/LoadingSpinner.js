import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MinecraftItem from './MinecraftItem';

const LoadingSpinner = ({ fullScreen = false, size = 'md', text = 'Loading...' }) => {
  const [dots, setDots] = useState('');
  const [blocks, setBlocks] = useState([]);
  
  // Generate random blocks for background
  useEffect(() => {
    if (fullScreen) {
      const blockCount = 8;
      const blockTypes = ['grass', 'wood', 'stone', 'dirt'];
      const newBlocks = [];
      
      for (let i = 0; i < blockCount; i++) {
        newBlocks.push({
          type: blockTypes[Math.floor(Math.random() * blockTypes.length)],
          size: Math.floor(Math.random() * 60) + 40,
          x: Math.random() * 100,
          y: Math.random() * 100,
          rotation: Math.random() * 20 - 10,
          delay: Math.random() * 1
        });
      }
      
      setBlocks(newBlocks);
    }
  }, [fullScreen]);
  
  // Animate loading dots
  useEffect(() => {
    if (fullScreen) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [fullScreen]);
  
  // Size classes
  const sizeClasses = {
    sm: { outer: 'h-8 w-8', inner: 'h-3 w-3' },
    md: { outer: 'h-12 w-12', inner: 'h-4 w-4' },
    lg: { outer: 'h-16 w-16', inner: 'h-6 w-6' },
    xl: { outer: 'h-24 w-24', inner: 'h-8 w-8' }
  };

  // Minecraft-themed spinner with rotating blocks
  const Spinner = () => (
    <div className="relative">
      {/* Outer spin animation */}
      <motion.div 
        className={`${sizeClasses[size].outer} flex items-center justify-center`}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 3,
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {/* Diamond animation */}
        <motion.div
          className="absolute"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <MinecraftItem 
            name="diamond" 
            size={parseInt(sizeClasses[size].inner.split('h-')[1].split(' ')[0])*4} 
            animate={false}
            className="pixel-art"
          />
        </motion.div>
        
        {/* Orbiting pixels */}
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ 
              rotate: index * 90,
              x: 18
            }}
            style={{
              originX: -0.5,
              originY: 0.5
            }}
          >
            <motion.div 
              className="h-2 w-2 bg-minecraft-green"
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

  // Minecraft full screen loading screen with block background
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-minecraft-navy-dark/90 backdrop-blur-md flex flex-col items-center justify-center z-50 overflow-hidden">
        {/* Floating Minecraft blocks in background */}
        {blocks.map((block, index) => (
          <motion.div
            key={index}
            className={`absolute minecraft-${block.type}-bg opacity-10 border border-white/10`}
            style={{ 
              width: block.size, 
              height: block.size, 
              left: `${block.x}%`, 
              top: `${block.y}%`,
              transform: `rotate(${block.rotation}deg)`
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.1, 
              scale: 1,
              y: [0, -20, 0],
              rotate: [block.rotation, block.rotation + 5, block.rotation]
            }}
            transition={{
              delay: block.delay,
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Grid background animation */}
        <div className="absolute inset-0 minecraft-grid-bg opacity-10"></div>
        
        {/* Center loading indicator */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Spinner />
          </motion.div>
          
          <motion.div
            className="glass-panel border-2 border-black p-4 shadow-minecraft relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex flex-col items-center">
              <h3 className="font-minecraft text-minecraft-green minecraft-text-shadow text-lg mb-1">
                LOADING WORLD
              </h3>
              <p className="text-gray-200 text-sm font-mono mb-4">{text}{dots}</p>
              
              {/* Progress bar styled like Minecraft */}
              <div className="w-64 h-4 bg-gray-800 border-2 border-black shadow-inner relative overflow-hidden">
                <motion.div 
                  className="h-full bg-minecraft-green"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Adding pixel-style loading effect */}
                  <motion.div
                    className="absolute top-0 h-full right-0 w-2 bg-white/30"
                    animate={{ x: [10, -300] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
              
              <p className="mt-4 text-xs text-gray-400 italic">
                Preparing awesome Minecraft experience...
              </p>
            </div>
            
            {/* Pixel corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-minecraft-green translate-x-[-50%] translate-y-[-50%] rotate-45"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-minecraft-green translate-x-[50%] translate-y-[-50%] rotate-45"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-minecraft-green translate-x-[-50%] translate-y-[50%] rotate-45"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-minecraft-green translate-x-[50%] translate-y-[50%] rotate-45"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Inline loading spinner
  return (
    <div className="flex items-center justify-center py-1">
      <div className="mr-2">
        <Spinner />
      </div>
      {text && (
        <p className="text-white font-minecraft text-sm minecraft-text-shadow">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;