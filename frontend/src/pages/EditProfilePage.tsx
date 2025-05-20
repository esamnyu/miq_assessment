// frontend/src/pages/EditProfilePage.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile, updateMyProfile, type EmployeeResponse } from '../services/employeeService';
import { updateProfileSchema } from '../schemas/employeeSchemas';
import type { UpdateProfileFormInputs } from '../schemas/employeeSchemas';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current profile data to pre-fill the form
  const { data: currentProfile, isLoading: isLoadingProfile, isError: isProfileError, error: profileError } = useQuery<EmployeeResponse, Error>({
    queryKey: ['myProfile', token], // Use the same queryKey as ProfilePage to leverage caching
    queryFn: () => {
      if (!token) throw new Error("Authentication token not found.");
      return getMyProfile(token);
    },
    enabled: !!token, // Only run if token exists
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
  });

  const form = useForm<UpdateProfileFormInputs>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { // Default values will be overridden by useEffect once profile data loads
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      email: '',
      phone: '',
    },
  });

  // Pre-fill form with fetched profile data
  useEffect(() => {
    if (currentProfile) {
      form.reset({
        firstName: currentProfile.first_name,
        lastName: currentProfile.last_name,
        jobTitle: currentProfile.job_title,
        department: currentProfile.department,
        email: currentProfile.email,
        phone: currentProfile.phone || '', // Handle null phone
      });
    }
  }, [currentProfile, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileFormInputs) => {
      if (!token) throw new Error("Authentication token not found for update.");
      
      // Map field names for the backend if they differ from frontend form names
      // Fixed: Type-safe payload construction
      const payload: Record<string, any> = {
        first_name: data.firstName,
        last_name: data.lastName,
        job_title: data.jobTitle,
        department: data.department,
        email: data.email,
      };
      
      // Only add phone if it has a value, otherwise omit it completely
      // (backend will interpret absence as "don't change" rather than "set to null")
      if (data.phone === '') {
        payload.phone = null; // Explicitly set to null if empty string
      } else if (data.phone !== undefined) {
        payload.phone = data.phone; // Only set if defined and not empty
      }

      return updateMyProfile(payload, token);
    },
    onSuccess: (updatedData) => {
      alert("Profile Updated! Your profile information has been successfully updated.");
      queryClient.invalidateQueries({ queryKey: ['myProfile'] }); // Invalidate cache to refetch on ProfilePage
      navigate('/profile');
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.detail || (error instanceof Error ? error.message : "An unexpected error occurred.");
      alert(`Update Failed: ${errorMessage}`);
      console.error("Update profile error:", error);
    },
  });

  const onSubmit = (data: UpdateProfileFormInputs) => {
    updateMutation.mutate(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold">Error Loading Profile</h3>
          <p>
            Could not load your profile data for editing. {(profileError as any)?.data?.detail || profileError.message}
          </p>
        </div>
        <button 
          onClick={() => navigate('/profile')} 
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-lg">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Edit Your Profile</h2>
          <p className="text-gray-600">Update your personal and professional information.</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                placeholder="Your first name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                placeholder="Your last name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
              <input
                type="tel"
                placeholder="+1234567890"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                placeholder="Your job title"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("jobTitle")}
              />
              {form.formState.errors.jobTitle && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.jobTitle.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                placeholder="Your department"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                {...form.register("department")}
              />
              {form.formState.errors.department && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.department.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;