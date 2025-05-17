/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file Admin.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import { 
  UsersIcon,
  LinkIcon,
  UserPlusIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Admin = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [linkedAccounts, setLinkedAccounts] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check if user is admin (by role or forum_rank)
  useEffect(() => {
    if (user && user.role !== 'admin' && user.forum_rank !== 'admin') {
      setNotification({
        show: true,
        type: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
  }, [user]);
  
  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      if (!user || (user.role !== 'admin' && user.forum_rank !== 'admin')) return;
      
      setLoading(true);
      
      try {
        const response = await AdminService.getUsers(page);
        setUsers(response.data.users);
        setTotalUsers(response.data.totalUsers);
        setTotalPages(response.data.totalPages);
        
        // Calculate stats
        const linked = response.data.users.filter(u => u.linked).length;
        setLinkedAccounts(linked);
        
        // Get new users (registered in last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recent = response.data.users.filter(
          u => new Date(u.createdAt) > oneDayAgo
        ).length;
        setNewUsers(recent);
        
        // Active sessions count (placeholder)
        setActiveSessions(Math.floor(response.data.totalUsers * 0.3));
      } catch (error) {
        console.error('Failed to load users:', error);
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to load users. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [page, user]);
  
  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await AdminService.deleteUser(userId);
      
      // Remove user from state
      setUsers(users.filter(u => u._id !== userId));
      
      setNotification({
        show: true,
        type: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Failed to delete user'
      });
    }
  };
  
  // Filter users based on search term and filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.mcUsername && user.mcUsername.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (filter === 'all') return matchesSearch;
    if (filter === 'linked') return matchesSearch && user.linked;
    if (filter === 'unlinked') return matchesSearch && !user.linked;
    
    return matchesSearch;
  });
  
  // If not admin, show access denied
  if (user && user.role !== 'admin' && user.forum_rank !== 'admin') {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center minecraft-grid-bg">
        <div className="glass-panel p-8 rounded-lg max-w-md text-center">
          <h1 className="text-2xl font-minecraft text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You do not have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 minecraft-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 
          className="text-3xl font-minecraft text-minecraft-green mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Admin Dashboard
        </motion.h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<UsersIcon className="h-6 w-6" />}
            label="Total Users"
            value={totalUsers}
            delay={0}
          />
          <StatCard 
            icon={<LinkIcon className="h-6 w-6" />}
            label="Linked Accounts"
            value={linkedAccounts}
            delay={0.1}
          />
          <StatCard 
            icon={<UserPlusIcon className="h-6 w-6" />}
            label="New Users (24h)"
            value={newUsers}
            delay={0.2}
          />
          <StatCard 
            icon={<ArrowPathIcon className="h-6 w-6" />}
            label="Active Sessions"
            value={activeSessions}
            delay={0.3}
          />
        </div>
        
        {/* User Management */}
        <motion.div 
          className="glass-panel p-6 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white mb-4 md:mb-0">User Management</h2>
            <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 p-2 rounded-md bg-minecraft-navy-dark border border-gray-600 text-white w-full md:w-64"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="p-2 rounded-md bg-minecraft-navy-dark border border-gray-600 text-white"
              >
                <option value="all">All Users</option>
                <option value="linked">Linked Only</option>
                <option value="unlinked">Unlinked Only</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-minecraft-navy-dark">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        MC Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-minecraft-navy-light divide-y divide-gray-700">
                    {filteredUsers.map(user => (
                      <tr key={user._id} className="hover:bg-minecraft-navy-dark">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {user.linked ? (
                            <span className="text-green-400">{user.mcUsername}</span>
                          ) : (
                            <span className="text-gray-500">Not linked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                          No users found matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                  Showing {filteredUsers.length} of {totalUsers} users
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page => Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      page <= 1 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-minecraft-navy-dark text-white hover:bg-minecraft-navy'
                    }`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(page => Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className={`px-4 py-2 rounded-md flex items-center ${
                      page >= totalPages 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-minecraft-navy-dark text-white hover:bg-minecraft-navy'
                    }`}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, delay = 0 }) => (
  <motion.div 
    className="glass-panel rounded-lg shadow-lg p-6 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="text-gray-400 text-sm mb-1 flex items-center justify-center">
      <span className="mr-2">{icon}</span>
      {label}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
  </motion.div>
);

export default Admin;