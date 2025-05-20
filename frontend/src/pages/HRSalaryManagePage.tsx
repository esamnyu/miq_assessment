// src/pages/HRSalaryManagePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import {
  getEmployeeById,
  updateEmployeeSalary,
  getEmployeeConfidential,
  type EmployeeResponse,
  type EmployeeConfidential
} from '../services/employeeService';

const HRSalaryManagePage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [salary, setSalary] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch employee basic info
  const {
    data: employee,
    isLoading: isLoadingEmployee,
    error: employeeError
  } = useQuery<EmployeeResponse, Error>({
    queryKey: ['employee', employeeId, token],
    queryFn: () => {
      if (!employeeId || !token) throw new Error("Missing employee ID or token");
      return getEmployeeById(employeeId, token);
    },
    enabled: !!employeeId && !!token,
  });

  // Fetch confidential info including current salary
  const {
    data: confidentialData,
    isLoading: isLoadingConfidential,
    error: confidentialError
  } = useQuery<EmployeeConfidential, Error>({
    queryKey: ['employee-confidential', employeeId, token],
    queryFn: () => {
      if (!employeeId || !token) throw new Error("Missing employee ID or token");
      return getEmployeeConfidential(employeeId, token);
    },
    enabled: !!employeeId && !!token
  });

  // Set salary input when confidential data loads
  useEffect(() => {
    // Updated line: Checks for both null and undefined
    if (confidentialData?.salary != null) {
      setSalary(confidentialData.salary.toString());
    }
  }, [confidentialData]);

  const updateSalaryMutation = useMutation({
    mutationFn: (newSalary: number) => {
      if (!employeeId || !token) throw new Error("Missing employee ID or token");
      return updateEmployeeSalary(employeeId, newSalary, token);
    },
    onSuccess: () => {
      toast.success("Salary updated successfully");
      queryClient.invalidateQueries({ queryKey: ['employee-confidential', employeeId] });
      navigate('/hr/dashboard');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown error occurred";
      toast.error(`Update failed: ${errorMessage}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate salary input
    const salaryNumber = parseFloat(salary);
    if (isNaN(salaryNumber) || salaryNumber < 0) {
      toast.error("Please enter a valid salary amount");
      setIsSubmitting(false);
      return;
    }

    updateSalaryMutation.mutate(salaryNumber);
  };

  if (isLoadingEmployee || isLoadingConfidential) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-6"></div>
            <div className="flex justify-end space-x-2">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const errorMessage = employeeError instanceof Error
    ? employeeError.message
    : confidentialError instanceof Error
      ? confidentialError.message
      : "An error occurred while loading employee data";

  if (employeeError || confidentialError) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-lg">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold">Error Loading Employee Data</h3>
          <p>{errorMessage}</p>
          <button
            onClick={() => navigate('/hr/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-lg">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-1">Manage Salary</h1>
        <p className="text-gray-600 mb-6">
          {employee?.first_name} {employee?.last_name} - {employee?.job_title}
        </p>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {/* Updated block for displaying current salary */}
          <p className="font-medium text-blue-700">
            Current Salary: {
              confidentialData?.salary != null ?
                `$${confidentialData.salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` :
                'Not set'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
              New Salary Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="salary"
                id="salary"
                step="0.01"
                min="0"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="0.00"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">USD</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/hr/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRSalaryManagePage;