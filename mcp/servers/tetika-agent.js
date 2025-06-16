#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { searchWeb } from '../tools/search.js';
import { chatWithAI } from '../tools/chat.js';
import { analyzeFile } from '../tools/file-analysis.js';
import { manageConversation } from '../tools/conversation.js';

class TetikaAgentServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tetika-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for information using SerpAPI integration',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query to execute',
                },
                location: {
                  type: 'string',
                  description: 'Geographic location for localized results (optional)',
                },
                num_results: {
                  type: 'number',
                  description: 'Number of results to return (default: 10)',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'chat_with_ai',
            description: 'Chat with AI models through Tetika using various providers and models',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to send to the AI',
                },
                model: {
                  type: 'string',
                  description: 'The AI model to use (e.g., gpt-4, claude-3-sonnet)',
                },
                mode: {
                  type: 'string',
                  enum: ['standard', 'rag'],
                  description: 'Chat mode: standard or RAG-enhanced',
                  default: 'standard',
                },
                system_prompt: {
                  type: 'string',
                  description: 'Optional system prompt to set context',
                },
              },
              required: ['message'],
            },
          },
          {
            name: 'analyze_file',
            description: 'Analyze files (documents, images, videos) using AI capabilities',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the file to analyze',
                },
                file_content: {
                  type: 'string',
                  description: 'Base64 encoded file content (alternative to file_path)',
                },
                file_type: {
                  type: 'string',
                  description: 'MIME type of the file',
                },
                analysis_type: {
                  type: 'string',
                  enum: ['document', 'image', 'video', 'auto'],
                  description: 'Type of analysis to perform',
                  default: 'auto',
                },
                questions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific questions to ask about the file',
                },
              },
              required: ['file_type'],
            },
          },
          {
            name: 'manage_conversation',
            description: 'Manage conversation sessions, history, and context',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'list', 'get', 'update', 'delete', 'search'],
                  description: 'Action to perform on conversations',
                },
                session_id: {
                  type: 'string',
                  description: 'Session ID for get/update/delete actions',
                },
                title: {
                  type: 'string',
                  description: 'Title for create/update actions',
                },
                search_term: {
                  type: 'string',
                  description: 'Search term for finding conversations',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'get_tetika_status',
            description: 'Get current status, configuration, and capabilities of Tetika',
            inputSchema: {
              type: 'object',
              properties: {
                include_models: {
                  type: 'boolean',
                  description: 'Include available AI models in the response',
                  default: true,
                },
                include_settings: {
                  type: 'boolean',
                  description: 'Include current settings and configuration',
                  default: true,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'web_search':
            return await searchWeb(args);

          case 'chat_with_ai':
            return await chatWithAI(args);

          case 'analyze_file':
            return await analyzeFile(args);

          case 'manage_conversation':
            return await manageConversation(args);

          case 'get_tetika_status':
            return await this.getTetikaStatus(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  async getTetikaStatus(args) {
    const { include_models = true, include_settings = true } = args;

    const status = {
      name: 'Tetika AI Agent',
      version: '0.2.0',
      description: 'Advanced AI chat interface with multi-model support and RAG capabilities',
      capabilities: [
        'Multi-model AI chat (OpenRouter integration)',
        'RAG-enhanced responses with web search',
        'File analysis (documents, images, videos)',
        'Conversation management',
        'Real-time web search',
        'Secure local API key storage',
      ],
      status: 'active',
      timestamp: new Date().toISOString(),
    };

    if (include_models) {
      status.available_models = [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
        'gemini-pro',
        'llama-2-70b-chat',
        'mistral-large',
      ];
    }

    if (include_settings) {
      status.configuration = {
        default_mode: 'standard',
        rag_enabled: true,
        web_search_enabled: true,
        file_analysis_enabled: true,
        max_conversation_history: 50,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Tetika Agent MCP server running on stdio');
  }
}

const server = new TetikaAgentServer();
server.run().catch(console.error);
