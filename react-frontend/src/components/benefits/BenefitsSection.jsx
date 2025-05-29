import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import diamondIcon from '../../assets/images/minecraft-content/diamond.svg';
import emeraldIcon from '../../assets/images/minecraft-content/emerald.svg';
import chestIcon from '../../assets/images/minecraft-content/chest.svg';
import xpOrbIcon from '../../assets/images/minecraft-content/xp-orb.svg';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const benefitKeys = ['reward', 'stats', 'community', 'security'];

const BenefitsSection = () => {
  // State for toggling details
  const [openDetails, setOpenDetails] = useState({});
  // State for hover reveals
  const [hovered, setHovered] = useState({});
  // Ref for particles container
  const particlesRef = useRef(null);

  // Toggle details handler
  const handleToggle = (key) => {
    setOpenDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hover handlers
  const handleMouseEnter = (key) => {
    setHovered((prev) => ({ ...prev, [key]: true }));
  };
  const handleMouseLeave = (key) => {
    setHovered((prev) => ({ ...prev, [key]: false }));
  };

  // Particle effect
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.classList.add('minecraft-particle');
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = Math.random() * 3 + 1;
      const colors = ['#54aa54', '#3a873a', '#7bba3c', '#79c05a', '#fff', '#80c71f'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${left}%`;
      particle.style.top = `${top}%`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      particle.style.animation = `float ${duration}s ${delay}s infinite ease-in-out`;
      container.appendChild(particle);
    }
  }, []);

  // Styles for Minecraft blocks and particles
  const style = `
    .minecraft-ore-block { width: 24px; height: 24px; border: 2px solid rgba(0,0,0,0.3); }
    .minecraft-ore-block.diamond { background-color: #29ACBF; box-shadow: 0 0 10px #29ACBF; }
    .minecraft-ore-block.emerald { background-color: #00A82B; box-shadow: 0 0 10px #00A82B; }
    .minecraft-item-frame { width: 48px; height: 48px; background-color: rgba(0,0,0,0.3); border: 2px solid rgba(84, 170, 84, 0.3); display: flex; align-items: center; justify-content: center; border-radius: 4px; }
    .minecraft-particle { position: absolute; opacity: 0.7; border-radius: 0; pointer-events: none; }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(10deg); } }
    .hover-reveal { transition: opacity 0.3s ease; z-index: 10; }
  `;

  return (
    <section className="py-16 relative minecraft-dirt-bg overflow-hidden">
      <style>{style}</style>
      <div className="absolute inset-0 bg-minecraft-navy/80"></div>
      {/* Floating Minecraft particles effect */}
      <div className="absolute inset-0 pointer-events-none minecraft-particles" ref={particlesRef} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10">
          <motion.div
            className="inline-block relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {/* Diamond ore decoration */}
            <div className="absolute -top-8 -left-8 minecraft-ore-block diamond hidden md:block"></div>
            <h2 className="text-4xl font-minecraft text-minecraft-green minecraft-text-shadow">
              Premium Benefits
            </h2>
            {/* Emerald ore decoration */}
            <div className="absolute -top-8 -right-8 minecraft-ore-block emerald hidden md:block"></div>
          </motion.div>
          <motion.p 
            className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Linking your Minecraft account unlocks a treasure chest of exclusive features
          </motion.p>
        </div>
        {/* Interactive benefit display - reworked for better alignment */}
        <div className="flex justify-center mb-16">
          {/* Benefits cards with improved alignment */}
          <div className="w-full max-w-4xl space-y-4">
            {/* Rewards Benefit Card */}
            <motion.div
              className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
              id="rewards-benefit"
              onMouseEnter={() => handleMouseEnter('reward')}
              onMouseLeave={() => handleMouseLeave('reward')}
            >
              {/* Easter egg: Hidden chest loot that appears on hover */}
              <div className="absolute -right-4 -top-4 transition-opacity duration-300 hover-reveal" style={{ opacity: hovered['reward'] ? 1 : 0 }}>
                <img src={diamondIcon} alt="Diamond" className="w-8 h-8 animate-bounce" />
              </div>
              <div className="flex items-start">
                <div className="minecraft-item-frame mr-5 flex-shrink-0">
                  <img src={chestIcon} alt="Chest" className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-minecraft text-minecraft-green mb-2">EXCLUSIVE REWARDS</h3>
                  <div className="minecraft-tooltip-container">
                    <p className="text-gray-300 mb-3">Link your account to receive special in-game items, currency bonuses, and unique cosmetics unavailable to unlinked players.</p>
                    {/* Expandable loot list */}
                    <div className={`bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 ${openDetails['reward'] ? '' : 'hidden'} reward-details`}>
                      <h4 className="text-white font-minecraft text-sm mb-2">POSSIBLE REWARDS:</h4>
                      <ul className="text-sm text-gray-300">
                        <li className="flex items-center mb-1">
                          <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                          <span>Daily login bonuses (5 diamonds/week)</span>
                        </li>
                        <li className="flex items-center mb-1">
                          <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                          <span>Exclusive Bizzy's custom armor skin</span>
                        </li>
                        <li className="flex items-center mb-1">
                          <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                          <span>Special chat prefix [LINKED]</span>
                        </li>
                        <li className="flex items-center">
                          <div className="w-1 h-1 bg-minecraft-green mr-2"></div>
                          <span className="text-yellow-400">Mystery bonus items</span>
                        </li>
                      </ul>
                    </div>
                    <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center reward-toggle" onClick={() => handleToggle('reward')}>
                      <span>{openDetails['reward'] ? 'Hide details' : 'Show reward details'}</span>
                      <ChevronRightIcon className="ml-1 h-4 w-4 reward-arrow" style={{ transform: openDetails['reward'] ? 'rotate(90deg)' : 'rotate(0)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Statistics Benefit Card */}
            <motion.div
              className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
              id="stats-benefit"
              onMouseEnter={() => handleMouseEnter('stats')}
              onMouseLeave={() => handleMouseLeave('stats')}
            >
              {/* Easter egg: Animated XP orbs */}
              <div className="absolute -right-4 -top-4 transition-opacity duration-300 hover-reveal" style={{ opacity: hovered['stats'] ? 1 : 0 }}>
                <img src={xpOrbIcon} alt="XP Orb" className="w-8 h-8 animate-ping" />
              </div>
              <div className="flex items-start">
                <div className="minecraft-item-frame mr-5 flex-shrink-0">
                  <img src={xpOrbIcon} alt="XP Orb" className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-minecraft text-minecraft-green mb-2">PLAYER STATISTICS</h3>
                  <div>
                    <p className="text-gray-300 mb-3">Track your complete gameplay statistics through our web dashboard. Monitor your achievements, playtime, and server rankings.</p>
                    {/* Mini stat dashboard preview */}
                    <div className={`bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 ${openDetails['stats'] ? '' : 'hidden'} stats-details`}>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                          <div className="text-xs text-gray-400">BLOCKS MINED</div>
                          <div className="text-white font-minecraft">14,382</div>
                        </div>
                        <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                          <div className="text-xs text-gray-400">PLAYER KILLS</div>
                          <div className="text-white font-minecraft">267</div>
                        </div>
                        <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                          <div className="text-xs text-gray-400">PLAYTIME</div>
                          <div className="text-white font-minecraft">128h 22m</div>
                        </div>
                        <div className="flex flex-col items-center bg-black/30 p-2 rounded">
                          <div className="text-xs text-gray-400">SERVER RANK</div>
                          <div className="text-yellow-400 font-minecraft">#42</div>
                        </div>
                      </div>
                    </div>
                    <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center stats-toggle" onClick={() => handleToggle('stats')}>
                      <span>{openDetails['stats'] ? 'Hide details' : 'View sample statistics'}</span>
                      <ChevronRightIcon className="ml-1 h-4 w-4 stats-arrow" style={{ transform: openDetails['stats'] ? 'rotate(90deg)' : 'rotate(0)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Community Benefit Card */}
            <motion.div
              className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
              id="community-benefit"
              onMouseEnter={() => handleMouseEnter('community')}
              onMouseLeave={() => handleMouseLeave('community')}
            >
              {/* Easter egg: Animate community icon */}
              <div className="absolute -right-4 -top-4 transition-opacity duration-300 hover-reveal" style={{ opacity: hovered['community'] ? 1 : 0 }}>
                <img src={emeraldIcon} alt="Emerald" className="w-8 h-8 animate-spin" />
              </div>
              <div className="flex items-start">
                <div className="minecraft-item-frame mr-5 flex-shrink-0">
                  <img src={emeraldIcon} alt="Emerald" className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-minecraft text-minecraft-green mb-2">COMMUNITY ACCESS</h3>
                  <div>
                    <p className="text-gray-300 mb-3">Join exclusive community events, participate in voting for server features, and get early access to new content updates.</p>
                    {/* Upcoming events calendar */}
                    <div className={`bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 ${openDetails['community'] ? '' : 'hidden'} community-details`}>
                      <h4 className="text-white font-minecraft text-sm mb-2">UPCOMING EVENTS:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="bg-black/30 p-2 rounded">
                          <div className="text-yellow-400 font-minecraft mb-1">SATURDAY</div>
                          <div className="text-gray-300">Bizzy's Weekly Build Battle (6PM EST)</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <div className="text-yellow-400 font-minecraft mb-1">SUNDAY</div>
                          <div className="text-gray-300">PvP Tournament - Diamond Rewards</div>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <div className="text-yellow-400 font-minecraft mb-1">WEDNESDAY</div>
                          <div className="text-gray-300">New Content Vote (Members Only)</div>
                        </div>
                      </div>
                    </div>
                    <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center community-toggle" onClick={() => handleToggle('community')}>
                      <span>{openDetails['community'] ? 'Hide details' : 'See upcoming events'}</span>
                      <ChevronRightIcon className="ml-1 h-4 w-4 community-arrow" style={{ transform: openDetails['community'] ? 'rotate(90deg)' : 'rotate(0)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Security Benefit Card */}
            <motion.div
              className="bg-black/60 border-2 border-minecraft-green/40 rounded-lg p-6 relative hover:shadow-lg hover:shadow-minecraft-green/20 transition-shadow"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01 }}
              id="security-benefit"
              onMouseEnter={() => handleMouseEnter('security')}
              onMouseLeave={() => handleMouseLeave('security')}
            >
              {/* Easter egg: Security lock animation */}
              <div className="absolute -right-4 -top-4 transition-opacity duration-300 hover-reveal" style={{ opacity: hovered['security'] ? 1 : 0 }}>
                <img src={diamondIcon} alt="Diamond" className="w-8 h-8 animate-pulse" />
              </div>
              <div className="flex items-start">
                <div className="minecraft-item-frame mr-5 flex-shrink-0">
                  <img src={diamondIcon} alt="Diamond" className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-minecraft text-minecraft-green mb-2">SECURE IDENTITY</h3>
                  <div>
                    <p className="text-gray-300 mb-3">Protect your Minecraft identity with our secure linking system. Prevent impersonation and secure your in-game progress and items.</p>
                    {/* Security features */}
                    <div className={`bg-black/40 border border-minecraft-green/30 p-3 rounded mt-3 ${openDetails['security'] ? '' : 'hidden'} security-details`}>
                      <h4 className="text-white font-minecraft text-sm mb-2">SECURITY FEATURES:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="bg-black/30 p-2 rounded flex items-start">
                          <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                          <span className="text-gray-300 text-sm">Two-factor authentication for important actions</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded flex items-start">
                          <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                          <span className="text-gray-300 text-sm">Automatic IP verification</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded flex items-start">
                          <div className="w-1 h-1 bg-minecraft-green mr-2 mt-2"></div>
                          <span className="text-gray-300 text-sm">Unique verification codes for each login</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-minecraft-green text-sm hover:underline mt-1 flex items-center security-toggle" onClick={() => handleToggle('security')}>
                      <span>{openDetails['security'] ? 'Hide details' : 'View security features'}</span>
                      <ChevronRightIcon className="ml-1 h-4 w-4 security-arrow" style={{ transform: openDetails['security'] ? 'rotate(90deg)' : 'rotate(0)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Call to action */}
        <div className="text-center mt-10">
          <motion.div
            className="relative inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Animated glow effect behind button */}
            <div className="absolute inset-0 bg-minecraft-green/20 rounded-lg filter blur-md animate-pulse"></div>
            <div className="btn-3d relative">
              <a 
                href="/register" 
                className="minecraft-btn rounded-md px-10 py-4 text-xl font-minecraft inline-flex items-center"
              >
                <span>CLAIM YOUR BENEFITS</span>
                <ChevronRightIcon className="ml-2 h-6 w-6" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection; 