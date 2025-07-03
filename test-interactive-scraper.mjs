import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the interactive scraper API
async function testInteractiveScraper() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 Testing Interactive Scraper API...\n');
  
  try {
    // Test 1: Start a session
    console.log('📋 Test 1: Starting scraping session...');
    const startResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'start',
          url: 'https://example.com'
        }
      })
    });
    
    const startResult = await startResponse.json();
    console.log('✅ Start session result:', startResult.success ? 'SUCCESS' : 'FAILED');
    
    if (!startResult.success) {
      console.log('❌ Error:', startResult.error);
      return;
    }
    
    const sessionData = JSON.parse(startResult.data.content[0].text);
    const sessionId = sessionData.sessionId;
    console.log('📝 Session ID:', sessionId);
    
    // Wait a bit for the session to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Analyze the page
    console.log('\n📋 Test 2: Analyzing page content...');
    const analyzeResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'analyze',
          sessionId: sessionId
        }
      })
    });
    
    const analyzeResult = await analyzeResponse.json();
    console.log('✅ Analyze result:', analyzeResult.success ? 'SUCCESS' : 'FAILED');
    
    if (analyzeResult.success) {
      const analysisData = JSON.parse(analyzeResult.data.content[0].text);
      console.log('📊 Page title:', analysisData.pageInfo?.title);
      console.log('📊 Available elements:', analysisData.pageInfo?.availableElements?.length || 0);
    }
    
    // Test 3: Extract data with instructions
    console.log('\n📋 Test 3: Extracting data...');
    const extractResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'extract',
          sessionId: sessionId,
          instructions: 'Extract the main heading and any paragraph text from this example page'
        }
      })
    });
    
    const extractResult = await extractResponse.json();
    console.log('✅ Extract result:', extractResult.success ? 'SUCCESS' : 'FAILED');
    
    if (extractResult.success) {
      const extractData = JSON.parse(extractResult.data.content[0].text);
      console.log('📊 Extracted items:', extractData.totalFound || 0);
      console.log('📊 Sample data:', extractData.extractedData?.slice(0, 2));
    }
    
    // Test 4: Cleanup
    console.log('\n📋 Test 4: Cleaning up session...');
    const cleanupResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'cleanup',
          sessionId: sessionId
        }
      })
    });
    
    const cleanupResult = await cleanupResponse.json();
    console.log('✅ Cleanup result:', cleanupResult.success ? 'SUCCESS' : 'FAILED');
    
    console.log('\n🎉 Interactive Scraper API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInteractiveScraper();
