'use client';

import { useState } from 'react';
import MCPAgent from '@/components/MCPAgent';
import { FaRobot, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function MCPAgentPage() {  const [executedTools, setExecutedTools] = useState<Array<{
    tool: string;
    args: Record<string, unknown>;
    timestamp: string;
  }>>([]);

  const handleToolExecute = (tool: string, args: Record<string, unknown>) => {
    setExecutedTools(prev => [{
      tool,
      args,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 9)]); // Keep last 10 executions
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Back to Tetika</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <FaRobot className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-semibold">MCP Agent</span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cyan-400 mb-4">
              Tetika MCP Agent Interface
            </h1>            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Interact with Tetika&apos;s capabilities through the Model Context Protocol. 
              Execute tools, search the web, chat with AI models, and manage conversations.
            </p>
          </div>
        </div>

        {/* MCP Agent Component */}
        <MCPAgent onToolExecute={handleToolExecute} />

        {/* Recent Executions */}
        {executedTools.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Tool Executions</h3>
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {executedTools.map((execution, index) => (
                  <div 
                    key={index}
                    className="p-4 border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 font-medium">
                        {execution.tool}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(execution.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      <code className="bg-gray-800 px-2 py-1 rounded">
                        {JSON.stringify(execution.args, null, 2)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About MCP */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">
              About Model Context Protocol (MCP)
            </h3>
            <div className="space-y-4 text-gray-300">
              <p>
                The Model Context Protocol (MCP) is an open standard that enables AI applications 
                to securely access external data sources and tools. Tetika implements MCP to provide 
                structured access to its capabilities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Available Tools:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Web Search via SerpAPI</li>
                    <li>• AI Chat with Multiple Models</li>
                    <li>• File Analysis (Images, Documents)</li>
                    <li>• Conversation Management</li>
                    <li>• System Status & Configuration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Capabilities:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Real-time web search integration</li>
                    <li>• RAG-enhanced AI responses</li>
                    <li>• Multi-format file processing</li>
                    <li>• Conversation history management</li>
                    <li>• Secure API key handling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
