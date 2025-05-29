import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const MinecraftPlayerHead = ({ player, delay }) => {
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(player.message);
  const [showMessage, setShowMessage] = useState(true);
  const [showSpeechBubble, setShowSpeechBubble] = useState(player.username === 'n0t_awake');
  const [easterEggActivated, setEasterEggActivated] = useState(false);

  useEffect(() => {
    if (player.username !== 'n0t_awake') {
      setShowSpeechBubble(isHovered);
    }
  }, [isHovered, player.username]);

  useEffect(() => {
    if (player.username === 'n0t_awake' && player.messages) {
      setCurrentMessage(player.messages[0]);
      setShowMessage(true);
      const messageInterval = setInterval(() => {
        setShowMessage(false);
        setTimeout(() => {
          if (easterEggActivated) {
            const easterEggMessages = [
              "You found the Easter egg! Nice click!",
              "Secret message unlocked! You're awesome!",
              "Bizzy's secret: I love building redstone contraptions!",
              "Psst! The best ore is definitely emerald!",
              "Hidden fact: I once built a 1:1 scale castle!"
            ];
            const randomIndex = Math.floor(Math.random() * easterEggMessages.length);
            setCurrentMessage(easterEggMessages[randomIndex]);
          } else {
            const randomIndex = Math.floor(Math.random() * player.messages.length);
            const newMessage = player.messages[randomIndex];
            setCurrentMessage(newMessage);
          }
          setShowMessage(true);
        }, 800);
      }, 6000);
      return () => clearInterval(messageInterval);
    }
  }, [player.username, player.messages, easterEggActivated]);

  const getSpeechBubblePosition = () => {
    const username = player.username;
    if (username === 'n0t_awake') {
      return { 
        left: 'auto', 
        right: '90px',
        top: '-40px',
        transform: 'none',
        zIndex: 60
      };
    } else if (username === 'Notch') {
      return { 
        left: '55px', 
        right: 'auto',
        top: '5px',
        zIndex: 41
      };
    } else if (player.position.right) {
      return { 
        left: 'auto', 
        right: `${player.size + 10}px`,
        top: '5px',
        zIndex: player.zIndex + 1
      };
    } else {
      return { 
        left: `${player.size + 10}px`, 
        right: 'auto',
        top: '5px',
        zIndex: player.zIndex + 1
      };
    }
  };

  const speechBubblePosition = getSpeechBubblePosition();

  const getArrowPosition = () => {
    const username = player.username;
    if (username === 'n0t_awake') {
      return { 
        left: '50%',
        right: 'auto', 
        bottom: '-10px',
        top: 'auto',
        marginLeft: '-10px',
        transform: 'rotate(45deg)'
      };
    } else if (player.position.right) {
      return { 
        left: 'auto', 
        right: '-6px',
        top: '15px',
        transform: 'rotate(-45deg)'
      };
    } else {
      return { 
        right: 'auto',
        left: '-6px', 
        top: '15px',
        transform: 'rotate(45deg)'
      };
    }
  };

  const arrowPosition = getArrowPosition();
  const textKey = player.username === 'n0t_awake' ? `message-${currentMessage}` : `message-${player.message}`;

  return (
    <motion.div 
      className={player.username === 'n0t_awake' ? "absolute z-[100]" : "absolute"}
      style={{ 
        top: player.position.top, 
        left: player.position.left,
        right: player.position.right,
        transform: `translate(${player.translateX || '0'}, ${player.translateY || '0'})${player.rotate ? ` rotate(${player.rotate})` : ''}`,
        zIndex: player.zIndex || 1
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        ...player.animation
      }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        ...player.transition
      }}
      whileHover={{ scale: 1.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Player Head */}
        <img 
          src={`https://mc-heads.net/avatar/${player.username}/${player.size || 40}`} 
          alt={`${player.username}'s Minecraft head`} 
          className="rounded-sm shadow-lg"
          style={{ 
            border: player.username === 'n0t_awake' ? '4px solid lime' : '2px solid rgba(84, 170, 84, 0.5)',
            minWidth: `${player.size || 40}px`,
            minHeight: `${player.size || 40}px`,
            backgroundColor: 'rgba(20, 20, 20, 0.3)'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => setImageError(true)}
        />
        {imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-sm"
            style={{ 
              width: `${player.size || 40}px`, 
              height: `${player.size || 40}px` 
            }}
          >
            <span className="text-xs text-white">Error</span>
          </div>
        )}
        <AnimatePresence>
          {showSpeechBubble && (
            <>
              <motion.div 
                className={`speech-bubble absolute bg-white rounded-lg border-2 border-gray-800 shadow-lg font-minecraft 
                  ${player.username === 'n0t_awake' ? 'text-md p-4' : 'text-sm p-3'} z-20`}
                style={{
                  width: player.username === 'n0t_awake' ? '380px' : '220px',
                  maxWidth: '90vw',
                  ...speechBubblePosition,
                  color: 'black',
                  fontWeight: '600',
                  textShadow: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                }}
                onClick={() => {
                  if (player.username === 'n0t_awake') {
                    setEasterEggActivated(!easterEggActivated);
                    const bubble = document.querySelector('.speech-bubble');
                    if (bubble) {
                      bubble.style.transform = 'scale(1.05)';
                      setTimeout(() => {
                        bubble.style.transform = 'scale(1)';
                      }, 200);
                    }
                  }
                }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ 
                  opacity: showMessage ? 1 : 0, 
                  scale: showMessage ? 1 : 0.9, 
                  y: showMessage ? 0 : 10,
                  transition: { duration: 0.8 }
                }}
                exit={{ opacity: 0, scale: 0.8, y: 10, transition: { duration: 0.5 } }}
              >
                <div className="text-black font-medium" style={{ minHeight: '1.5em' }}>
                  <motion.span
                    key={textKey}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    {player.username === 'n0t_awake' ? currentMessage : player.message}
                  </motion.span>
                </div>
                {easterEggActivated && player.username === 'n0t_awake' && (
                  <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500">
                    Easter egg mode activated! Click again to return to normal messages.
                  </div>
                )}
              </motion.div>
              {player.username !== 'n0t_awake' && (
                <motion.div 
                  className="absolute w-4 h-4 bg-white border-l-2 border-b-2 border-gray-800" 
                  style={arrowPosition}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                ></motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MinecraftPlayerHead; 