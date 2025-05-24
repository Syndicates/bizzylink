/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025           |
 * +-------------------------------------------------+
 *
 * @file ProfileSettingsModal.jsx
 * @description Modal for managing profile, privacy, and account settings
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import UserSettingsForm from './UserSettingsForm';
import { toast } from 'react-toastify';
import { Cog6ToothIcon, LockClosedIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TABS = [
  { key: 'profile', label: 'Profile', icon: <UserIcon className="h-5 w-5 mr-1" /> },
  { key: 'privacy', label: 'Privacy', icon: <LockClosedIcon className="h-5 w-5 mr-1" /> },
  { key: 'account', label: 'Account', icon: <Cog6ToothIcon className="h-5 w-5 mr-1" /> },
];

const ProfileSettingsModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const overlayRef = useRef();

  useEffect(() => {
    setIsPrivate(currentUser?.isPrivate || false);
  }, [currentUser]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Save privacy settings
  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const res = await fetch('/api/user/profile/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPrivate }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update privacy');
      toast.success('Privacy settings updated');
      onUpdate?.({ ...currentUser, isPrivate });
    } catch (err) {
      toast.error(err.message);
      // Revert the state if the API call fails
      setIsPrivate(!isPrivate);
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Toggle privacy and save
  const handleTogglePrivacy = () => {
    const newPrivacyState = !isPrivate;
    setIsPrivate(newPrivacyState);
    // Save with the new privacy state
    setSavingPrivacy(true);
    fetch('/api/user/profile/privacy', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isPrivate: newPrivacyState }),
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update privacy');
        toast.success('Privacy settings updated');
        onUpdate?.({ ...currentUser, isPrivate: newPrivacyState });
      })
      .catch((err) => {
        toast.error(err.message);
        // Revert the state if the API call fails
        setIsPrivate(!newPrivacyState);
      })
      .finally(() => {
        setSavingPrivacy(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-minecraft-navy p-0 rounded-lg shadow-xl max-w-lg w-full border-2 border-minecraft-habbo-blue relative animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-minecraft-habbo-blue/40 bg-minecraft-navy-dark rounded-t-lg">
          <div className="flex items-center gap-2 text-lg font-minecraft text-white">
            <Cog6ToothIcon className="h-6 w-6 mr-2 text-minecraft-habbo-blue" />
            Manage Profile
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-minecraft-habbo-blue/30 bg-minecraft-navy-light">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center px-5 py-3 font-minecraft text-sm transition-colors focus:outline-none ${
                activeTab === tab.key
                  ? 'text-minecraft-habbo-blue border-b-2 border-minecraft-habbo-blue bg-minecraft-navy'
                  : 'text-gray-300 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.key)}
              aria-selected={activeTab === tab.key}
              tabIndex={0}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="p-6 bg-minecraft-navy-light rounded-b-lg">
          {activeTab === 'profile' && (
            <div>
              <h3 className="font-minecraft text-minecraft-habbo-blue text-lg mb-4">Profile Info</h3>
              {/* Display name and signature editing could go here */}
              <UserSettingsForm currentUser={currentUser} onUpdate={onUpdate} />
            </div>
          )}
          {activeTab === 'privacy' && (
            <div>
              <h3 className="font-minecraft text-minecraft-habbo-blue text-lg mb-4">Privacy Settings</h3>
              <div className="mb-6 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  disabled={savingPrivacy}
                  className={`px-6 py-3 rounded font-minecraft text-lg transition-colors shadow-md border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-minecraft-habbo-blue
                    ${isPrivate ? 'bg-red-700 border-red-500 text-white hover:bg-red-800' : 'bg-green-700 border-green-500 text-white hover:bg-green-800'}
                    ${savingPrivacy ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {savingPrivacy ? (
                    <span className="flex items-center"><span className="loader mr-2"></span>Saving...</span>
                  ) : isPrivate ? (
                    <span>Privacy Mode ON</span>
                  ) : (
                    <span>Public</span>
                  )}
                </button>
                <p className="text-gray-400 text-xs mt-3 text-center max-w-xs">
                  {isPrivate
                    ? 'Your profile is private. Only you can view it. Others will see a privacy message.'
                    : 'Your profile is public. Anyone can view your profile.'}
                </p>
              </div>
            </div>
          )}
          {activeTab === 'account' && (
            <div>
              <h3 className="font-minecraft text-minecraft-habbo-blue text-lg mb-4">Account</h3>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-minecraft">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 font-minecraft opacity-70 cursor-not-allowed"
                />
              </div>
              <button
                className="px-5 py-2 bg-minecraft-habbo-blue hover:bg-blue-700 text-white rounded font-minecraft text-base transition-colors"
                onClick={() => toast.info('Password change coming soon!')}
              >
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal; 