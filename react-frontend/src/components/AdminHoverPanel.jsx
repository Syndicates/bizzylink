import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AdminModal from './AdminModal';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const AdminHoverPanel = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only render if user is admin or owner (webRank, role, or forum_rank)
  if (!user || !(
    user.role === 'admin' ||
    user.role === 'owner' ||
    user.forum_rank === 'admin' ||
    user.forum_rank === 'owner' ||
    user.webRank === 'admin' ||
    user.webRank === 'owner'
  )) {
    return null;
  }

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-6 right-6 z-50 cursor-move"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative group">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gray-900 shadow-xl flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all border border-gray-800 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
            aria-label="Open Admin Panel"
          >
            <ShieldCheckIcon className="w-7 h-7 text-minecraft-green" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-4 py-2 rounded bg-gray-900 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap select-none font-semibold tracking-wide" style={{top: '50%', left: 'calc(100% + 16px)'}}>
            Admin Panel
          </span>
        </div>
      </motion.div>
      {isModalOpen && <AdminModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default AdminHoverPanel; 