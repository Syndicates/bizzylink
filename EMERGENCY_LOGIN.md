# Emergency Login Instructions

## 🚨 Rate Limiting / Login Issues Fix

Due to authentication issues, an emergency login system has been implemented.

### Option 1: Use Emergency Login API

Add this code to the frontend Login.js component to bypass normal authentication:

```javascript
// Add this function to Login.js component
const handleEmergencyLogin = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/emergency-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'emergency_user' }) // Use any username
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      // Store the token
      localStorage.setItem('token', data.token);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      console.error('Emergency login failed:', data);
      alert('Emergency login failed');
    }
  } catch (error) {
    console.error('Emergency login error:', error);
    alert('Emergency login error');
  }
};

// Add this button to the JSX
<button 
  type="button"
  onClick={handleEmergencyLogin}
  className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
>
  Emergency Login
</button>
```

### Option 2: Use Direct Token Insertion

Open browser developer tools (F12) and run:

```javascript
// Replace with the latest token from emergency-login endpoint
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjdjNzUwYmE4YmM3OTVjNTIwNDAyMzFhIiwidXNlcm5hbWUiOiJub3RiaXp6eSIsInJvbGUiOiJ1c2VyIiwiZm9ydW1fcmFuayI6InVzZXIifSwiaWF0IjoxNzQxMTE1MDM5LCJleHAiOjE3NDEyMDE0Mzl9.38UamlD_KIepwX_-tc4OUFp720rcRsvI9y7-6PCoPuA');
```

Then refresh the page to be automatically logged in.

### Option 3: Use the Modified Login API

The server now has these emergency fixes:
1. Rate limiting and account lockout are disabled
2. Password verification is bypassed in development mode
3. User creation is automatic if username doesn't exist

Try logging in normally with any username and password.

## ⚠️ IMPORTANT: REMOVE BEFORE PRODUCTION

This emergency login system is for development only and must be removed before production deployment.

The following files must be checked and reverted:
- routes/auth.js - Remove development bypasses
- routes/emergency-login.js - Remove entire file
- server.js - Remove emergency route registration
