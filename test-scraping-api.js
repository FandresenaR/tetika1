const testScraping = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness',
        mode: 'quick-scraping',
        maxSources: 10,
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
    
    console.log('✅ Scraping API Response:');
    console.log('Success:', result.success);
    console.log('Steps:', result.steps?.length || 0);
    
    if (result.reportData?.companyData) {
      console.log('🏢 Companies found:', result.reportData.companyData.length);
      console.log('📋 First few companies:');
      result.reportData.companyData.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company['Company Name']} - ${company.Website} (${company.Employees} employees)`);
      });
    }
    
    if (result.error) {
      console.error('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testScraping();
