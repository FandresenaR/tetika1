#!/usr/bin/env node

import fetch from 'node-fetch';

async function testMCPEndpoint() {
  try {
    console.log('🧪 Testing MCP endpoint with simple request...');
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'web_search',
        args: {
          query: 'test query',
          num_results: 3
        }
      }),
      timeout: 10000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMCPEndpoint();
