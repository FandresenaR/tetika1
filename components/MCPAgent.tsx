'use client';

import React, { useState } from 'react';
import { FaRobot, FaSearch, FaFile, FaComments, FaCog } from 'react-icons/fa';

interface MCPTool {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

interface MCPAgentProps {
  onToolExecute?: (tool: string, args: Record<string, unknown>) => void;
}

const MCPAgent: React.FC<MCPAgentProps> = ({ onToolExecute }) => {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<Record<string, unknown>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const tools: MCPTool[] = [
    {
      name: 'web_search',
      description: 'Search the web for information',
      icon: <FaSearch className="w-5 h-5" />,
      category: 'Search'
    },
    {
      name: 'chat_with_ai',
      description: 'Chat with AI models',
      icon: <FaRobot className="w-5 h-5" />,
      category: 'AI'
    },
    {
      name: 'analyze_file',
      description: 'Analyze files (documents, images, videos)',
      icon: <FaFile className="w-5 h-5" />,
      category: 'Analysis'
    },
    {
      name: 'manage_conversation',
      description: 'Manage conversation sessions',
      icon: <FaComments className="w-5 h-5" />,
      category: 'Conversation'
    },
    {
      name: 'get_tetika_status',
      description: 'Get Tetika status and configuration',
      icon: <FaCog className="w-5 h-5" />,
      category: 'System'
    }
  ];

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setToolArgs({});
    setResult(null);
  };
  const handleArgChange = (key: string, value: unknown) => {
    setToolArgs(prev => ({
      ...prev,
      [key]: value
    }));
  };  const getStringValue = (key: string, defaultValue = ''): string => {
    const value = toolArgs[key];
    return typeof value === 'string' ? value : defaultValue;
  };

  const getNumberValue = (key: string, defaultValue = 0): number => {
    const value = toolArgs[key];
    return typeof value === 'number' ? value : defaultValue;
  };

  const getArrayValue = (key: string): string[] => {
    const value = toolArgs[key];
    return Array.isArray(value) ? value : [];
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: selectedTool,
          args: toolArgs
        })
      });

      const data = await response.json();
      setResult(data);
      onToolExecute?.(selectedTool, toolArgs);    } catch (error) {
      console.error('Tool execution error:', error);
      setResult(JSON.stringify({
        success: false,
        error: 'Failed to execute tool'
      }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const renderToolForm = () => {
    switch (selectedTool) {
      case 'web_search':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={getStringValue('query')}
                onChange={(e) => handleArgChange('query', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="Enter your search query..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={getStringValue('location')}
                onChange={(e) => handleArgChange('location', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., Paris, France"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Results
              </label>              <input
                type="number"
                value={getNumberValue('num_results', 10)}
                onChange={(e) => handleArgChange('num_results', parseInt(e.target.value))}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                min="1"
                max="20"
                aria-label="Number of search results"
              />
            </div>
          </div>
        );

      case 'chat_with_ai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={getStringValue('message')}
                onChange={(e) => handleArgChange('message', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                rows={4}
                placeholder="Enter your message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>              <select
                value={getStringValue('model', 'gpt-4-turbo-preview')}
                onChange={(e) => handleArgChange('model', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                aria-label="Select AI model"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mode
              </label>              <select
                value={getStringValue('mode', 'standard')}
                onChange={(e) => handleArgChange('mode', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                aria-label="Select chat mode"
              >
                <option value="standard">Standard</option>
                <option value="rag">RAG Enhanced</option>
              </select>
            </div>
          </div>
        );

      case 'analyze_file':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File Path
              </label>
              <input
                type="text"
                value={getStringValue('file_path')}
                onChange={(e) => handleArgChange('file_path', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="Path to file..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File Type
              </label>
              <input
                type="text"
                value={getStringValue('file_type')}
                onChange={(e) => handleArgChange('file_type', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                placeholder="e.g., image/jpeg, text/plain, application/pdf"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Questions (optional)
              </label>
              <textarea
                value={getArrayValue('questions').join('\n')}
                onChange={(e) => handleArgChange('questions', e.target.value.split('\n').filter(q => q.trim()))}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                rows={3}
                placeholder="Enter questions, one per line..."
              />
            </div>
          </div>
        );

      case 'manage_conversation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Action
              </label>              <select
                value={getStringValue('action', 'list')}
                onChange={(e) => handleArgChange('action', e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                aria-label="Select conversation action"
              >
                <option value="create">Create</option>
                <option value="list">List</option>
                <option value="get">Get</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="search">Search</option>
              </select>
            </div>
            {['get', 'update', 'delete'].includes(getStringValue('action')) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session ID
                </label>
                <input
                  type="text"
                  value={getStringValue('session_id')}
                  onChange={(e) => handleArgChange('session_id', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter session ID..."
                />
              </div>
            )}
            {['create', 'update'].includes(getStringValue('action')) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={getStringValue('title')}
                  onChange={(e) => handleArgChange('title', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter conversation title..."
                />
              </div>
            )}
            {toolArgs.action === 'search' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Term
                </label>
                <input
                  type="text"
                  value={getStringValue('search_term')}
                  onChange={(e) => handleArgChange('search_term', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter search term..."
                />
              </div>
            )}
          </div>
        );

      case 'get_tetika_status':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolArgs.include_models !== false}
                  onChange={(e) => handleArgChange('include_models', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Include Models</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={toolArgs.include_settings !== false}
                  onChange={(e) => handleArgChange('include_settings', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Include Settings</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Tetika MCP Agent</h2>        <p className="text-gray-300">
          Access Tetika&apos;s capabilities through the Model Context Protocol
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Available Tools</h3>
          <div className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool.name)}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  selectedTool === tool.name
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {tool.icon}
                  <div>
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-sm opacity-75">{tool.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tool Configuration */}
        <div>
          {selectedTool ? (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Configure {selectedTool}
              </h3>
              {renderToolForm()}
              <button
                onClick={executeTool}
                disabled={isExecuting}
                className="w-full mt-6 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? 'Executing...' : 'Execute Tool'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <FaRobot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a tool to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Result</h3>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPAgent;
