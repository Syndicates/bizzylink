import React, { useState } from 'react';
import MinecraftPlayerHead from '../MinecraftPlayerHead';

// Bizzy head configuration
const bizzyHead = {
  username: 'heyimbusy',
  message: 'Hey, I\'m Bizzy! Welcome to my Minecraft server!',
  messages: [
    'Want to see cool builds! 🏠',
    'Check out new profiles! 👤',
    'Explore post feeds now! 📱',
    'Discover server map! 🗺️',
    'View leaderboard now! 🏆',
    'Get real-time updates! ⚡',
    'Join our community! 🌟',
    'Stay tuned for more! 🔔',
    'Follow for latest news! 📰',
    'Join us for perks! 🎁',
    'Join Discord today! 💬',
    'Follow on social! 📲',
    'Thanks for support! ❤️',
  ],
  size: 64,
  position: { top: '0', left: '0' },
  translateX: '0',
  translateY: '0',
  rotate: '0deg',
  zIndex: 10,
  isFeatured: true
};

const socialLinks = [
  {
    name: 'TT',
    url: 'https://www.tiktok.com/@bizzynation',
    handle: 'bizzynation',
    color: 'bg-[#EE1D52]/20',
    border: 'border-[#EE1D52]/40',
    icon: (
      <svg className="w-6 h-6 text-[#EE1D52]" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
    ),
    cta: 'Follow',
    ctaColor: 'bg-[#EE1D52] text-white',
  },
  {
    name: 'YT',
    url: 'https://www.youtube.com/@bizzys',
    handle: 'bizzys',
    color: 'bg-[#FF0000]/20',
    border: 'border-[#FF0000]/40',
    icon: (
      <svg className="w-6 h-6 text-[#FF0000]" fill="currentColor" viewBox="0 0 576 512"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
    ),
    cta: 'Subscribe',
    ctaColor: 'bg-[#FF0000] text-white',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/bizzynation',
    handle: 'discord.gg/bizzynation',
    color: 'bg-[#5865F2]/20',
    border: 'border-[#5865F2]/40',
    icon: (
      <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 640 512"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"/></svg>
    ),
    cta: 'Join',
    ctaColor: 'bg-[#5865F2] text-white',
  },
];

const getRandomMessage = (messages) => {
  // Find the max length
  const maxLen = Math.max(...messages.map(m => m.length));
  // Pad all messages to the same length with spaces (for visual consistency)
  return messages[Math.floor(Math.random() * messages.length)].padEnd(maxLen, ' ');
};

const HeroSocialStats = () => {
  const [currentMessage, setCurrentMessage] = useState(getRandomMessage(bizzyHead.messages));

  // Cycle message every 6 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(getRandomMessage(bizzyHead.messages));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-3 sm:p-4 md:p-8 gap-2 overflow-visible">
      {/* MC head and speech bubble, both contained and aligned */}
      <div className="flex flex-col sm:flex-row items-start w-full mb-4 gap-2 sm:gap-3 max-w-full">
        <div className="flex-shrink-0 flex items-center justify-center" style={{ minWidth: 64, height: 64 }}>
          <img
            src={`https://mc-heads.net/avatar/heyimbusy/64`}
            alt="Bizzy Minecraft Head"
            title="Bizzy"
            className="rounded-sm shadow-lg border-2 border-gray-800 bg-black"
            style={{ width: 64, height: 64 }}
          />
        </div>
        {/* Divider line between head and speech bubble, hide on mobile */}
        <div className="hidden sm:block h-16 w-px bg-gray-300 mx-2" style={{ minHeight: 64 }}></div>
        <div className="flex-1 flex items-center min-w-0 mt-2 sm:mt-0">
          <div className="relative w-full max-w-full" style={{ height: 64, display: 'flex', alignItems: 'center' }}>
            <div
              className="bg-white border-2 border-gray-800 rounded-lg px-2 sm:px-4 py-2 sm:py-3 font-minecraft text-black text-base leading-snug shadow-md max-w-full flex items-center h-full whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ minHeight: 48 }}
            >
              {currentMessage}
            </div>
          </div>
        </div>
      </div>
      {/* Social links grid */}
      <div className="flex flex-col gap-2 sm:gap-3 mt-2 w-full max-w-full">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-full">
          {socialLinks.slice(0, 2).map(link => (
            <a
              key={link.name}
              href={link.url}
            target="_blank" 
            rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-between rounded-xl px-3 sm:px-4 py-2 sm:py-3 ${link.color} ${link.border} border transition-all hover:scale-[1.03] hover:shadow-lg group min-w-0`}
              style={{ minWidth: 0 }}
          >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {link.icon}
                <div className="flex flex-col min-w-0">
                  <span className="font-minecraft text-sm text-white leading-tight truncate">{link.name}</span>
                  <span className="text-xs text-gray-300 font-sans truncate">{link.handle}</span>
                </div>
              </div>
              <span className={`ml-2 sm:ml-4 px-2 py-1 rounded font-minecraft text-xs font-bold uppercase tracking-wider ${link.ctaColor} group-hover:scale-105 transition-all whitespace-nowrap`}>{link.cta}</span>
          </a>
          ))}
        </div>
          <a 
          href={socialLinks[2].url}
            target="_blank" 
            rel="noopener noreferrer"
          className={`flex items-center justify-between rounded-xl px-3 sm:px-4 py-2 sm:py-3 ${socialLinks[2].color} ${socialLinks[2].border} border transition-all hover:scale-[1.03] hover:shadow-lg group w-full`}
          >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {socialLinks[2].icon}
            <div className="flex flex-col min-w-0">
              <span className="font-minecraft text-sm text-white leading-tight truncate">{socialLinks[2].name}</span>
              <span className="text-xs text-gray-300 font-sans truncate">{socialLinks[2].handle}</span>
            </div>
          </div>
          <span className={`ml-2 sm:ml-4 px-2 py-1 rounded font-minecraft text-xs font-bold uppercase tracking-wider ${socialLinks[2].ctaColor} group-hover:scale-105 transition-all whitespace-nowrap`}>{socialLinks[2].cta}</span>
          </a>
      </div>
    </div>
  );
};

export default HeroSocialStats; 