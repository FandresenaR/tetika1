#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test the MCP server with sample requests
async function testMCPServer() {
  const serverPath = path.join(__dirname, 'servers', 'tetika-agent.js');
  
  console.log('Testing Tetika MCP Agent Server...');
  
  // Test requests
  const testRequests = [
    {
      name: 'List Tools',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      }
    },
    {
      name: 'Get Tetika Status',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_tetika_status',
          arguments: {
            include_models: true,
            include_settings: true
          }
        }
      }
    }
  ];

  for (const test of testRequests) {
    console.log(`\n--- Testing: ${test.name} ---`);
    
    try {
      const result = await runMCPRequest(serverPath, test.request);
      console.log('✓ Success:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('✗ Error:', error.message);
    }
  }
}

function runMCPRequest(serverPath, request) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
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

    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Run the tests
testMCPServer().catch(console.error);
