// src/pages/MCPDemoPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Terminal, BookOpen } from "lucide-react";

// Import the MCP components we'll be using
import MCPDemo from '../components/mcp/MCPDemo';
import MCPExplainer from '@/components/mcp/MCPExplainer';

const MCPDemoPage: React.FC = () => {
  const { user } = useAuth();
  const canAccessHRDashboard = user?.role === 'hr' || user?.role === 'admin';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Model-Context-Protocol (MCP) Demo</h1>
        <div className="flex space-x-3">
          {canAccessHRDashboard && (
            <Link to="/hr/dashboard">
              <Button variant="outline">
                HR Dashboard
              </Button>
            </Link>
          )}
          <Link to="/profile">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Page intro card */}
      <Card className="mb-6 bg-slate-50 border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle>MCP Microservice Architecture</CardTitle>
          <CardDescription>
            This demo showcases our implementation of the Model-Context-Protocol pattern for microservice communication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            MCP is a standardized interface that enables seamless integration between services and AI agents.
            It provides a consistent, well-structured approach to data exchange that improves observability,
            error handling, and service discovery.
          </p>
        </CardContent>
      </Card>

      {/* Main content with tabs */}
      <Tabs defaultValue="explainer">
        <TabsList className="mb-4">
          <TabsTrigger value="explainer" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" /> Learn About MCP
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center">
            <Terminal className="mr-2 h-4 w-4" /> Try MCP Demo
          </TabsTrigger>
        </TabsList>

        {/* Learn About MCP Tab */}
        <TabsContent value="explainer">
          <MCPExplainer />
          
          {/* Additional MCP Explanation Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>MCP in Our Employee Onboarding Application</CardTitle>
              <CardDescription>
                How we've implemented MCP for our employee data services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Implementation Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    Our employee microservice exposes both traditional REST endpoints and an MCP endpoint 
                    that enables standardized access to employee data. The MCP endpoint follows the 
                    Model-Context-Protocol pattern to provide a consistent, well-structured interface.
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-md border">
                    <h4 className="font-medium mb-1">Key Advantages</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                      <li>
                        <span className="font-medium">Service Integration:</span> Other services can easily consume employee data
                      </li>
                      <li>
                        <span className="font-medium">AI Agent Compatibility:</span> LLM-based agents can discover and use the employee service
                      </li>
                      <li>
                        <span className="font-medium">Versioning:</span> API changes can be managed through the protocol layer
                      </li>
                      <li>
                        <span className="font-medium">Traceability:</span> Context fields enable request tracking across services
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Supported MCP Actions</h3>
                  
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <h4 className="font-medium text-blue-700 mb-1">get_employee</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Retrieves a single employee by their unique ID.
                    </p>
                    <div className="text-xs">
                      <p className="font-medium">Parameters:</p>
                      <code className="bg-blue-100 p-1 rounded">{"{ employee_id: string }"}</code>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <h4 className="font-medium text-green-700 mb-1">search_employees</h4>
                    <p className="text-sm text-green-800 mb-2">
                      Searches for employees by name or other attributes.
                    </p>
                    <div className="text-xs">
                      <p className="font-medium">Parameters:</p>
                      <code className="bg-green-100 p-1 rounded">{"{ name: string, limit?: number }"}</code>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                    <h4 className="font-medium text-purple-700 mb-1">list_employees</h4>
                    <p className="text-sm text-purple-800 mb-2">
                      Lists all employees, with optional pagination.
                    </p>
                    <div className="text-xs">
                      <p className="font-medium">Parameters:</p>
                      <code className="bg-purple-100 p-1 rounded">{"{ limit?: number }"}</code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Integration with AI Agents</h3>
                <p className="text-sm text-yellow-800">
                  Our MCP interface enables AI assistants to autonomously:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1 text-yellow-800 mt-2">
                  <li>Look up employee information to answer HR questions</li>
                  <li>Find the right person to contact for specific departments</li>
                  <li>Search for employees with specific skills or roles</li>
                  <li>Build custom employee reports and visualizations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Tab */}
        <TabsContent value="demo">
          <Card>
            <CardHeader>
              <CardTitle>Interactive MCP Demo</CardTitle>
              <CardDescription>
                Try out our MCP API interface for employee data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MCPDemo />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MCPDemoPage;