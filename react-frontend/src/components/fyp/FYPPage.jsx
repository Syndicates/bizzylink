import React, { useState } from 'react';
import FYPFeed from './FYPFeed';
import FYPFilterBar from './FYPFilterBar';
import FeedSidebar from '../FeedSidebar';
import CreateFeedPost from './CreateFeedPost';
import { useAuth } from '../../contexts/AuthContext';

const FYPPage = () => {
  const [filter, setFilter] = useState('fyp');
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-minecraft-navy flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pt-8 px-4">
        {/* Left column (future mini-profile, nav, etc.) */}
        <div className="hidden md:block w-1/5">
          {/* Reserved for future */}
        </div>
        
        {/* Center column: Feed */}
        <div className="w-full md:w-3/5 flex flex-col">
          <FYPFilterBar filter={filter} setFilter={setFilter} />
          {isAuthenticated && <CreateFeedPost />}
          <FYPFeed filter={filter} />
        </div>
        
        {/* Right column: Sidebar */}
        <div className="hidden md:block w-1/5">
          <FeedSidebar />
        </div>
      </div>
    </div>
  );
};

export default FYPPage; 