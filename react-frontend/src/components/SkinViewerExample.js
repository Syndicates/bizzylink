/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file SkinViewerExample.js
 * @description Example component demonstrating all available Minecraft skin viewing options
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import MinecraftAvatar from './MinecraftAvatar';
import MinecraftSkinViewer3D from './MinecraftSkinViewer3D';

const SkinViewerExample = () => {
  const [username, setUsername] = useState('Notch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Sample usernames that are known to work
  const sampleUsernames = ['Notch', 'jeb_', 'Dinnerbone', 'Grumm', 'Dream', 'Technoblade', 'heyimbusy'];
  
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setError(null);
  };
  
  const setRandomSample = () => {
    const randomUsername = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)];
    setUsername(randomUsername);
    setError(null);
  };

  // Define size presets for thumbnails
  const sizes = {
    xs: 32,
    sm: 50,
    md: 80,
    lg: 120,
    xl: 150,
    xxl: 200
  };
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Minecraft Skin Viewer Gallery</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-white">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Enter Minecraft Username:</label>
        <div className="flex flex-wrap gap-2">
          <input 
            type="text"
            value={username}
            onChange={handleUsernameChange}
            className="px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none flex-grow"
            placeholder="Minecraft username"
          />
          <button 
            onClick={setRandomSample}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Random Player
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-400">
          Try known Minecraft usernames like: {sampleUsernames.join(', ')}
        </div>
      </div>
      
      {/* Tabs for different categories */}
      <div className="flex border-b border-gray-700 mb-6">
        <button 
          className={`px-4 py-2 font-minecraft ${activeTab === 'basic' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Avatars
        </button>
        <button 
          className={`px-4 py-2 font-minecraft ${activeTab === '3d' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('3d')}
        >
          3D Models
        </button>
        <button 
          className={`px-4 py-2 font-minecraft ${activeTab === 'profile' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Cards
        </button>
        <button 
          className={`px-4 py-2 font-minecraft ${activeTab === 'special' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('special')}
        >
          Special Formats
        </button>
      </div>
      
      {/* Basic Avatars Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Standard Avatars (Various Sizes)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(sizes).map(([key, size]) => (
                <div key={key} className="text-center">
                  <MinecraftAvatar username={username} type="face" size={size} />
                  <p className="text-gray-300 mt-2">Face ({size}px)</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{`size={${size}}`}</p>
                </div>
              ))}
            </div>
          </section>
          
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Head Views</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MinecraftAvatar username={username} type="face" size={100} />
                <p className="text-gray-300 mt-2">Face (Front only)</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="face"`}</p>
              </div>
              <div className="text-center">
                <MinecraftAvatar username={username} type="head" size={100} />
                <p className="text-gray-300 mt-2">Head (All sides)</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="head"`}</p>
              </div>
              <div className="text-center">
                <MinecraftAvatar username={username} type="isometric" size={100} />
                <p className="text-gray-300 mt-2">Isometric</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="isometric"`}</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">External Service Avatars</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <img src={`https://mineskin.eu/avatar/${username}/100`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">MineSkin</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`mineskin.eu/avatar/{username}/size`}</p>
              </div>
              <div className="text-center">
                <img src={`https://mc-heads.net/avatar/${username}/100`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">MC-Heads</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`mc-heads.net/avatar/{username}/size`}</p>
              </div>
              <div className="text-center">
                <img src={`https://minotar.net/avatar/${username}/100.png`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">Minotar</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`minotar.net/avatar/{username}/size.png`}</p>
              </div>
            </div>
          </section>
        </div>
      )}
      
      {/* 3D Models Tab */}
      {activeTab === '3d' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">3D Avatars (Different Poses)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <MinecraftAvatar username={username} type="3d" size={150} />
                <p className="text-gray-300 mt-2">Idle Pose</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="3d"`}</p>
              </div>
              <div className="text-center">
                <MinecraftAvatar username={username} type="3d-walking" size={150} />
                <p className="text-gray-300 mt-2">Walking</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="3d-walking"`}</p>
              </div>
              <div className="text-center">
                <MinecraftAvatar username={username} type="3d-running" size={150} />
                <p className="text-gray-300 mt-2">Running</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="3d-running"`}</p>
              </div>
              <div className="text-center">
                <MinecraftAvatar username={username} type="3d-flying" size={150} />
                <p className="text-gray-300 mt-2">Flying</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`type="3d-flying"`}</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Advanced 3D Viewer (Larger Sizes)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <MinecraftSkinViewer3D 
                  username={username}
                  width={240}
                  height={320}
                  pose="idle"
                  rotate={true}
                />
                <p className="text-gray-300 mt-2">Idle with Rotation</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`pose="idle" rotate={true}`}</p>
              </div>
              <div className="text-center">
                <MinecraftSkinViewer3D 
                  username={username}
                  width={240}
                  height={320}
                  pose="running"
                  rotate={false}
                />
                <p className="text-gray-300 mt-2">Running (No Rotation)</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`pose="running" rotate={false}`}</p>
              </div>
            </div>
          </section>
        </div>
      )}
      
      {/* Profile Cards Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Profile Cards (Ready-to-Use Components)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simple Profile Card */}
              <div className="bg-gray-700 rounded-lg p-4 flex items-center space-x-4">
                <MinecraftAvatar username={username} type="face" size={80} />
                <div>
                  <h4 className="text-lg font-minecraft text-white">{username}</h4>
                  <p className="text-gray-300 text-sm">Minecraft Player</p>
                  <p className="text-xs mt-1 text-gray-400 font-mono">Simple Profile</p>
                </div>
              </div>
              
              {/* Advanced Profile Card */}
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-16"></div>
                <div className="p-4 -mt-10 relative">
                  <div className="absolute left-4 border-4 border-gray-700 rounded-md bg-gray-800">
                    <MinecraftAvatar username={username} type="3d" size={80} />
                  </div>
                  <div className="ml-24">
                    <h4 className="text-lg font-minecraft text-white">{username}</h4>
                    <p className="text-gray-300 text-sm">Diamond Rank</p>
                    <div className="flex mt-2 space-x-2">
                      <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-xs">Builder</span>
                      <span className="px-2 py-0.5 bg-green-600/30 text-green-300 rounded text-xs">Explorer</span>
                    </div>
                    <p className="text-xs mt-3 text-gray-400 font-mono">Advanced Profile</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Leaderboard & Forum Components</h3>
            
            <div className="space-y-4">
              {/* Leaderboard Row */}
              <div className="bg-gray-700 rounded-lg p-3 flex items-center">
                <div className="text-center w-10 mr-3">
                  <span className="text-2xl font-minecraft text-yellow-400">#1</span>
                </div>
                <MinecraftAvatar username={username} type="face" size={50} />
                <div className="ml-3 flex-grow">
                  <h4 className="text-white font-minecraft">{username}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Level 92</span>
                    <span className="text-green-400">9,876 points</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-mono ml-2">Leaderboard Row</p>
              </div>
              
              {/* Forum Post Header */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MinecraftAvatar username={username} type="3d" size={60} />
                  </div>
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between">
                      <h4 className="text-white font-minecraft">{username}</h4>
                      <span className="text-gray-400 text-sm">2 hours ago</span>
                    </div>
                    <p className="text-gray-300 mt-2">This is an example of a forum post with the user's 3D avatar displayed...</p>
                  </div>
                </div>
                <p className="text-xs text-right text-gray-400 font-mono mt-2">Forum Post</p>
              </div>
            </div>
          </section>
        </div>
      )}
      
      {/* Special Formats Tab */}
      {activeTab === 'special' && (
        <div className="space-y-8">
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">External API Special Renders</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Body */}
              <div className="text-center">
                <img src={`https://mc-heads.net/body/${username}/150`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">Full Body</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`mc-heads.net/body/{username}/size`}</p>
              </div>
              
              {/* Body with armor */}
              <div className="text-center">
                <img src={`https://mineskin.eu/armor/body/${username}/150`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">Body w/ Armor</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`mineskin.eu/armor/body/{username}/size`}</p>
              </div>
              
              {/* Bust */}
              <div className="text-center">
                <img src={`https://mc-heads.net/bust/${username}/150`} alt={username} className="mx-auto rounded-md" />
                <p className="text-gray-300 mt-2">Bust (Upper Body)</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{`mc-heads.net/bust/{username}/size`}</p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Creative Uses</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skin History Display */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-minecraft mb-3">Skin History</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <MinecraftAvatar 
                        username={sampleUsernames[i % sampleUsernames.length]} 
                        type="face" 
                        size={50} 
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-3">Skin History Timeline</p>
              </div>
              
              {/* Team Display */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-minecraft mb-3">Team Members</h4>
                <div className="flex justify-center gap-4 flex-wrap">
                  {sampleUsernames.slice(0, 4).map((name, i) => (
                    <div key={i} className="text-center">
                      <MinecraftAvatar 
                        username={name} 
                        type="3d" 
                        size={70} 
                      />
                      <p className="text-sm text-white mt-1">{name}</p>
                      <p className="text-xs text-gray-400">{["Owner", "Admin", "Mod", "Builder"][i]}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-mono mt-3">Team Display</p>
              </div>
            </div>
          </section>
        </div>
      )}
      
      <div className="mt-8 bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-lg text-white mb-2">Implementation Guide</h3>
        <div className="bg-gray-900 p-4 rounded-md overflow-x-auto">
          <pre className="text-xs text-gray-300">
{`// Basic 2D Avatars
<MinecraftAvatar username="${username}" type="face" size={64} />
<MinecraftAvatar username="${username}" type="head" size={100} />
<MinecraftAvatar username="${username}" type="isometric" size={80} />

// 3D Avatars
<MinecraftAvatar username="${username}" type="3d" size={150} />
<MinecraftAvatar username="${username}" type="3d-walking" size={150} />
<MinecraftAvatar username="${username}" type="3d-running" size={150} />
<MinecraftAvatar username="${username}" type="3d-flying" size={150} />

// Advanced 3D Viewer
<MinecraftSkinViewer3D 
  username="${username}"
  width={240}
  height={320}
  pose="running"
  rotate={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SkinViewerExample; 