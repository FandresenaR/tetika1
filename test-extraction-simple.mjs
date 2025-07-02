#!/usr/bin/env node

import fetch from 'node-fetch';

async function testCompanyExtraction() {
  try {
    console.log('🧪 Testing company extraction with simple URL...');
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: 'https://example.com',
          extractionMode: 'companies',
          maxResults: 5,
          instructions: 'Test extraction with a simple page'
        }
      }),
      timeout: 30000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ Basic extraction test passed!');
      
      if (data.success && data.data && data.data.content) {
        try {
          const content = JSON.parse(data.data.content[0].text);
          console.log(`📊 Extraction successful: ${content.success}`);
          console.log(`🌐 URL processed: ${content.url}`);
          console.log(`📈 Companies found: ${content.totalFound}`);
          console.log(`🔧 Method: ${content.method}`);
        } catch (parseError) {
          console.log('Raw response:', JSON.stringify(data, null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCompanyExtraction();
