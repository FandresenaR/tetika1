#!/usr/bin/env node
/**
 * Test VivaTech navigation with improved anti-bot strategies
 */

import fetch from 'node-fetch';

const MCP_URL = 'http://localhost:3001/api/mcp';

async function testVivaTechNavigation() {
  console.log('🚀 Testing VivaTech navigation with improved strategies...\n');
  
  // Test 1: Main VivaTech page (should be more accessible)
  console.log('=== Test 1: Main VivaTech page ===');
  
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'start',
          url: 'https://vivatechnology.com/'
        }
      })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.content) {
      const content = JSON.parse(data.data.content[0].text);
      if (content.success) {
        console.log('✅ Main page navigation successful!');
        console.log('Session ID:', content.sessionId);
        
        // Test analysis
        console.log('\n=== Test 2: Analyzing main page ===');
        const analyzeResponse = await fetch(MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'analyze',
              sessionId: content.sessionId
            }
          })
        });
        
        const analyzeData = await analyzeResponse.json();
        console.log('Analysis success:', analyzeData.success);
        if (analyzeData.success) {
          const analysisContent = JSON.parse(analyzeData.data.content[0].text);
          console.log('Page title:', analysisContent.pageInfo?.title);
          console.log('Available elements:', analysisContent.pageInfo?.availableElements?.length);
        }
        
        // Clean up
        await fetch(MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'cleanup',
              sessionId: content.sessionId
            }
          })
        });
        
      } else {
        console.log('❌ Main page navigation failed:', content.message);
      }
    } else {
      console.log('❌ Main page navigation failed - invalid response structure');
    }
  } catch (error) {
    console.error('❌ Main page test failed:', error.message);
  }
  
  // Test 2: Specific startup page (more likely to be protected)
  console.log('\n=== Test 3: Specific startup page ===');
  
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'start',
          url: 'https://vivatechnology.com/innovation/startup/bedr%20-%20sustainable%20outdoor%20architecture/'
        }
      })
    });
    
    const data = await response.json();
    console.log('Response success:', data.success);
    
    if (data.success && data.data && data.data.content) {
      const content = JSON.parse(data.data.content[0].text);
      if (content.success) {
        console.log('✅ Startup page navigation successful!');
        console.log('Session ID:', content.sessionId);
        
        // Clean up
        await fetch(MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'cleanup',
              sessionId: content.sessionId
            }
          })
        });
        
      } else {
        console.log('❌ Startup page navigation failed:', content.message);
        console.log('This is expected for protected pages');
      }
    } else {
      console.log('❌ Startup page navigation failed - API error:', data.error);
    }
  } catch (error) {
    console.error('❌ Startup page test failed:', error.message);
  }
  
  // Test 3: Alternative approach - simpler URL
  console.log('\n=== Test 4: Alternative approach ===');
  
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'start',
          url: 'https://vivatechnology.com/innovation/'
        }
      })
    });
    
    const data = await response.json();
    console.log('Response success:', data.success);
    
    if (data.success && data.data && data.data.content) {
      const content = JSON.parse(data.data.content[0].text);
      if (content.success) {
        console.log('✅ Innovation page navigation successful!');
        
        // Clean up
        await fetch(MCP_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'cleanup',
              sessionId: content.sessionId
            }
          })
        });
        
      } else {
        console.log('❌ Innovation page navigation failed:', content.message);
      }
    } else {
      console.log('❌ Innovation page navigation failed - API error:', data.error);
    }
  } catch (error) {
    console.error('❌ Innovation page test failed:', error.message);
  }
}

testVivaTechNavigation().catch(console.error);
