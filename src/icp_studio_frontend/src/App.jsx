import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import ModuleManagementPage from './pages/ModuleManagementPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import AdminManagementPage from './pages/AdminManagementPage.jsx';
import LearningPage from './pages/LearningPage.jsx';
import ModuleContentPage from './pages/ModuleContentPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Protected Routes
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminRoute from './components/auth/AdminRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      
      {/* Protected Routes (require authentication) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearningPage />} />
        <Route path="/module/:moduleId" element={<ModuleContentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/modules" element={<ModuleManagementPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/admins" element={<AdminManagementPage />} />
        </Route>
      </Route>
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
