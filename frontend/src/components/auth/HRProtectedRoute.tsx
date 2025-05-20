// src/components/auth/HRProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HRProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  // First check if user is authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Then strictly check for HR role only
  if (user?.role !== 'hr') {
    return <Navigate to="/profile" replace />;
  }

  // User is both authenticated and has HR role, render the child routes
  return <Outlet />;
};

export default HRProtectedRoute;