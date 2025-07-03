// Test with URL missing protocol
async function testMissingProtocol() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔗 Testing URL without protocol...\n');
  
  const testUrl = 'example.com';  // No https://
  
  console.log(`📋 Testing URL: ${testUrl}`);
  
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
          url: testUrl
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const sessionData = JSON.parse(result.data.content[0].text);
      console.log(`✅ SUCCESS: Session created successfully!`);
      console.log(`📊 Input URL: ${testUrl}`);
      console.log(`📊 Processed URL: ${sessionData.url || 'N/A'}`);
      console.log(`📊 Session ID: ${sessionData.sessionId}`);
      
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
      
      console.log('✅ Session cleaned up successfully!');
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testMissingProtocol();
