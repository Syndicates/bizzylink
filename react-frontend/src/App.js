import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, TokenStorage } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { EventSourceProvider } from './contexts/EventSourceContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Navigation from './components/Navigation';
import BizzyLinkHeader from './components/BizzyLinkHeader';
// Custom styles to fix dropdown z-index issues
import './dropdown-fix.css';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import BizzyLink from './pages/BizzyLink';
// Use our defensive wrapper around the Friends component
import Friends from './pages/FriendsWrapper';
import Notifications from './pages/Notifications';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import AuthDebugger from './components/AuthDebugger';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import the Community page
import Community from './pages/Community';
import TestRealTime from './pages/TestRealTime';
import ProfilePage from './pages/ProfilePage';
import LinkPage from './pages/LinkPage';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  const [retryCount, setRetryCount] = React.useState(0);
  const MAX_RETRIES = 3;
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  
  // Direct access to computed getter - with safety
  const isAuthenticated = auth?.isAuthenticated || false;
  const loading = auth?.loading || false;
  const user = auth?.user || null;

  // Enhanced debugging for protected routes
  React.useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setCheckingAuth(true);
        
        console.group('🛡️ Protected Route Check');
        console.log('Loading state:', loading);
        console.log('isAuthenticated:', isAuthenticated);
        console.log('User data:', user ? {
          id: user.id || user._id,
          _id: user._id || user.id,
          username: user.username
        } : 'null');
        
        // Check if token exists using TokenStorage if available
        let tokenExists = false;
        try {
          if (typeof window !== 'undefined') {
            // Try to safely import TokenStorage
            const AuthContext = await import('./contexts/AuthContext');
            if (AuthContext.TokenStorage) {
              tokenExists = AuthContext.TokenStorage.hasToken();
              console.log('TokenStorage available, token exists:', tokenExists);
            } else {
              // Fallback to direct token check
              try {
                tokenExists = !!localStorage.getItem('token') || 
                              !!sessionStorage.getItem('token');
              } catch (storageErr) {
                console.error('Error accessing storage:', storageErr);
              }
              console.log('TokenStorage not available, using fallback check, token exists:', tokenExists);
            }
          }
        } catch (err) {
          console.error('Error checking token existence:', err);
          // Fallback to direct token check
          try {
            tokenExists = !!localStorage.getItem('token') || 
                          !!sessionStorage.getItem('token');
            console.log('Using fallback token check, token exists:', tokenExists);
          } catch (storageErr) {
            console.error('Storage access error:', storageErr);
          }
        }
        
        if (!isAuthenticated && tokenExists && retryCount < MAX_RETRIES) {
          console.log('Token exists but not authenticated yet, refreshing auth state...');
          setRetryCount(prev => prev + 1);
          
          // Try to manually refresh auth
          if (auth.refreshAuth) {
            try {
              await auth.refreshAuth();
              console.log('Auth state refreshed');
            } catch (refreshErr) {
              console.error('Error refreshing auth state:', refreshErr);
            }
          } else {
            console.warn('refreshAuth function not available');
          }
        } else if (!isAuthenticated && retryCount >= MAX_RETRIES) {
          console.log('Max retries reached, redirecting to login page');
          // Force redirect to login page for clean state
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        console.groupEnd();
      } catch (error) {
        console.error('Protected route check error:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
  
    checkAuthentication();
  }, [isAuthenticated, loading, user, retryCount, auth]);

  // Show loading spinner while checking authentication
  if (loading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // If authenticated, render the protected content
  // Otherwise, redirect to login page
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Safe render of children
  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/bizzylink" element={<BizzyLink />} />
      <Route path="/vote" element={<DynamicImport importFunc={() => import('./pages/Vote')} />} />
      <Route path="/leaderboard" element={<DynamicImport importFunc={() => import('./pages/Leaderboard')} />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:username" element={<DynamicImport importFunc={() => import('./pages/Profile')} />} />
      <Route path="/link" element={<LinkPage />} />
      <Route 
        path="/link-success" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/LinkSuccess')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/map" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/Map')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shop" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/Shop')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/auction" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/Auction')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } 
      />
      <Route 
        path="/edit-profile" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/EditProfile')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/change-password" 
        element={
          <ProtectedRoute>
            <DynamicImport importFunc={() => import('./pages/ChangePassword')} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/friends" 
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Friends />
            </ErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/community" 
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/community/:tab" 
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        } 
      />
      <Route path="/test-realtime" element={
        <ProtectedRoute>
          <TestRealTime />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// Dynamic import component to lazy load pages
const DynamicImport = ({ importFunc }) => {
  const [Component, setComponent] = React.useState(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        const module = await importFunc();
        setComponent(() => module.default);
      } catch (error) {
        console.error('Error loading component:', error);
      }
    };
    
    loadComponent();
  }, [importFunc]);

  return Component ? <Component /> : <LoadingSpinner />;
};

// Main App component
function App() {
  // Check for persisted tokens on application startup
  useEffect(() => {
    try {
      // If TokenStorage is available, check for persisted tokens
      if (TokenStorage && TokenStorage.hasToken()) {
        console.log('Existing authentication token found on app startup');
      } else {
        console.log('No authentication token found on app startup');
      }
    } catch (err) {
      console.error('Error checking for persisted authentication on startup:', err);
    }
  }, []);

  // Enable debug mode in development environment
  const isDevMode = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary>
      <BrowserRouter basename="/">
        <AuthProvider>
          <WebSocketProvider>
            <EventSourceProvider>
              <SocialProvider>
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnHover
                  theme="colored"
                />
                <div className="min-h-screen flex flex-col">
                  <Navigation />
                  {/* BizzyLink header included for BizzyLink pages */}
                  <Routes>
                    <Route path="/bizzylink/*" element={<BizzyLinkHeader playerCount={42} />} />
                  </Routes>
                  <main className="flex-grow pt-20">
                    <ErrorBoundary>
                      <AppRoutes />
                    </ErrorBoundary>
                  </main>
                  <Footer />
                  {/* Include AuthDebugger in development mode */}
                  {isDevMode && <AuthDebugger />}
                </div>
              </SocialProvider>
            </EventSourceProvider>
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
