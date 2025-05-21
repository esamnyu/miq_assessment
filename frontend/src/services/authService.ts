// frontend/src/services/authService.ts
import axios from 'axios';
// Assuming authSchemas.ts is in the ../schemas/ directory relative to the services directory
import type { LoginFormInputs } from '../schemas/authSchemas';

// Ensure your .env file in the frontend directory has VITE_API_BASE_URL defined
// Example: VITE_API_BASE_URL=http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-eight-ivory-36.vercel.app';

/**
 * Interface for the expected successful response from the /token endpoint.
 * This should match what your backend's /token route returns.
 */
interface TokenResponse {
  access_token: string;
  token_type: string; // Typically "bearer"
}

/**
 * Logs in a user by calling the backend's /token endpoint.
 * @param loginData - The user's login credentials (username and password).
 * @returns A promise that resolves to the token response from the backend.
 */
export const loginUser = async (loginData: LoginFormInputs): Promise<TokenResponse> => {
  // The backend's /token endpoint, when using FastAPI's OAuth2PasswordRequestForm,
  // expects the data to be in 'application/x-www-form-urlencoded' format.
  const params = new URLSearchParams();
  params.append('username', loginData.username);
  params.append('password', loginData.password);
  // If your backend expects 'grant_type' (though typically not needed if directly using OAuth2PasswordRequestForm),
  // you would append it here, e.g., params.append('grant_type', 'password');

  try {
    const response = await axios.post<TokenResponse>(`${API_BASE_URL}/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Re-throw the error.response object itself.
      // This allows components using this service (e.g., via useMutation)
      // to access detailed error information like error.response.data.detail.
      throw error.response;
    }
    // For non-Axios errors or Axios errors without a response object, re-throw the original error.
    throw error;
  }
};

// If you had other auth-related service functions (e.g., forgot password, refresh token),
// they would go here. For now, loginUser is the primary one based on your current setup.