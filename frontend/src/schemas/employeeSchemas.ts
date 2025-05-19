import { z } from 'zod';

// Schema for Employee Self-Registration
export const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." })
    .max(50, { message: "Username cannot exceed 50 characters." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
  firstName: z.string().min(1, { message: "First name is required." })
    .max(50, { message: "First name cannot exceed 50 characters." }),
  lastName: z.string().min(1, { message: "Last name is required." })
    .max(50, { message: "Last name cannot exceed 50 characters." }),
  jobTitle: z.string().min(1, { message: "Job title is required." })
    .max(100, { message: "Job title cannot exceed 100 characters." }),
  department: z.string().min(1, { message: "Department is required." })
    .max(100, { message: "Department cannot exceed 100 characters." }),
  email: z.string().email({ message: "Invalid email address." })
    .min(1, { message: "Email is required." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  phone: z.string().optional()
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), { // Basic E.164 format validation, can be adjusted
      message: "Invalid phone number format.",
    }),
  // 'role' is usually set by the backend during self-registration to a default like 'employee'.
  // If you were to allow role selection on the frontend (e.g., for an admin panel), you'd add it here.
  // For self-registration, the backend `EmployeeCreate` model's default `role: "employee"` will be used.
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // Path of the error for react-hook-form
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;

// Schema for Updating Employee Profile (Self-Service by Employee)
// Fields are optional as the user might only want to update one or two things.
// The backend `EmployeeUpdate` model also expects optional fields.
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." })
    .max(50, { message: "First name cannot exceed 50 characters." }).optional(),
  lastName: z.string().min(1, { message: "Last name is required." })
    .max(50, { message: "Last name cannot exceed 50 characters." }).optional(),
  jobTitle: z.string().min(1, { message: "Job title is required." })
    .max(100, { message: "Job title cannot exceed 100 characters." }).optional(),
  department: z.string().min(1, { message: "Department is required." })
    .max(100, { message: "Department cannot exceed 100 characters." }).optional(),
  email: z.string().email({ message: "Invalid email address." })
    .min(1, { message: "Email is required." })
    .max(100, { message: "Email cannot exceed 100 characters." }).optional(),
  phone: z.string().optional()
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Invalid phone number format.",
    }).or(z.literal('')), // Allow empty string to clear the field
  // Password, username, and role changes are typically handled through separate, more secure processes
  // and are not part of a general profile update by the employee themselves.
});

export type UpdateProfileFormInputs = z.infer<typeof updateProfileSchema>;

// You might also want a schema for HR/Admin updates if it differs
// (e.g., if an HR admin can update fields an employee cannot).
// For now, the backend's /employees/admin/{id} endpoint reuses EmployeeUpdate,
// so this schema would be similar to updateProfileSchema but potentially used in a different form.