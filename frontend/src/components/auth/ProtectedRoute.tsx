import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as necessary

// Optional: Define props if you need to pass any specific configuration
// interface ProtectedRouteProps {
//   // Example: allowedRoles?: string[];
// }

const ProtectedRoute: React.FC /* <ProtectedRouteProps> */ = (/* { allowedRoles } */) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // To redirect back to the intended page after login

  if (isLoading) {
    // Show a loading indicator while checking authentication status
    // This prevents a flicker or premature redirect if auth state is still loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading authentication status...</div>
        {/* You can replace this with a spinner component from shadcn/ui later */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Role-based access control (can be added later)
  // if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
  //   // User does not have the required role, redirect to an unauthorized page or home
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // User is authenticated (and optionally, has the required role), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;