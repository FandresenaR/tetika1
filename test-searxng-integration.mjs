#!/usr/bin/env node

// Test script to verify the SearXNG HTML parsing integration

async function testSearXNGIntegration() {
  try {
    console.log('🧪 Testing SearXNG integration with HTML parsing...\n');
    
    const query = 'Madagascar tourism attractions';
    
    const response = await fetch('http://localhost:3002/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'multi_search',
        args: {
          provider: 'searxng',
          query: query
        }
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.results && data.data.results.length > 0) {
      console.log('\n✅ SUCCESS: SearXNG HTML parsing working!');
      console.log(`📈 Found ${data.data.results.length} results`);
      console.log(`🔍 Provider used: ${data.data.provider}`);
      console.log('\n📋 Sample results:');
      data.data.results.slice(0, 3).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('❌ FAILURE: No results or error occurred');
      if (data.error) {
        console.log('Error:', data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSearXNGIntegration();
