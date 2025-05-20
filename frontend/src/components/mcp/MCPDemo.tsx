// src/components/mcp/MCPDemo.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  employeeMCPRequest, 
  getEmployeeByIdMCP,
  searchEmployeesMCP,
  listEmployeesMCP,
  type EmployeeResponse 
} from '../../services/employeeService';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserRound, Search, Users } from "lucide-react";

const MCPDemo: React.FC = () => {
  const { token } = useAuth();
  const [employeeId, setEmployeeId] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('get-employee');

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

  const renderResponse = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Processing request...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      );
    }
    
    if (!result) {
      return (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-md my-4 text-center text-gray-500">
          <p>Use the controls above to make MCP API requests</p>
        </div>
      );
    }
    
    return (
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">Response:</h3>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-md text-sm">
        <p className="font-medium text-yellow-800">MCP Demo: Exploring the Model-Context-Protocol</p>
        <p className="text-yellow-700 mt-1">
          This demo shows how MCP provides a standardized interface for AI agents and services to access employee data.
          Each request follows the MCP pattern with actions, parameters, and context.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="get-employee" className="flex items-center">
            <UserRound className="mr-2 h-4 w-4" /> Get Employee
          </TabsTrigger>
          <TabsTrigger value="search-employees" className="flex items-center">
            <Search className="mr-2 h-4 w-4" /> Search
          </TabsTrigger>
          <TabsTrigger value="list-employees" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> List All
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="get-employee">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Get employee by ID using the MCP <code>get_employee</code> action.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter employee ID"
                    disabled={loading}
                  />
                  <Button onClick={handleGetEmployeeById} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Get Employee
                  </Button>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-sm">
                  <p className="font-medium">MCP Request Format:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
{`{
  "action": "get_employee",
  "parameters": {
    "employee_id": "${employeeId || '[employee-id]'}"
  },
  "context": {
    "service": "frontend-client",
    "timestamp": "${new Date().toISOString()}"
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search-employees">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Search employees by name using the MCP <code>search_employees</code> action.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Enter name to search"
                    disabled={loading}
                  />
                  <Button onClick={handleSearchEmployees} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Search
                  </Button>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-sm">
                  <p className="font-medium">MCP Request Format:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
{`{
  "action": "search_employees",
  "parameters": {
    "name": "${searchName || '[search-term]'}",
    "limit": 10
  },
  "context": {
    "service": "frontend-client",
    "timestamp": "${new Date().toISOString()}"
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list-employees">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  List all employees using the MCP <code>list_employees</code> action.
                </p>
                <Button onClick={handleListEmployees} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  List All Employees
                </Button>

                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-sm">
                  <p className="font-medium">MCP Request Format:</p>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
{`{
  "action": "list_employees",
  "parameters": {
    "limit": 10
  },
  "context": {
    "service": "frontend-client",
    "timestamp": "${new Date().toISOString()}"
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {renderResponse()}
    </div>
  );
};

export default MCPDemo;