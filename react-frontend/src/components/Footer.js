import React from 'react';
import { 
  GlobeAltIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  HeartIcon 
} from '@heroicons/react/24/outline';

/**
 * Footer component for the application
 * Contains links, social media connections, and a personal story
 */
const Footer = () => {
  const footerLinks = [
    { name: 'Home', href: '/' },
    { name: 'BizzyLink', href: '/bizzylink' },
    { name: 'About', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Server Rules', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ];

  const socialLinks = [
    { name: 'Discord', href: '#', icon: ChatBubbleLeftRightIcon },
    { name: 'Twitter', href: '#', icon: GlobeAltIcon },
    { name: 'Email', href: 'mailto:contact@bizzynation.co.uk', icon: EnvelopeIcon },
  ];

  return (
    <footer className="bg-minecraft-navy-dark border-t border-minecraft-green/20">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Personal story and Easter egg on the left */}
          <div className="space-y-4 md:col-span-7">
            <div className="text-sm">
              <h3 className="text-white font-bold text-lg mb-4 border-b border-minecraft-green/30 pb-2">My Minecraft Journey</h3>
              <p className="mb-4 text-gray-300 leading-relaxed">
                I've been captivated by Minecraft since I was young. What started as YouTube videos from my bedroom has grown into a passion for building communities. Minecraft has been a constant companion throughout my life, inspiring creativity and bringing people together.
              </p>
              <p className="mb-4 text-gray-300 leading-relaxed">
                I designed everything you see here myself—every button, every animation, every feature. I'm constantly thinking of new additions to make our server experience even better. Your suggestions matter to me; I'm always eager to hear what you think would make BizzyNation even more incredible.
              </p>
              <p className="mb-4 text-gray-300 leading-relaxed">
                Building the ultimate Minecraft community isn't just a project for me—it's a mission to create something special where everyone feels welcome. When you join our server, you're joining a family of like-minded creators and adventurers.
              </p>
              <p 
                className="text-center my-5 italic text-gray-400 cursor-pointer hover:text-minecraft-green transition-colors duration-300 border-t border-gray-700 pt-4" 
                id="interstellar-quote"
                onClick={() => {
                  const overlay = document.createElement('div');
                  overlay.className = 'fixed inset-0 bg-black z-[999] flex items-center justify-center opacity-0 transition-opacity duration-1000';
                  document.body.appendChild(overlay);
                  
                  // Fade to black
                  setTimeout(() => {
                    overlay.style.opacity = '1';
                  }, 100);
                  
                  // Show firework after fade completes
                  setTimeout(() => {
                    const firework = document.createElement('div');
                    firework.className = 'firework';
                    overlay.appendChild(firework);
                    
                    // Create explosion particles
                    for (let i = 0; i < 50; i++) {
                      const particle = document.createElement('div');
                      particle.className = 'particle';
                      const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
                      particle.style.backgroundColor = color;
                      particle.style.boxShadow = `0 0 6px 2px ${color}`;
                      particle.style.left = '50%';
                      particle.style.top = '50%';
                      particle.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
                      
                      // Random particle animation
                      const angle = Math.random() * Math.PI * 2;
                      const speed = 2 + Math.random() * 4;
                      const size = 2 + Math.random() * 5;
                      
                      particle.style.width = `${size}px`;
                      particle.style.height = `${size}px`;
                      
                      // Add keyframe animation dynamically
                      particle.animate([
                        { transform: 'translate(-50%, -50%)' },
                        { 
                          transform: `translate(calc(-50% + ${Math.cos(angle) * 100 * speed}px), calc(-50% + ${Math.sin(angle) * 100 * speed}px))`,
                          opacity: 0
                        }
                      ], {
                        duration: 1000 + Math.random() * 1000,
                        easing: 'cubic-bezier(0,.9,.57,1)',
                        fill: 'forwards'
                      });
                      
                      firework.appendChild(particle);
                    }
                  }, 1000);
                  
                  // Remove overlay after animation completes
                  setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                      document.body.removeChild(overlay);
                    }, 1000);
                  }, 3000);
                }}
              >
                "Do not go gentle into that good night..."
              </p>
            </div>
          </div>
          
          {/* Links sections on the right */}
          <div className="md:col-span-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quick Links */}
              <div>
                <h3 className="text-white font-bold mb-4 border-b border-minecraft-green/30 pb-2">Quick Links</h3>
                <ul className="space-y-2">
                  {footerLinks.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href} 
                        className="text-gray-400 hover:text-minecraft-green transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Social links */}
              <div>
                <h3 className="text-white font-bold mb-4 border-b border-minecraft-green/30 pb-2">Connect With Us</h3>
                <ul className="space-y-2">
                  {socialLinks.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href} 
                        className="flex items-center text-gray-400 hover:text-minecraft-green transition-colors duration-200"
                      >
                        <link.icon className="h-5 w-5 mr-2" />
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 BizzyLink. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-gray-400 text-sm flex items-center">
              Made with <HeartIcon className="h-4 w-4 mx-1 text-minecraft-habbo-red" /> for the Minecraft community
            </span>
          </div>
        </div>
      </div>

      {/* Add CSS for the firework effect */}
      <style>{`
        .firework {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          z-index: 1000;
        }
      `}</style>
    </footer>
  );
};

export default Footer; 