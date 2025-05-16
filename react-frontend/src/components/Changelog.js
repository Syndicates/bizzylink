import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Mock changelog entries
const CHANGELOG_ENTRIES = [
  {
    version: "1.5.0",
    date: "March 1, 2025",
    title: "Major Dashboard Update & New Features",
    changes: [
      "Added Server Map with live DynMap integration",
      "Implemented new Shop system with various item categories",
      "Added Auction House feature for player-to-player trading",
      "Improved dashboard UI with Habbo-inspired design elements",
      "Added persistent link code generation with countdown timer",
      "Fixed multiple bugs in profile system"
    ],
    type: "major"
  },
  {
    version: "1.4.2",
    date: "February 20, 2025",
    title: "Performance Improvements",
    changes: [
      "Optimized server performance for better response times",
      "Fixed issues with account linking process",
      "Improved mobile responsiveness"
    ],
    type: "minor"
  },
  {
    version: "1.4.1",
    date: "February 10, 2025",
    title: "Bug Fixes",
    changes: [
      "Fixed authentication token expiration issues",
      "Resolved problems with profile data not loading correctly",
      "Fixed visual bugs in dark mode"
    ],
    type: "patch"
  },
  {
    version: "1.4.0",
    date: "January 15, 2025",
    title: "Profile Enhancements",
    changes: [
      "Added detailed player statistics on dashboard",
      "Implemented server status indicators",
      "Added friend management system",
      "Improved notification system"
    ],
    type: "major"
  },
  {
    version: "1.3.2",
    date: "December 30, 2024",
    title: "Winter Update",
    changes: [
      "Added festive winter theme",
      "Implemented seasonal events calendar",
      "Added winter-themed cosmetics"
    ],
    type: "minor"
  }
];

const Changelog = ({ maxHeight = "18rem", maxVisible = 3, showLatestByDefault = true }) => {
  const [expanded, setExpanded] = useState(showLatestByDefault);
  const [visibleCount, setVisibleCount] = useState(maxVisible);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleShowMore = () => {
    setVisibleCount(prevCount => prevCount + 3);
  };
  
  // Get entries to display based on current state
  const displayEntries = expanded ? CHANGELOG_ENTRIES.slice(0, visibleCount) : CHANGELOG_ENTRIES.slice(0, 1);
  const hasMore = expanded && visibleCount < CHANGELOG_ENTRIES.length;
  
  return (
    <div className="habbo-card overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center">
          <HistoryIcon className="h-5 w-5 text-minecraft-habbo-blue mr-3" />
          <h3 className="text-lg font-bold">Changelog</h3>
        </div>
        <button className="text-gray-400 hover:text-white">
          {expanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </button>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className={`p-4 space-y-4 overflow-y-auto ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
              {displayEntries.map((entry, index) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full mr-2 ${
                        entry.type === 'major' ? 'bg-minecraft-habbo-blue text-white' :
                        entry.type === 'minor' ? 'bg-minecraft-habbo-purple text-white' :
                        'bg-minecraft-habbo-orange text-white'
                      }`}>
                        v{entry.version}
                      </span>
                      <span className="text-sm text-gray-400">{entry.date}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-base font-medium mb-2">{entry.title}</h4>
                  
                  <ul className="space-y-1 pl-5 list-disc text-sm text-gray-300">
                    {entry.changes.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
              
              {hasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleShowMore}
                    className="habbo-btn text-sm py-1"
                  >
                    Show More
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Missing icon component
const HistoryIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Changelog;