import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react'; // Corrected: Type-only import for ReactNode
import { useQueryClient } from '@tanstack/react-query'; // To reset query cache on logout
import { getMyProfile } from '../services/employeeService'; // Import to fetch user profile

// Define the shape of your user object if you plan to store it
interface User {
  username: string;
  role: string;
  // Add other relevant user properties as needed
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial token check
  login: (token: string, userData?: User) => void;
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
    const storedUserData = localStorage.getItem('userData');
    
    console.log("AuthContext - Initializing with stored data:", { 
      hasToken: !!storedToken,
      hasUserData: !!storedUserData 
    });
    
    if (storedToken) {
      setToken(storedToken);
      
      // Try to load user data from localStorage first
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          console.log("AuthContext - Loaded user data from localStorage:", userData);
          setUser(userData);
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to parse stored user data:", error);
          // If parsing fails, we'll fetch the profile below
        }
      }
      
      // If we don't have stored user data, fetch it from the API
      if (!storedUserData) {
        setIsLoading(true);
        getMyProfile(storedToken)
          .then(profile => {
            const userData = {
              username: profile.username,
              role: profile.role
              // Add other fields as needed
            };
            console.log("AuthContext - Fetched user profile:", userData);
            setUser(userData);
            localStorage.setItem('userData', JSON.stringify(userData));
          })
          .catch(error => {
            console.error("Failed to fetch user profile:", error);
            // If fetching fails, token might be invalid
            localStorage.removeItem('authToken');
            setToken(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, userData?: User) => {
    console.log("AuthContext - Login called with userData:", userData);
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    
    if (userData) {
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      console.log("AuthContext - User data saved to localStorage:", userData);
    } else {
      // If userData is not provided, we'll fetch it from the API
      console.log("AuthContext - No userData provided, will attempt to fetch profile");
      getMyProfile(newToken)
        .then(profile => {
          const userData = {
            username: profile.username,
            role: profile.role
            // Add other fields as needed
          };
          console.log("AuthContext - Fetched user profile:", userData);
          setUser(userData);
          localStorage.setItem('userData', JSON.stringify(userData));
        })
        .catch(error => {
          console.error("Failed to fetch user profile:", error);
        });
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData'); // Clear user data
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