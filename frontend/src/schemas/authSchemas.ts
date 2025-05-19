import { z } from 'zod';

// Schema for the Login Form
export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  // You could add more specific validations later if needed, e.g.,
  // email: z.string().email({ message: "Invalid email address." }) if username is an email
  // password: z.string().min(8, { message: "Password must be at least 8 characters." })
});

// Type to infer for your Login Form data based on the schema
export type LoginFormInputs = z.infer<typeof loginSchema>;

// --- Placeholder for Registration Schema (You'll build this out next or when you do RegisterPage) ---
// export const registerSchema = z.object({
//   username: z.string().min(3, { message: "Username must be at least 3 characters." }),
//   email: z.string().email({ message: "Invalid email address." }),
//   password: z.string().min(8, { message: "Password must be at least 8 characters." }),
//   confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
//   firstName: z.string().min(1, { message: "First name is required." }),
//   lastName: z.string().min(1, { message: "Last name is required." }),
//   jobTitle: z.string().min(1, { message: "Job title is required." }),
//   department: z.string().min(1, { message: "Department is required." }),
//   phone: z.string().optional(), // Optional phone number
// })
// .refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"], // Path of error
// });

// export type RegisterFormInputs = z.infer<typeof registerSchema>;