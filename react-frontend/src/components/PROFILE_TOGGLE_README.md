# Profile Toggle Feature

This feature allows switching between the Legacy (`Profile.js`) and Refactored (`Profile.refactored.js`) Profile components for testing and comparison purposes.

## Usage Methods

### 1. URL Parameter (Highest Priority)
Add `?legacy=true` to any profile URL to use the legacy version:
- `http://localhost:3000/profile/bizzy?legacy=true` - Uses Legacy Profile
- `http://localhost:3000/profile/bizzy?legacy=false` - Uses Refactored Profile  
- `http://localhost:3000/profile/bizzy` - Uses stored preference or default

### 2. UI Toggle Button
- **Desktop**: Small toggle button in the top navigation bar (when logged in)
- **Mobile**: Toggle button in the mobile menu with label
- **Features**: 
  - Shows current profile type ("Legacy" or "Refactored")
  - Highlights when on a profile page
  - Persists choice in localStorage
  - Updates URL parameter automatically

### 3. Environment Variable (Development Only)
Set in `.env` file:
```
REACT_APP_USE_LEGACY_PROFILE=true
```

## Priority Order
1. URL parameter (`?legacy=true/false`)
2. Environment variable (development only)
3. localStorage (user preference)
4. Default: Refactored Profile

## Technical Implementation

### Files
- `hooks/useProfileToggle.js` - Core toggle logic and state management
- `components/ProfileToggle.jsx` - UI toggle button component
- `components/DynamicProfile.jsx` - Dynamic Profile route component
- `components/Navigation.js` - Updated to include toggle button

### How It Works
1. `useProfileToggle()` hook manages the toggle state
2. `DynamicProfile` component dynamically imports the correct Profile
3. Toggle button updates URL parameters and localStorage
4. Route uses `DynamicProfile` instead of hardcoded import

## Visual Indicators
- **Active Profile Page**: Toggle button has blue ring highlighting
- **Development Mode**: Yellow "DEV" badge appears next to toggle
- **Icons**: 
  - Legacy mode: Code bracket icon
  - Refactored mode: Refresh/arrows icon

## Benefits
- **A/B Testing**: Easy comparison between Profile implementations
- **Debugging**: Switch versions when investigating issues  
- **Development**: Test changes without affecting other version
- **Rollback**: Quick fallback if refactored version has issues
- **User Choice**: Let users pick their preferred experience

## Usage Examples

```javascript
import { useProfileToggle } from '../hooks/useProfileToggle';

function MyComponent() {
  const { 
    useLegacyProfile,
    toggleProfile,
    setLegacyProfile,
    profileType,
    isProfilePage 
  } = useProfileToggle();
  
  return (
    <div>
      <p>Current Profile: {profileType}</p>
      <button onClick={toggleProfile}>
        Switch to {useLegacyProfile ? 'Refactored' : 'Legacy'}
      </button>
    </div>
  );
}
```

## Testing
1. Navigate to any profile page (e.g., `/profile/bizzy`)
2. Click the toggle button in navigation
3. Observe the Profile component switches between versions
4. Refresh the page - preference should persist
5. Add `?legacy=true` to URL - should override stored preference
6. Clear localStorage and URL params - should use default (Refactored) 