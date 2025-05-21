// src/pages/HRDashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllEmployees } from '../services/employeeService';

const HRDashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['allEmployees', token],
    queryFn: () => getAllEmployees(token!),
    enabled: !!token && user?.role === 'hr',
    // Better error handling and retry policy
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return (
    <div className="container mx-auto p-8">
      <div className="flex justify-center items-center">
        <div className="animate-pulse">Loading employees data...</div>
      </div>
    </div>
  );
  
  // Show error but don't crash the page
  const hasError = error !== null;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <div className="flex space-x-3">
            <Link to="/mcp-demo">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                MCP Demo
              </button>
            </Link>
            <Link to="/profile">
              <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">
                Back to Profile
              </button>
            </Link>
          </div>
        </div>
        
        {/* Info banner about MCP Demo */}
        <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Pro Tip:</span> Check out the MCP Demo to see how our Model-Context-Protocol enables AI agents and services to access employee data.
          </p>
        </div>
      </div>
      
      {hasError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          <h3 className="font-bold">Error Loading Data</h3>
          <p>There was a problem fetching employee data. Please try again later.</p>
        </div>
      )}
      
      {employees.length === 0 && !isLoading && !hasError ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          <h3 className="font-bold">No Employees Found</h3>
          <p>There are no employees in the system yet.</p>
        </div>
      ) : (
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
              {employees.map((employee) => (
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
      )}
    </div>
  );
};

export default HRDashboardPage;