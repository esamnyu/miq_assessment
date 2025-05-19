import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import your AuthProvider
import { AuthProvider } from './contexts/AuthContext'; // Make sure this path is correct

// Import your page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Import your ProtectedRoute component
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import shadcn/ui Toaster for notifications
import { Toaster } from "@/components/ui/toaster"; // Adjust path if your shadcn setup is different

// Create a client for TanStack Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* <--- Wrap your app with AuthProvider HERE */}
        <BrowserRouter>
          {/* You might have a global layout component here if needed */}
          {/* For example, a Navbar that uses useAuth() hook */}
          {/* <Navbar /> */}

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              {/* Simpler protected routes for direct access */}
              <Route path="/" element={<Navigate to="/profile" replace />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              {/* Add other protected routes here */}
            </Route>

            {/* Catch-all for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster /> {/* <--- Add Toaster here for shadcn/ui notifications */}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;