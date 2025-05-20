// src/components/auth/HRProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HRProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Add debugging
  useEffect(() => {
    console.log("HRProtectedRoute - Auth state:", { 
      isAuthenticated, 
      isLoading, 
      user,
      userRole: user?.role 
    });
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    console.log("HRProtectedRoute - Still loading auth status");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading authentication status...</div>
      </div>
    );
  }

  // First check if user is authenticated at all
  if (!isAuthenticated) {
    console.log("HRProtectedRoute - User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Then strictly check for HR role only
  if (user?.role !== 'hr') {
    console.log("HRProtectedRoute - User is not HR, has role:", user?.role);
    return <Navigate to="/profile" replace />;
  }

  console.log("HRProtectedRoute - Access granted to HR route");
  // User is both authenticated and has HR role, render the child routes
  return <Outlet />;
};

export default HRProtectedRoute;