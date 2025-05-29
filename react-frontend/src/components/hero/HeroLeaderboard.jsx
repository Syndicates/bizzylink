import React from 'react';
import { MinecraftService } from '../../services/api';

const HeroLeaderboard = () => {
  const [players, setPlayers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    MinecraftService.getLeaderboard('economy', 'all', 3)
      .then(res => {
        setPlayers(res.data?.data?.players?.slice(0, 3) || []);
        setError(null);
      })
      .catch(err => {
        setError('Could not load leaderboard');
        setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-48 w-full">
      <span className="text-minecraft-green font-minecraft">Loading...</span>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center h-48 w-full">
      <span className="text-red-400 font-minecraft">{error}</span>
    </div>
  );
  return (
    <div className="bg-black/60 border-2 border-blue-400/40 rounded-xl shadow-lg p-3 sm:p-6 flex flex-col items-center w-full">
      <div className="font-minecraft text-blue-300 text-base sm:text-lg mb-2">TOP BALANCES</div>
      <ol className="space-y-2 sm:space-y-3 w-full">
        {players.map((player, idx) => (
          <li key={player.uuid || player.username} className="flex items-center justify-between bg-black/20 rounded px-2 sm:px-4 py-2">
            <span className="font-minecraft text-sm sm:text-base text-minecraft-green flex items-center">
              <img src={`https://mc-heads.net/avatar/${player.mcUsername || player.username}/32`} alt={player.username} className="w-6 h-6 rounded mr-2" />
              {idx + 1}. {player.username}
            </span>
            <span className="font-minecraft text-base sm:text-lg text-yellow-300">${player.balance?.toLocaleString() || 0}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default HeroLeaderboard; 