import axios from 'axios';
// Assuming your schema file is in the parent directory relative to 'services'
import type { RegisterFormInputs } from '../schemas/employeeSchemas';
import type { UpdateProfileFormInputs } from '../schemas/employeeSchemas';

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

// Interface for confidential employee data including salary
export interface EmployeeConfidential extends EmployeeResponse {
  salary?: number | null;
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
  const { confirmPassword, ...formData } = userData;
  
  // Map frontend field names to backend field names
  const payload = {
    username: formData.username,
    password: formData.password,
    first_name: formData.firstName,
    last_name: formData.lastName,
    job_title: formData.jobTitle,
    department: formData.department,
    email: formData.email,
    phone: formData.phone || null, // Convert empty string to null if needed
    role: 'employee' // Default role for self-registration
  };

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
export const updateMyProfile = async (payload: Record<string, any>, token: string): Promise<EmployeeResponse> => {
  try {
    const response = await axios.put<EmployeeResponse>(`${API_BASE_URL}/employees/me`, payload, {
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
 * Fetches an employee by ID or name using the microservice endpoint.
 * This can be used by other internal systems to retrieve employee data.
 * @param params - Object containing either employeeId or name to search by.
 * @param token - The JWT token for authorization (optional, depending on if the endpoint requires it).
 * @returns A promise that resolves to the employee data or an array of employees if multiple match.
 */
export const getEmployeeByIdOrName = async (
  params: { employeeId?: string; name?: string },
  token?: string
): Promise<EmployeeResponse | EmployeeResponse[]> => {
  const { employeeId, name } = params;
  
  if (!employeeId && !name) {
    throw new Error("Either employeeId or name must be provided");
  }
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (employeeId) queryParams.append('employee_id', employeeId);
  if (name) queryParams.append('name', name);
  
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await axios.get<EmployeeResponse | EmployeeResponse[]>(
      `${API_BASE_URL}/employees/api/employee?${queryParams.toString()}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};

/** 
 * HR ADMIN FUNCTIONS
 * The following functions are for HR/Admin use only and require appropriate permissions
 */

/**
 * Get all employees (for HR dashboard)
 * @param token - The JWT token for authorization
 * @returns A promise that resolves to an array of employee data
 */
export const getAllEmployees = async (token: string): Promise<EmployeeResponse[]> => {
  try {
    // Use a wildcard search that will match most/all employees
    // The empty string for name parameter should match employees with any name
    const response = await axios.get<EmployeeResponse | EmployeeResponse[]>(
      `${API_BASE_URL}/employees/api/employee?name=%`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Handle the case where the API might return a single employee or an array
    let employees: EmployeeResponse[];
    if (Array.isArray(response.data)) {
      employees = response.data;
    } else {
      employees = [response.data];
    }
    
    console.log("Retrieved employees:", employees.length);
    return employees;
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    if (axios.isAxiosError(error) && error.response) {
      // If API returns 404 or error, return empty array to avoid breaking the UI
      if (error.response.status === 404) {
        return [];
      }
      throw error.response;
    }
    throw error;
  }
};

/**
 * Get a single employee by ID for HR/Admin view
 * @param employeeId - The ID of the employee to retrieve
 * @param token - The JWT token for authorization
 * @returns A promise that resolves to the employee's data
 */
export const getEmployeeById = async (employeeId: string, token: string): Promise<EmployeeResponse> => {
  try {
    // You may need to create this endpoint, or you can use the existing getEmployeeByIdOrName function
    return await getEmployeeByIdOrName({ employeeId }, token) as EmployeeResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};

/**
 * Get employee with confidential data (includes salary)
 * @param employeeId - The ID of the employee to retrieve confidential info for
 * @param token - The JWT token for authorization
 * @returns A promise that resolves to the employee's confidential data
 */
export const getEmployeeConfidential = async (employeeId: string, token: string): Promise<EmployeeConfidential> => {
  try {
    // You'll need to create this endpoint in your backend
    const response = await axios.get<EmployeeConfidential>(`${API_BASE_URL}/employees/${employeeId}/confidential`, {
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
 * Update employee as admin/HR (non-confidential info)
 * @param employeeId - The ID of the employee to update
 * @param data - The profile data to update
 * @param token - The JWT token for authorization
 * @returns A promise that resolves to the updated employee's data
 */
export const updateEmployeeAsAdmin = async (
  employeeId: string, 
  data: UpdateProfileFormInputs, 
  token: string
): Promise<EmployeeResponse> => {
  try {
    // Map frontend field names to backend field names
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      job_title: data.jobTitle,
      department: data.department,
      email: data.email,
      phone: data.phone || null,
    };
    
    const response = await axios.put<EmployeeResponse>(
      `${API_BASE_URL}/employees/admin/${employeeId}`, 
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};

/**
 * Update employee salary (confidential info)
 * @param employeeId - The ID of the employee to update salary for
 * @param salary - The new salary amount
 * @param token - The JWT token for authorization
 * @returns A promise that resolves to the updated employee's confidential data
 */
export const updateEmployeeSalary = async (
  employeeId: string, 
  salary: number, 
  token: string
): Promise<EmployeeConfidential> => {
  try {
    const response = await axios.put<EmployeeConfidential>(
      `${API_BASE_URL}/employees/${employeeId}/salary`, 
      { salary }, // This matches the expected format in your API
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response;
    }
    throw error;
  }
};