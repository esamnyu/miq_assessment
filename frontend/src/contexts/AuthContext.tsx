import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react'; // Corrected: Type-only import for ReactNode
import { useQueryClient } from '@tanstack/react-query'; // To reset query cache on logout

// Define the shape of your user object if you plan to store it
// For MVP, we might only store the token, but this is for future expansion
interface User {
  // Example properties - you'd get these by decoding the JWT or from a /me endpoint
  username: string; // Ensure this matches what you get from your token or /me endpoint
  role: string;
  // Add other relevant user properties like id, email, firstName, lastName if available and needed globally
  // id?: string;
  // email?: string;
  // firstName?: string;
  // lastName?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null; // For MVP, this might start as null and be populated later
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial token check
  login: (token: string, userData?: User) => void; // userData is optional for MVP
  logout: () => void;
  // fetchUser: () => Promise<void>; // Optional: if you want to explicitly fetch user data after login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // User state
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check localStorage
  const queryClient = useQueryClient(); // Get query client instance

  // Effect to check for a token in localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // For a more robust MVP or production, you would typically:
      // 1. Decode the JWT here to get basic user info (like username, role, expiry).
      //    Be cautious about relying solely on JWT for all user data as it can be stale.
      // 2. Optionally, make a /employees/me request to the backend to validate the token
      //    and fetch fresh, complete user data. This is generally a good practice.

      // Example of decoding (you'd need a JWT decoding library like 'jwt-decode'):
      // try {
      //   const decodedToken: any = jwtDecode(storedToken); // Use a library like jwt-decode
      //   // Ensure the token isn't expired if the library doesn't do it
      //   if (decodedToken.exp * 1000 > Date.now()) {
      //     setUser({ username: decodedToken.sub, role: decodedToken.role || 'employee' /* adapt as per your token structure */ });
      //   } else {
      //     localStorage.removeItem('authToken'); // Token expired
      //     setToken(null);
      //   }
      // } catch (error) {
      //   console.error("Failed to decode token:", error);
      //   localStorage.removeItem('authToken');
      //   setToken(null);
      // }
    }
    setIsLoading(false); // Done checking
  }, []);

  const login = useCallback((newToken: string, userData?: User) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    if (userData) {
      setUser(userData);
      // Optionally store userData in localStorage too, but be mindful of size and sensitivity
      // localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      // If userData is not provided immediately, you might want to fetch it.
      // For example, by decoding the token (again, be cautious with stale data)
      // or by triggering a /me request.
      // Example with decoding (requires a JWT decoding library):
      // try {
      //   const decodedToken: any = jwtDecode(newToken);
      //   setUser({ username: decodedToken.sub, role: decodedToken.role || 'employee' });
      // } catch (error) {
      //   console.error("Failed to decode token on login:", error);
      //   // Handle appropriately, maybe logout or clear user
      // }
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData'); // if you stored user data
    queryClient.clear(); // Clear React Query cache
    // Navigation to /login is usually handled by the component calling logout
    // or by ProtectedRoute redirecting.
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};