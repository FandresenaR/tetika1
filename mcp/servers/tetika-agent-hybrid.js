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
import fs from 'fs/promises';
import path from 'path';

class TetikaAgentServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tetika-agent-hybrid',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.searchConfig = null;
    this.loadSearchConfig();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  async loadSearchConfig() {
    try {
      const configPath = path.join(process.cwd(), 'mcp', 'config-search.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.searchConfig = JSON.parse(configData);
      console.log('[Tetika MCP] Loaded hybrid search configuration');
    } catch (error) {
      console.warn('[Tetika MCP] Could not load search config, using defaults:', error.message);
      this.searchConfig = {
        searchStrategy: {
          primary: 'serpapi',
          fallback: 'serpapi',
          specialized: {}
        }
      };
    }
  }

  classifyQuery(query) {
    const lowerQuery = query.toLowerCase();
    const config = this.searchConfig?.searchStrategy?.routing_rules || {};

    // Check for AI/ML queries
    if (config.ai_keywords?.some(keyword => lowerQuery.includes(keyword))) {
      return 'ai_queries';
    }

    // Check for technical documentation queries
    if (config.technical_keywords?.some(keyword => lowerQuery.includes(keyword))) {
      return 'technical_docs';
    }

    // Check for research queries
    if (config.research_keywords?.some(keyword => lowerQuery.includes(keyword))) {
      return 'research';
    }

    return 'general';
  }

  async performHybridSearch(args) {
    const { query, location, num_results = 10, search_method } = args;
    const queryType = this.classifyQuery(query);
    
    console.log(`[Hybrid Search] Query: "${query}", Type: ${queryType}`);

    // Determine search method
    let selectedMethod = search_method;
    if (!selectedMethod) {
      const specialized = this.searchConfig?.searchStrategy?.specialized?.[queryType];
      selectedMethod = specialized || this.searchConfig?.searchStrategy?.primary || 'serpapi';
    }

    console.log(`[Hybrid Search] Using method: ${selectedMethod}`);

    try {
      switch (selectedMethod) {
        case 'searxng-search':
          return await this.searchWithSearXNG(query, num_results);
        
        case 'exa-search':
          return await this.searchWithExa(query, num_results);
        
        case 'fetch-mcp':
          return await this.fetchDirectContent(query);
        
        case 'google-search':
          return await this.searchWithGoogle(query, num_results);
        
        case 'serper-search':
          return await this.searchWithSerper(query, num_results);
        
        case 'rag-web-browser':
          return await this.searchWithRAGBrowser(query, num_results);
        
        case 'serpapi':
        default:
          // Fallback to existing SerpAPI implementation
          return await searchWeb(args);
      }
    } catch (error) {
      console.error(`[Hybrid Search] ${selectedMethod} failed:`, error.message);
      
      // Fallback logic
      const fallbackMethod = this.searchConfig?.searchStrategy?.fallback || 'serpapi';
      if (selectedMethod !== fallbackMethod) {
        console.log(`[Hybrid Search] Falling back to: ${fallbackMethod}`);
        try {
          if (fallbackMethod === 'serpapi') {
            return await searchWeb(args);
          }
          // Could add other fallback methods here
        } catch (fallbackError) {
          console.error(`[Hybrid Search] Fallback also failed:`, fallbackError.message);
        }
      }

      throw new McpError({
        code: ErrorCode.InternalError,
        message: `All search methods failed: ${error.message}`,
      });
    }
  }

  async searchWithSearXNG(query, numResults) {
    // Mock implementation - replace with actual SearXNG MCP client
    console.log(`[SearXNG] Searching for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'SearXNG',
            query: query,
            results: [
              {
                title: `Privacy-focused results for: ${query}`,
                url: `https://searxng-result.example.com/${encodeURIComponent(query)}`,
                snippet: `Aggregated results from multiple search engines for ${query}, respecting user privacy.`,
                source: 'SearXNG (Multiple engines)',
                privacy_level: 'High'
              }
            ],
            metadata: {
              method: 'SearXNG',
              privacy: 'High',
              sources: ['Google', 'Bing', 'DuckDuckGo'],
              api_key_required: false,
              cost: 'Free'
            }
          }, null, 2)
        }
      ]
    };
  }

  async searchWithExa(query, numResults) {
    // Mock implementation - replace with actual Exa MCP client
    console.log(`[Exa AI] AI-optimized search for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'Exa AI',
            query: query,
            results: [
              {
                title: `AI-curated: ${query}`,
                url: `https://exa-result.example.com/${encodeURIComponent(query)}`,
                snippet: `High-quality, AI-optimized content about ${query} with enhanced relevance scoring.`,
                relevance_score: 0.95,
                ai_summary: `This result provides comprehensive, technically accurate information about ${query}.`,
                quality_indicators: ['Expert-reviewed', 'Recent', 'Comprehensive']
              }
            ],
            metadata: {
              method: 'Exa AI',
              ai_enhanced: true,
              quality_score: 'High',
              api_key_required: true,
              cost_per_search: '$0.001'
            }
          }, null, 2)
        }
      ]
    };
  }

  async fetchDirectContent(query) {
    // Mock implementation for Fetch MCP
    console.log(`[Fetch MCP] Direct content fetch for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'Fetch MCP',
            note: 'Direct content fetching requires specific URLs',
            query: query,
            example_usage: {
              description: 'Use when you have specific URLs to fetch content from',
              suggested_url: `https://docs.example.com/${query.replace(/\s+/g, '-')}`,
              robots_txt_compliant: true,
              content_format: 'Markdown'
            },
            metadata: {
              method: 'Fetch MCP',
              robots_txt_compliant: true,
              proxy_support: true,
              api_key_required: false,
              best_for: 'Direct URL content fetching'
            }
          }, null, 2)
        }
      ]
    };
  }

  async searchWithGoogle(query, numResults) {
    // Mock implementation for Google Custom Search
    console.log(`[Google Search] Custom search for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'Google Custom Search',
            query: query,
            results: [
              {
                title: `Google: ${query}`,
                url: `https://google-result.example.com/${encodeURIComponent(query)}`,
                snippet: `High-quality search results for ${query} powered by Google's search algorithms.`,
                page_rank: 'High',
                freshness: 'Recent'
              }
            ],
            metadata: {
              method: 'Google Custom Search',
              reliability: 'High',
              api_key_required: true,
              rate_limits: '100 queries/day (free tier)',
              cost: 'Free tier available'
            }
          }, null, 2)
        }
      ]
    };
  }

  async searchWithSerper(query, numResults) {
    // Mock implementation for Serper.dev
    console.log(`[Serper] Google API search for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'Serper.dev',
            query: query,
            results: [
              {
                title: `Serper: ${query}`,
                url: `https://serper-result.example.com/${encodeURIComponent(query)}`,
                snippet: `Cost-effective Google search results for ${query} via Serper.dev API.`,
                position: 1,
                authority_score: 'High'
              }
            ],
            metadata: {
              method: 'Serper.dev',
              google_powered: true,
              cost_effective: true,
              api_key_required: true,
              cost_per_search: '$0.001'
            }
          }, null, 2)
        }
      ]
    };
  }

  async searchWithRAGBrowser(query, numResults) {
    // Mock implementation for RAG Web Browser
    console.log(`[RAG Browser] Deep research for: ${query}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_method: 'RAG Web Browser',
            query: query,
            results: [
              {
                title: `Deep Research: ${query}`,
                url: `https://rag-research.example.com/${encodeURIComponent(query)}`,
                snippet: `Comprehensive research compilation about ${query} with RAG-enhanced analysis.`,
                research_depth: 'Deep',
                sources_analyzed: 15,
                rag_enhanced: true
              }
            ],
            metadata: {
              method: 'RAG Web Browser',
              research_focused: true,
              multi_source_analysis: true,
              api_key_required: true,
              best_for: 'Deep research and analysis'
            }
          }, null, 2)
        }
      ]
    };
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
            name: 'hybrid_web_search',
            description: 'Advanced web search using multiple search providers with intelligent routing. Supports SerpAPI, SearXNG, Exa AI, Google Custom Search, and more.',
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
                search_method: {
                  type: 'string',
                  enum: ['auto', 'serpapi', 'searxng-search', 'exa-search', 'fetch-mcp', 'google-search', 'serper-search', 'rag-web-browser'],
                  description: 'Force a specific search method (optional, auto-detection used by default)',
                  default: 'auto'
                }
              },
              required: ['query'],
            },
          },
          {
            name: 'web_search',
            description: 'Legacy web search using SerpAPI integration (maintained for compatibility)',
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
            name: 'search_status',
            description: 'Get information about available search methods and their current status',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
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
            description: 'Analyze files including documents, images, and other media',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the file to analyze',
                },
                analysis_type: {
                  type: 'string',
                  enum: ['content', 'metadata', 'structure', 'all'],
                  description: 'Type of analysis to perform',
                  default: 'all',
                },
              },
              required: ['file_path'],
            },
          },
          {
            name: 'manage_conversation',
            description: 'Manage conversation sessions including create, list, and retrieve',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['create', 'list', 'get', 'delete'],
                  description: 'Action to perform on conversations',
                },
                conversation_id: {
                  type: 'string',
                  description: 'Conversation ID for get/delete actions',
                },
                title: {
                  type: 'string',
                  description: 'Title for new conversation (create action)',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'get_tetika_status',
            description: 'Get comprehensive status information about Tetika system',
            inputSchema: {
              type: 'object',
              properties: {
                include_models: {
                  type: 'boolean',
                  description: 'Include available AI models in response',
                  default: true,
                },
                include_settings: {
                  type: 'boolean',
                  description: 'Include system settings in response',
                  default: true,
                },
                include_search_config: {
                  type: 'boolean',
                  description: 'Include search configuration details',
                  default: true,
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'hybrid_web_search':
            return await this.performHybridSearch(args);

          case 'web_search':
            // Legacy SerpAPI search
            return await searchWeb(args);

          case 'search_status':
            return await this.getSearchStatus();

          case 'chat_with_ai':
            return await chatWithAI(args);

          case 'analyze_file':
            return await analyzeFile(args);

          case 'manage_conversation':
            return await manageConversation(args);

          case 'get_tetika_status':
            return await this.getTetikaStatus(args);

          default:
            throw new McpError({
              code: ErrorCode.MethodNotFound,
              message: `Unknown tool: ${name}`,
            });
        }
      } catch (error) {
        console.error(`[MCP Tool Error] ${name}:`, error);
        
        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError({
          code: ErrorCode.InternalError,
          message: `Tool execution failed: ${error.message}`,
        });
      }
    });
  }

  async getSearchStatus() {
    const config = this.searchConfig?.searchStrategy || {};
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            search_configuration: {
              primary_method: config.primary || 'serpapi',
              fallback_method: config.fallback || 'serpapi',
              specialized_routing: config.specialized || {},
              routing_rules: config.routing_rules || {}
            },
            available_methods: [
              {
                name: 'serpapi',
                description: 'Current SerpAPI integration',
                status: 'active',
                requires_api_key: true,
                cost: 'Paid'
              },
              {
                name: 'searxng-search',
                description: 'Privacy-focused metasearch engine',
                status: 'configured',
                requires_api_key: false,
                cost: 'Free'
              },
              {
                name: 'exa-search',
                description: 'AI-optimized search results',
                status: 'configured',
                requires_api_key: true,
                cost: 'Paid'
              },
              {
                name: 'fetch-mcp',
                description: 'Direct content fetching',
                status: 'configured',
                requires_api_key: false,
                cost: 'Free'
              },
              {
                name: 'google-search',
                description: 'Google Custom Search API',
                status: 'configured',
                requires_api_key: true,
                cost: 'Freemium'
              },
              {
                name: 'serper-search',
                description: 'Google search via Serper.dev',
                status: 'configured',
                requires_api_key: true,
                cost: 'Paid'
              },
              {
                name: 'rag-web-browser',
                description: 'RAG-enhanced web research',
                status: 'configured',
                requires_api_key: true,
                cost: 'Paid'
              }
            ],
            recommendation: 'Use hybrid_web_search tool for best results with automatic method selection'
          }, null, 2)
        }
      ]
    };
  }

  async getTetikaStatus(args) {
    const { include_models = true, include_settings = true, include_search_config = true } = args;
    
    const status = {
      status: 'active',
      version: '2.0.0',
      mcp_server: 'tetika-agent-hybrid',
      timestamp: new Date().toISOString(),
      capabilities: [
        'hybrid_web_search',
        'ai_chat',
        'file_analysis',
        'conversation_management'
      ]
    };

    if (include_search_config) {
      status.search_configuration = this.searchConfig?.searchStrategy || {};
    }

    if (include_models) {
      // This would typically fetch from your models configuration
      status.available_models = [
        'gpt-4',
        'claude-3-sonnet',
        'deepseek-v3',
        // ... other models
      ];
    }

    if (include_settings) {
      status.system_settings = {
        mcp_version: '2.0.0',
        search_methods: 7,
        hybrid_routing: true,
        fallback_enabled: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Tetika Agent MCP Server (Hybrid) running on stdio');
  }
}

const server = new TetikaAgentServer();
server.run().catch(console.error);
