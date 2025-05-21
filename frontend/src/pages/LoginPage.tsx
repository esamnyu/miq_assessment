// frontend/src/pages/LoginPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

// Import UI components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LogIn } from 'lucide-react';

// Your custom imports
import { loginSchema } from '../schemas/authSchemas';
import type { LoginFormInputs } from '../schemas/authSchemas';
import { loginUser } from '../services/authService';
import { getMyProfile } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  // Initialize form with validation
  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Login mutation
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
        });
        
        toast.success("Login successful!", {
          description: "Redirecting to your profile...",
        });
        
        // Redirect to profile page
        navigate('/profile');
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Still navigate but without complete user data
        toast.success("Login successful!", {
          description: "Redirecting to your profile...",
        });
        navigate('/profile');
      }
    },
    onError: (error: any) => {
      // Improved error handling
      let errorMessage = "Invalid username or password.";
      
      if (error && error.data && error.data.detail) {
        errorMessage = error.data.detail;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error("Login failed", {
        description: errorMessage,
      });
      
      console.error("Login error:", error);
    },
  });

  // Form submission handler
  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your username" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
                  OR
                </span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate('/register')}
              >
                Create new account
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="w-full">
              By signing in, you agree to our 
              <a href="#" className="underline underline-offset-4 hover:text-primary"> Terms of Service </a> 
              and 
              <a href="#" className="underline underline-offset-4 hover:text-primary"> Privacy Policy</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;