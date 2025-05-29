import React, { useState, useEffect } from 'react';
import HeroLeaderboard from './HeroLeaderboard';
import TrendingPostsFeed from './HeroPostFeedPlaceholder';
import HeroSocialStats from './HeroSocialStats';
import HeroServerInfo from './HeroServerInfo';
import LatestNewsHero from '../LatestNewsHero';
import { InformationCircleIcon, ChevronDownIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Constants
const CONTAINER_MAX_WIDTH = '2560px';
const GRID_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Component: BetaAlert
function BetaAlert() {
  return (
    <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl shadow flex items-center gap-4 px-4 py-3 mb-2 w-full backdrop-blur-md">
      <div className="flex-shrink-0">
        <InformationCircleIcon className="h-7 w-7 text-blue-400" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-blue-300 text-base mb-0.5 font-sans tracking-wide">Beta Version</div>
        <div className="text-blue-100 text-sm font-sans">
          This is a <span className="font-semibold">beta</span> version of Bizzy Nation. Not everything is working properly yet. If you find a bug or something broken, please let Bizzy know!
        </div>
      </div>
      <a
        href="mailto:support@bizzynation.co.uk"
        className="ml-auto flex-shrink-0 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white font-semibold font-sans text-sm shadow transition active:scale-95"
        style={{ minWidth: '120px', textAlign: 'center' }}
      >
        Report a Bug
      </a>
    </div>
  );
}

// Component: ScrollIndicator
function ScrollIndicator() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 mt-10 z-20"
         style={{ top: '100%' }}>
      <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-full px-6 py-3 flex items-center gap-3 animate-fade-in"
           style={{ minWidth: 220, maxWidth: 340 }}>
        <span className="text-white font-semibold text-base md:text-lg tracking-wide drop-shadow-sm select-none">
          {scrolled ? "You're on your way!" : "Scroll down for more"}
        </span>
        <span className={`transition-all duration-500 flex items-center ${scrolled ? 'text-green-400 drop-shadow-glow' : 'text-white/80'}`}>
          {scrolled ? (
            <CheckIcon className="w-7 h-7 animate-scale-in" />
          ) : (
            <ChevronDownIcon className="w-7 h-7 animate-bounce-slow" />
          )}
        </span>
      </div>
    </div>
  );
}

// Component: HeroReleaseAlert
function HeroReleaseAlert() {
  return (
    <div className="w-full max-w-7xl mx-auto mb-6">
      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl px-6 py-4">
        <div className="flex-shrink-0">
          <SparklesIcon className="h-8 w-8 text-yellow-300 drop-shadow-glow" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg text-white mb-1 font-sans tracking-wide">BizzyNation Website Launch!</div>
          <div className="text-white/90 text-base font-sans">
            We're <span className="text-minecraft-green font-semibold">thrilled</span> to celebrate this major milestone with you. The new website is just the beginning—<span className="text-minecraft-habbo-blue font-semibold">loads of exciting updates</span> are coming soon to the server. <span className="text-minecraft-habbo-yellow font-semibold">Thank you for being part of our community!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: HeroColumn
function HeroColumn({ children, className = '' }) {
  return (
    <div className={`flex flex-col gap-6 items-stretch w-full h-full ${className}`}>
      {children}
    </div>
  );
}

// Main Component: HeroLayout
const HeroLayout = ({ serverStatus, serverStatusLoading, copyServerAddress, copySuccess }) => (
  <section
    id="hero"
    className="w-full min-h-screen overflow-hidden relative"
  >
    {/* Animated Gradient Background */}
    <div className="absolute inset-0 z-0 animate-gradient-move bg-[length:400%_400%] bg-gradient-to-br from-[#1a233a] via-[#3a2a4d] via-[#1e3a34] to-[#232c4a] opacity-90" style={{animation: 'gradientMove 18s ease-in-out infinite'}} />
    <style>{`
      @keyframes gradientMove {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `}</style>

    {/* Content */}
    <div className="relative z-10 max-w-[1800px] mx-auto px-12 py-8 md:py-12">
      {/* Release Alert */}
      <HeroReleaseAlert />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_auto] gap-12 mt-6 items-stretch justify-center mx-auto">
        {/* Left Column: Trending Posts */}
        <HeroColumn className="min-w-0 overflow-hidden max-w-[520px] flex flex-col gap-6">
          <TrendingPostsFeed />
        </HeroColumn>

        {/* Middle Column: Top Balances, Beta, Latest News */}
        <HeroColumn className="min-w-0 overflow-hidden max-w-[700px] flex flex-col gap-6">
          <HeroLeaderboard />
          <BetaAlert />
          <LatestNewsHero />
          <div className="mt-2 flex justify-center">
            <ScrollIndicator />
          </div>
        </HeroColumn>

        {/* Right Column: Social/Leaderboard Promo, Server Info */}
        <HeroColumn className="min-w-0 overflow-hidden max-w-[520px] flex flex-col gap-6">
          <div className="max-h-[340px] overflow-y-auto">
            <HeroSocialStats />
          </div>
          <HeroServerInfo
            serverStatus={serverStatus}
            serverStatusLoading={serverStatusLoading}
            copyServerAddress={copyServerAddress}
            copySuccess={copySuccess}
          />
        </HeroColumn>
      </div>
    </div>
  </section>
);

export default HeroLayout; 