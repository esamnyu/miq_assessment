import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';

// Your custom imports
import { loginSchema } from '../schemas/authSchemas';
import type { LoginFormInputs } from '../schemas/authSchemas';
import { loginUser } from '../services/authService';
import { getMyProfile } from '../services/employeeService'; // Import getMyProfile function
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      // First set the token
      contextLogin(data.access_token);
      
      try {
        // Then fetch the user profile to get role information
        const userProfile = await getMyProfile(data.access_token);
        
        // Update Auth context with complete user data including role
        contextLogin(data.access_token, {
          username: userProfile.username,
          role: userProfile.role,
          // Add other fields if needed
        });
        
        alert("Login Successful! Redirecting to your profile...");
        navigate('/profile');
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Still navigate but without complete user data
        alert("Login Successful! Redirecting to your profile...");
        navigate('/profile');
      }
    },
    onError: (error: any) => {
      // Improved error message extraction
      let errorMessage = "An unexpected error occurred during login.";
      if (error && error.data && error.data.detail) {
        errorMessage = error.data.detail;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Login Failed: ${errorMessage}`);
      console.error("Login error:", error);
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 space-y-1 text-center border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your credentials to access your account.
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                placeholder="your_username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 
                          focus:ring-blue-500 focus:border-transparent"
                disabled={loginMutation.isPending}
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 
                          focus:ring-blue-500 focus:border-transparent"
                disabled={loginMutation.isPending}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;