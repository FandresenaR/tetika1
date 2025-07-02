#!/usr/bin/env node

import fetch from 'node-fetch';

const VIVATECH_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';

async function testVivaTechExtraction() {
  try {
    console.log('🧪 Testing VivaTechnology extraction...');
    console.log(`🌐 URL: ${VIVATECH_URL}`);
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'extract_company_data',
        args: {
          url: VIVATECH_URL,
          extractionMode: 'companies',
          maxResults: 20,
          instructions: 'Extract all company names, their website links, and employee counts from the VivaTechnology partners page. This page loads content dynamically and may require scrolling. If needed, click on company names to get additional details like employee count.'
        }
      }),
      timeout: 120000 // 2 minutes timeout for VivaTech
    });
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Response received successfully`);
    
    if (data.success && data.data && data.data.content) {
      try {
        const content = JSON.parse(data.data.content[0].text);
        
        console.log('\n📊 EXTRACTION RESULTS:');
        console.log('='.repeat(50));
        console.log(`Success: ${content.success ? '✅' : '❌'}`);
        console.log(`URL Processed: ${content.url}`);
        console.log(`Total Found: ${content.totalFound || 0}`);
        console.log(`Method: ${content.method}`);
        console.log(`Timestamp: ${content.timestamp}`);
        
        if (content.companies && Array.isArray(content.companies) && content.companies.length > 0) {
          console.log(`\n🏢 COMPANIES EXTRACTED (${content.companies.length}):`);
          console.log('='.repeat(50));
          
          content.companies.forEach((company, index) => {
            console.log(`\n${index + 1}. ${company.name || 'Unknown Company'}`);
            console.log(`   Website: ${company.website || 'Not available'}`);
            console.log(`   Employees: ${company.employees || 'Not available'}`);
            console.log(`   Industry: ${company.industry || 'Not specified'}`);
            console.log(`   Location: ${company.location || 'Not specified'}`);
            
            if (company.description && company.description.length > 0) {
              console.log(`   Description: ${company.description.substring(0, 100)}${company.description.length > 100 ? '...' : ''}`);
            }
          });
          
          // Quality analysis
          const withWebsites = content.companies.filter(c => c.website && c.website !== 'Not available' && c.website !== '').length;
          const withEmployees = content.companies.filter(c => c.employees && c.employees !== 'Not available' && c.employees !== 'Not specified').length;
          const withIndustry = content.companies.filter(c => c.industry && c.industry !== 'Not specified').length;
          
          console.log(`\n📈 DATA QUALITY ANALYSIS:`);
          console.log('='.repeat(50));
          console.log(`Companies with websites: ${withWebsites}/${content.companies.length} (${((withWebsites/content.companies.length)*100).toFixed(1)}%)`);
          console.log(`Companies with employee data: ${withEmployees}/${content.companies.length} (${((withEmployees/content.companies.length)*100).toFixed(1)}%)`);
          console.log(`Companies with industry data: ${withIndustry}/${content.companies.length} (${((withIndustry/content.companies.length)*100).toFixed(1)}%)`);
          
          console.log(`\n🎯 SUCCESS! VivaTechnology extraction completed successfully.`);
          
        } else {
          console.log('\n❌ No companies were extracted.');
          console.log('💡 This might indicate:');
          console.log('   - The page structure has changed');
          console.log('   - Anti-bot protection prevented access');
          console.log('   - Content is loaded via JavaScript after our extraction');
          
          if (content.error) {
            console.log(`   - Error: ${content.error}`);
          }
        }
        
      } catch (parseError) {
        console.log('❌ Error parsing response content');
        console.log('📄 Raw response:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ Invalid response structure');
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('💡 The request timed out - this is common with VivaTech due to anti-bot protection');
      console.log('💡 Suggestions:');
      console.log('   - Try with a longer timeout');
      console.log('   - Use a different browser configuration');
      console.log('   - Consider using a proxy service');
    }
  }
}

testVivaTechExtraction();
