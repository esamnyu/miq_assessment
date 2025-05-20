import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile } from '../services/employeeService';

const ProfilePage: React.FC = () => {
  const { token, logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading, error, isError } = useQuery({
    queryKey: ['myProfile', token],
    queryFn: () => {
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      return getMyProfile(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-4 animate-pulse"></div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <h3 className="font-bold">Error</h3>
          <p>
            Could not fetch profile data. {(error as any)?.data?.detail || (error as Error)?.message || "Please try again later."}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
          <button 
            onClick={handleLogout} 
            className="border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
        <p className="text-gray-700 dark:text-gray-300">No profile data available.</p>
        <button 
          onClick={handleLogout} 
          className="mt-4 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 px-4 py-2 rounded"
        >
          Logout
        </button>
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
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {profile.first_name} {profile.last_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This is your personal onboarding profile.
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <ProfileField label="First Name" value={profile.first_name} />
            <ProfileField label="Last Name" value={profile.last_name} />
            <ProfileField label="Email Address" value={profile.email} />
            <ProfileField label="Phone Number" value={profile.phone} />
            <ProfileField label="Job Title" value={profile.job_title} />
            <ProfileField label="Department" value={profile.department} />
            <ProfileField label="Role" value={profile.role} />
            <ProfileField label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Link to="/profile/edit">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto">
              Edit Profile
            </button>
          </Link>
          <button 
            onClick={handleLogout} 
            className="border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded w-full sm:w-auto mt-2 sm:mt-0"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;