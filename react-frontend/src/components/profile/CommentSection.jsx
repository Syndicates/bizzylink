/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file CommentSection.jsx
 * @description Comment section component for wall posts
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleOvalLeftIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import CommentItem from './CommentItem';

// Enhanced CommentSection with animations and improved styling
const CommentSection = ({
  post,
  commentLoading,
  commentError,
  onAddComment,
  onDeleteComment,
  currentUser,
  isExpanded,
  onToggleExpand,
}) => {
  // Get comments from post or default to empty array
  const comments = post.comments || [];
  const postId = post._id;

  // Reference to input field for focusing
  const inputRef = useRef(null);

  // State to track emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // State to track if the comment input is visible
  const [showCommentInput, setShowCommentInput] = useState(false);

  // State for comment deletion modal and pending comment
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // State for comment input
  const [commentInput, setCommentInput] = useState('');

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && showCommentInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded, showCommentInput]);

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && commentInput.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle emoji insertion
  const handleEmojiSelect = (emoji) => {
    setCommentInput(commentInput + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Common emojis for quick selection
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];

  // Handler to trigger modal
  const handleDeleteCommentWithConfirm = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  // Handler to confirm deletion
  const confirmDeleteComment = () => {
    if (commentToDelete) {
      onDeleteComment(postId, commentToDelete);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  // Handler to cancel deletion
  const cancelDeleteComment = () => {
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  const handleSubmit = async () => {
    if (!commentInput.trim()) return;
    await onAddComment(post._id, commentInput.trim());
    setCommentInput('');
    setShowCommentInput(false);
  };

  return (
    <div className="mt-4">
      {/* Comment toggle button */}
      <button
        onClick={onToggleExpand}
        className="flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
      >
        <div className="flex items-center relative">
          <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-1" />
          {comments.length > 0 && (
            <span className="absolute -top-2 -right-1 bg-minecraft-habbo-blue text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {comments.length > 99 ? "99+" : comments.length}
            </span>
          )}
        </div>
        <span className="ml-1 group-hover:text-white transition-colors">
          {comments.length === 0
            ? "Add Comment"
            : isExpanded
              ? "Hide Comments"
              : "Show Comments"}
        </span>
      </button>

      {/* Expanded comment section */}
      {isExpanded && (
        <motion.div
          className="mt-3 pt-3 border-t border-white/10 comment-section rounded-md transition-colors duration-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Comments list */}
          <AnimatePresence mode="popLayout">
            {comments.length > 0 ? (
              <div className="space-y-1 mb-3">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    postId={postId}
                    onDelete={handleDeleteCommentWithConfirm}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            ) : (
              <motion.p
                className="text-sm text-gray-400 text-center py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                No comments yet. Be the first to comment!
              </motion.p>
            )}
          </AnimatePresence>

          {/* Comment input toggle */}
          {!showCommentInput && (
            <button
              onClick={() => setShowCommentInput(true)}
              className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all duration-200"
            >
              Write a comment...
            </button>
          )}

          {/* Comment input area */}
          {showCommentInput && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <input
                ref={inputRef}
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 pr-20 bg-white/10 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-minecraft-habbo-blue transition-all"
                disabled={commentLoading}
              />
              
              {/* Emoji picker button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                type="button"
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>

              {/* Quick emoji picker */}
              {showEmojiPicker && (
                <motion.div
                  className="absolute bottom-full right-0 mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="grid grid-cols-3 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Error message */}
          {commentError && (
            <motion.p
              className="text-red-400 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {commentError}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Delete comment confirmation modal */}
      <AnimatePresence>
        {showDeleteCommentModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDeleteComment}
          >
            <motion.div
              className="bg-minecraft-navy p-6 rounded-md max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-minecraft mb-4">Delete Comment?</h3>
              <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteComment}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteComment}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection; 