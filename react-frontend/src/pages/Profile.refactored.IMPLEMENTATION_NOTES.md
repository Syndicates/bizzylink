# Profile.refactored.js - Implementation Notes

## 🎯 Quick Reference for Implementing the Refactored Profile

### Key Architecture Decisions

1. **Custom Hooks for Business Logic**
   - `useProfileData`: All profile-related state and operations
   - `useWallPosts`: Wall posts, comments, likes, SSE integration
   - `useSocialStats`: Friends/followers/following counts

2. **Component Separation**
   - `ProfileHeader`: Cover photo, avatar, social buttons
   - `LeftSidebar` & `RightSidebar`: Stats and social info
   - Tab components: `WallTab`, `InfoTab`, `StatsTab`, etc.

3. **Modal Management**
   - `WallpaperModal`: Database-integrated wallpaper selection
   - Social modals: Followers/Following/Friends (inline JSX)

## ⚠️ CRITICAL: SSE Integration Rules

**NEVER CHANGE** these patterns when refactoring:

```javascript
// ✅ KEEP: Ref pattern for SSE callbacks
const profileUserRef = useRef();
useEffect(() => {
  profileUserRef.current = profileUser;
}, [profileUser]);

// ✅ KEEP: Event listener cleanup pattern
useEffect(() => {
  if (!addEventListener) return;
  const removeListener = addEventListener("event_name", handler);
  return () => { if (removeListener) removeListener(); };
}, [addEventListener, handler]);

// ✅ KEEP: fetchWallPostsDirectly pattern
const fetchWallPostsDirectly = useCallback(async () => {
  if (!profileUser?.username) return;
  await refreshWallPosts();
}, [profileUser?.username, refreshWallPosts]);
```

## 🔄 Data Flow Pattern

```
Database → Hooks → Main Component → Child Components
         ↓
    SSE Events → Hooks → State Updates → UI Updates
```

## 📝 Implementation Checklist

### When Refactoring Similar Components:

- [ ] Extract related state into custom hooks
- [ ] Keep SSE patterns identical
- [ ] Maintain prop drilling solution (bundle common props)
- [ ] Use useCallback for event handlers
- [ ] Keep error boundaries and loading states
- [ ] Test SSE functionality after changes
- [ ] Verify database operations still work
- [ ] Check responsive design

### Required Hook Structure:

```javascript
const useCustomHook = (params) => {
  // State management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Event handlers with useCallback
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Return clean API
  return {
    data,
    loading,
    error,
    handleAction,
  };
};
```

### Component Props Pattern:

```javascript
const ChildComponent = ({
  // Data props
  profileUser,
  playerStats,
  
  // State props
  loading,
  error,
  
  // Action props
  onAction,
  onUpdate,
}) => {
  // Component implementation
};
```

## 🚫 Common Mistakes

1. **DON'T**: Change SSE event listener patterns
2. **DON'T**: Add new state to main component (use hooks)
3. **DON'T**: Break prop drilling solutions
4. **DON'T**: Remove error boundaries
5. **DON'T**: Change useCallback dependency arrays carelessly

## ✅ Success Indicators

- All original functionality works
- SSE events trigger correctly
- Database operations succeed
- No performance regressions
- Components are testable in isolation
- Code is easier to understand and maintain

## 🔧 Debugging Guide

If something breaks:

1. **SSE Issues**: Check browser dev tools → Network → EventSource
2. **State Issues**: Use React DevTools to inspect hook state
3. **Render Issues**: Check prop drilling and component structure
4. **Database Issues**: Verify API endpoints and payload structure

## 📚 Key Files to Study

- `hooks/profile/useProfileData.js` - Main profile hook pattern
- `components/profile/ProfileHeader.jsx` - Component prop pattern
- `components/profile/WallpaperModal.jsx` - Modal integration pattern

This refactored Profile maintains 100% feature parity while being significantly more maintainable and testable. 