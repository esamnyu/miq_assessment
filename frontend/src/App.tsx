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
// Import HR page components
import HRDashboardPage from './pages/HRDashboardPage';
import HREmployeeEditPage from './pages/HREmployeeEditPage';
// Import your route protection components
import ProtectedRoute from './components/auth/ProtectedRoute';
import HRProtectedRoute from './components/auth/HRProtectedRoute'; // You'll need to create this file
// Import Sonner's Toaster instead of shadcn/ui toaster
import { Toaster } from "sonner";

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
            
            {/* Protected routes for any authenticated user */}
            <Route element={<ProtectedRoute />}>
              {/* Simpler protected routes for direct access */}
              <Route path="/" element={<Navigate to="/profile" replace />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
            </Route>
            
            {/* HR-only protected routes */}
            <Route element={<HRProtectedRoute />}>
              <Route path="/hr/dashboard" element={<HRDashboardPage />} />
              <Route path="/hr/employees/:employeeId/edit" element={<HREmployeeEditPage />} />
              <Route path="/hr/employees/:employeeId/salary" element={<HREmployeeEditPage />} />
            </Route>
            
            {/* Catch-all for 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster /> {/* <--- Now using Sonner's Toaster component */}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;