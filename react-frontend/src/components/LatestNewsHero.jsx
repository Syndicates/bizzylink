import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NewsService from '../services/NewsService';
// import MinecraftHead from './MinecraftHead'; // If you have a component for MC heads

const LatestNewsHero = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    NewsService.getNews({ limit: 5 })
      .then(data => {
        setNews(data.news || []);
        setError(null);
      })
      .catch(err => {
        setError('Failed to load news');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-lg text-gray-400">Loading latest news...</div>;
  if (error) return <div className="py-16 text-center text-red-500">{error}</div>;
  if (!news.length) return <div className="py-16 text-center text-gray-400">No news yet.</div>;

  const hero = news[0];
  const previous = news.slice(1, 5);

  return (
    <section className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="block w-1 h-5 bg-yellow-400 rounded-sm" />
        <h2 className="text-base font-minecraft text-cyan-300 tracking-wider">LATEST NEWS</h2>
      </div>
      {/* Hero News */}
      <Link to={`/news/${hero._id}`} className="block w-full">
        <div className="relative rounded-xl overflow-hidden mb-3 shadow-xl border border-white/20 bg-white/10 backdrop-blur-xl w-full" style={{ aspectRatio: '16/9', minHeight: 120, maxHeight: 180 }}>
          {/* Banner image as full-width background */}
          {hero.bannerType === 'custom' && hero.bannerImage && (
            <img
              src={hero.bannerImage}
              alt="News banner"
              className="absolute inset-0 w-full h-full object-cover object-center z-0"
              style={{ minHeight: 120, maxHeight: 180 }}
            />
          )}
          {hero.bannerType === 'head' && hero.bannerHeadUsername && (
            <img
              src={`https://mc-heads.net/avatar/${hero.bannerHeadUsername}/256`}
              alt={hero.bannerHeadUsername}
              className="absolute inset-0 w-full h-full object-cover object-center z-0"
              style={{ minHeight: 120, maxHeight: 180 }}
            />
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          {/* News content overlayed on image */}
          <div className="absolute left-0 bottom-0 z-20 p-3 w-full flex flex-col items-start">
            <h3 className="text-base font-bold text-white mb-0.5 line-clamp-1 drop-shadow-lg">{hero.title}</h3>
            <div className="text-xs text-white/80 mb-0.5 italic drop-shadow">
              {new Date(hero.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              {hero.summary && <span className="ml-2">| {hero.summary}</span>}
            </div>
            <div className="text-xs text-white/90 mb-0.5 line-clamp-1 drop-shadow">
              {hero.body?.slice(0, 60)}...
            </div>
            <span className="text-white font-bold mt-0.5 drop-shadow text-xs">{hero.author?.username || 'Bizzy'}</span>
          </div>
        </div>
      </Link>
      {/* Previous News */}
      <div className="grid grid-cols-2 gap-2 mt-1 w-full">
        {previous.map((item) => (
          <Link key={item._id} to={`/news/${item._id}`} className="block w-full">
            <div className="relative rounded-lg overflow-hidden shadow border border-white/20 bg-white/10 backdrop-blur-xl w-full" style={{ aspectRatio: '16/9', minHeight: 60, maxHeight: 90 }}>
              {/* Banner image covers the whole card */}
              {item.bannerType === 'custom' && item.bannerImage && (
                <img
                  src={item.bannerImage}
                  alt="News banner"
                  className="absolute inset-0 w-full h-full object-cover object-center z-0"
                  style={{ minHeight: 60, maxHeight: 90 }}
                />
              )}
              {item.bannerType === 'head' && item.bannerHeadUsername && (
                <img
                  src={`https://mc-heads.net/avatar/${item.bannerHeadUsername}/64`}
                  alt={item.bannerHeadUsername}
                  className="absolute inset-0 w-full h-full object-cover object-center z-0"
                  style={{ minHeight: 60, maxHeight: 90 }}
                />
              )}
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              {/* News content overlayed on image */}
              <div className="absolute left-0 bottom-0 z-20 p-2 w-full flex flex-col items-start">
                <h4 className="text-xs font-bold text-white mb-0.5 line-clamp-1 drop-shadow-lg">{item.title}</h4>
                <div className="text-[10px] text-white/80 mb-0.5 italic drop-shadow">
                  {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                  {item.summary && <span className="ml-1">| {item.summary}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default LatestNewsHero; 