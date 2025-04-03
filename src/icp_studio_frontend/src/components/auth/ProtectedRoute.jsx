import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If auth is still loading, show nothing (or could add a loader here)
  if (isLoading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the child routes
  return <Outlet />;
}

export default ProtectedRoute; 