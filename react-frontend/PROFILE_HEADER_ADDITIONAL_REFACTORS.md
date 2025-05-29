# Additional ProfileHeader Refactoring Opportunities

## Overview
While the ProfileHeader works well, here are additional refactoring opportunities following RULES.md principles for better maintainability, performance, and code organization.

## 1. **Component Decomposition** (Single Responsibility Principle)
The ProfileHeader is 616 lines - too large for a single component. It should be broken down:

### Suggested Sub-components:
```jsx
// ProfileCoverImage.jsx - Handle cover image with loading states
<ProfileCoverImage
  coverImage={coverImage}
  username={username}
  isOwnProfile={isOwnProfile}
  onWallpaperSelect={onWallpaperSelect}
  savingWallpaper={savingWallpaper}
/>

// ProfileAvatar.jsx - Avatar with 2D/3D toggle
<ProfileAvatar
  username={mcUsername}
  viewMode={viewMode}
  onViewModeChange={onViewModeChange}
/>

// ProfileSocialStats.jsx - The social stats overlay
<ProfileSocialStats
  stats={socialStats}
  onOpenModal={onSocialAction}
/>

// ProfileActions.jsx - Friend/Follow/Message buttons
<ProfileActions
  profileUser={profileUser}
  isOwnProfile={isOwnProfile}
  relationship={relationship}
/>

// ProfileVerificationAlert.jsx - Verification warning
<ProfileVerificationAlert
  user={profileUser}
  isOwnProfile={isOwnProfile}
/>
```

## 2. **Extract Inline Styles** (Maintainability)
Many inline styles should be CSS classes:

```jsx
// BAD - Current inline styles
<img
  style={{
    filter: imageLoaded ? 'blur(0px)' : 'blur(20px)',
    opacity: imageLoaded ? 1 : 0.7,
    transform: imageLoaded ? 'scale(1)' : 'scale(1.1)',
    transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 10
  }}
/>

// GOOD - CSS classes
<img className={`cover-image ${imageLoaded ? 'cover-image--loaded' : 'cover-image--loading'}`} />

// In CSS:
.cover-image {
  transition: all 1.2s cubic-bezier(0.4,0,0.2,1);
  z-index: 10;
}
.cover-image--loading {
  filter: blur(20px);
  opacity: 0.7;
  transform: scale(1.1);
}
.cover-image--loaded {
  filter: blur(0px);
  opacity: 1;
  transform: scale(1);
}
```

## 3. **Configuration Management** (No Magic Numbers)
Extract all hardcoded values:

```javascript
// BAD - Magic numbers scattered
animationDelay: '150ms'
h-32 w-32
min-w-[90px]

// GOOD - Configuration object
const PROFILE_CONFIG = {
  avatar: {
    size: 128,
    containerClasses: 'w-32 h-32'
  },
  animations: {
    bounce: {
      delays: [0, 150, 300]
    },
    coverTransition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)'
  },
  socialStats: {
    minWidth: 90
  },
  cover: {
    height: 'h-48',
    blurRadius: {
      loading: 20,
      loaded: 0
    }
  }
};
```

## 4. **Repeated UI Patterns** (DRY Principle)
The social stat buttons are repeated 3 times:

```jsx
// BAD - Repeated code
<button onClick={() => onSocialAction?.('openFollowersModal')} className="...">
  <div className="text-white font-bold text-xl">{socialStats?.followersCount || 0}</div>
  <div className="text-gray-300 text-xs">Followers</div>
</button>
// Repeated for Following and Friends...

// GOOD - Reusable component
const socialStatTypes = [
  { key: 'followers', label: 'Followers', action: 'openFollowersModal', color: 'blue' },
  { key: 'following', label: 'Following', action: 'openFollowingModal', color: 'green' },
  { key: 'friends', label: 'Friends', action: 'openFriendsModal', color: 'blue' }
];

{socialStatTypes.map(stat => (
  <SocialStatButton
    key={stat.key}
    count={socialStats?.[`${stat.key}Count`] || 0}
    label={stat.label}
    onClick={() => onSocialAction?.(stat.action)}
    color={stat.color}
  />
))}
```

## 5. **Complex Conditional Rendering** (Readability)
Simplify complex conditions:

```jsx
// BAD - Complex nested ternaries
const isOwnOriginalPost = user && (
  isRepostWithOriginal
    ? (originalPost.author && (
        user.username === originalPost.author.username ||
        user._id === originalPost.author._id ||
        user.id === originalPost.author.id
      ))
    : (author && (
        user.username === author.username ||
        user._id === author._id ||
        user.id === author.id
      ))
);

// GOOD - Extract to utility function
const isOwnOriginalPost = useMemo(() => {
  if (!user) return false;
  
  const targetAuthor = isRepostWithOriginal ? originalPost?.author : author;
  return isUserMatch(user, targetAuthor);
}, [user, isRepostWithOriginal, originalPost?.author, author]);

// Utility function
function isUserMatch(user1, user2) {
  if (!user1 || !user2) return false;
  return user1.username === user2.username ||
         user1._id === user2._id ||
         user1.id === user2.id;
}
```

## 6. **Event Handler Definition** (Performance)
Move inline handlers out:

```jsx
// BAD - Inline arrow functions recreated each render
onClick={() => onSocialAction?.('openFollowersModal')}
onClick={() => setShowProfileSettings(true)}

// GOOD - Memoized handlers
const handleOpenFollowers = useCallback(() => {
  onSocialAction?.('openFollowersModal');
}, [onSocialAction]);

const handleOpenSettings = useCallback(() => {
  setShowProfileSettings(true);
}, []);
```

## 7. **Animation System** (Maintainability)
Centralize animations:

```jsx
// Create animation utilities
const animations = {
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-top duration-300',
  bounce: (delay) => ({
    animation: 'bounce 1s infinite',
    animationDelay: `${delay}ms`
  })
};

// Use consistently
<div className={animations.fadeIn}>
<div className={animations.spin}>
<span style={animations.bounce(150)}>
```

## 8. **Type Safety** (TypeScript Interfaces)
Define proper interfaces:

```typescript
interface ProfileHeaderProps {
  profileUser: User;
  playerStats?: PlayerStats;
  coverImage?: string;
  isOwnProfile: boolean;
  relationship?: Relationship;
  viewMode?: 'avatar' | '3d';
  onViewModeChange?: (mode: 'avatar' | '3d') => void;
  onWallpaperSelect?: () => void;
  onSocialAction?: (action: SocialAction, data?: any) => Promise<any>;
  socialStats?: SocialStats;
  savingWallpaper?: boolean;
  className?: string;
}

interface User {
  _id: string;
  username: string;
  displayName?: string;
  mcUsername?: string;
  verified?: boolean;
  isVerified?: boolean;
  title?: string;
  role?: string;
}

type SocialAction = 
  | 'openFollowersModal' 
  | 'openFollowingModal' 
  | 'openFriendsModal'
  | 'acceptFriendRequest'
  | 'rejectFriendRequest';
```

## 9. **Accessibility Improvements** (WCAG Compliance)
```jsx
// Add proper ARIA labels
<button
  aria-label={`View ${socialStats?.followersCount || 0} followers`}
  aria-pressed={false}
  role="button"
>

// Add keyboard navigation
<div
  role="navigation"
  aria-label="Profile actions"
  onKeyDown={handleKeyboardNavigation}
>

// Add focus management
const firstFocusableRef = useRef(null);
useEffect(() => {
  if (showProfileSettings) {
    firstFocusableRef.current?.focus();
  }
}, [showProfileSettings]);
```

## 10. **Loading State Management** (State Machine)
Implement proper state machine for loading:

```javascript
const IMAGE_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  RETRYING: 'retrying'
};

const [imageState, setImageState] = useState(IMAGE_STATES.IDLE);

// Clear state transitions
const imageStateHandlers = {
  [IMAGE_STATES.LOADING]: {
    onLoad: () => setImageState(IMAGE_STATES.LOADED),
    onError: () => setImageState(IMAGE_STATES.RETRYING),
    onTimeout: () => setImageState(IMAGE_STATES.ERROR)
  },
  [IMAGE_STATES.RETRYING]: {
    onSuccess: () => setImageState(IMAGE_STATES.LOADED),
    onMaxRetries: () => setImageState(IMAGE_STATES.ERROR)
  }
};
```

## 11. **Custom Hooks** (Logic Extraction)
Extract complex logic:

```javascript
// useImageLoader.js
function useImageLoader(imageUrl, options = {}) {
  const { timeout = 10000, retries = 2 } = options;
  const [state, setState] = useState({ loading: true, error: false });
  // ... loading logic
  return { ...state, retry };
}

// useVerificationAlert.js
function useVerificationAlert(user, isOwnProfile) {
  const [dismissed, setDismissed] = useState(() => {
    // Check localStorage
  });
  const dismiss = useCallback(() => {
    // Dismiss logic
  }, []);
  return { shouldShow: !dismissed && !user?.verified, dismiss };
}
```

## 12. **Performance Monitoring** (Observability)
Add performance tracking:

```javascript
// Track component render time
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.time('[ProfileHeader] Render Time');
    return () => console.timeEnd('[ProfileHeader] Render Time');
  }
}, []);

// Track image load performance
const trackImagePerformance = useCallback((startTime) => {
  const loadTime = Date.now() - startTime;
  console.log(`[ProfileHeader] Cover image loaded in ${loadTime}ms`);
  
  // Send to analytics if needed
  if (window.analytics) {
    window.analytics.track('Cover Image Load', { loadTime });
  }
}, []);
```

## Benefits of Full Refactor
- 📦 **Smaller Components**: Easier to test and maintain
- 🎨 **Cleaner Styles**: No inline styles, better theming support
- 🔧 **Better Configuration**: Easy to adjust settings
- ♿ **Improved Accessibility**: Better for all users
- 🚀 **Better Performance**: Optimized renders and memoization
- 🧪 **Easier Testing**: Smaller units to test
- 📊 **Better Monitoring**: Track performance issues
- 🔒 **Type Safety**: Catch errors at compile time

## Implementation Priority
1. **High**: Component decomposition (biggest impact)
2. **High**: Extract repeated patterns (DRY)
3. **Medium**: Remove inline styles
4. **Medium**: Add proper TypeScript interfaces
5. **Low**: Animation system (nice to have)
6. **Low**: Performance monitoring (for production) 