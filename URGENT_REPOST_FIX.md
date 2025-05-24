# 🚨 URGENT: Repost Fix for Profile.refactored.js

## 🎯 **Problem**: User can't repost because WallPost component is missing repost functionality

## ✅ **Quick Fix Steps**

### **STEP 1: Add Repost Props to WallPost Component**

In `react-frontend/src/components/profile/WallPost.jsx`, add these props to the component:

```javascript
// Add these props to WallPost component (around line 36)
repostStatuses = {},
repostLoading = {},
viewCounts = {},
onRepost,
onUnrepost,
```

### **STEP 2: Add Repost Icon Import**

```javascript
// Add ArrowPathIcon to imports (line ~19)
import { 
  HandThumbUpIcon, 
  XMarkIcon, 
  EyeIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ArrowPathIcon  // <- ADD THIS
} from '@heroicons/react/24/outline';
```

### **STEP 3: Add Repost Logic to WallPost Component**

Add this logic inside the WallPost component (around line 60):

```javascript
// Get repost data for this post
const getPostId = () => {
  return post.isRepost && post.originalPost?._id ? post.originalPost._id : post._id;
};

const postId = getPostId();
const repostStatus = repostStatuses[postId] || {};
const hasReposted = repostStatus.hasReposted || false;
const repostCount = repostStatus.repostCount || 0;
const isRepostLoading = repostLoading[postId] || false;
const viewCount = viewCounts[postId] || post.views || 0;

// Handle repost click
const handleRepostClick = () => {
  if (!currentUser || !onRepost || !onUnrepost) return;
  
  if (hasReposted) {
    onUnrepost(postId);
  } else {
    onRepost(postId, '');
  }
};
```

### **STEP 4: Add Repost Button to Post Actions**

Replace the existing post actions section (around line 180) with this:

```javascript
{/* Post Actions */}
<div className="flex items-center justify-between border-t border-white/10 pt-3">
  <div className="flex items-center space-x-6">
    {/* Like Button */}
    <button
      onClick={handleLikeClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
        hasLiked
          ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
          : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
      }`}
    >
      {hasLiked ? (
        <HeartIconSolid className="h-5 w-5" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">
        {hasLiked ? 'Liked' : 'Like'}
      </span>
    </button>

    {/* Comment Button */}
    <button
      onClick={handleToggleComments}
      className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-400 hover:text-minecraft-habbo-blue hover:bg-minecraft-habbo-blue/10 transition-all duration-200"
    >
      <ChatBubbleOvalLeftIcon className="h-5 w-5" />
      <span className="text-sm font-medium">Comment</span>
    </button>

    {/* *** ADD THIS: Repost Button *** */}
    {currentUser && !isPostAuthor && onRepost && (
      <button
        onClick={handleRepostClick}
        disabled={isRepostLoading}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          hasReposted
            ? 'text-minecraft-habbo-green bg-minecraft-habbo-green/10 hover:bg-minecraft-habbo-green/20'
            : 'text-gray-400 hover:text-minecraft-habbo-green hover:bg-minecraft-habbo-green/10'
        } ${isRepostLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ArrowPathIcon className={`h-5 w-5 ${isRepostLoading ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">
          {isRepostLoading ? 'Reposting...' : hasReposted ? 'Reposted' : 'Repost'}
        </span>
        {repostCount > 0 && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {repostCount}
          </span>
        )}
      </button>
    )}
  </div>
</div>
```

### **STEP 5: Update Profile.refactored.js WallPost Props**

In `Profile.refactored.js`, find the WallPost component usage and add:

```javascript
<WallPost
  key={post._id}
  post={post}
  currentUser={user}
  isOwnProfile={isOwnProfile}
  commentInputs={commentInputs}
  commentLoading={commentLoading}
  commentError={commentError}
  expandedComments={expandedComments}
  onLike={handleLike}
  onUnlike={handleUnlike}
  onDelete={handleDeleteWallPostWithConfirm}
  onCommentChange={handleCommentInputChange}
  onAddComment={handleCommentSubmit}
  onDeleteComment={handleCommentDelete}
  onToggleComments={toggleCommentSection}
  // *** ADD THESE REPOST PROPS ***
  repostStatuses={repostStatuses}
  repostLoading={repostLoading}
  viewCounts={viewCounts}
  onRepost={handleRepost}
  onUnrepost={handleUnrepost}
/>
```

## 🎉 **Result**

After these changes:
- ✅ **Repost button will appear** on all wall posts (except your own)
- ✅ **You can repost and unrepost** successfully 
- ✅ **Repost counts will display** correctly
- ✅ **Loading states** work properly
- ✅ **Real-time updates** via SSE will work

## 🚀 **Test It**

1. Go to someone's profile
2. See a post with the "Repost" button
3. Click "Repost" - should change to "Reposted" 
4. Go to your profile - should see the reposted content
5. Click "Reposted" to remove the repost

**This will restore the full repost functionality that was missing!** 🎯 