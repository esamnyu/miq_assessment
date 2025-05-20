// src/pages/HREmployeeEditPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeById, updateEmployeeAsAdmin } from '../services/employeeService'; // You'll need to create these
import { updateProfileSchema } from '../schemas/employeeSchemas';
import type { UpdateProfileFormInputs } from '../schemas/employeeSchemas';

const HREmployeeEditPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  // Authorization check
  React.useEffect(() => {
    if (user && user.role !== 'hr' && user.role !== 'manager' && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, navigate]);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', employeeId, token],
    queryFn: () => getEmployeeById(employeeId!, token!),
    enabled: !!employeeId && !!token,
  });

  const form = useForm<UpdateProfileFormInputs>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      email: '',
      phone: '',
    },
  });

  // Pre-fill form when employee data loads
  React.useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.first_name,
        lastName: employee.last_name,
        jobTitle: employee.job_title,
        department: employee.department,
        email: employee.email,
        phone: employee.phone || '',
      });
    }
  }, [employee, form]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileFormInputs) => {
      if (!employeeId || !token) throw new Error("Missing employee ID or token");
      return updateEmployeeAsAdmin(employeeId, data, token);
    },
    onSuccess: () => {
      toast.success("Employee information updated successfully");
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['allEmployees'] });
      navigate('/hr/dashboard');
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message || "Unknown error"}`);
    },
  });

  const onSubmit = (data: UpdateProfileFormInputs) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8">Loading employee data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {(error as Error).message}</div>;
  if (!employee) return <div className="p-8">Employee not found</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Edit Employee: {employee.first_name} {employee.last_name}</h1>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              {...form.register("department")}
            />
            {form.formState.errors.department && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.department.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/hr/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HREmployeeEditPage;