// Updated App.tsx with proper types and MCP Demo route
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import your AuthProvider
import { AuthProvider } from './contexts/AuthContext';
// Import your page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NotFoundPage from './pages/NotFoundPage';
// Import HR page components
import HRDashboardPage from './pages/HRDashboardPage';
import HREmployeeEditPage from './pages/HREmployeeEditPage';
import HRSalaryManagePage from './pages/HRSalaryManagePage';
// Import the MCP Demo page
import MCPDemoPage from './pages/MCPDemoPage';
// Import your route protection components
import ProtectedRoute from './components/auth/ProtectedRoute';
import HRProtectedRoute from './components/auth/HRProtectedRoute';
// Import Toaster component
import { Toaster } from "sonner";

// Create a client for TanStack Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth pages with AuthLayout */}
            <Route element={
              <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
                <div className="w-full max-w-md">
                  <Outlet />
                </div>
              </div>
            }>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            
            {/* Protected routes inside AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                  {/* Header and navigation */}
                  <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <div className="container mx-auto p-4 flex justify-between items-center">
                      <div className="font-semibold text-xl">Employee Portal</div>
                      {/* User menu will be added in the AppLayout component */}
                    </div>
                  </header>
                  <main className="container mx-auto py-6 px-4">
                    <Outlet />
                  </main>
                </div>
              }>
                {/* Default route */}
                <Route path="/" element={<Navigate to="/profile" replace />} />
                
                {/* User routes */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/mcp-demo" element={<MCPDemoPage />} />
                
                {/* HR-only routes */}
                <Route element={<HRProtectedRoute />}>
                  <Route path="/hr/dashboard" element={<HRDashboardPage />} />
                  <Route path="/hr/employees/:employeeId/edit" element={<HREmployeeEditPage />} />
                  <Route path="/hr/employees/:employeeId/salary" element={<HRSalaryManagePage />} />
                </Route>
              </Route>
            </Route>
            
            {/* Not Found page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;