import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateThread = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [notifyInGame, setNotifyInGame] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tags
  const availableTags = [
    { id: 'question', name: 'Question', color: 'blue' },
    { id: 'announcement', name: 'Announcement', color: 'red' },
    { id: 'guide', name: 'Guide', color: 'green' },
    { id: 'suggestion', name: 'Suggestion', color: 'yellow' },
    { id: 'bug', name: 'Bug', color: 'orange' }
  ];

  // Handle tag selection toggle
  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title for your thread');
      return;
    }
    
    if (!content.trim()) {
      alert('Please enter content for your thread');
      return;
    }
    
    setIsSubmitting(true);
    
    // Prepare the thread data
    const threadData = {
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
      isPinned,
      isLocked,
      notifyInGame
    };
    
    // Call the submission handler
    onSubmit(threadData);
    
    // Reset form (in case the submission fails)
    setIsSubmitting(false);
  };

  // Check if user has admin or moderator role
  const isAdminOrMod = user && (user.role === 'admin' || user.role === 'moderator');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Create New Thread</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thread title */}
        <div>
          <label htmlFor="thread-title" className="block text-sm font-medium text-gray-300 mb-1">
            Thread Title
          </label>
          <input
            id="thread-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter thread title"
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Thread content */}
        <div>
          <label htmlFor="thread-content" className="block text-sm font-medium text-gray-300 mb-1">
            Thread Content
          </label>
          <textarea
            id="thread-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post here..."
            required
            rows={10}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Markdown is supported. You can use **bold**, *italic*, and [links](https://example.com)
          </p>
        </div>
        
        {/* Tags selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium
                  ${selectedTags.includes(tag.id)
                    ? `bg-${tag.color}-600 text-white`
                    : `bg-gray-700 text-gray-300 hover:bg-gray-600`
                  }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Admin/moderator options */}
        {isAdminOrMod && (
          <div className="bg-gray-700 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Moderator Options</h3>
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
        )}
        
        {/* Submission buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Thread'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateThread;