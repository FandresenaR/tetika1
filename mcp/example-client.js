#!/usr/bin/env node

/**
 * Example script demonstrating how to interact with the Tetika MCP server
 * This shows how external applications can use Tetika's capabilities
 */

const { spawn } = require('child_process');
const path = require('path');

class TetikaAgentClient {
  constructor() {
    this.serverPath = path.join(__dirname, 'servers', 'tetika-agent.js');
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const server = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
          SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
        }
      });

      let stdout = '';
      let stderr = '';

      server.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      server.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      server.on('close', (code) => {
        if (code === 0) {
          try {
            const lines = stdout.trim().split('\n');
            const response = JSON.parse(lines[lines.length - 1]);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`Server exited with code ${code}: ${stderr}`));
        }
      });

      server.on('error', (error) => {
        reject(error);
      });

      server.stdin.write(JSON.stringify(request) + '\n');
      server.stdin.end();
    });
  }

  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(name, args = {}) {
    return this.sendRequest('tools/call', { name, arguments: args });
  }

  // Convenience methods for specific tools
  async searchWeb(query, options = {}) {
    return this.callTool('web_search', {
      query,
      ...options
    });
  }

  async chatWithAI(message, options = {}) {
    return this.callTool('chat_with_ai', {
      message,
      ...options
    });
  }

  async analyzeFile(filePath, fileType, options = {}) {
    return this.callTool('analyze_file', {
      file_path: filePath,
      file_type: fileType,
      ...options
    });
  }

  async manageConversation(action, options = {}) {
    return this.callTool('manage_conversation', {
      action,
      ...options
    });
  }

  async getStatus(options = {}) {
    return this.callTool('get_tetika_status', options);
  }
}

// Example usage
async function runExamples() {
  const client = new TetikaAgentClient();

  console.log('🤖 Tetika MCP Agent Client Examples\n');

  try {
    // 1. List available tools
    console.log('1. Listing available tools...');
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools?.length || 0} tools`);
    tools.tools?.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 2. Get Tetika status
    console.log('2. Getting Tetika status...');
    const status = await client.getStatus();
    if (status.content?.[0]?.text) {
      const statusData = JSON.parse(status.content[0].text);
      console.log(`✓ Tetika ${statusData.version} is ${statusData.status}`);
      console.log(`   Available models: ${statusData.available_models?.length || 0}`);
    }
    console.log();    // 3. Search the web (if SERPAPI_API_KEY is available)
    if (process.env.SERPAPI_API_KEY) {
      console.log('3. Searching the web...');
      const searchResult = await client.searchWeb('latest AI developments 2024', {
        num_results: 3
      });
      
      if (searchResult.content?.[0]?.text) {
        const searchData = JSON.parse(searchResult.content[0].text);
        console.log(`✓ Found ${searchData.total_results} results for "${searchData.query}"`);
        searchData.results?.slice(0, 2).forEach(result => {
          console.log(`   - ${result.title}`);
          console.log(`     ${result.url}`);
        });
      }
      console.log();    } else {
      console.log('3. Skipping web search (SERPAPI_API_KEY not set)\n');
    }

    // 4. Chat with AI (if OPENROUTER_API_KEY is available)
    if (process.env.OPENROUTER_API_KEY) {
      console.log('4. Chatting with AI...');
      const chatResult = await client.chatWithAI(
        'What is the capital of France? Answer in one sentence.',
        { model: 'gpt-3.5-turbo' }
      );
      
      if (chatResult.content?.[0]?.text) {
        console.log(`✓ AI Response: ${chatResult.content[0].text.substring(0, 100)}...`);
      }
      console.log();
    } else {
      console.log('4. Skipping AI chat (OPENROUTER_API_KEY not set)\n');
    }

    // 5. Conversation management
    console.log('5. Managing conversations...');
    
    // Create a conversation
    const createResult = await client.manageConversation('create', {
      title: 'Example Conversation'
    });
    
    if (createResult.content?.[0]?.text) {
      const createData = JSON.parse(createResult.content[0].text);
      console.log(`✓ Created conversation: ${createData.session?.title}`);
      
      // List conversations
      const listResult = await client.manageConversation('list', { limit: 5 });
      if (listResult.content?.[0]?.text) {
        const listData = JSON.parse(listResult.content[0].text);
        console.log(`✓ Found ${listData.total} total conversations`);
      }
    }
    console.log();

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error running examples:', error.message);
    process.exit(1);
  }
}

// Run examples if this script is executed directly
if (require.main === module) {
  console.log('Starting Tetika MCP Agent examples...');
  console.log('Make sure your API keys are set in environment variables.\n');
  
  runExamples().catch(error => {
    console.error('Failed to run examples:', error);
    process.exit(1);
  });
}

module.exports = { TetikaAgentClient };
