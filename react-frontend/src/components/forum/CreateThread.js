/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file CreateThread.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

/**
 * CreateThread component
 * 
 * Form for creating a new forum thread with title, content, and options
 */
const CreateThread = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [notifyInGame, setNotifyInGame] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Check if user has admin or moderator permissions
  const isAdminOrMod = user && (
    user.role === 'admin' || 
    user.role === 'moderator' || 
    user.forum_rank === 'admin' || 
    user.forum_rank === 'moderator'
  );
  const [currentTab, setCurrentTab] = useState('write'); // 'write' or 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple markdown preview converter
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Replace markdown with HTML elements (very basic example)
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\s*\n\* (.*)/gm, '<ul class="list-disc ml-5 my-2"><li>$1</li></ul>');
    html = html.replace(/^\s*\n\d\. (.*)/gm, '<ol class="list-decimal ml-5 my-2"><li>$1</li></ol>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline">$1</a>');
    
    // Blockquotes
    html = html.replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-green-500 pl-3 py-1 my-2 bg-gray-800">$1</blockquote>');
    
    // Code blocks
    html = html.replace(/`(.*?)`/g, '<code class="px-1 bg-gray-800 rounded">$1</code>');
    
    // Paragraphs
    html = html.replace(/^\s*(\n)?(.+)/gm, function(m) {
      return /\<(\/)?(h|ul|ol|li|blockquote|code|br)/i.test(m) ? m : '<p class="my-2">' + m + '</p>';
    });
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Thread title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Thread content is required';
    } else if (content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Process tags
    const processedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Create thread data object
    const threadData = {
      title,
      content,
      tags: processedTags,
      isPinned: isAdminOrMod ? isPinned : false,
      isLocked: isAdminOrMod ? isLocked : false,
      notifyInGame: isAdminOrMod ? notifyInGame : false
    };
    
    console.log('Submitting thread:', threadData);
    
    // Submit the data to parent component
    onSubmit(threadData);
    
    setIsSubmitting(false);
  };

  // Insert formatting to textarea at cursor position
  const insertFormatting = (startChars, endChars = '') => {
    const textarea = document.getElementById('thread-content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const newText = content.substring(0, start) + startChars + selection + endChars + content.substring(end);
    
    setContent(newText);
    
    // Re-focus and place cursor in the right position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startChars.length,
        start + startChars.length + selection.length
      );
    }, 0);
  };

  return (
    <div className="create-thread-form">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Thread</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Thread title */}
        <div className="mb-4">
          <label htmlFor="thread-title" className="block text-sm font-medium text-gray-300 mb-1">
            Thread Title
          </label>
          <input
            type="text"
            id="thread-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`
              w-full px-3 py-2 bg-gray-800 text-white rounded-md 
              border ${errors.title ? 'border-red-500' : 'border-gray-600'}
              focus:outline-none focus:ring-2 focus:ring-green-500
            `}
            placeholder="Enter your thread title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        {/* Content tabs - Write/Preview */}
        <div className="mb-1">
          <div className="flex border-b border-gray-700">
            <button
              type="button"
              onClick={() => setCurrentTab('write')}
              className={`py-2 px-4 text-sm font-medium ${
                currentTab === 'write' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('preview')}
              className={`py-2 px-4 text-sm font-medium ${
                currentTab === 'preview' 
                  ? 'border-b-2 border-green-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        
        {/* Formatting toolbar */}
        {currentTab === 'write' && (
          <div className="flex flex-wrap gap-1 mb-2 bg-gray-800 p-1 rounded-t-md border-t border-x border-gray-700">
            <button 
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Bold
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Italic
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('# ', '')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Heading
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('* ', '')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              List
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('> ', '')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Quote
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('[', '](url)')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Link
            </button>
            <button 
              type="button"
              onClick={() => insertFormatting('`', '`')}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
            >
              Code
            </button>
          </div>
        )}
        
        {/* Thread content */}
        <div className="mb-4">
          {currentTab === 'write' ? (
            <div className={`border ${errors.content ? 'border-red-500' : 'border-gray-700'} rounded-b-md`}>
              <textarea
                id="thread-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`
                  w-full px-3 py-2 bg-gray-800 text-white rounded-b-md
                  focus:outline-none focus:ring-2 focus:ring-green-500
                  min-h-[200px]
                `}
                placeholder="Enter your thread content... (Markdown supported)"
              ></textarea>
            </div>
          ) : (
            <div className="border border-gray-700 rounded-md p-4 bg-gray-800 prose prose-invert prose-sm min-h-[200px]">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
              ) : (
                <p className="text-gray-500 italic">Nothing to preview...</p>
              )}
            </div>
          )}
          
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
        </div>
        
        {/* Tags */}
        <div className="mb-4">
          <label htmlFor="thread-tags" className="block text-sm font-medium text-gray-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="thread-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="minecraft, help, question"
          />
          <p className="mt-1 text-xs text-gray-400">Optional. Add relevant tags to help others find your thread.</p>
        </div>
        
        {/* Options */}
        <div className="mb-6">
          {isAdminOrMod ? (
            <div className="bg-gray-700 rounded-md p-4 mb-4">
              <h3 className="text-sm font-medium text-white mb-3">Admin/Moderator Options</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="thread-pinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="thread-pinned" className="ml-2 text-sm text-gray-300">
                    Pin Thread
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="thread-locked"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                    className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="thread-locked" className="ml-2 text-sm text-gray-300">
                    Lock Thread
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notify-in-game"
                    checked={notifyInGame}
                    onChange={(e) => setNotifyInGame(e.target.checked)}
                    className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="notify-in-game" className="ml-2 text-sm text-gray-300">
                    Notify Players In-Game
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center opacity-50">
                <input
                  type="checkbox"
                  id="thread-pinned"
                  disabled
                  className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-gray-500"
                />
                <label htmlFor="thread-pinned" className="ml-2 text-sm text-gray-500">
                  Pin Thread (Admin/Mod Only)
                </label>
              </div>
              
              <div className="flex items-center opacity-50">
                <input
                  type="checkbox"
                  id="thread-locked"
                  disabled
                  className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-gray-500"
                />
                <label htmlFor="thread-locked" className="ml-2 text-sm text-gray-500">
                  Lock Thread (Admin/Mod Only)
                </label>
              </div>
            </div>
          )}
        </div>
        
        {/* Submission buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <motion.button
            type="submit"
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md flex items-center"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Thread'
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default CreateThread;