#!/usr/bin/env node

/**
 * Comprehensive test for the enhanced MCP scraping system
 */

import fetch from 'node-fetch';

const TEST_URL = 'https://vivatechnology.com/partners?hashtags=healthcare%2520%2526%2520wellness';
const API_BASE = 'http://localhost:3000';

// Test data for different scenarios
const testScenarios = [
  {
    name: 'VivaTechnology Partners - Enhanced Extraction',
    tool: 'extract_company_data',
    args: {
      url: TEST_URL,
      extractionMode: 'companies',
      maxResults: 20,
      instructions: 'Extract all company names, their website links, and employee counts from the VivaTechnology partners page. This page loads content dynamically and may require scrolling. If needed, click on company names to get additional details like employee count.'
    }
  },
  {
    name: 'VivaTechnology Partners - Intelligent Navigation',
    tool: 'intelligent_navigation',
    args: {
      url: TEST_URL,
      task: 'extract_companies',
      maxPages: 2,
      maxResults: 15
    }
  },
  {
    name: 'Simple Test URL - Basic Extraction',
    tool: 'extract_company_data',
    args: {
      url: 'https://example.com',
      extractionMode: 'companies',
      maxResults: 5,
      instructions: 'Test extraction with a simple page to verify the system works'
    }
  }
];

async function testMCPTool(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log('='.repeat(60));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: scenario.tool,
        args: scenario.args
      }),
      timeout: 120000 // 2 minutes timeout
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Response received in ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Success: ${data.success}`);
    
    if (data.success && data.data && data.data.content) {
      try {
        const content = JSON.parse(data.data.content[0].text);
        
        console.log(`📈 Total found: ${content.totalFound || 'N/A'}`);
        console.log(`🔧 Method: ${content.method || 'N/A'}`);
        console.log(`🌐 URL: ${content.url || 'N/A'}`);
        
        if (content.companies && Array.isArray(content.companies)) {
          console.log(`\n📋 Sample companies (showing first 3):`);
          content.companies.slice(0, 3).forEach((company, index) => {
            console.log(`  ${index + 1}. ${company.name || 'Unknown'}`);
            console.log(`     Website: ${company.website || 'Not available'}`);
            console.log(`     Employees: ${company.employees || 'Not available'}`);
            console.log(`     Industry: ${company.industry || 'Not specified'}`);
          });
          
          // Analysis
          const withWebsites = content.companies.filter(c => c.website && c.website !== 'Not available' && c.website !== '').length;
          const withEmployees = content.companies.filter(c => c.employees && c.employees !== 'Not available' && c.employees !== 'Not specified').length;
          
          console.log(`\n📊 Data Quality:`);
          console.log(`   Companies with websites: ${withWebsites}/${content.companies.length}`);
          console.log(`   Companies with employee data: ${withEmployees}/${content.companies.length}`);
        }
        
        return {
          success: true,
          duration,
          totalFound: content.totalFound || 0,
          companiesExtracted: content.companies ? content.companies.length : 0,
          dataQuality: {
            withWebsites: content.companies ? content.companies.filter(c => c.website && c.website !== 'Not available' && c.website !== '').length : 0,
            withEmployees: content.companies ? content.companies.filter(c => c.employees && c.employees !== 'Not available' && c.employees !== 'Not specified').length : 0
          }
        };
        
      } catch (parseError) {
        console.log('📄 Raw response data:', JSON.stringify(data, null, 2));
        return { success: true, duration, raw: true };
      }
    } else {
      console.log('❌ No valid data in response');
      console.log('📄 Response:', JSON.stringify(data, null, 2));
      return { success: false, duration, error: 'No valid data' };
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkServerStatus() {
  try {
    console.log('🔍 Checking server status...');
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log(`⚠️ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Server is not accessible:', error.message);
    console.log('💡 Please start the server with: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Enhanced MCP Scraping Tests');
  console.log('=' .repeat(80));
  
  // Check server status first
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n❌ Cannot run tests - server is not accessible');
    return;
  }
  
  console.log('\n🎯 Testing scenarios:');
  testScenarios.forEach((scenario, index) => {
    console.log(`  ${index + 1}. ${scenario.name} (${scenario.tool})`);
  });
  
  const results = [];
  
  // Run tests
  for (const scenario of testScenarios) {
    const result = await testMCPTool(scenario);
    results.push({ scenario: scenario.name, ...result });
    
    // Wait between tests to avoid overwhelming the system
    if (testScenarios.indexOf(scenario) < testScenarios.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.scenario}`);
    console.log(`   Status: ${result.success ? '✅ Pass' : '❌ Fail'}`);
    
    if (result.duration) {
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);
    }
    
    if (result.companiesExtracted) {
      console.log(`   Companies: ${result.companiesExtracted}`);
    }
    
    if (result.dataQuality) {
      console.log(`   With Websites: ${result.dataQuality.withWebsites}`);
      console.log(`   With Employees: ${result.dataQuality.withEmployees}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n🎯 Overall Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed! The enhanced MCP scraping system is working correctly.');
  } else if (successCount > 0) {
    console.log('⚠️ Some tests passed. The system is partially functional.');
  } else {
    console.log('❌ All tests failed. The system needs investigation.');
  }
  
  // Specific VivaTech analysis
  const vivaTechResults = results.filter(r => r.scenario.includes('VivaTechnology'));
  if (vivaTechResults.length > 0) {
    console.log('\n🎯 VivaTechnology Specific Analysis:');
    vivaTechResults.forEach(result => {
      if (result.companiesExtracted && result.companiesExtracted > 0) {
        console.log(`✅ Successfully extracted ${result.companiesExtracted} companies from VivaTech`);
      } else {
        console.log(`❌ Failed to extract companies from VivaTech - may need anti-bot strategy adjustment`);
      }
    });
  }
}

main().catch(console.error);
