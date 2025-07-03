// Test VivaTech navigation with full workflow
async function testVivaTechWorkflow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing VivaTech full workflow...\n');
  
  const vivatechUrl = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';
  
  try {
    // Step 1: Start session
    console.log('📋 Step 1: Starting session...');
    const startResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'interactive_scraper',
        args: {
          action: 'start',
          url: vivatechUrl
        }
      })
    });
    
    const startResult = await startResponse.json();
    console.log('📊 Start Response:', JSON.stringify(startResult, null, 2));
    
    if (startResult.success) {
      const sessionData = JSON.parse(startResult.data.content[0].text);
      
      if (sessionData.success) {
        const sessionId = sessionData.sessionId;
        console.log(`✅ Session created: ${sessionId}`);
        
        // Step 2: Analyze page
        console.log('\n📋 Step 2: Analyzing page...');
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
        
        if (analyzeResult.success) {
          const analysisData = JSON.parse(analyzeResult.data.content[0].text);
          console.log(`✅ Page analysis successful`);
          console.log(`📊 Page title: ${analysisData.pageInfo?.title}`);
          console.log(`📊 Available elements: ${analysisData.pageInfo?.availableElements?.length || 0}`);
          console.log(`📊 Available links: ${analysisData.pageInfo?.availableLinks?.length || 0}`);
          
          // Step 3: Extract healthcare companies
          console.log('\n📋 Step 3: Extracting healthcare companies...');
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
                instructions: 'Extract healthcare companies, their names, descriptions, and any contact information or website links'
              }
            })
          });
          
          const extractResult = await extractResponse.json();
          
          if (extractResult.success) {
            const extractData = JSON.parse(extractResult.data.content[0].text);
            console.log(`✅ Data extraction successful`);
            console.log(`📊 Total found: ${extractData.totalFound || 0}`);
            console.log(`📊 Companies with links: ${extractData.summary?.withLinks || 0}`);
            console.log(`📊 Sample data:`, extractData.extractedData?.slice(0, 2));
          } else {
            console.log(`❌ Extraction failed:`, extractResult.error);
          }
        } else {
          console.log(`❌ Analysis failed:`, analyzeResult.error);
        }
        
        // Cleanup
        console.log('\n📋 Step 4: Cleaning up...');
        await fetch(`${baseUrl}/api/mcp`, {
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
        console.log('✅ Session cleaned up');
        
      } else {
        console.log('❌ Session creation failed:', sessionData.message);
      }
    } else {
      console.log('❌ API call failed:', startResult.error);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testVivaTechWorkflow();
