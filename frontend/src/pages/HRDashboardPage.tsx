// src/pages/HRDashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllEmployees } from '../services/employeeService'; // You'll need to create this function

const HRDashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Make sure only HR can access this page
  React.useEffect(() => {
    if (user && user.role !== 'hr' && user.role !== 'manager' && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, navigate]);

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['allEmployees', token],
    queryFn: () => getAllEmployees(token!),
    enabled: !!token && (user?.role === 'hr' || user?.role === 'manager' || user?.role === 'admin'),
  });

  if (isLoading) return <div className="p-8">Loading employees...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading employees: {(error as Error).message}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees?.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{employee.first_name} {employee.last_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{employee.job_title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{employee.department}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{employee.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => navigate(`/hr/employees/${employee.id}/salary`)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Manage Salary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRDashboardPage;