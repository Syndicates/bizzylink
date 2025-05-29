import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const HeroButtons = () => (
  <div className="flex flex-row space-x-4 justify-center mt-2 w-full">
    <div className="btn-3d transform hover:scale-105 transition">
      <Link to="/register" className="minecraft-btn rounded-md px-8 py-3 text-lg font-medium flex items-center justify-center">
        Get Started
        <ChevronRightIcon className="ml-2 h-5 w-5" />
      </Link>
    </div>
    <div className="btn-3d transform hover:scale-105 transition">
      <Link to="/login" className="habbo-btn rounded-md px-8 py-3 text-lg font-medium flex items-center justify-center">
        Login
      </Link>
    </div>
  </div>
);

export default HeroButtons; 