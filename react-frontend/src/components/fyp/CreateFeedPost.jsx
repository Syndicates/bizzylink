import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import WallService from '../../services/wallService';
import { FiImage, FiSend, FiSmile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import MinecraftAvatar from '../MinecraftAvatar';

const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];

const CreateFeedPost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await WallService.createPost(user.username, { content: content.trim() });
      if (response.success) {
        setContent('');
        toast.success('Post created!');
        if (onPostCreated) onPostCreated(response.post);
      }
    } catch (error) {
      toast.error('Failed to create post');
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Insert emoji at cursor position
  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(content + emoji);
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.slice(0, start) + emoji + content.slice(end);
      setContent(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-minecraft-navy-light border border-minecraft-navy rounded-lg shadow-lg p-5 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <MinecraftAvatar
            username={user?.mcUsername || user?.username}
            size={48}
            className="rounded-md border-2 border-minecraft-navy bg-minecraft-navy-light"
            animate={true}
          />
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in the Minecraft world?"
                className="w-full bg-minecraft-navy/80 border border-minecraft-green rounded-md p-3 min-h-[80px] text-white placeholder-gray-400 shadow focus:ring-2 focus:ring-minecraft-green focus:outline-none resize-none text-base transition-all font-sans"
                maxLength={500}
                onBlur={() => setTimeout(() => setShowEmojiPicker(false), 200)}
              />
              {/* Emoji picker popup */}
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-full mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg border border-minecraft-green z-20">
                  <div className="grid grid-cols-5 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 bg-minecraft-navy/60 px-2 py-1 rounded">
                <button
                  type="button"
                  className="p-2 text-minecraft-green hover:bg-minecraft-green/10 rounded-full transition-colors"
                  title="Add image (coming soon)"
                  tabIndex={-1}
                >
                  <FiImage className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-minecraft-green hover:bg-minecraft-green/10 rounded-full transition-colors"
                  title="Add emoji"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  tabIndex={-1}
                >
                  <FiSmile className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 font-minecraft">
                  {content.length}/500
                </span>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className={`px-6 py-2 rounded font-minecraft font-bold flex items-center space-x-2 shadow transition-colors
                  ${!content.trim() || isSubmitting 
                    ? 'bg-minecraft-navy text-gray-400 cursor-not-allowed'
                    : 'bg-minecraft-green text-white hover:bg-minecraft-light-green hover:shadow-lg'}
                `}
              >
                <span>Post</span>
                <FiSend className={isSubmitting ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateFeedPost; 