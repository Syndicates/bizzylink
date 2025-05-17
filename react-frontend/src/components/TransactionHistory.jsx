/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file TransactionHistory.jsx
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Use window.location.origin as a fallback
const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

const TransactionHistory = ({ userId, limit = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/user/balance`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setBalance(response.data.balance || 0);
        
        // Limit the number of transactions if specified
        const limitedTransactions = limit ? 
          response.data.transactions.slice(0, limit) : 
          response.data.transactions;
          
        setTransactions(limitedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err.response?.data?.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [limit]);
  
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 rounded-lg p-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Transaction History</h2>
        <div className="text-yellow-300 font-bold">
          Balance: {balance}
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          No transactions yet
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map((transaction, index) => {
                // Determine if this user is sender or receiver
                const isSender = transaction.from?._id === userId;
                const otherUser = isSender ? transaction.to : transaction.from;
                const transactionType = isSender ? 'Sent' : 'Received';
                
                return (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(transaction.date)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                      isSender ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {transactionType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => navigate(`/profile/${otherUser?.username}`)}
                      >
                        <img 
                          src={otherUser?.avatar || '/images/default-avatar.png'} 
                          alt={otherUser?.username || 'Unknown user'} 
                          className="h-6 w-6 rounded-full mr-2"
                        />
                        <span className="text-blue-400 hover:underline">
                          {otherUser?.username || 'Unknown user'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                      isSender ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {isSender ? '-' : '+'}{transaction.amount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs">
                      {transaction.note || 'No note'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {limit && transactions.length >= limit && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/transactions')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View all transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;