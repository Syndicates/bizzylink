/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Home.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import minecraftApi from '../services/minecraft-api';
import { 
  ChevronRightIcon, 
  UserIcon, 
  LinkIcon, 
  CheckCircleIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import diamondIcon from '../assets/images/minecraft-content/diamond.svg';
import emeraldIcon from '../assets/images/minecraft-content/emerald.svg';
import chestIcon from '../assets/images/minecraft-content/chest.svg';
import xpOrbIcon from '../assets/images/minecraft-content/xp-orb.svg';
import HeroLayout from '../components/hero/HeroLayout';
import FeaturesSection from '../components/features/FeaturesSection';
import useServerStatus from '../hooks/useServerStatus';
import useCopyToClipboard from '../hooks/useCopyToClipboard';
import BenefitsSection from '../components/benefits/BenefitsSection';
import PostCard from '../components/PostCard';
import axios from 'axios';

const TrendingPostsSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/wall/fyp?sort=likes&limit=3')
      .then(res => {
        setPosts(res.data.posts || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load trending posts');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-400 text-center py-8">Loading trending posts...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (!posts.length) return null;

  return (
    <section className="max-w-2xl mx-auto w-full mt-10 mb-8">
      <h2 className="font-minecraft text-minecraft-habbo-blue text-xl mb-4">Trending Posts</h2>
      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { serverStatus, serverStatusLoading } = useServerStatus();
  const { copySuccess, copyToClipboard } = useCopyToClipboard('play.bizzynation.co.uk');

  return (
    <motion.div
      className="min-h-screen bg-minecraft-navy flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ 
        minHeight: '100dvh'
      }}
    >
      {/* Remove BizzyLink Navbar/Header here. Only use Navigation.js for navigation. */}
      {/* Hero Section */}
      <HeroLayout
        serverStatus={serverStatus}
        serverStatusLoading={serverStatusLoading}
        copyServerAddress={copyToClipboard}
        copySuccess={copySuccess}
      />

      {/* Features Section */}
      <FeaturesSection />

      {/* Benefits Section */}
      <BenefitsSection />
    </motion.div>
  );
};

export default Home;