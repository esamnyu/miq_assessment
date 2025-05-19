// frontend/src/pages/EditProfilePage.tsx
import React, { useEffect } from 'react';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyProfile, updateMyProfile, EmployeeResponse } from '../services/employeeService';
import { updateProfileSchema } from '../schemas/employeeSchemas';
import type { UpdateProfileFormInputs } from '../schemas/employeeSchemas';

// Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
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
      // Filter out fields that weren't touched or are empty, matching backend expectations
      const changedData: Partial<UpdateProfileFormInputs> = {};
      (Object.keys(data) as Array<keyof UpdateProfileFormInputs>).forEach(key => {
        if (form.formState.dirtyFields[key] || data[key] !== currentProfile?.[key as keyof EmployeeResponse]) {
           if (data[key] !== undefined && data[key] !== null ) { // Ensure not sending undefined/null unless intended
             // Map frontend field names to backend field names if they differ
             if (key === 'firstName') changedData.first_name = data[key];
             else if (key === 'lastName') changedData.last_name = data[key];
             else if (key === 'jobTitle') changedData.job_title = data[key];
             else changedData[key as keyof UpdateProfileFormInputs] = data[key] as any; // Adjust mapping if needed
           }
        }
      });


      // Map field names for the backend if they differ from frontend form names
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        job_title: data.jobTitle,
        department: data.department,
        email: data.email,
        phone: data.phone === '' ? null : data.phone, // Send null if phone is cleared
      };

      return updateMyProfile(payload, token);
    },
    onSuccess: (updatedData) => {
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] }); // Invalidate cache to refetch on ProfilePage
      // queryClient.setQueryData(['myProfile', token], updatedData); // Optionally, optimistically update cache
      navigate('/profile');
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.detail || (error instanceof Error ? error.message : "An unexpected error occurred.");
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      });
      console.error("Update profile error:", error);
    },
  });

  const onSubmit = (data: UpdateProfileFormInputs) => {
    updateMutation.mutate(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <Card>
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            Could not load your profile data for editing. {(profileError as any)?.data?.detail || profileError.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/profile')} className="mt-4">Back to Profile</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Your Profile</CardTitle>
          <CardDescription>Update your personal and professional information.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'firstName'> }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input placeholder="Your first name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'lastName'> }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Your last name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'email'> }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'phone'> }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input placeholder="+1234567890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'jobTitle'> }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl><Input placeholder="Your job title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }: { field: ControllerRenderProps<UpdateProfileFormInputs, 'department'> }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl><Input placeholder="Your department" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Username, Password, and Role are typically not editable by the user in this form */}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !form.formState.isDirty}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default EditProfilePage;