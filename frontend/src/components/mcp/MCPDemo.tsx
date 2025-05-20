import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  employeeMCPRequest, 
  getEmployeeByIdMCP,
  searchEmployeesMCP,
  listEmployeesMCP,
  type EmployeeResponse 
} from '../../services/employeeService';

const MCPDemo: React.FC = () => {
  const { token } = useAuth();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDirectMCPCall = async () => {
    setLoading(true);
    setError(null);
    try {
      // Example of direct MCP call
      const response = await employeeMCPRequest(
        'list_employees',
        { limit: 5 },
        token || undefined
      );
      setResult(response);
    } catch (err) {
      setError('Error making MCP request: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleGetEmployeeById = async () => {
    if (!employeeId) {
      setError('Please enter an employee ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const employee = await getEmployeeByIdMCP(employeeId, token || undefined);
      setResult(employee);
    } catch (err) {
      setError('Error getting employee: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmployees = async () => {
    if (!searchName) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const employees = await searchEmployeesMCP(searchName, 10, token || undefined);
      setResult(employees);
    } catch (err) {
      setError('Error searching employees: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleListEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const employees = await listEmployeesMCP(10, token || undefined);
      setResult(employees);
    } catch (err) {
      setError('Error listing employees: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">MCP API Demo</h2>
      
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Direct MCP Request</h3>
          <button 
            onClick={handleDirectMCPCall}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Make Direct MCP Call
          </button>
        </div>
        
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Get Employee by ID</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button 
              onClick={handleGetEmployeeById}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Get Employee
            </button>
          </div>
        </div>
        
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Search Employees</h3>
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter name to search"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button 
              onClick={handleSearchEmployees}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Search Employees
            </button>
          </div>
        </div>
        
        <div className="pb-4">
          <h3 className="text-lg font-semibold mb-2">List All Employees</h3>
          <button 
            onClick={handleListEmployees}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            List Employees
          </button>
        </div>
        
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Processing request...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPDemo;