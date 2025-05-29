import React, { useEffect, useState } from 'react';
import PostCard from '../../components/PostCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const TrendingPostsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    api.get('/api/wall/fyp?sort=likes&limit=3')
      .then(res => {
        setPosts(res.data.posts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load trending posts:', err);
        setError('Failed to load trending posts. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Fetch member count
  useEffect(() => {
    api.get('/api/user/count')
      .then(res => {
        setMemberCount(res.data.count);
      })
      .catch(err => {
        console.error('Failed to fetch member count:', err);
      });
  }, []);

  if (loading) return <div className="text-gray-400 text-center py-8">Loading trending posts...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (!posts.length) return <div className="text-gray-400 text-center py-8">No trending posts yet.</div>;

  return (
    <div className="w-full flex flex-col h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-4 md:p-6">
      <div className="flex items-center gap-2 mb-2 sm:mb-4">
        <span className="block w-1.5 h-6 rounded bg-minecraft-habbo-blue shadow-glow"></span>
        <h2 className="px-3 py-1 rounded-lg bg-white/10 font-minecraft text-minecraft-habbo-blue text-base sm:text-lg tracking-wide shadow">
          Trending Posts
        </h2>
      </div>
      <div className="flex flex-col gap-1 sm:gap-2 flex-1">
        {posts.slice(0, 2).map(post => (
          <PostCard key={post._id} post={post} />
        ))}
        {posts[2] && (
          <div className="relative max-h-28 overflow-hidden rounded-xl">
            <PostCard post={posts[2]} />
            {/* Modern fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 flex items-end justify-center pointer-events-none rounded-b-xl"
                 style={{
                   background: 'linear-gradient(180deg, rgba(71,64,90,0) 40%, rgba(71,64,90,0.15) 65%, rgba(71,64,90,0.35) 80%, rgba(58,51,74,0.7) 95%, #3a334a 100%)'
                 }}>
              <div className="w-full flex justify-center pb-3 pointer-events-auto">
                <Link
                  to={isAuthenticated ? "/fyp" : "/register"}
                  className="px-4 py-1.5 bg-minecraft-green text-minecraft-dark font-minecraft font-bold text-base rounded-md border-2 border-minecraft-green shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-minecraft-green/90 hover:shadow-lg active:scale-95 transition-all text-center tracking-wide"
                >
                  Read More
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Community message directly below posts */}
      <div className="mb-9 flex items-center gap-3 text-base text-gray-100 bg-[#2d2540] border border-[#4a3a6a] rounded-xl px-4 py-3 shadow">
        <svg className="w-5 h-5 text-[#4a90e2] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01"/></svg>
        <span>
          {memberCount ? (
            <>
              Join <span className="inline-block align-middle bg-[#201a2e] rounded-md px-2 py-0.5 shadow text-minecraft-green font-minecraft font-bold text-sm mx-1">{memberCount.toLocaleString()}</span> registered members! Gain followers, write posts, customize your profile, set up meetups, and trade claims, houses, or items—all in one place.
            </>
          ) : (
            <>Join BizzyNation! Gain followers, write posts, customize your profile, set up meetups, and trade claims, houses, or items—all in one place.</>
          )}
        </span>
      </div>
      {/* View More and Login buttons below the message */}
      <div className="mt-2 sm:mt-1 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full items-center justify-start">
        <Link
          to="/fyp"
          className="w-full sm:flex-1 bg-minecraft-green text-minecraft-dark font-minecraft font-bold text-base rounded-md px-5 py-2 flex items-center justify-center gap-2 border-2 border-minecraft-green shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-minecraft-green/90 hover:shadow-lg active:scale-95 transition-all text-center tracking-wide"
        >
          <span>View More</span>
        </Link>
        <Link
          to="/login"
          className="w-full sm:flex-1 bg-transparent text-minecraft-green font-minecraft font-bold text-base rounded-md px-5 py-2 flex items-center justify-center gap-2 border-2 border-minecraft-green shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-minecraft-green/10 hover:text-minecraft-dark active:scale-95 transition-all text-center tracking-wide"
        >
          <span>Login</span>
        </Link>
      </div>
    </div>
  );
};

export default TrendingPostsFeed; 