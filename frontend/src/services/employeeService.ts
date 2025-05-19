import axios from 'axios';
// Assuming your schema file is in the parent directory relative to 'services'
import type { RegisterFormInputs } from '../schemas/employeeSchemas';
import type { UpdateProfileFormInputs } from '../schemas/employeeSchemas'; // For a future function

// Define your API base URL - ideally from an environment variable
// For Vite, environment variables prefixed with VITE_ are exposed to the client-side code.
// Make sure you have a .env file in your frontend directory with VITE_API_BASE_URL=http://localhost:8000 (or your actual backend URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Interface for the expected successful response from POST /employees/
// This should match your backend's EmployeeResponse Pydantic model
export interface EmployeeResponse {
  id: string;
  username: string; // Assuming username is returned, adjust if not
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  email: string;
  phone?: string | null; // Allow null if the backend might return null
  role: string;
  created_at: string; // Or Date, if you parse it immediately
  // salary is confidential and should not be in this general response
}

/**
 * Registers a new user.
 * @param userData - The registration form data.
 * @returns A promise that resolves to the created employee's data.
 */
export const registerUser = async (userData: RegisterFormInputs): Promise<EmployeeResponse> => {
  // The backend's EmployeeCreate model expects:
  // username, password, first_name, last_name, job_title, department, email, phone (optional), role (defaults to 'employee')
  // We don't send confirmPassword to the backend.
  const { confirmPassword, ...payload } = userData;

  try {
    // The backend endpoint for creating employees is POST /employees/
    const response = await axios.post<EmployeeResponse>(`${API_BASE_URL}/employees/`, payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // The backend likely returns a JSON error object with a 'detail' field
      // Re-throw the error.response so useMutation's onError can access error.response.data.detail
      throw error.response;
    }
    // For non-Axios errors or errors without a response object
    throw error;
  }
};

/**
 * Fetches the current logged-in user's profile.
 * Requires an authorization token to be set in the Axios instance or passed.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to the employee's profile data.
 */
export const getMyProfile = async (token: string): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get<EmployeeResponse>(`${API_BASE_URL}/employees/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};

/**
 * Updates the current logged-in user's profile.
 * Requires an authorization token.
 * @param userData - The profile data to update.
 * @param token - The JWT token for authorization.
 * @returns A promise that resolves to the updated employee's profile data.
 */
export const updateMyProfile = async (userData: UpdateProfileFormInputs, token: string): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put<EmployeeResponse>(`${API_BASE_URL}/employees/me`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};

// Add other employee-related service functions here as needed, e.g.:
// - Functions for HR to manage users (if applicable from this service)
// - Function to call the microservice endpoint GET /employees/api/employee