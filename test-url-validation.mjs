// Test URL validation and protocol handling
async function testUrlValidation() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔗 Testing URL validation and protocol handling...\n');
  
  const testCases = [
    {
      name: 'URL without protocol',
      url: 'example.com',
      expected: 'Should add https:// protocol'
    },
    {
      name: 'URL with https protocol',
      url: 'https://example.com',
      expected: 'Should work as-is'
    },
    {
      name: 'VivaTech URL without protocol',
      url: 'vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness',
      expected: 'Should add https:// protocol'
    },
    {
      name: 'VivaTech URL with protocol',
      url: 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness',
      expected: 'Should work as-is'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   Input: ${testCase.url}`);
    console.log(`   Expected: ${testCase.expected}`);
    
    try {
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
      
      const result = await response.json();
      
      if (result.success) {
        const sessionData = JSON.parse(result.data.content[0].text);
        console.log(`   ✅ SUCCESS: Session created with URL: ${sessionData.url}`);
        
        // Cleanup the session
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
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 URL validation tests completed!');
}

// Run the test
testUrlValidation();
