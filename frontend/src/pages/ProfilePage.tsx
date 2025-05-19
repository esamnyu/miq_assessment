import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate for logout
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile } from '../services/employeeService';

// Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
// You might want a simple layout component later
// import MainLayout from '@/components/layout/MainLayout';

const ProfilePage: React.FC = () => {
  const { token, logout, user: authUser } = useAuth(); // Get logout function and potentially basic user info
  const navigate = useNavigate();

  const { data: profile, isLoading, error, isError } = useQuery({
    queryKey: ['myProfile', token], // Query key includes token to refetch if token changes
    queryFn: () => {
      if (!token) {
        // This should ideally not happen if ProtectedRoute is working,
        // but as a safeguard / or if token expires mid-session.
        throw new Error("Authentication token not found.");
      }
      return getMyProfile(token);
    },
    enabled: !!token, // Only run the query if the token exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    // If you populate `user` in AuthContext immediately after login with data from /token
    // or /me, you could use it as initialData:
    // initialData: authUser ? transformAuthUserToProfile(authUser) : undefined,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-10 w-24 mt-4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not fetch profile data. {(error as any)?.data?.detail || (error as Error)?.message || "Please try again later."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
         <Button onClick={handleLogout} variant="outline" className="mt-4 ml-2">Logout</Button>
      </div>
    );
  }

  if (!profile) {
    // This case should ideally be covered by isLoading or isError
    // but can be a fallback if data is unexpectedly null post-fetch.
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
            <p>No profile data available.</p>
            <Button onClick={handleLogout} variant="outline" className="mt-4">Logout</Button>
        </div>
    );
  }

  // Helper to display profile fields
  const ProfileField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div className="mb-3">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg text-gray-800 dark:text-gray-200">{value || 'N/A'}</p>
    </div>
  );

  return (
    // Consider wrapping with a <MainLayout> if you create one
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Welcome, {profile.first_name} {profile.last_name}!
          </CardTitle>
          <CardDescription>This is your personal onboarding profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <ProfileField label="First Name" value={profile.first_name} />
            <ProfileField label="Last Name" value={profile.last_name} />
            <ProfileField label="Email Address" value={profile.email} />
            <ProfileField label="Phone Number" value={profile.phone} />
            <ProfileField label="Job Title" value={profile.job_title} />
            <ProfileField label="Department" value={profile.department} />
            <ProfileField label="Role" value={profile.role} />
            {/* You can add username here if it's part of EmployeeResponse and you want to display it */}
            {/* <ProfileField label="Username" value={profile.username} /> */}
            <ProfileField label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-6">
          <Link to="/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;