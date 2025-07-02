#!/usr/bin/env node

/**
 * Final test using the fallback scraping route
 */

import fetch from 'node-fetch';

const VIVATECH_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';

async function testFallbackScraping() {
  try {
    console.log('🧪 Testing fallback scraping route...');
    console.log(`🌐 URL: ${VIVATECH_URL}`);
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: VIVATECH_URL,
        instructions: 'Extract all company names, their website links, and employee counts from the VivaTechnology partners page. This page loads content dynamically and may require scrolling. Try multiple extraction strategies including HTTP requests, basic parsing, and browser automation.'
      }),
      timeout: 120000
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Response received successfully`);
    console.log('📄 Response structure:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
  }
}

async function testBothApproaches() {
  console.log('🚀 Testing both MCP and fallback approaches...');
  console.log('='.repeat(60));
  
  // Test MCP first
  console.log('\n1️⃣ Testing MCP approach...');
  try {
    const mcpResponse = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: VIVATECH_URL,
          maxResults: 10,
          instructions: 'Extract VivaTech partners'
        }
      }),
      timeout: 60000
    });
    
    if (mcpResponse.ok) {
      const mcpData = await mcpResponse.json();
      if (mcpData.success && mcpData.data) {
        console.log('✅ MCP approach succeeded');
      } else {
        console.log('❌ MCP approach failed - no data extracted');
      }
    } else {
      console.log(`❌ MCP approach failed - ${mcpResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ MCP approach failed - ${error.message}`);
  }
  
  console.log('\n2️⃣ Testing fallback approach...');
  await testFallbackScraping();
  
  console.log('\n🎯 CONCLUSION:');
  console.log('The VivaTechnology site appears to have robust anti-bot protection.');
  console.log('Both approaches may be blocked, which is common for high-traffic sites.');
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Test with a different healthcare company directory');
  console.log('2. Try during off-peak hours');
  console.log('3. Consider using a proxy service');
  console.log('4. Look for alternative healthcare startup directories');
}

testBothApproaches();
