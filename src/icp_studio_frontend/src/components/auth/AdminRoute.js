import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  
  // If auth is still loading, show nothing (or could add a loader here)
  if (isLoading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // If authenticated and admin, render the child routes
  return <Outlet />;
}

export default AdminRoute; 