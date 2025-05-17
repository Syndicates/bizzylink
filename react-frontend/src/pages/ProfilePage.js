/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file ProfilePage.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, hasLinkedAccount, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderMinecraftInfo = () => {
    if (!hasLinkedAccount) {
      return (
        <div className="minecraft-not-linked">
          <p>You haven't linked your Minecraft account yet.</p>
          <Link to="/link" className="btn btn-primary">Link Minecraft Account</Link>
        </div>
      );
    }
    
    // Get Minecraft data from either location
    const mcData = user.minecraft || {};
    const mcUsername = user.mcUsername || mcData.username;
    const mcUUID = user.mcUUID || mcData.uuid;
    
    // Format the linked date
    const linkedDate = mcData.linkedAt || user.linkedAt;
    const formattedDate = linkedDate ? new Date(linkedDate).toLocaleString() : 'Unknown';
    
    // Get stats if available
    const stats = mcData.stats || {};
    const inventory = mcData.inventory || {};
    const advancements = mcData.advancements || [];
    
    return (
      <div className="minecraft-linked">
        <div className="minecraft-header">
          <h3>Minecraft Account Linked</h3>
          <div className="minecraft-avatar">
            <img 
              src={`https://crafatar.com/avatars/${mcUUID}?size=64&overlay=true`} 
              alt={`${mcUsername}'s avatar`} 
            />
          </div>
        </div>
        
        <div className="minecraft-details">
          <p><strong>Username:</strong> {mcUsername}</p>
          <p><strong>UUID:</strong> {mcUUID}</p>
          <p><strong>Linked on:</strong> {formattedDate}</p>
          
          {mcData.experience !== undefined && (
            <p><strong>Experience:</strong> {mcData.experience} (Level {mcData.level || 0})</p>
          )}
          
          {mcData.playtime_minutes !== undefined && (
            <p><strong>Playtime:</strong> {Math.floor(mcData.playtime_minutes / 60)} hours {mcData.playtime_minutes % 60} minutes</p>
          )}
          
          {inventory && inventory.valuables && (
            <div className="minecraft-valuables">
              <h4>Inventory Highlights</h4>
              <ul>
                {inventory.valuables.diamond > 0 && <li>Diamonds: {inventory.valuables.diamond}</li>}
                {inventory.valuables.gold > 0 && <li>Gold: {inventory.valuables.gold}</li>}
                {inventory.valuables.iron > 0 && <li>Iron: {inventory.valuables.iron}</li>}
                {inventory.valuables.enchanted_items > 0 && <li>Enchanted Items: {inventory.valuables.enchanted_items}</li>}
              </ul>
            </div>
          )}
          
          {advancements && advancements.length > 0 && (
            <div className="minecraft-advancements">
              <h4>Recent Advancements</h4>
              <ul>
                {advancements.slice(0, 5).map((advancement, index) => (
                  <li key={index}>{advancement.replace('minecraft:', '').split('/').join(': ')}</li>
                ))}
              </ul>
              {advancements.length > 5 && <p>...and {advancements.length - 5} more</p>}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'minecraft' ? 'active' : ''}`}
          onClick={() => setActiveTab('minecraft')}
        >
          Minecraft
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
            <p><strong>Minecraft Account:</strong> {hasLinkedAccount ? 'Linked' : 'Not Linked'}</p>
          </div>
        )}
        
        {activeTab === 'minecraft' && (
          <div className="minecraft-info">
            {renderMinecraftInfo()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 