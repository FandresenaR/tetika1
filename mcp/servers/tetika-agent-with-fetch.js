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
import { fetchWebContent, searchWebWithFetch } from '../tools/fetch-mcp.js';

class TetikaAgentWithFetchServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tetika-agent-with-fetch',
        version: '1.1.0',
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
            name: 'fetch_web_content',
            description: 'Fetch and extract content from a specific URL using Fetch MCP',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to fetch and extract content from',
                },
                options: {
                  type: 'object',
                  description: 'Additional fetch options (headers, etc.)',
                  properties: {
                    headers: {
                      type: 'object',
                      description: 'Custom HTTP headers'
                    }
                  }
                }
              },
              required: ['url'],
            },
          },
          {
            name: 'search_web_fetch',
            description: 'Search the web using Fetch MCP with content extraction',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query to execute',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 5)',
                  default: 5,
                },
                searchEngines: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['duckduckgo']
                  },
                  description: 'Search engines to use (default: ["duckduckgo"])',
                  default: ['duckduckgo']
                }
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
            description: 'Analyze files including documents, images, and videos for content extraction and metadata',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the file to analyze',
                },
                analysis_type: {
                  type: 'string',
                  enum: ['content', 'metadata', 'both'],
                  description: 'Type of analysis to perform',
                  default: 'both',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'manage_conversation',
            description: 'Create, read, update, or delete chat conversations and sessions',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'read', 'update', 'delete', 'list'],
                  description: 'The action to perform on the conversation',
                },
                conversation_id: {
                  type: 'string',
                  description: 'ID of the conversation (required for read, update, delete)',
                },
                title: {
                  type: 'string',
                  description: 'Title for new conversations or updates',
                },
                messages: {
                  type: 'array',
                  description: 'Messages to add or update in the conversation',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'get_system_status',
            description: 'Get the current status and configuration of the Tetika system',
            inputSchema: {
              type: 'object',
              properties: {},
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

          case 'fetch_web_content':
            return await fetchWebContent(args);

          case 'search_web_fetch':
            return await searchWebWithFetch(args);

          case 'chat_with_ai':
            return await chatWithAI(args);

          case 'analyze_file':
            return await analyzeFile(args);

          case 'manage_conversation':
            return await manageConversation(args);

          case 'get_system_status':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'operational',
                    version: '1.1.0',
                    capabilities: [
                      'Web Search (SerpAPI)',
                      'Fetch Web Content (Fetch MCP)',
                      'AI Chat (OpenRouter)',
                      'File Analysis',
                      'Conversation Management'
                    ],
                    integrations: {
                      serpapi: !!process.env.SERPAPI_API_KEY,
                      openrouter: !!process.env.OPENROUTER_API_KEY,
                      fetch_mcp: true
                    },
                    timestamp: new Date().toISOString()
                  }, null, 2),
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Tetika Agent with Fetch MCP server running on stdio');
  }
}

const server = new TetikaAgentWithFetchServer();
server.run().catch(console.error);
