import React, { useState } from 'react';
import useFYPFeed from '../hooks/useFYPFeed';
import FYPFilterBar from './FYPFilterBar';

const FYPFeed = () => {
  const [filter, setFilter] = useState('fyp');
  const { posts, loading, error, page, hasMore, setPage } = useFYPFeed(filter);

  return (
    <div>
      <FYPFilterBar filter={filter} setFilter={setFilter} />
      {/* ...rest of feed rendering logic, using posts, loading, error, etc... */}
    </div>
  );
};

export default FYPFeed; 