import React, { useState, useEffect } from 'react';
import ForumAPI from '../services/ForumAPI';
import { toast } from 'react-toastify';

const UserSettingsForm = ({ currentUser, onUpdate }) => {
  const [signature, setSignature] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [showReputation, setShowReputation] = useState(true);
  const [showVouches, setShowVouches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  
  useEffect(() => {
    // Initialize form with user's current settings
    if (currentUser) {
      setSignature(currentUser.signature || '');
      setShowBalance(currentUser.settings?.privacy?.showBalance !== false);
      setShowReputation(currentUser.settings?.privacy?.showReputation !== false);
      setShowVouches(currentUser.settings?.privacy?.showVouches !== false);
    }
  }, [currentUser]);
  
  const handleSignatureChange = (e) => {
    const value = e.target.value;
    setSignature(value);
    
    // Validate signature length
    if (value.length > 500) {
      setSignatureError('Signature must be 500 characters or less');
    } else {
      setSignatureError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (signatureError) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update signature
      await ForumAPI.updateSignature(signature);
      
      // TODO: Update privacy settings when API is available
      // This would be implemented in a similar way to the signature update
      
      // Show success message
      toast.success('Settings updated successfully');
      
      // Call onUpdate callback with the new settings
      if (onUpdate) {
        onUpdate({
          signature,
          settings: {
            privacy: {
              showBalance,
              showReputation,
              showVouches
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-4">Forum Settings</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Signature field */}
        <div className="mb-4">
          <label htmlFor="signature" className="block text-gray-300 mb-2">
            Forum Signature
          </label>
          <textarea
            id="signature"
            value={signature}
            onChange={handleSignatureChange}
            className={`w-full px-3 py-2 bg-gray-700 border ${
              signatureError ? 'border-red-500' : 'border-gray-600'
            } rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600`}
            placeholder="Your forum signature (optional)"
            rows="3"
          />
          <div className="flex justify-between mt-1">
            {signatureError ? (
              <p className="text-red-400 text-xs">{signatureError}</p>
            ) : (
              <p className="text-gray-400 text-xs">
                Appears below your posts. HTML not allowed.
              </p>
            )}
            <p className="text-gray-400 text-xs">
              {signature.length}/500
            </p>
          </div>
        </div>
        
        {/* Privacy settings */}
        <div className="mb-6">
          <h3 className="text-gray-300 text-sm font-semibold mb-2">Privacy Settings</h3>
          
          <div className="space-y-3 bg-gray-700 p-3 rounded">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showBalance"
                checked={showBalance}
                onChange={(e) => setShowBalance(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-500 rounded"
              />
              <label htmlFor="showBalance" className="ml-2 block text-sm text-gray-300">
                Show my balance to other users
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showReputation"
                checked={showReputation}
                onChange={(e) => setShowReputation(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-500 rounded"
              />
              <label htmlFor="showReputation" className="ml-2 block text-sm text-gray-300">
                Show my reputation to other users
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showVouches"
                checked={showVouches}
                onChange={(e) => setShowVouches(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-500 rounded"
              />
              <label htmlFor="showVouches" className="ml-2 block text-sm text-gray-300">
                Show my vouches to other users
              </label>
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !!signatureError}
            className={`px-4 py-2 bg-green-700 hover:bg-green-600 text-gray-100 rounded-md flex items-center ${
              isSubmitting || !!signatureError ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserSettingsForm;