// Test enhanced navigation strategies
async function testEnhancedNavigation() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Testing enhanced navigation strategies...\n');
  
  const testCases = [
    {
      name: 'Working Site (Example.com)',
      url: 'https://example.com',
      expectedSuccess: true
    },
    {
      name: 'VivaTech (Protected Site)',
      url: 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness',
      expectedSuccess: false,
      note: 'Expected to fail due to anti-bot protection'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    if (testCase.note) console.log(`   Note: ${testCase.note}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'interactive_scraper',
          args: {
            action: 'start',
            url: testCase.url
          }
        })
      });
      
      const duration = Date.now() - startTime;
      const result = await response.json();
      
      if (result.success) {
        const sessionData = JSON.parse(result.data.content[0].text);
        console.log(`   ✅ SUCCESS (${duration}ms): Session created`);
        console.log(`   📊 Session ID: ${sessionData.sessionId}`);
        console.log(`   📊 Final URL: ${sessionData.url}`);
        
        // Cleanup
        await fetch(`${baseUrl}/api/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'interactive_scraper',
            args: {
              action: 'cleanup',
              sessionId: sessionData.sessionId
            }
          })
        });
        
        console.log(`   🧹 Session cleaned up`);
      } else {
        const errorData = JSON.parse(result.data.content[0].text);
        console.log(`   ❌ FAILED (${duration}ms): ${errorData.message}`);
        
        if (testCase.expectedSuccess) {
          console.log(`   ⚠️  Unexpected failure for ${testCase.name}`);
        } else {
          console.log(`   ℹ️  Expected failure - anti-bot protection working`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🎉 Enhanced navigation testing completed!');
}

// Run the test
testEnhancedNavigation();
