import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import NewsService from '../services/NewsService';

const PAGE_SIZE = 10;

function UserDetailModal({ user, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    webRank: user.webRank,
    isPrivate: user.isPrivate,
    verified: user.verified,
    activeTitle: user.activeTitle
  });
  const isBizzy = user.username === 'bizzy';
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.webRank === 'owner';

  if (isBizzy) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-11/12 max-w-full flex flex-col items-center justify-center">
          <div className="text-6xl text-red-600 animate-pulse">⚠️</div>
          <div className="text-2xl font-bold text-red-500 text-center mt-4">WARNING: This is the BIZZY account</div>
          <div className="text-lg text-red-300 text-center max-w-xl mt-2">
            This account is <span className="font-bold">IMMUNE</span> to all admin actions.<br />
            Any attempt to modify, ban, or delete this account will be <span className="font-bold">logged and reported</span>.<br />
            <span className="font-bold">DO NOT TOUCH.</span>
          </div>
          <button onClick={onClose} className="mt-8 px-6 py-3 rounded bg-red-700 hover:bg-red-800 text-white text-lg font-bold shadow-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await AdminService.updateUser(user._id, formData);
      onUpdate();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-11/12 max-w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-minecraft">{user.username}</h3>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded ${activeTab === 'profile' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded ${activeTab === 'permissions' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('minecraft')}
            className={`px-4 py-2 rounded ${activeTab === 'minecraft' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Minecraft
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded ${activeTab === 'security' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded ${activeTab === 'audit' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Audit Log
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Active Title</label>
                  <input
                    type="text"
                    value={formData.activeTitle}
                    onChange={(e) => setFormData({ ...formData, activeTitle: e.target.value })}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Account Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.accountStatus === 'active' ? 'bg-green-900 text-green-300' :
                      user.accountStatus === 'banned' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {user.accountStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Web Rank</label>
                <select
                  value={formData.webRank}
                  onChange={(e) => setFormData({ ...formData, webRank: e.target.value })}
                  disabled={!editing || !isOwner}
                  className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white disabled:bg-gray-700 disabled:text-gray-400"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              {!isOwner && (
                <p className="text-xs text-gray-500 mt-1">Only Bizzy can change web rank.</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  disabled={!editing}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <label className="text-sm font-medium text-gray-400">Private Profile</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  disabled={!editing}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <label className="text-sm font-medium text-gray-400">Verified</label>
              </div>
            </div>
          )}

          {activeTab === 'minecraft' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400">Minecraft Username</label>
                  <input
                    type="text"
                    value={user.minecraft?.mcUsername || 'Not linked'}
                    disabled
                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Minecraft UUID</label>
                  <input
                    type="text"
                    value={user.minecraft?.mcUUID || 'Not linked'}
                    disabled
                    className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
              </div>
              {user.minecraft?.stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Level</label>
                    <div className="mt-1 text-lg">{user.minecraft.stats.level}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Balance</label>
                    <div className="mt-1 text-lg">${user.minecraft.stats.balance}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Playtime</label>
                    <div className="mt-1 text-lg">{user.minecraft.stats.playtime}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Last Login</label>
                <div className="mt-1">{new Date(user.lastLogin).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Known IPs</label>
                <div className="mt-1 space-y-2">
                  {user.knownIPs?.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{ip.ip}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(ip.lastSeen).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={user.twoFactorEnabled}
                  disabled
                  className="rounded bg-gray-800 border-gray-700"
                />
                <label className="text-sm font-medium text-gray-400">Two-Factor Enabled</label>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                {user.auditLog?.map((log, index) => (
                  <div key={index} className="border-b border-gray-800 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-sm text-gray-400 mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    username: user.username,
                    email: user.email,
                    webRank: user.webRank,
                    isPrivate: user.isPrivate,
                    verified: user.verified,
                    activeTitle: user.activeTitle
                  });
                }}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
            >
              Edit User
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BanModal({ user, onClose, onBan }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');

  const handleBan = async () => {
    try {
      const durationMs = duration ? parseInt(duration) * 24 * 60 * 60 * 1000 : null; // Convert days to ms
      await AdminService.banUser(user._id, { reason, duration: durationMs });
      onBan();
      onClose();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-11/12 max-w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
        
        <h3 className="text-2xl font-minecraft mb-4">Ban User</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Duration (days, leave empty for permanent)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleBan}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
          >
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreadDetailModal({ thread, onClose, onModerate }) {
  if (!thread) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-11/12 max-w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
        <h3 className="text-2xl font-minecraft mb-4">Thread: {thread.title}</h3>
        <div className="mb-2"><span className="font-bold">Author:</span> {thread.author?.username || thread.author}</div>
        <div className="mb-2"><span className="font-bold">Category:</span> {thread.category?.name || thread.category}</div>
        <div className="mb-2"><span className="font-bold">Created:</span> {new Date(thread.createdAt).toLocaleString()}</div>
        <div className="mb-2"><span className="font-bold">Status:</span> {thread.isLocked || thread.locked ? 'Locked' : 'Open'} | {thread.isPinned || thread.pinned ? 'Pinned' : 'Unpinned'}</div>
        <div className="mb-2"><span className="font-bold">Views:</span> {thread.views}</div>
        <div className="mb-2"><span className="font-bold">Replies:</span> {thread.replyCount}</div>
        {/* TODO: Add posts preview, moderation actions, edit form */}
      </div>
    </div>
  );
}

// News Management Modal
function NewsModal({ news, onClose, onSave }) {
  const isEdit = !!news;
  const [form, setForm] = useState({
    title: news?.title || '',
    summary: news?.summary || '',
    body: news?.body || '',
    bannerImage: news?.bannerImage || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(news?.bannerImage || '');
  const [uploading, setUploading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setForm(prev => ({ ...prev, bannerImage: data.url }));
      setBannerPreview(data.url);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const newsData = { ...form };
      if (form.bannerImage) {
        newsData.bannerType = 'custom';
      }
      if (isEdit) {
        await NewsService.updateNews(news._id, newsData);
      } else {
        await NewsService.createNews(newsData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError('Failed to save news.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-11/12 max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">✕</button>
        <h3 className="text-2xl font-minecraft mb-4">{isEdit ? 'Edit News' : 'Create News'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Summary</label>
            <input name="summary" value={form.summary} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Body</label>
            <textarea name="body" value={form.body} onChange={handleChange} required rows={6} className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Banner Image</label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <div className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-center cursor-pointer hover:bg-gray-700 transition-colors">
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <span className="text-sm text-gray-400">or</span>
                <input
                  type="text"
                  name="bannerImage"
                  value={form.bannerImage}
                  onChange={handleChange}
                  placeholder="Enter image URL"
                  className="flex-1 px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                />
              </div>
              {bannerPreview && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-700">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                    onError={() => setBannerPreview('')}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPreview('');
                      setForm(prev => ({ ...prev, bannerImage: '' }));
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create News'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminModal = ({ onClose }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    rank: '',
    linked: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [threads, setThreads] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [threadPage, setThreadPage] = useState(1);
  const [threadTotalPages, setThreadTotalPages] = useState(1);
  const [threadSearch, setThreadSearch] = useState('');
  const [threadCategory, setThreadCategory] = useState('');
  const [threadStatus, setThreadStatus] = useState('');
  const [selectedThread, setSelectedThread] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const [newsPage, setNewsPage] = useState(1);
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editNews, setEditNews] = useState(null);

  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'forum', label: 'Forum Management' },
    { id: 'minecraft', label: 'Minecraft Permissions' },
    { id: 'news', label: 'News Management' },
    { id: 'reports', label: 'Reports' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'stats', label: 'Quick Stats' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getUsers({
        page,
        limit: PAGE_SIZE,
        search,
        ...filters
      });
      if (!response || !Array.isArray(response.users)) {
        setUsers([]);
        setTotalPages(1);
        setError('Invalid response from server');
        console.error('AdminService.getUsers returned:', response);
        return;
      }
      setUsers(response.users);
      setTotalPages(response.pages || 1);
      setError(null);
    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    try {
      setThreadLoading(true);
      const response = await AdminService.getThreads({
        page: threadPage,
        limit: 10,
        search: threadSearch,
        category: threadCategory,
        status: threadStatus
      });
      if (!response || !Array.isArray(response.threads)) {
        setThreads([]);
        setThreadTotalPages(1);
        setThreadError('Invalid response from server');
        return;
      }
      setThreads(response.threads);
      setThreadTotalPages(response.pages || 1);
      setThreadError(null);
    } catch (error) {
      setThreadError('Failed to load threads');
    } finally {
      setThreadLoading(false);
    }
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await NewsService.getNews({ page: newsPage, limit: 10 });
      setNewsList(res.news || []);
      setNewsTotalPages(res.pages || 1);
    } catch (err) {
      setNewsError('Failed to load news');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'forum') fetchThreads();
    if (activeTab === 'news') fetchNews();
  }, [page, search, filters, activeTab, threadPage, threadSearch, threadCategory, threadStatus, newsPage]);

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'unban':
          await AdminService.unbanUser(userId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            await AdminService.deleteUser(userId);
          }
          break;
        default:
          break;
      }
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleThreadModerate = async (threadId, action) => {
    try {
      await AdminService.moderateThread(threadId, { action });
      fetchThreads();
    } catch (error) {
      alert('Failed to moderate thread');
    }
  };

  const isBizzyOrOwner = currentUser?.username === 'bizzy' || currentUser?.webRank === 'owner';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg shadow-xl w-11/12 max-w-full flex flex-col"
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-minecraft">Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex">
          <div className="w-64 border-r border-gray-800 p-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2 rounded mb-2 ${
                  activeTab === tab.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                  <select
                    value={filters.rank}
                    onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                    className="px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  >
                    <option value="">All Ranks</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <select
                    value={filters.linked}
                    onChange={(e) => setFilters({ ...filters, linked: e.target.value })}
                    className="px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  >
                    <option value="">All Users</option>
                    <option value="true">Linked</option>
                    <option value="false">Unlinked</option>
                  </select>
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No users found</div>
                ) : (
                  <div className="bg-gray-800 rounded-lg">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-900">
                          <th className="px-4 py-2 text-left">Username</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Rank</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Last Login</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(users) && users.map(user => {
                          const isBizzy = user.username === 'bizzy';
                          const isOwner = currentUser?.webRank === 'owner';
                          return (
                            <tr key={user._id} className="border-t border-gray-700">
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span>{user.username}</span>
                                  {user.minecraft?.mcUsername && (
                                    <span className="text-sm text-gray-400">
                                      ({user.minecraft.mcUsername})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">{user.email}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-sm ${
                                  user.webRank === 'owner' ? 'bg-purple-900 text-purple-300' :
                                  user.webRank === 'admin' ? 'bg-red-900 text-red-300' :
                                  user.webRank === 'moderator' ? 'bg-blue-900 text-blue-300' :
                                  'bg-gray-900 text-gray-300'
                                }`}>
                                  {user.webRank}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-sm ${
                                  user.accountStatus === 'active' ? 'bg-green-900 text-green-300' :
                                  user.accountStatus === 'banned' ? 'bg-red-900 text-red-300' :
                                  'bg-yellow-900 text-yellow-300'
                                }`}>
                                  {user.accountStatus}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {new Date(user.lastLogin).toLocaleString()}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setSelectedUser(user)}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm"
                                  >
                                    View
                                  </button>
                                  {!isBizzy && (user.accountStatus === 'banned' ? (
                                    <button
                                      onClick={() => handleUserAction(user._id, 'unban')}
                                      className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-sm"
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowBanModal(true);
                                      }}
                                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-sm"
                                    >
                                      Ban
                                    </button>
                                  ))}
                                  {isOwner && !isBizzy && (
                                    <button
                                      onClick={() => handleUserAction(user._id, 'delete')}
                                      className="px-2 py-1 rounded bg-red-900 hover:bg-red-800 text-sm"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'forum' && (
              <div className="space-y-4">
                <div className="flex gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Search threads..."
                    value={threadSearch}
                    onChange={e => setThreadSearch(e.target.value)}
                    className="flex-1 px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  />
                  <select
                    value={threadStatus}
                    onChange={e => setThreadStatus(e.target.value)}
                    className="px-4 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  >
                    <option value="">All Status</option>
                    <option value="locked">Locked</option>
                    <option value="pinned">Pinned</option>
                  </select>
                </div>
                {threadLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : threadError ? (
                  <div className="text-center py-8 text-red-500">{threadError}</div>
                ) : !Array.isArray(threads) || threads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No threads found</div>
                ) : (
                  <div className="bg-gray-800 rounded-lg">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-900">
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Author</th>
                          <th className="px-4 py-2 text-left">Category</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Replies</th>
                          <th className="px-4 py-2 text-left">Views</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {threads.map(thread => {
                          const isBizzy = thread.author?.username === 'bizzy';
                          const isOwner = currentUser?.webRank === 'owner';
                          return (
                            <tr key={thread._id} className="border-t border-gray-700">
                              <td className="px-4 py-2">
                                <button onClick={() => setSelectedThread(thread)} className="text-blue-400 hover:underline">
                                  {thread.title}
                                </button>
                              </td>
                              <td className="px-4 py-2">{thread.author?.username || thread.author}</td>
                              <td className="px-4 py-2">{thread.category?.name || thread.category}</td>
                              <td className="px-4 py-2">
                                {(thread.isLocked || thread.locked) ? 'Locked' : 'Open'} / {(thread.isPinned || thread.pinned) ? 'Pinned' : 'Unpinned'}
                              </td>
                              <td className="px-4 py-2">{thread.replyCount}</td>
                              <td className="px-4 py-2">{thread.views}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <button onClick={() => handleThreadModerate(thread._id, (thread.isLocked || thread.locked) ? 'unlock' : 'lock')} className="px-2 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-sm">
                                    {(thread.isLocked || thread.locked) ? 'Unlock' : 'Lock'}
                                  </button>
                                  <button onClick={() => handleThreadModerate(thread._id, (thread.isPinned || thread.pinned) ? 'unpin' : 'pin')} className="px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-sm">
                                    {(thread.isPinned || thread.pinned) ? 'Unpin' : 'Pin'}
                                  </button>
                                  <button onClick={() => handleThreadModerate(thread._id, 'edit')} className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 text-sm" disabled>
                                    Edit
                                  </button>
                                  {isBizzy ? (
                                    <button
                                      onClick={() => {
                                        alert('Action disabled for bizzy user');
                                      }}
                                      className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                                    >
                                      Delete
                                    </button>
                                  ) : (
                                    <button onClick={() => handleThreadModerate(thread._id, 'delete')} className="px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-sm">
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setThreadPage(p => Math.max(1, p - 1))}
                    disabled={threadPage === 1}
                    className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {threadPage} of {threadTotalPages}
                  </span>
                  <button
                    onClick={() => setThreadPage(p => Math.min(threadTotalPages, p + 1))}
                    disabled={threadPage === threadTotalPages}
                    className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                {selectedThread && (
                  <ThreadDetailModal
                    thread={selectedThread}
                    onClose={() => setSelectedThread(null)}
                    onModerate={fetchThreads}
                  />
                )}
              </div>
            )}

            {activeTab === 'minecraft' && (
              <div className="text-center py-8 text-gray-400">
                Minecraft permissions coming soon...
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-minecraft">News Management</h3>
                  {isBizzyOrOwner && (
                    <button onClick={() => { setEditNews(null); setShowNewsModal(true); }} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">Create News</button>
                  )}
                </div>
                {newsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : newsError ? (
                  <div className="text-center py-8 text-red-500">{newsError}</div>
                ) : !Array.isArray(newsList) || newsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No news found</div>
                ) : (
                  <div className="bg-gray-800 rounded-lg overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-900">
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Author</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newsList.map(news => (
                          <tr key={news._id} className="border-t border-gray-700">
                            <td className="px-4 py-2">{news.title}</td>
                            <td className="px-4 py-2">{news.author?.username || news.author}</td>
                            <td className="px-4 py-2">{new Date(news.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                {isBizzyOrOwner && (
                                  <>
                                    <button onClick={() => { setEditNews(news); setShowNewsModal(true); }} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm">Edit</button>
                                    <button onClick={async () => { if (window.confirm('Delete this news article?')) { await NewsService.deleteNews(news._id); fetchNews(); } }} className="px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-sm">Delete</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <button onClick={() => setNewsPage(p => Math.max(1, p - 1))} disabled={newsPage === 1} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">Previous</button>
                  <span className="text-gray-400">Page {newsPage} of {newsTotalPages}</span>
                  <button onClick={() => setNewsPage(p => Math.min(newsTotalPages, p + 1))} disabled={newsPage === newsTotalPages} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">Next</button>
                </div>
                {showNewsModal && (
                  <NewsModal news={editNews} onClose={() => setShowNewsModal(false)} onSave={fetchNews} />
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="text-center py-8 text-gray-400">
                Reports coming soon...
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="text-center py-8 text-gray-400">
                Audit logs coming soon...
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="text-center py-8 text-gray-400">
                Quick stats coming soon...
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}

      {showBanModal && selectedUser && (
        <BanModal
          user={selectedUser}
          onClose={() => {
            setShowBanModal(false);
            setSelectedUser(null);
          }}
          onBan={fetchUsers}
        />
      )}
    </motion.div>
  );
};

export default AdminModal; 