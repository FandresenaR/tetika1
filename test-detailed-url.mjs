// Test specific URL validation issue
async function testSpecificUrl() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing specific URL validation issue...\n');
  
  const testUrl = 'vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';
  
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
    
    console.log('📊 Full API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      const sessionData = JSON.parse(result.data.content[0].text);
      console.log('✅ Session Data:');
      console.log(JSON.stringify(sessionData, null, 2));
    } else {
      console.log('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Request Error:', error.message);
  }
}

// Run the test
testSpecificUrl();
