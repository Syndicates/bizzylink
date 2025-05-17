/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file EditProfile.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faKey, faSave } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const EditProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    username: '',
    email: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  });
  
  useEffect(() => {
    if (user) {
      setFormState({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Update user profile via API
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/profile', formState, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update context with new user data
      updateUserProfile({
        ...user,
        username: formState.username,
        email: formState.email
      });
      
      setNotification({
        show: true,
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.error || 'Failed to update profile. Please try again.'
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
          <h1 className="text-2xl font-minecraft text-minecraft-habbo-blue mb-6">Edit Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="flex items-center gap-2 text-white font-semibold mb-2">
                <FontAwesomeIcon icon={faUser} />
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formState.username}
                onChange={handleChange}
                className="habbo-input w-full"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-white font-semibold mb-2">
                <FontAwesomeIcon icon={faEnvelope} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="habbo-input w-full"
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Want to change your password instead?{' '}
              <a href="/change-password" className="text-minecraft-habbo-blue hover:underline">
                Go to password settings
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

export default EditProfile;