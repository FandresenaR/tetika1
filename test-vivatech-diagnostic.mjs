#!/usr/bin/env node

import fetch from 'node-fetch';

const VIVATECH_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';

async function diagnoseVivaTechPage() {
  try {
    console.log('🔍 Diagnosing VivaTech page content...');
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: VIVATECH_URL,
          maxResults: 5,
          instructions: 'Diagnostic run - extract any companies found'
        }
      }),
      timeout: 90000
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data && data.data.content) {
        try {
          const content = JSON.parse(data.data.content[0].text);
          
          console.log('📋 DIAGNOSTIC RESULTS:');
          console.log('='.repeat(50));
          console.log(`Success: ${content.success}`);
          console.log(`Method: ${content.method}`);
          console.log(`Companies found: ${content.totalFound}`);
          
          if (content.debugInfo) {
            console.log('\n🔍 DEBUG INFO:');
            console.log('='.repeat(30));
            console.log(`Page title: ${content.debugInfo.title}`);
            console.log(`Body text length: ${content.debugInfo.bodyLength}`);
            console.log(`Total elements: ${content.debugInfo.totalElements}`);
            console.log(`Has partner text: ${content.debugInfo.hasPartnerText}`);
            console.log(`Has company text: ${content.debugInfo.hasCompanyText}`);
            
            console.log('\n📊 SELECTOR RESULTS:');
            Object.entries(content.debugInfo.selectorResults || {}).forEach(([selector, count]) => {
              console.log(`  ${selector}: ${count} elements`);
            });
          }
          
          if (content.warning) {
            console.log(`\n⚠️ Warning: ${content.warning}`);
          }
          
        } catch (parseError) {
          console.log('Error parsing response:', parseError.message);
          console.log('Raw response:', JSON.stringify(data, null, 2));
        }
      }
    } else {
      console.log(`❌ HTTP Error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseVivaTechPage();
