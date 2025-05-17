/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ChangePassword.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUnlock, faKey, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  });
  
  if (!user) {
    return <LoadingSpinner fullScreen />;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    // Check if new password meets requirements
    if (formState.newPassword.length < 8) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Password must be at least 8 characters long'
      });
      return false;
    }
    
    // Check if passwords match
    if (formState.newPassword !== formState.confirmPassword) {
      setNotification({
        show: true,
        type: 'error',
        message: 'New passwords do not match'
      });
      return false;
    }
    
    // Password complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formState.newPassword)) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update password via API
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/password', {
        currentPassword: formState.currentPassword,
        newPassword: formState.newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Password updated successfully!'
      });
      
      // Clear form
      setFormState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Failed to update password. Please check your current password and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen py-12 minecraft-grid-bg">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="habbo-card p-6 rounded-habbo shadow-habbo">
          <h1 className="text-2xl font-minecraft text-minecraft-habbo-blue mb-6">
            <FontAwesomeIcon icon={faKey} className="mr-2" />
            Change Password
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="flex items-center gap-2 text-white font-semibold mb-2">
                <FontAwesomeIcon icon={faUnlock} />
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formState.currentPassword}
                onChange={handleChange}
                className="habbo-input w-full"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="flex items-center gap-2 text-white font-semibold mb-2">
                <FontAwesomeIcon icon={faLock} />
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formState.newPassword}
                onChange={handleChange}
                className="habbo-input w-full"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">
                Password must be at least 8 characters and include uppercase, lowercase, and numbers
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-white font-semibold mb-2">
                <FontAwesomeIcon icon={faLock} />
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formState.confirmPassword}
                onChange={handleChange}
                className="habbo-input w-full"
                required
              />
            </div>
            
            <div className="pt-4 flex space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="habbo-btn bg-minecraft-habbo-red flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="habbo-btn flex-1 flex justify-center items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Want to edit your profile instead?{' '}
              <a href="/edit-profile" className="text-minecraft-habbo-blue hover:underline">
                Go to profile settings
              </a>
            </p>
          </div>
        </div>
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

export default ChangePassword;