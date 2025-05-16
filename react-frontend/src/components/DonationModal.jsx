import React, { useState } from 'react';
import ForumAPI from '../services/ForumAPI';
import { toast } from 'react-toastify';

const DonationModal = ({ isOpen, onClose, recipient, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate amount
    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await ForumAPI.donate(recipient._id, parsedAmount, note);
      
      // Show success message
      toast.success(`Successfully donated ${parsedAmount} to ${recipient.username}!`);
      
      // Reset form
      setAmount('');
      setNote('');
      
      // Call success callback with the result
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error donating:', error);
      setError(error.response?.data?.message || 'Failed to process donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-gray-700">
        <div className="flex justify-between items-center bg-gray-900 p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-gray-100">
            Donate to {recipient?.username}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-300 mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="note" className="block text-gray-300 mb-2">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              placeholder="Add a note with your donation"
              rows="3"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-green-700 hover:bg-green-600 text-gray-100 rounded-md flex items-center ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Send Donation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationModal;