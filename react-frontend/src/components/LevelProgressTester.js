import React, { useState } from 'react';
import LevelProgressBar from './LevelProgressBar';

const LevelProgressTester = () => {
  const [level, setLevel] = useState(54);
  const [experience, setExperience] = useState(54);
  
  return (
    <div className="p-4 bg-white/10 rounded-habbo my-6 border border-white/20">
      <h2 className="text-lg font-bold mb-4">Level Progress Tester</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-sm">
            Level:
            <input 
              type="range" 
              min="1" 
              max="400" 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-minecraft-habbo-blue">{level}</span>
          </label>
          
          <label className="block mb-2 text-sm mt-4">
            Experience %:
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={experience} 
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full mt-1"
            />
            <span className="text-minecraft-habbo-blue">{experience}%</span>
          </label>
          
          <div className="flex gap-4 mt-4">
            <button 
              className="habbo-btn py-1" 
              onClick={() => {
                setLevel(54);
                setExperience(54);
              }}
            >
              Set to 54
            </button>
            <button 
              className="habbo-btn py-1" 
              onClick={() => {
                setLevel(100);
                setExperience(100);
              }}
            >
              Set to 100
            </button>
            <button 
              className="habbo-btn py-1" 
              onClick={() => {
                setLevel(127);
                setExperience(0);
              }}
            >
              Set to 127
            </button>
            <button 
              className="habbo-btn py-1" 
              onClick={() => {
                setLevel(250);
                setExperience(50);
              }}
            >
              Set to 250
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-habbo">
          <p className="text-sm text-gray-400 mb-2">Progress Bar Preview:</p>
          <LevelProgressBar level={level} experience={experience} />
        </div>
      </div>
    </div>
  );
};

export default LevelProgressTester;