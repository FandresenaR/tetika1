const testSimpleScraping = async () => {
  try {
    console.log('🔍 Testing simple scraping without Puppeteer...');
    
    const response = await fetch('http://localhost:3001/api/scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'healthcare companies in France',
        mode: 'quick-scraping',
        maxSources: 5,
        includeAnalysis: true
      })
    });

    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Simple Scraping API Response:');
    console.log('Success:', result.success);
    console.log('Steps:', result.steps?.length || 0);
    
    if (result.reportData) {
      console.log('📊 Report summary:', result.reportData.summary);
      console.log('🔗 Sources found:', result.reportData.sources?.length || 0);
    }
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testSimpleScraping();
