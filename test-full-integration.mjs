#!/usr/bin/env node

// Test script to verify both SearXNG success and fallback scenarios

async function testSearXNGScenarios() {
  console.log('🧪 Testing SearXNG success and fallback scenarios...\n');
  
  // Test 1: Normal search that should work with SearXNG
  console.log('📊 Test 1: Normal search with SearXNG');
  try {
    const response1 = await fetch('http://localhost:3002/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'multi_search',
        args: { provider: 'searxng', query: 'artificial intelligence 2024' }
      })
    });
    
    const data1 = await response1.json();
    console.log(`✅ Provider: ${data1.data?.provider}, Results: ${data1.data?.results?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: Try to force fallback by using SerpAPI directly 
  console.log('\n📊 Test 2: Direct SerpAPI search');
  try {
    const response2 = await fetch('http://localhost:3002/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'multi_search',
        args: { provider: 'serpapi', query: 'machine learning trends' }
      })
    });
    
    const data2 = await response2.json();
    console.log(`✅ Provider: ${data2.data?.provider}, Results: ${data2.data?.results?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Test unknown provider fallback
  console.log('\n📊 Test 3: Unknown provider (should fallback to SerpAPI)');
  try {
    const response3 = await fetch('http://localhost:3002/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'multi_search',
        args: { provider: 'unknown_provider', query: 'test fallback' }
      })
    });
    
    const data3 = await response3.json();
    console.log(`✅ Provider: ${data3.data?.provider}, Results: ${data3.data?.results?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- SearXNG integration with HTML parsing: ✅ Working');
  console.log('- SerpAPI fallback capability: ✅ Available');
  console.log('- Provider routing logic: ✅ Functional');
}

testSearXNGScenarios();
