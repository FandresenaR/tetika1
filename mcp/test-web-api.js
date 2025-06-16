#!/usr/bin/env node

/**
 * Test script for the Tetika MCP Web API
 * This tests the /api/mcp endpoint directly
 */

const axios = require('axios');

const testTools = [
  {
    name: 'get_tetika_status',
    description: 'Get Tetika status',
    args: {
      include_models: true,
      include_settings: true
    }
  },
  {
    name: 'manage_conversation',
    description: 'Create a new conversation',
    args: {
      action: 'create',
      title: 'Test Conversation from API'
    }
  }
];

async function testMCPWebAPI() {
  console.log('🧪 Testing Tetika MCP Web API...\n');

  const baseUrl = 'http://localhost:3001';

  for (const test of testTools) {
    console.log(`--- Testing: ${test.description} ---`);
    
    try {
      const response = await axios.post(`${baseUrl}/api/mcp`, {
        tool: test.name,
        args: test.args
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = response.data;
      
      if (result.success) {
        console.log('✅ Success!');
        if (result.data?.content?.[0]?.text) {
          const data = JSON.parse(result.data.content[0].text);
          if (test.name === 'get_tetika_status') {
            console.log(`   Status: ${data.status}`);
            console.log(`   Version: ${data.version}`);
            console.log(`   Models: ${data.available_models?.length || 0}`);
          } else if (test.name === 'manage_conversation') {
            console.log(`   Action: ${data.action}`);
            console.log(`   Session: ${data.session?.title || 'N/A'}`);
          }
        }
      } else {
        console.log('❌ Failed:', result.error);
      }    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Headers:', error.response.headers);
      }
    }
    
    console.log('');
  }

  console.log('🎉 Web API tests completed!');
}

// Run the tests
testMCPWebAPI().catch(console.error);
