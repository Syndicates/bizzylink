import { useState, useEffect } from 'react';
import minecraftApi from '../services/minecraft-api';

const useServerStatus = (serverAddress = 'play.bizzynation.co.uk') => {
  const [serverStatus, setServerStatus] = useState({
    online: true,
    playerCount: 0,
    maxPlayers: 100,
    version: '1.19.2',
    motd: '',
    players: [],
    lastUpdated: new Date()
  });
  const [serverStatusLoading, setServerStatusLoading] = useState(true);

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        setServerStatusLoading(true);
        const status = await minecraftApi.getServerStatus(serverAddress);
        setServerStatus(status);
      } catch (error) {
        console.error('Failed to fetch server status:', error);
      } finally {
        setServerStatusLoading(false);
      }
    };
    fetchServerStatus();
    const statusInterval = setInterval(fetchServerStatus, 120000);
    return () => clearInterval(statusInterval);
  }, [serverAddress]);

  return { serverStatus, serverStatusLoading };
};

export default useServerStatus; 