import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query'; // To reset query cache on logout

// Define the shape of your user object if you plan to store it
// For MVP, we might only store the token, but this is for future expansion
interface User {
  // Example properties - you'd get these by decoding the JWT or from a /me endpoint
  username: string;
  role: string;
  // Add other relevant user properties
}

interface AuthContextType {
  token: string | null;
  user: User | null; // For MVP, this might start as null and be populated later
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial token check
  login: (token: string, userData?: User) => void; // userData is optional for MVP
  logout: () => void;
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
      // For a more robust MVP or production, you would:
      // 1. Decode the JWT here to get user info (like username, role, expiry).
      // 2. Optionally, make a /me request to the backend to validate the token and fetch fresh user data.
      // For this simple MVP, we're just trusting the stored token.
      // If you decode, you can set the user state here:
      // const decodedUser = decodeToken(storedToken); // Implement decodeToken
      // setUser(decodedUser);
    }
    setIsLoading(false); // Done checking
  }, []);

  const login = useCallback((newToken: string, userData?: User) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    if (userData) {
      setUser(userData);
      // Optionally store userData in localStorage too, but be mindful of size and sensitivity
    }
    // You might want to navigate or refetch user-specific queries here
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    // localStorage.removeItem('userData'); // if you store user data
    // Clear React Query cache to remove stale protected data
    queryClient.clear();
    // Navigate to login page (usually done in the component calling logout)
    // window.location.href = '/login'; // Or use useNavigate if called from a component
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user, // Provide user state
        isAuthenticated: !!token, // True if token exists
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