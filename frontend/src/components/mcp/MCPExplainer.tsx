// src/components/mcp/MCPExplainer.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const MCPExplainer: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-700 mb-2">Model</h3>
            <p className="text-sm text-blue-800">
              The structured data representation that services exchange. In our case, 
              employee data with standardized fields and formats.
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-700 mb-2">Context</h3>
            <p className="text-sm text-purple-800">
              Metadata about the request including service name, timestamps, and tracking IDs 
              that enable observability and auditability.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-700 mb-2">Protocol</h3>
            <p className="text-sm text-green-800">
              The standard interface with actions and parameters that services use to communicate, 
              enabling consistent integration patterns.
            </p>
          </div>
        </div>
        
        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-2">Example MCP Request/Response Flow</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Request:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "action": "get_employee",
  "parameters": {
    "employee_id": "e12345"
  },
  "context": {
    "service": "hr-dashboard",
    "timestamp": "2025-05-20T14:30:00Z",
    "request_id": "req-7890"
  }
}`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Response:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "status": "success",
  "data": {
    "id": "e12345",
    "first_name": "Jane",
    "last_name": "Smith",
    "job_title": "Software Engineer",
    "department": "Engineering",
    "email": "jane.smith@example.com"
  },
  "context": {
    "service": "employee-service",
    "timestamp": "2025-05-20T14:30:01Z",
    "request_id": "req-7890"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Benefits for Agentic Workflows</h3>
          <ul className="list-disc pl-5 text-sm space-y-1 text-yellow-800">
            <li>
              <span className="font-medium">Standardized Interfaces:</span> AI agents can discover and use services through a consistent pattern
            </li>
            <li>
              <span className="font-medium">Discoverability:</span> Services can advertise their capabilities through standard protocols
            </li>
            <li>
              <span className="font-medium">Error Handling:</span> Consistent error patterns make automated retry and recovery possible
            </li>
            <li>
              <span className="font-medium">Observability:</span> Context fields enable tracking and monitoring across service boundaries
            </li>
            <li>
              <span className="font-medium">Agent Autonomy:</span> Well-defined protocols allow agents to make appropriate service calls without human intervention
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MCPExplainer;