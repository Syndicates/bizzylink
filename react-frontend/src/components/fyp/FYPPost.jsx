import React, { useState, useEffect } from 'react';
import PostCard from '../PostCard';
import MinecraftAvatar from '../MinecraftAvatar';
import { formatRelativeTime } from '../../utils/timeUtils';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import WallService from '../../services/wallService';

const FYPPost = (props) => {
  const { post, onCommentChange } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quickEmojis = ["😊", "👍", "❤️", "😂", "😎", "🎮", "🧱", "⛏️", "🗡️"];

  // Always use comments from props (parent state)
  const comments = post.isRepost && Array.isArray(post.originalComments)
    ? post.originalComments : post.comments || [];

  // Clear input when comments change (new comment added)
  useEffect(() => {
    setCommentInput('');
  }, [comments.length]);

  const handleEmojiSelect = (emoji) => {
    setCommentInput(commentInput + emoji);
    setShowEmojiPicker(false);
  };

  const getPostId = () => (post.isRepost && post.originalPost && post.originalPost._id) ? post.originalPost._id : post._id;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    try {
      const response = await WallService.addComment(getPostId(), commentInput.trim());
      // Use backend's full comments array if available
      if (response && response.comments) {
        if (onCommentChange) onCommentChange(getPostId(), response.comments);
      } else if (response && response.comment) {
        // Fallback: append the new comment to the current list
        const updated = [...comments, response.comment];
        if (onCommentChange) onCommentChange(getPostId(), updated);
      }
    } catch (err) {
      alert('Failed to add comment');
    }
    setCommentLoading(false);
  };

  // Delete comment with real API
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    setCommentLoading(true);
    try {
      await WallService.deleteComment(getPostId(), commentId);
      const updated = comments.filter((c) => c._id !== commentId);
      if (onCommentChange) onCommentChange(getPostId(), updated);
    } catch (err) {
      alert('Failed to delete comment');
    }
    setCommentLoading(false);
  };

  const renderComments = () => {
    if (!isExpanded) return null;
    
  return (
        <div className="border-t border-white/10 pt-3 pl-13">
          {/* Existing Comments */}
          {comments.filter(Boolean).map((comment) => {
            if (!comment) return null;
            const author = comment.author || { username: "Unknown User", mcUsername: "Steve" };
            const avatarUsername = author.mcUsername || author.minecraftUsername || author.username;
            return (
              <div key={comment._id} className="flex items-start space-x-2 mb-2">
                <a href={`/profile/${author.username}`}>
                  <MinecraftAvatar 
                    username={avatarUsername}
                    size={24}
                    type="head"
                    className="mt-1 rounded-md"
                  />
                </a>
                <div className="flex-1 bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <a 
                      href={`/profile/${author.username}`}
                      className="text-sm font-medium text-white hover:text-minecraft-habbo-blue flex items-center"
                    >
                      {author.username}
                    </a>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-gray-400 hover:text-red-400"
                        disabled={commentLoading}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-200">{comment.content}</p>
                </div>
              </div>
            );
          })}
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex items-center space-x-2">
            <MinecraftAvatar 
              username={post.author?.mcUsername || post.author?.username || "Steve"} 
              size={24}
              type="head"
              className="rounded-md"
            />
            <div className="flex-1 flex items-center space-x-2 relative">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add Comment"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-minecraft-habbo-blue pr-10"
                disabled={commentLoading}
              />
              {/* Emoji picker button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex={0}
              >
                <FaceSmileIcon className="h-4 w-4" />
              </button>
              {/* Emoji picker dropdown */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 p-2 bg-minecraft-navy rounded-md shadow-lg z-10">
                  <div className="grid grid-cols-3 gap-1">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg p-1 hover:bg-white/10 rounded transition-colors"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!commentInput?.trim() || commentLoading}
              className="px-3 py-2 bg-minecraft-habbo-blue hover:bg-minecraft-habbo-blue/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
            >
              {commentLoading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
    );
  };

  return (
    <div>
      <PostCard
        {...props}
        onToggleComments={() => setIsExpanded((v) => !v)}
        onLike={() => props.onLike(getPostId())}
        onUnlike={() => props.onUnlike(getPostId())}
        onRepost={() => props.onRepost(post)}
        onUnrepost={() => props.onUnrepost(post)}
        postId={post._id}
        likeLoading={props.likeLoading}
        repostStatus={{
          hasReposted: post.isReposted || false,
          repostCount: post.repostCount || 0
        }}
        repostLoading={false}
        commentsSection={renderComments()}
      />
    </div>
  );
};

export default FYPPost; 