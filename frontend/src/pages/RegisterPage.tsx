import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';

// Your custom imports
import { registerSchema } from '../schemas/employeeSchemas';
import type { RegisterFormInputs } from '../schemas/employeeSchemas';
import { registerUser } from '../services/employeeService';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      email: '',
      phone: '',
    },
  });

  const registrationMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      alert(`Registration Successful! Welcome, ${data.first_name}! Please log in.`);
      navigate('/login');
    },
    onError: (error: any) => {
      let errorMessage = "An unexpected error occurred during registration.";
      if (error && error.data && error.data.detail) {
        if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (Array.isArray(error.data.detail) && error.data.detail.length > 0 && error.data.detail[0].msg) {
          errorMessage = error.data.detail.map((err: any) => `${err.loc.join('.')} - ${err.msg}`).join('; ');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Registration Failed: ${errorMessage}`);
      console.error("Registration error:", error);
    },
  });

  const onSubmit = (data: RegisterFormInputs) => {
    registrationMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="text-gray-600">
            Fill in the details below to get started.
          </p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              placeholder="John"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('firstName')}
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              placeholder="Doe"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('lastName')}
            />
            {form.formState.errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="john.doe@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
            <input
              type="tel"
              placeholder="+1234567890"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('phone')}
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              placeholder="Software Engineer"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('jobTitle')}
            />
            {form.formState.errors.jobTitle && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.jobTitle.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              placeholder="Technology"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('department')}
            />
            {form.formState.errors.department && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.department.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              placeholder="johndoe"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('username')}
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={registrationMutation.isPending}
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={registrationMutation.isPending}
          >
            {registrationMutation.isPending ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;