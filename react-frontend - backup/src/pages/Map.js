import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ArrowPathIcon as RefreshIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Map = () => {
  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // DynMap URL
  const dynmapBaseUrl = 'https://map.bizzynation.co.uk';
  
  useEffect(() => {
    // Initialize map
    setMapUrl(`${dynmapBaseUrl}?worldname=world&mapname=flat&zoom=4`);
    setLoading(false);
    
    // Set up auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      refreshMap();
    }, 60000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Handle map refresh
  const refreshMap = () => {
    setLoading(true);
    // Force reload by adding a timestamp parameter
    setMapUrl(`${dynmapBaseUrl}?worldname=world&mapname=flat&zoom=4&ts=${Date.now()}`);
    setLastUpdated(new Date());
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className="min-h-screen py-8 minecraft-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <MapIcon className="h-8 w-8 text-minecraft-habbo-blue mr-4" />
            <h1 className="text-3xl font-minecraft text-minecraft-habbo-blue">Server Map</h1>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={refreshMap}
              className="habbo-btn flex items-center"
            >
              <RefreshIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button 
              onClick={toggleFullscreen}
              className="habbo-btn flex items-center"
            >
              {isFullscreen ? (
                <>
                  <ArrowsPointingInIcon className="h-5 w-5 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <ArrowsPointingOutIcon className="h-5 w-5 mr-2" />
                  Fullscreen
                </>
              )}
            </button>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className={`glass-panel p-4 ${isFullscreen ? 'fixed inset-0 z-50 p-4' : 'rounded-lg'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              {isFullscreen && (
                <button 
                  onClick={toggleFullscreen}
                  className="habbo-btn"
                >
                  Exit Fullscreen
                </button>
              )}
            </div>
            
            <div className="relative w-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                  <LoadingSpinner />
                </div>
              )}
              
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                {mapUrl && (
                  <iframe
                    src={mapUrl}
                    title="Minecraft Server Map"
                    className="w-full h-full border-0"
                    onLoad={() => setLoading(false)}
                  />
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="habbo-card p-4">
                <h3 className="text-lg font-bold mb-2">Map Controls</h3>
                <p className="text-sm text-gray-300">
                  • Mouse wheel to zoom in/out<br />
                  • Left click + drag to pan<br />
                  • Right click for more options
                </p>
              </div>
              
              <div className="habbo-card p-4">
                <h3 className="text-lg font-bold mb-2">Online Players</h3>
                <p className="text-sm text-gray-300">
                  Click on player icons on the map to see their information.
                </p>
              </div>
              
              <div className="habbo-card p-4">
                <h3 className="text-lg font-bold mb-2">Map Legend</h3>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span>Players</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Spawn</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span>Protected Areas</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Map;