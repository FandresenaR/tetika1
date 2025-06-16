#!/usr/bin/env node

/**
 * Production-Ready MCP Search Integration Test Suite
 * Tests real MCP servers and validates hybrid search functionality
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SseClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  queries: [
    'artificial intelligence trends 2024',
    'https://example.com',
    'React hooks tutorial',
    'latest news technology',
    'weather forecast'
  ],
  timeout: 30000,
  max_results: 5
};

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test Results Collector
 */
class TestResults {
  constructor() {
    this.tests = [];
    this.startTime = Date.now();
  }

  addTest(provider, query, success, responseTime, resultCount, error = null) {
    this.tests.push({
      provider,
      query,
      success,
      responseTime,
      resultCount,
      error,
      timestamp: new Date().toISOString()
    });
  }

  getProviderStats(provider) {
    const providerTests = this.tests.filter(t => t.provider === provider);
    const successful = providerTests.filter(t => t.success);
    
    return {
      total: providerTests.length,
      successful: successful.length,
      failed: providerTests.length - successful.length,
      success_rate: providerTests.length > 0 ? successful.length / providerTests.length : 0,
      avg_response_time: successful.length > 0 ? 
        successful.reduce((sum, t) => sum + t.responseTime, 0) / successful.length : 0,
      avg_results: successful.length > 0 ?
        successful.reduce((sum, t) => sum + (t.resultCount || 0), 0) / successful.length : 0
    };
  }

  generateReport() {
    const providers = [...new Set(this.tests.map(t => t.provider))];
    const report = {
      summary: {
        total_tests: this.tests.length,
        successful_tests: this.tests.filter(t => t.success).length,
        test_duration: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      },
      providers: {}
    };

    providers.forEach(provider => {
      report.providers[provider] = this.getProviderStats(provider);
    });

    return report;
  }
}

/**
 * Individual MCP Server Testers
 */
class MCPServerTester {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.client = null;
    this.transport = null;
  }

  async connect() {
    try {
      if (this.config.transport === 'stdio') {
        this.transport = new StdioClientTransport({
          command: this.config.command,
          args: this.config.args || [],
          env: { ...process.env, ...this.config.env }
        });
      } else if (this.config.transport === 'sse') {
        this.transport = new SseClientTransport(this.config.url);
      } else {
        throw new Error(`Unsupported transport: ${this.config.transport}`);
      }

      this.client = new Client(
        { name: 'mcp-test-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await this.client.connect(this.transport);
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${this.name}:`, error.message);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
      }
    } catch (error) {
      console.error(`Error disconnecting ${this.name}:`, error.message);
    }
  }

  async listTools() {
    try {
      const tools = await this.client.listTools();
      return tools.tools || [];
    } catch (error) {
      console.error(`Error listing tools for ${this.name}:`, error.message);
      return [];
    }
  }

  async testSearch(query, maxResults = 5) {
    const startTime = Date.now();
    
    try {
      // Determine appropriate tool and arguments based on server type
      let toolName, args;
      
      if (this.name === 'SearXNG') {
        toolName = 'web_search';
        args = { query, count: maxResults };
      } else if (this.name === 'Google-CSE') {
        toolName = 'search';
        args = { query, num: maxResults };
      } else if (this.name === 'Fetch-MCP') {
        if (query.startsWith('http')) {
          toolName = 'fetch';
          args = { url: query, max_length: 5000 };
        } else {
          throw new Error('Fetch MCP only supports URLs');
        }
      } else if (this.name === 'RAG-Browser') {
        toolName = 'search';
        args = { 
          query, 
          maxResults,
          scrapingTool: 'raw-http',
          outputFormats: ['markdown']
        };
      } else {
        // Default
        toolName = 'search';
        args = { query, max_results: maxResults };
      }

      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      const responseTime = Date.now() - startTime;
      const resultCount = this.parseResultCount(result);

      return {
        success: true,
        responseTime,
        resultCount,
        result
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        resultCount: 0,
        error: error.message
      };
    }
  }

  parseResultCount(result) {
    try {
      if (!result || !result.content || !result.content[0]) {
        return 0;
      }

      const text = result.content[0].text;
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed)) {
          return parsed.length;
        } else if (parsed.results && Array.isArray(parsed.results)) {
          return parsed.results.length;
        } else if (parsed.total_results) {
          return parsed.total_results;
        }
      } catch (jsonError) {
        // Not JSON, estimate based on text length
        return text.length > 100 ? 1 : 0;
      }

      return text.length > 50 ? 1 : 0;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Main Test Runner
 */
class MCPTestRunner {
  constructor() {
    this.results = new TestResults();
    this.servers = this.initializeServers();
  }

  initializeServers() {
    return {
      'SearXNG': new MCPServerTester('SearXNG', {
        transport: 'sse',
        url: 'http://localhost:5488/sse'
      }),
      
      'Google-CSE': new MCPServerTester('Google-CSE', {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@adenot/mcp-google-search'],
        env: {
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
          GOOGLE_SEARCH_ENGINE_ID: process.env.GOOGLE_SEARCH_ENGINE_ID
        }
      }),
      
      'Fetch-MCP': new MCPServerTester('Fetch-MCP', {
        transport: 'stdio',
        command: 'uvx',
        args: ['mcp-server-fetch']
      }),
      
      'RAG-Browser': new MCPServerTester('RAG-Browser', {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@apify/mcp-server-rag-web-browser'],
        env: {
          APIFY_TOKEN: process.env.APIFY_TOKEN
        }
      }),

      'Hybrid-Server': new MCPServerTester('Hybrid-Server', {
        transport: 'stdio',
        command: 'node',
        args: [path.join(__dirname, 'servers', 'tetika-agent-advanced.js')]
      })
    };
  }

  async testProvider(serverName, server) {
    colorLog('blue', `\n🧪 Testing ${serverName}...`);
    
    // Connect to server
    const connected = await server.connect();
    if (!connected) {
      colorLog('red', `❌ Failed to connect to ${serverName}`);
      TEST_CONFIG.queries.forEach(query => {
        this.results.addTest(serverName, query, false, 0, 0, 'Connection failed');
      });
      return;
    }

    colorLog('green', `✅ Connected to ${serverName}`);

    // List available tools
    try {
      const tools = await server.listTools();
      colorLog('cyan', `📊 Available tools: ${tools.map(t => t.name).join(', ')}`);
    } catch (error) {
      colorLog('yellow', `⚠️  Could not list tools: ${error.message}`);
    }

    // Test with each query
    for (const query of TEST_CONFIG.queries) {
      colorLog('yellow', `  🔍 Testing query: "${query}"`);
      
      const testResult = await server.testSearch(query, TEST_CONFIG.max_results);
      
      this.results.addTest(
        serverName,
        query,
        testResult.success,
        testResult.responseTime,
        testResult.resultCount,
        testResult.error
      );

      if (testResult.success) {
        colorLog('green', `    ✅ Success (${testResult.responseTime}ms, ${testResult.resultCount} results)`);
      } else {
        colorLog('red', `    ❌ Failed: ${testResult.error}`);
      }
    }

    // Disconnect
    await server.disconnect();
  }

  async runAllTests() {
    colorLog('bright', '🚀 Starting MCP Search Provider Tests');
    colorLog('cyan', `📋 Testing ${TEST_CONFIG.queries.length} queries across ${Object.keys(this.servers).length} providers`);

    for (const [serverName, server] of Object.entries(this.servers)) {
      await this.testProvider(serverName, server);
    }

    await this.generateFinalReport();
  }

  async runSpecificTest(providerName) {
    const server = this.servers[providerName];
    if (!server) {
      colorLog('red', `❌ Provider ${providerName} not found`);
      colorLog('cyan', `Available providers: ${Object.keys(this.servers).join(', ')}`);
      return;
    }

    colorLog('bright', `🎯 Testing specific provider: ${providerName}`);
    await this.testProvider(providerName, server);
    await this.generateFinalReport();
  }

  async generateFinalReport() {
    colorLog('bright', '\n📊 TEST RESULTS SUMMARY');
    console.log('=' * 50);

    const report = this.results.generateReport();

    // Overall summary
    colorLog('cyan', '\n🎯 Overall Results:');
    console.log(`  Total Tests: ${report.summary.total_tests}`);
    console.log(`  Successful: ${report.summary.successful_tests}`);
    console.log(`  Success Rate: ${((report.summary.successful_tests / report.summary.total_tests) * 100).toFixed(1)}%`);
    console.log(`  Duration: ${(report.summary.test_duration / 1000).toFixed(1)}s`);

    // Provider-specific results
    colorLog('cyan', '\n📈 Provider Performance:');
    
    const sortedProviders = Object.entries(report.providers)
      .sort((a, b) => b[1].success_rate - a[1].success_rate);

    sortedProviders.forEach(([provider, stats]) => {
      const successColor = stats.success_rate >= 0.8 ? 'green' : stats.success_rate >= 0.5 ? 'yellow' : 'red';
      
      console.log(`\n  ${provider}:`);
      colorLog(successColor, `    Success Rate: ${(stats.success_rate * 100).toFixed(1)}% (${stats.successful}/${stats.total})`);
      
      if (stats.successful > 0) {
        console.log(`    Avg Response Time: ${stats.avg_response_time.toFixed(0)}ms`);
        console.log(`    Avg Results: ${stats.avg_results.toFixed(1)}`);
      }
    });

    // Recommendations
    colorLog('cyan', '\n💡 Recommendations:');
    
    const bestProvider = sortedProviders[0];
    if (bestProvider && bestProvider[1].success_rate > 0.8) {
      colorLog('green', `  ⭐ Best Performer: ${bestProvider[0]} (${(bestProvider[1].success_rate * 100).toFixed(1)}% success)`);
    }

    const fastestProvider = sortedProviders
      .filter(([_, stats]) => stats.successful > 0)
      .sort((a, b) => a[1].avg_response_time - b[1].avg_response_time)[0];
    
    if (fastestProvider) {
      colorLog('blue', `  ⚡ Fastest: ${fastestProvider[0]} (${fastestProvider[1].avg_response_time.toFixed(0)}ms avg)`);
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    colorLog('cyan', `\n💾 Detailed report saved to: ${reportPath}`);

    // Generate CSV for analysis
    await this.generateCSVReport(report);
  }

  async generateCSVReport(report) {
    const csvData = [];
    csvData.push('Provider,Query,Success,ResponseTime,ResultCount,Error');

    this.results.tests.forEach(test => {
      csvData.push([
        test.provider,
        `"${test.query}"`,
        test.success,
        test.responseTime,
        test.resultCount,
        `"${test.error || ''}"`
      ].join(','));
    });

    const csvPath = path.join(__dirname, 'test-results.csv');
    await fs.writeFile(csvPath, csvData.join('\n'));
    colorLog('cyan', `📈 CSV report saved to: ${csvPath}`);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new MCPTestRunner();

  if (args.length === 0) {
    // Run all tests
    await runner.runAllTests();
  } else if (args[0] === '--provider' && args[1]) {
    // Run specific provider test
    await runner.runSpecificTest(args[1]);
  } else if (args[0] === '--list') {
    // List available providers
    colorLog('cyan', 'Available providers:');
    Object.keys(runner.servers).forEach(provider => {
      console.log(`  - ${provider}`);
    });
  } else if (args[0] === '--help') {
    // Show help
    console.log(`
MCP Search Provider Test Suite

Usage:
  node ${path.basename(__filename)}                    # Run all tests
  node ${path.basename(__filename)} --provider NAME    # Test specific provider
  node ${path.basename(__filename)} --list             # List providers
  node ${path.basename(__filename)} --help             # Show this help

Examples:
  node ${path.basename(__filename)} --provider SearXNG
  node ${path.basename(__filename)} --provider Google-CSE
  node ${path.basename(__filename)} --provider Hybrid-Server

Environment Variables:
  GOOGLE_API_KEY              # Required for Google Custom Search
  GOOGLE_SEARCH_ENGINE_ID     # Required for Google Custom Search
  APIFY_TOKEN                 # Required for Apify RAG Browser
    `);
  } else {
    colorLog('red', '❌ Invalid arguments. Use --help for usage information.');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  colorLog('red', `❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  colorLog('yellow', '\n⚠️  Test interrupted by user');
  process.exit(0);
});

// Run the tests
main().catch(error => {
  colorLog('red', `❌ Test suite failed: ${error.message}`);
  process.exit(1);
});
