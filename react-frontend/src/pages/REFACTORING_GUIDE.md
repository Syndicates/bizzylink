# Profile Component Refactoring Guide

## Overview

This guide explains how to properly refactor the monolithic `Profile.js` (7,200+ lines) into the clean, modular `Profile.refactored.js` architecture. Follow this guide to understand the refactoring process and avoid common mistakes.

## 🎯 Goals of Refactoring

1. **Maintainability**: Break down large component into smaller, focused pieces
2. **Testability**: Enable unit testing of individual parts
3. **Reusability**: Create components that can be used elsewhere
4. **Performance**: Optimize renders and memory usage
5. **Readability**: Make code easier to understand and debug

## 📊 Before vs After Comparison

| Aspect | Original Profile.js | Refactored Profile.js |
|--------|-------------------|---------------------|
| **Lines of Code** | 7,200+ lines | 692 lines main + modular components |
| **State Variables** | 50+ useState hooks | 3 UI state + custom hooks |
| **Components** | 1 monolithic file | 15+ focused components |
| **Testability** | Difficult | Easy unit testing |
| **Debugging** | Complex | Clear separation of concerns |

## 🏗️ Architecture Overview

### Custom Hooks (Business Logic)
```
useProfileData      - Profile info, wallpaper, social relationships
useWallPosts        - Wall posts, comments, likes, SSE updates
useSocialStats      - Friends/followers/following counts
```

### UI Components (Presentation Layer)
```
ProfileHeader       - Cover photo, avatar, social buttons
ProfileTabNavigation - Tab switching interface
LeftSidebar        - Friends list, social stats
RightSidebar       - Quick stats, progress, activity
WallTab, InfoTab... - Individual tab content
```

### Modal Components (Feature Isolation)
```
WallpaperModal     - Wallpaper selection with database integration
Social Modals      - Followers/Following/Friends lists
```

## 🔄 Step-by-Step Refactoring Process

### Step 1: Analyze Original Structure

First, understand what the original Profile.js contains:

```javascript
// Original Profile.js structure (7,200+ lines)
const Profile = () => {
  // 50+ useState hooks for different concerns
  const [profileUser, setProfileUser] = useState(null);
  const [wallPosts, setWallPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('wall');
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  // ... 40+ more state variables

  // Mixed business logic and UI logic
  // SSE event handlers
  // API calls
  // Complex JSX (thousands of lines)
};
```

### Step 2: Extract Custom Hooks

Create hooks for related functionality:

```javascript
// hooks/profile/useProfileData.js
const useProfileData = (username) => {
  // Move all profile-related state here
  const [profileUser, setProfileUser] = useState(null);
  const [wallpaperId, setWallpaperId] = useState(null);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  
  // Move all profile-related functions here
  const handleWallpaperSelect = (wallpaper) => { /* ... */ };
  
  return {
    profileUser,
    wallpaperId,
    showWallpaperModal,
    setShowWallpaperModal,
    handleWallpaperSelect,
    // ... other profile-related data and functions
  };
};
```

### Step 3: Extract UI Components

Break JSX into focused components:

```javascript
// components/profile/ProfileHeader.jsx
const ProfileHeader = ({ 
  profileUser, 
  playerStats, 
  coverImage, 
  onWallpaperSelect 
}) => {
  return (
    <div className="profile-header">
      {/* Cover photo section */}
      {/* Avatar section */}
      {/* Social buttons */}
    </div>
  );
};
```

### Step 4: Create the Refactored Main Component

The main component becomes an orchestrator:

```javascript
// pages/Profile.refactored.js
const Profile = () => {
  // Only UI state remains here
  const [activeTab, setActiveTab] = useState('wall');
  
  // Use custom hooks for business logic
  const {
    profileUser,
    showWallpaperModal,
    handleWallpaperSelect,
    // ...
  } = useProfileData(username);
  
  const {
    wallPosts,
    handleCreateWallPost,
    // ...
  } = useWallPosts(profileUser, isOwnProfile);
  
  // Render using modular components
  return (
    <div>
      <ProfileHeader
        profileUser={profileUser}
        onWallpaperSelect={() => setShowWallpaperModal(true)}
      />
      <ProfileTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {/* ... other components */}
    </div>
  );
};
```

## ⚠️ Critical Implementation Rules

### 1. SSE Integration (MUST NOT BREAK)

**❌ Wrong Approach:**
```javascript
// Don't change SSE patterns
useEffect(() => {
  someEventHandler(); // Direct call breaks SSE
}, []);
```

**✅ Correct Approach:**
```javascript
// Keep exact ref pattern for SSE callbacks
const profileUserRef = useRef();
useEffect(() => {
  profileUserRef.current = profileUser;
}, [profileUser]);

const handleWallPostEvent = useCallback((event) => {
  const currentProfileUser = profileUserRef.current; // Use ref in callback
  // ... exact logic from original
}, [fetchWallPostsDirectly]);

useEffect(() => {
  if (!addEventListener) return;
  const removeListener = addEventListener("wall_post", handleWallPostEvent);
  return () => { if (removeListener) removeListener(); };
}, [addEventListener, handleWallPostEvent]);
```

### 2. Data Flow Patterns

**❌ Wrong Approach:**
```javascript
// Don't break unidirectional data flow
const ChildComponent = () => {
  const [data, setData] = useState(); // Each component managing its own data
  return <div>...</div>;
};
```

**✅ Correct Approach:**
```javascript
// Data flows down, events flow up
const ParentComponent = () => {
  const { data, updateData } = useCustomHook();
  return (
    <ChildComponent 
      data={data} 
      onUpdate={updateData} 
    />
  );
};

const ChildComponent = ({ data, onUpdate }) => {
  return <div onClick={() => onUpdate(newValue)}>...</div>;
};
```

### 3. Modal Management

**❌ Wrong Approach:**
```javascript
// Don't scatter modal state everywhere
const [showModal1, setShowModal1] = useState(false);
const [showModal2, setShowModal2] = useState(false);
const [showModal3, setShowModal3] = useState(false);
```

**✅ Correct Approach:**
```javascript
// Centralize modal management in appropriate hooks
const {
  showWallpaperModal,
  setShowWallpaperModal,
  handleWallpaperSelect,
} = useProfileData(username);

const {
  showFollowersModal,
  followersData,
  handleOpenFollowersModal,
} = useProfileData(username);
```

## 🚫 Common Mistakes to Avoid

### 1. Breaking SSE Event Handling
```javascript
// ❌ DON'T: Change event listener patterns
// ❌ DON'T: Remove ref usage in callbacks  
// ❌ DON'T: Modify notification system
// ✅ DO: Keep exact SSE patterns from original
```

### 2. Changing API Contracts
```javascript
// ❌ DON'T: Change function signatures when extracting
const useProfileData = (username, extraParam) => { // Added param breaks existing usage

// ✅ DO: Keep same API when refactoring
const useProfileData = (username) => { // Same signature as before
```

### 3. Losing Error Boundaries
```javascript
// ❌ DON'T: Remove error handling
const Component = () => <div>...</div>;

// ✅ DO: Maintain error boundaries
const Component = () => (
  <ErrorBoundary>
    <div>...</div>
  </ErrorBoundary>
);
```

### 4. Performance Regressions
```javascript
// ❌ DON'T: Create new objects in render
const Component = ({ onAction }) => (
  <Child onAction={(data) => onAction({...data, extra: true})} /> // New function each render
);

// ✅ DO: Use useCallback for stable references
const Component = ({ onAction }) => {
  const handleAction = useCallback((data) => 
    onAction({...data, extra: true}), [onAction]
  );
  return <Child onAction={handleAction} />;
};
```

## 🧪 Testing Strategy

### 1. Hook Testing
```javascript
// Test custom hooks independently
import { renderHook } from '@testing-library/react-hooks';
import { useProfileData } from '../hooks/profile/useProfileData';

test('useProfileData loads profile correctly', () => {
  const { result } = renderHook(() => useProfileData('testuser'));
  expect(result.current.profileUser).toBeDefined();
});
```

### 2. Component Testing
```javascript
// Test components in isolation
import { render, screen } from '@testing-library/react';
import ProfileHeader from '../components/profile/ProfileHeader';

test('ProfileHeader displays user info', () => {
  const mockUser = { username: 'test', mcUsername: 'testmc' };
  render(<ProfileHeader profileUser={mockUser} />);
  expect(screen.getByText('test')).toBeInTheDocument();
});
```

### 3. Integration Testing
```javascript
// Test with DynamicProfile toggle
test('Profile toggle works correctly', () => {
  // Test switching between legacy and refactored versions
  // Verify all functionality works in both versions
});
```

## 📈 Performance Optimizations

### 1. Memoization
```javascript
// Use React.memo for components with stable props
const ProfileHeader = React.memo(({ profileUser, onWallpaperSelect }) => {
  // Component only rerenders if props change
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(playerStats);
}, [playerStats]);
```

### 2. Callback Optimization
```javascript
// Use useCallback to prevent unnecessary rerenders
const handleTabChange = useCallback((tab) => {
  setActiveTab(tab);
}, []); // Empty dependency array since setActiveTab is stable
```

### 3. Lazy Loading
```javascript
// Lazy load heavy components
const PhotosTab = lazy(() => import('../components/profile/tabs/PhotosTab'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <PhotosTab />
</Suspense>
```

## 🔄 Migration Strategy

### Phase 1: Preparation
1. Create feature branch
2. Ensure comprehensive tests for existing functionality
3. Document current behavior and edge cases

### Phase 2: Extract Hooks
1. Create `useProfileData` hook first
2. Test hook independently
3. Gradually move state from main component to hook
4. Test integration after each move

### Phase 3: Extract Components  
1. Start with least complex components (ProfileTabNavigation)
2. Move to more complex ones (ProfileHeader, sidebars)
3. Test visual appearance and interactions after each extraction

### Phase 4: Integration
1. Replace original JSX with new components one by one
2. Test SSE functionality thoroughly
3. Verify all database operations work
4. Check responsive design on all screen sizes

### Phase 5: Optimization
1. Add React.memo where appropriate
2. Optimize useCallback and useMemo usage
3. Add performance monitoring
4. Run bundle size analysis

## 🎯 Success Criteria

- [ ] All functionality works identically to original
- [ ] SSE events work correctly
- [ ] Database operations (wallpaper changes) work
- [ ] All modals function properly
- [ ] Responsive design maintained
- [ ] Performance improved or maintained
- [ ] Bundle size not significantly increased
- [ ] Code coverage maintained or improved

## ⚠️ CRITICAL: Avoiding Code Formatting Corruption

**🚨 CRITICAL**: See `CODE_FORMATTING_CORRUPTION_PREVENTION.md` for detailed guide on avoiding formatting corruption during refactoring.

### The Problem
During refactoring, especially with large files, code formatting can become corrupted when using automated editing tools. This manifests as:
- **Compressed JSX**: Multiple lines compressed into unreadable single lines
- **Broken syntax**: Valid code becoming unparseable
- **Hook destructuring corruption**: Variables becoming undefined due to malformed declarations
- **Import statement corruption**: Import blocks becoming single-line messes

### Root Causes
1. **Large search/replace operations** on complex JSX structures
2. **Editing near comment blocks** that contain special characters
3. **Multiple consecutive edits** without validation
4. **Working with files over 20KB** using automated tools

### Prevention Strategies
#### 1. File Size Management
```bash
# Check file size before major edits
ls -la Profile.js
# If > 25KB, consider breaking into smaller pieces first
```
#### 2. Incremental Editing Approach
```javascript
// ❌ DON'T: Edit large blocks at once
const massiveEdit = `  // 100+ lines of complex JSX and logic`;
// ✅ DO: Edit in small, focused chunks
// Step 1: Extract one hook
// Step 2: Extract one component 
// Step 3: Test and validate
// Step 4: Continue incrementally
```
#### 3. Backup and Validation Workflow
```bash
# Before major refactoring
cp Profile.js Profile.js.backup
# After each significant edit
node -c Profile.refactored.js  # Check syntax
npm run build  # Verify compilation
```
#### 4. Safe Editing Patterns
**✅ SAFE: Small, targeted changes**
```javascript
// Replace specific functions or small JSX blocks
const handleClick = () => { /* old */ };
// Replace with:
const handleClick = useCallback(() => { /* new */ }, []);
```
**❌ DANGEROUS: Large multi-line JSX replacements**
```javascript
// Avoid replacing entire component renders in one operation
return (  <div>    {/* 50+ lines of complex JSX */}  </div>);
```
#### 5. Recovery Procedures
If formatting corruption occurs:
1. **Immediate Recovery**:  
```bash  
# Stop editing immediately  
git stash  # Save current work  
git checkout -- filename.js  # Restore clean version  
git stash pop  # Reapply changes carefully  
```
2. **File Reconstruction**:  
```bash  
# If git doesn't help, reconstruct cleanly  
cp filename.js filename.corrupted.js  
# Create new file with clean structure  
# Copy working pieces incrementally  
```
3. **Validation After Recovery**:  
```bash  
# Check syntax  
npx eslint filename.js  
# Check compilation    
npm run build  
# Test functionality  
npm start  
```
### Best Practices for Large File Refactoring
#### 1. Planning Phase
- [ ] Identify logical separation boundaries
- [ ] Create detailed refactoring plan with small steps
- [ ] Set up version control checkpoints
- [ ] Prepare rollback strategy
#### 2. Execution Phase
- [ ] Edit in small, atomic changes (< 50 lines per edit)
- [ ] Validate syntax after each change
- [ ] Test functionality frequently
- [ ] Commit working states regularly
#### 3. Component Extraction Workflow
```javascript
// Step 1: Identify component boundary
const extractMe = (  <div className="component-to-extract">    {/* Clear, self-contained JSX */}  </div>
// Step 2: Create separate file
// components/ExtractedComponent.jsx
// Step 3: Replace with import and usage
import ExtractedComponent from './components/ExtractedComponent';
// Use: <ExtractedComponent {...props} />
```
#### 4. Hook Extraction Workflow
```javascript
// Step 1: Identify related state and logic
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const handleFetch = () => { /* logic */ };
// Step 2: Create custom hook file
// hooks/useDataFetching.jsexport const useDataFetching = () => {  // Move related logic here  return { data, loading, handleFetch };
};
// Step 3: Replace in component
const { data, loading, handleFetch } = useDataFetching();
```
### Emergency Protocols
#### If Component Breaks During Refactoring:
1. **Stop immediately** - don't make more changes
2. **Check syntax** with ESLint/TypeScript
3. **Isolate the problem** - which specific edit caused it?
4. **Rollback strategically** - revert only the problematic change
5. **Re-approach differently** - use smaller, safer edits
#### If Formatting Gets Corrupted:
1. **Don't panic** - the logic is usually still intact
2. **Save corrupted version** as reference
3. **Start with clean base** from version control
4. **Manually reconstruct** using working pieces
5. **Use IDE formatting tools** to clean up structure
### Tools and IDE Settings
#### Recommended VS Code Settings:
```json
{  "editor.formatOnSave": true,  "editor.codeActionsOnSave": {    "source.fixAll.eslint": true  },  "files.autoSave": "onFocusChange"}
```
#### Recommended ESLint Rules:
```json
{  "rules": {    "max-lines": ["warn", 500],    "max-lines-per-function": ["warn", 100],    "complexity": ["warn", 15]  }}
```
## 🔧 Debugging Tips

**🚨 CRITICAL**: See `CODE_FORMATTING_CORRUPTION_PREVENTION.md` for detailed guide on avoiding formatting corruption during refactoring.

1. **SSE Issues**: Check browser dev tools Network tab for SSE connections
2. **State Issues**: Use React DevTools to inspect hook state
3. **Performance Issues**: Use React Profiler to identify slow renders
4. **Build Issues**: Check import/export statements for typos
5. **Formatting Issues**: Use Prettier/ESLint to detect and fix corruption
6. **Syntax Errors**: Use TypeScript or Flow for early error detection

## 📚 Additional Resources

- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Component Composition Patterns](https://reactjs.org/docs/composition-vs-inheritance.html)
- [Testing React Components](https://testing-library.com/docs/react-testing-library/intro/)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)

---

This refactoring guide ensures that anyone can properly break down monolithic components while maintaining functionality and improving code quality. Follow these patterns for any large component refactoring in the BizzyLink application. 