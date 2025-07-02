#!/usr/bin/env node

import fetch from 'node-fetch';

async function testSimpleNavigation() {
  try {
    console.log('🧪 Testing simple navigation and content extraction...');
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'fetch_web_content',
        args: {
          url: 'https://vivatechnology.com',
          options: {
            maxResults: 1
          }
        }
      }),
      timeout: 30000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received');
      console.log('📄 Raw response structure:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleNavigation();
