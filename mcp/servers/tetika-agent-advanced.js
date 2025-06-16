#!/usr/bin/env node

/**
 * Advanced Hybrid MCP Search Server for Tetika
 * Supports multiple MCP web search providers with intelligent routing
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SseClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load enhanced configuration
const configPath = path.join(__dirname, 'enhanced-search-config.json');
let config;

try {
  const configData = await fs.readFile(configPath, 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Failed to load enhanced search configuration:', error);
  process.exit(1);
}

/**
 * MCP Client Manager for handling connections to different MCP servers
 */
class MCPClientManager {
  constructor() {
    this.clients = new Map();
    this.connectionCache = new Map();
  }

  /**
   * Get or create MCP client for a provider
   */
  async getClient(providerId) {
    if (this.clients.has(providerId)) {
      return this.clients.get(providerId);
    }

    const provider = config.providers[providerId];
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerId} not found or disabled`);
    }

    const client = await this.createClient(provider);
    this.clients.set(providerId, client);
    return client;
  }

  /**
   * Create and connect MCP client based on provider configuration
   */
  async createClient(provider) {
    const { config: providerConfig } = provider;
    let transport;
    let client;

    try {
      // Create transport based on provider type
      if (providerConfig.transport === 'stdio') {
        transport = new StdioClientTransport({
          command: providerConfig.server_command,
          args: providerConfig.server_args || [],
          env: this.buildEnvVars(providerConfig)
        });
      } else if (providerConfig.transport === 'sse') {
        transport = new SseClientTransport(providerConfig.server_url);
      } else {
        throw new Error(`Unsupported transport type: ${providerConfig.transport}`);
      }

      // Create client
      client = new Client(
        { name: 'tetika-hybrid-search', version: '2.0.0' },
        { capabilities: {} }
      );

      // Connect
      await client.connect(transport);
      
      console.log(`✅ Connected to MCP server: ${provider.name}`);
      return client;

    } catch (error) {
      console.error(`❌ Failed to connect to ${provider.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Build environment variables for MCP server
   */
  buildEnvVars(providerConfig) {
    const env = { ...process.env };
    
    // Add required API keys from environment
    if (providerConfig.api_key_env) {
      const apiKey = process.env[providerConfig.api_key_env];
      if (apiKey) {
        env[providerConfig.api_key_env] = apiKey;
      }
    }
    
    if (providerConfig.search_engine_id_env) {
      const searchEngineId = process.env[providerConfig.search_engine_id_env];
      if (searchEngineId) {
        env[providerConfig.search_engine_id_env] = searchEngineId;
      }
    }

    return env;
  }

  /**
   * Close all client connections
   */
  async closeAll() {
    for (const [providerId, client] of this.clients) {
      try {
        await client.close();
        console.log(`Closed connection to ${providerId}`);
      } catch (error) {
        console.error(`Error closing ${providerId}:`, error);
      }
    }
    this.clients.clear();
  }
}

/**
 * Query Analyzer for smart routing
 */
class QueryAnalyzer {
  static analyzeQuery(query) {
    const analysis = {
      type: 'general',
      patterns: [],
      suggested_providers: [],
      confidence: 0.5
    };

    // Check if it's a URL
    if (this.matchesPatterns(query, config.query_analysis.url_patterns)) {
      analysis.type = 'url';
      analysis.patterns.push('url');
      analysis.suggested_providers = ['fetch_mcp', 'rag_web_browser'];
      analysis.confidence = 0.9;
      return analysis;
    }

    // Check for technical queries
    if (this.matchesPatterns(query, config.query_analysis.technical_patterns)) {
      analysis.type = 'technical';
      analysis.patterns.push('technical');
      analysis.suggested_providers = ['google_cse', 'searxng'];
      analysis.confidence = 0.8;
    }

    // Check for news queries
    if (this.matchesPatterns(query, config.query_analysis.news_patterns)) {
      analysis.type = 'news';
      analysis.patterns.push('news');
      analysis.suggested_providers = ['serper', 'searxng', 'google_cse'];
      analysis.confidence = 0.8;
    }

    // Check for privacy-sensitive queries
    if (this.matchesPatterns(query, config.query_analysis.privacy_sensitive_patterns)) {
      analysis.patterns.push('privacy_sensitive');
      analysis.suggested_providers = ['searxng', 'fetch_mcp'];
      analysis.confidence = 0.7;
    }

    return analysis;
  }

  static matchesPatterns(query, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(query);
    });
  }
}

/**
 * Search Router for provider selection
 */
class SearchRouter {
  static async selectProviders(query, strategy = 'smart_cascade') {
    const analysis = QueryAnalyzer.analyzeQuery(query);
    const strategyConfig = config.routing_strategies[strategy];
    
    if (!strategyConfig) {
      throw new Error(`Unknown routing strategy: ${strategy}`);
    }

    if (strategy === 'smart_cascade') {
      return this.smartCascade(analysis, strategyConfig);
    } else if (strategy === 'parallel_best') {
      return this.parallelBest(analysis, strategyConfig);
    } else if (strategy === 'cost_optimized') {
      return this.costOptimized(analysis, strategyConfig);
    }

    // Default fallback
    return ['searxng', 'google_cse', 'serpapi'];
  }

  static smartCascade(analysis, strategyConfig) {
    // Find matching step based on query analysis
    for (const step of strategyConfig.steps) {
      if (step.condition === 'default') {
        return step.providers.filter(p => config.providers[p]?.enabled);
      }
      
      // Simple condition matching (can be enhanced)
      if (step.condition.includes(analysis.type) || 
          analysis.patterns.some(pattern => step.condition.includes(pattern))) {
        return step.providers.filter(p => config.providers[p]?.enabled);
      }
    }

    return ['searxng', 'google_cse', 'serpapi'];
  }

  static parallelBest(analysis, strategyConfig) {
    const candidates = strategyConfig.providers.filter(p => config.providers[p]?.enabled);
    return candidates.slice(0, strategyConfig.max_parallel || 3);
  }

  static costOptimized(analysis, strategyConfig) {
    const allProviders = Object.keys(config.providers)
      .filter(p => config.providers[p].enabled)
      .sort((a, b) => config.providers[a].cost_score - config.providers[b].cost_score);
    
    return allProviders;
  }
}

/**
 * Result Processor for quality filtering and deduplication
 */
class ResultProcessor {
  static processResults(results, query) {
    if (!results || results.length === 0) {
      return results;
    }

    let processed = [...results];

    // Apply quality filters
    if (config.result_processing?.quality_filters) {
      processed = this.applyQualityFilters(processed);
    }

    // Deduplicate results
    if (config.result_processing?.deduplication?.enabled) {
      processed = this.deduplicateResults(processed);
    }

    // Rank results
    if (config.result_processing?.ranking) {
      processed = this.rankResults(processed, query);
    }

    return processed;
  }

  static applyQualityFilters(results) {
    const filters = config.result_processing.quality_filters;
    
    return results.filter(result => {
      // Minimum content length
      if (filters.min_content_length && 
          result.content && 
          result.content.length < filters.min_content_length) {
        return false;
      }

      // Add more quality filters as needed
      return true;
    });
  }

  static deduplicateResults(results) {
    const threshold = config.result_processing.deduplication.similarity_threshold || 0.8;
    const unique = [];
    
    for (const result of results) {
      const isDuplicate = unique.some(existing => 
        this.calculateSimilarity(result, existing) > threshold
      );
      
      if (!isDuplicate) {
        unique.push(result);
      }
    }
    
    return unique;
  }

  static calculateSimilarity(result1, result2) {
    // Simple similarity based on URL and title
    if (result1.url && result2.url && result1.url === result2.url) {
      return 1.0;
    }
    
    if (result1.title && result2.title) {
      const title1 = result1.title.toLowerCase();
      const title2 = result2.title.toLowerCase();
      
      // Simple word overlap
      const words1 = title1.split(/\\s+/);
      const words2 = title2.split(/\\s+/);
      const common = words1.filter(word => words2.includes(word));
      
      return common.length / Math.max(words1.length, words2.length);
    }
    
    return 0;
  }

  static rankResults(results, query) {
    // Simple ranking - can be enhanced with more sophisticated algorithms
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }

  static calculateRelevanceScore(result, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title relevance
    if (result.title && result.title.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Content relevance
    if (result.content && result.content.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // URL relevance
    if (result.url && result.url.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    return score;
  }
}

/**
 * Performance Monitor for tracking metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: 0,
      successful_queries: 0,
      failed_queries: 0,
      provider_usage: {},
      response_times: {},
      errors: []
    };
  }

  trackQuery(providerId, responseTime, success, error = null) {
    this.metrics.queries++;
    
    if (success) {
      this.metrics.successful_queries++;
    } else {
      this.metrics.failed_queries++;
      if (error) {
        this.metrics.errors.push({
          provider: providerId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Track provider usage
    if (!this.metrics.provider_usage[providerId]) {
      this.metrics.provider_usage[providerId] = 0;
    }
    this.metrics.provider_usage[providerId]++;

    // Track response times
    if (!this.metrics.response_times[providerId]) {
      this.metrics.response_times[providerId] = [];
    }
    this.metrics.response_times[providerId].push(responseTime);
  }

  getStats() {
    const stats = { ...this.metrics };
    
    // Calculate average response times
    stats.avg_response_times = {};
    for (const [provider, times] of Object.entries(this.metrics.response_times)) {
      stats.avg_response_times[provider] = 
        times.reduce((sum, time) => sum + time, 0) / times.length;
    }
    
    // Calculate success rate
    stats.success_rate = this.metrics.queries > 0 ? 
      this.metrics.successful_queries / this.metrics.queries : 0;
    
    return stats;
  }
}

/**
 * Main Hybrid Search Server
 */
class HybridSearchServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tetika-hybrid-search-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.clientManager = new MCPClientManager();
    this.monitor = new PerformanceMonitor();
    
    this.setupErrorHandling();
    this.setupToolHandlers();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('\\nShutting down hybrid search server...');
      await this.clientManager.closeAll();
      await this.server.close();
      console.log('Server closed');
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'hybrid_web_search',
            description: 'Performs intelligent web search using multiple MCP providers with automatic fallback and quality optimization',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query or URL to process'
                },
                max_results: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                  minimum: 1,
                  maximum: 50
                },
                strategy: {
                  type: 'string',
                  description: 'Search routing strategy',
                  enum: ['smart_cascade', 'parallel_best', 'cost_optimized'],
                  default: 'smart_cascade'
                },
                providers: {
                  type: 'array',
                  description: 'Specific providers to use (overrides strategy)',
                  items: {
                    type: 'string',
                    enum: Object.keys(config.providers)
                  }
                }
              },
              required: ['query']
            }
          },
          {
            name: 'search_status',
            description: 'Get status and performance metrics of the hybrid search system',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'configure_providers',
            description: 'Get current provider configuration and availability',
            inputSchema: {
              type: 'object',
              properties: {
                provider_id: {
                  type: 'string',
                  description: 'Specific provider to check (optional)'
                }
              },
              required: []
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'hybrid_web_search':
            return await this.handleHybridSearch(args);
          case 'search_status':
            return await this.handleSearchStatus(args);
          case 'configure_providers':
            return await this.handleConfigureProviders(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in ${name}:`, error);
        throw error;
      }
    });
  }

  async handleHybridSearch(args) {
    const { query, max_results = 10, strategy = 'smart_cascade', providers } = args;
    
    if (!query || typeof query !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Query is required and must be a string');
    }

    console.log(`🔍 Hybrid search query: "${query}" (strategy: ${strategy})`);
    
    // Determine providers to use
    const selectedProviders = providers || await SearchRouter.selectProviders(query, strategy);
    
    console.log(`📡 Selected providers: ${selectedProviders.join(', ')}`);

    // Try providers in cascade mode
    const results = [];
    const errors = [];
    
    for (const providerId of selectedProviders) {
      try {
        const startTime = Date.now();
        const providerResults = await this.searchWithProvider(providerId, query, max_results);
        const responseTime = Date.now() - startTime;
        
        this.monitor.trackQuery(providerId, responseTime, true);
        
        if (providerResults && providerResults.length > 0) {
          results.push(...providerResults);
          console.log(`✅ ${providerId}: ${providerResults.length} results (${responseTime}ms)`);
          
          // For cascade strategy, return first successful result
          if (strategy === 'smart_cascade') {
            break;
          }
        }
        
      } catch (error) {
        console.error(`❌ ${providerId} failed:`, error.message);
        this.monitor.trackQuery(providerId, 0, false, error);
        errors.push({ provider: providerId, error: error.message });
        
        // Continue to next provider in cascade
        continue;
      }
    }

    // Process and optimize results
    const processedResults = ResultProcessor.processResults(results, query);
    
    // Build response
    const response = {
      query,
      strategy,
      providers_used: selectedProviders,
      results: processedResults.slice(0, max_results),
      total_results: processedResults.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }

  async searchWithProvider(providerId, query, maxResults) {
    const provider = config.providers[providerId];
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerId} not available`);
    }

    // Handle different provider types
    if (provider.type === 'mcp_server') {
      return await this.searchWithMCPServer(providerId, query, maxResults);
    } else if (provider.type === 'api_direct') {
      return await this.searchWithDirectAPI(providerId, query, maxResults);
    } else {
      throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  async searchWithMCPServer(providerId, query, maxResults) {
    const client = await this.clientManager.getClient(providerId);
    const provider = config.providers[providerId];
    const tools = provider.config.tools || [];
    
    // Determine appropriate tool based on query type
    let toolName = 'search'; // default
    let toolArgs = { query, num: maxResults };
    
    if (providerId === 'fetch_mcp') {
      toolName = 'fetch';
      toolArgs = { url: query, max_length: 5000 };
    } else if (providerId === 'searxng') {
      toolName = 'web_search';
      toolArgs = { query, count: maxResults };
    } else if (providerId === 'google_cse') {
      toolName = 'search';
      toolArgs = { query, num: maxResults };
    } else if (providerId === 'rag_web_browser') {
      toolName = 'search';
      toolArgs = { 
        query, 
        maxResults,
        scrapingTool: provider.config.scraping_tool || 'raw-http',
        outputFormats: provider.config.output_formats || ['markdown']
      };
    }

    // Call the tool
    const result = await client.callTool({ name: toolName, arguments: toolArgs });
    
    // Parse and normalize results
    return this.normalizeResults(result, providerId);
  }

  async searchWithDirectAPI(providerId, query, maxResults) {
    // Mock implementation for direct API calls
    // In real implementation, you would make HTTP requests to the API
    
    console.log(`🔗 Making direct API call to ${providerId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock results
    return [
      {
        title: `Mock result from ${providerId}`,
        url: `https://example.com/${providerId}`,
        content: `This is a mock search result from ${providerId} for query: ${query}`,
        provider: providerId,
        score: 0.8
      }
    ];
  }

  normalizeResults(mcpResult, providerId) {
    // Extract results from MCP response and normalize format
    if (!mcpResult || !mcpResult.content || !mcpResult.content[0]) {
      return [];
    }

    const text = mcpResult.content[0].text;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      
      // Handle different response formats from different providers
      if (Array.isArray(parsed)) {
        return parsed.map(item => this.normalizeResultItem(item, providerId));
      } else if (parsed.results && Array.isArray(parsed.results)) {
        return parsed.results.map(item => this.normalizeResultItem(item, providerId));
      } else {
        // Single result or unknown format
        return [this.normalizeResultItem(parsed, providerId)];
      }
      
    } catch (error) {
      // Not JSON, treat as plain text
      return [{
        title: `Content from ${providerId}`,
        content: text,
        provider: providerId,
        score: 0.5
      }];
    }
  }

  normalizeResultItem(item, providerId) {
    return {
      title: item.title || item.Title || 'Untitled',
      url: item.url || item.link || item.URL || null,
      content: item.content || item.snippet || item.text || item.Content || '',
      provider: providerId,
      score: item.score || 0.5,
      timestamp: new Date().toISOString()
    };
  }

  async handleSearchStatus(args) {
    const stats = this.monitor.getStats();
    const providerStatus = {};
    
    // Check provider availability
    for (const [providerId, provider] of Object.entries(config.providers)) {
      providerStatus[providerId] = {
        enabled: provider.enabled,
        priority: provider.priority,
        cost_score: provider.cost_score,
        quality_score: provider.quality_score,
        connected: this.clientManager.clients.has(providerId)
      };
    }

    const status = {
      server_status: 'operational',
      total_queries: stats.queries,
      success_rate: Math.round(stats.success_rate * 100) + '%',
      providers: providerStatus,
      performance: stats.avg_response_times,
      recent_errors: stats.errors.slice(-5),
      config_version: config.version,
      timestamp: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status, null, 2)
      }]
    };
  }

  async handleConfigureProviders(args) {
    const { provider_id } = args;
    
    if (provider_id) {
      const provider = config.providers[provider_id];
      if (!provider) {
        throw new McpError(ErrorCode.InvalidParams, `Provider ${provider_id} not found`);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ [provider_id]: provider }, null, 2)
        }]
      };
    } else {
      // Return all providers
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            providers: config.providers,
            routing_strategies: Object.keys(config.routing_strategies),
            total_providers: Object.keys(config.providers).length,
            enabled_providers: Object.values(config.providers).filter(p => p.enabled).length
          }, null, 2)
        }]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🚀 Tetika Hybrid Search Server is running');
    console.log(`📊 Loaded ${Object.keys(config.providers).length} providers`);
    console.log(`✅ ${Object.values(config.providers).filter(p => p.enabled).length} providers enabled`);
  }
}

// Start the server
const server = new HybridSearchServer();
server.run().catch(console.error);
