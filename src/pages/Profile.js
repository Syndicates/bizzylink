import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserService } from '../services/userService';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  MailIcon,
  LockClosedIcon,
  CogIcon,
  LogoutIcon,
  UsersIcon,
  BellIcon,
  HeartIcon,
  StarIcon,
  ChatIcon,
  GlobeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserAddIcon,
  UserRemoveIcon,
  XIcon,
  CheckIcon,
  ExclamationIcon,
  PencilIcon,
  PhotographIcon,
  SaveIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const socialContext = useSocial();
  
  // State variables
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [relationshipStatus, setRelationshipStatus] = useState('not_friends');
  
  // Get social context methods
  const {
    friends,
    following,
    followers,
    notifications,
    settings,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    followUser,
    unfollowUser,
    getRelationship,
    updateSettings
  } = socialContext || {};
  
  // Load user data and relationship status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load user data
        const response = await UserService.getUserProfile(username);
        if (!response.data.success) {
          setError('Failed to load user profile');
          return;
        }
        
        setUser(response.data.user);
        setEditedUser(response.data.user);
        
        // Load relationship status if not viewing own profile
        if (currentUser?.username !== username && getRelationship) {
          const relationshipResponse = await getRelationship(username);
          setRelationshipStatus(relationshipResponse.status || 'not_friends');
        }
        
        // Set cover image
        setCoverImage(response.data.user.coverImage || getDefaultCover());
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      loadUserData();
    }
  }, [username, currentUser, getRelationship, getDefaultCover, socialContext]);
  
  // ... rest of the component code ...
};

export default Profile; 