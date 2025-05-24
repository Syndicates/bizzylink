/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file RepostModal.jsx
 * @description Simple confirmation modal for reposts
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React from 'react';
import { 
  ArrowPathRoundedSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const RepostModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  loading = false 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-minecraft-navy-dark rounded-lg p-6 max-w-md w-full mx-4 border border-minecraft-habbo-blue/30 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ArrowPathRoundedSquareIcon className="h-6 w-6 text-minecraft-habbo-green" />
            <h3 className="text-lg font-minecraft text-minecraft-habbo-blue">
              Repost to your profile?
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 text-sm">
            This post will be shared to your profile and visible to your followers.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 bg-minecraft-habbo-green hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Reposting...</span>
              </>
            ) : (
              <>
                <ArrowPathRoundedSquareIcon className="h-4 w-4" />
                <span>Repost</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepostModal; 