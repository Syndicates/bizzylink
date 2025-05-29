import React from 'react';
import { FiTrendingUp, FiUsers, FiClock } from 'react-icons/fi';

const FYPFilterBar = ({ filter, setFilter }) => {
  const filters = [
    { id: 'fyp', label: 'For You', icon: FiTrendingUp },
    { id: 'following', label: 'Following', icon: FiUsers },
    { id: 'newest', label: 'Newest', icon: FiClock }
  ];

  return (
    <div className="flex items-center gap-2 mb-6 border-b border-minecraft-navy-light w-full">
      {filters.map(({ id, label, icon: Icon }) => (
      <button
          key={id}
          onClick={() => setFilter(id)}
          className={`flex-1 flex items-center justify-center gap-2 px-0 py-2 font-minecraft text-base uppercase tracking-wide transition-all
            border-b-2 rounded-md
            ${filter === id
              ? 'border-minecraft-habbo-blue text-minecraft-habbo-blue font-bold bg-minecraft-navy-light shadow-md translate-y-[-2px]'
              : 'border-transparent text-minecraft-green hover:text-minecraft-habbo-blue hover:bg-minecraft-navy-light/70 hover:shadow'}`}
          style={{ cursor: 'pointer' }}
        >
          <Icon className={`w-5 h-5 ${filter === id ? 'text-minecraft-habbo-blue' : 'text-minecraft-green'}`} />
          <span>{label}</span>
      </button>
    ))}
  </div>
);
};

export default FYPFilterBar; 