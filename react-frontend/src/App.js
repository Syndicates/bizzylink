/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file App.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, TokenStorage } from './contexts/AuthContext';
import { SocialProvider } from './contexts/SocialContext';
import { EventSourceProvider } from './contexts/EventSourceContext';
// Import the new WebSocket context
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
import { motion } from 'framer-motion';
import { GuidedTourProvider } from './hooks/useGuidedTour';

// Modified ProtectedRoute component with protections against infinite loops
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(false);
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // If authenticated, render the protected content
  // Otherwise, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Render children with a motion div to avoid flickering
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
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

// Add this global layout wrapper inside the .app div:
function GlobalLayout({ children }) {
  // Adjust this value to match the height of your fixed navbar (e.g., 4rem = pt-16)
  return (
    <div className="pt-16 min-h-screen bg-inherit">
      {children}
    </div>
  );
}

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
                  <GuidedTourProvider>
                    <div className="app">
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
                      <Navigation />
                    <GlobalLayout>
                      <ErrorBoundary>
                        <AppRoutes />
                      </ErrorBoundary>
                    </GlobalLayout>
                      <Footer />
                      {isDevMode && <AuthDebugger />}
                    </div>
                  </GuidedTourProvider>
                </SocialProvider>
              </EventSourceProvider>
            </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
