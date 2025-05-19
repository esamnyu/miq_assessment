import React from 'react';
// Updated import from react-hook-form
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';

// Shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

// Your custom imports
import { registerSchema } from '../schemas/employeeSchemas';
import type { RegisterFormInputs } from '../schemas/employeeSchemas';
import { registerUser } from '../services/employeeService';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // ... (mutation and onSubmit logic remains the same)
  const registrationMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast({
        title: "Registration Successful!",
        description: `Welcome, ${data.first_name}! Please log in.`,
      });
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
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
      console.error("Registration error:", error);
    },
  });

  const onSubmit = (data: RegisterFormInputs) => {
    registrationMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>
            Fill in the details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              {/* Example for firstName */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'firstName'> }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Example for lastName */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'lastName'> }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Apply similar typing to other FormField render props */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'email'> }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'phone'> }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'jobTitle'> }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'department'> }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'username'> }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'password'> }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }: { field: ControllerRenderProps<RegisterFormInputs, 'confirmPassword'> }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" disabled={registrationMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={registrationMutation.isPending}>
                {registrationMutation.isPending ? 'Registering...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;