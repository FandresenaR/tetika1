#!/usr/bin/env node

/**
 * Test script for the Tetika Scraping System
 * This script demonstrates how to use the scraping API for VivaTechnology partners
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testVivaTechnologyScraping() {
  console.log('🧪 Testing VivaTechnology Partners Scraping\n');
  
  const testQueries = [
    {
      name: 'VivaTechnology Partners - Direct URL',
      query: 'https://vivatechnology.com/partners give me all the company name with the website for each company and their employee number',
      mode: 'deep-scraping',
      maxSources: 100 // Increased for more companies
    },
    {
      name: 'VivaTechnology Partners - Alternative Query',
      query: 'Scrape system: https://vivatechnology.com/partners extract company data including names, websites, employee counts',
      mode: 'deep-scraping',
      maxSources: 50
    }
  ];

  for (const test of testQueries) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Mode: ${test.mode}, Max Sources: ${test.maxSources}\n`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/api/scraping`, {
        query: test.query,
        mode: test.mode,
        maxSources: test.maxSources,
        includeAnalysis: true
      }, {
        timeout: 120000 // 2 minutes timeout for complex scraping
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      if (response.data.success) {
        console.log(`✅ Success! (${duration}s)`);
        console.log(`📊 Results:`);
        console.log(`   - Steps completed: ${response.data.steps.length}`);
        console.log(`   - Scraping type: ${response.data.reportData?.scrapingType || 'Unknown'}`);
        console.log(`   - Companies found: ${response.data.reportData?.summary?.successfulExtractions || 0}`);
        console.log(`   - Data type: ${response.data.reportData?.summary?.dataType || 'Unknown'}`);
        
        // Show thinking process steps
        console.log(`\n🧠 Thinking Process:`);
        response.data.steps.forEach((step, index) => {
          const statusIcon = step.status === 'completed' ? '✅' : 
                           step.status === 'in-progress' ? '⏳' : '❌';
          console.log(`   ${index + 1}. ${statusIcon} ${step.title}`);
          console.log(`      ${step.description}`);
          if (step.sources.length > 0) {
            console.log(`      Sources: ${step.sources.length}`);
          }
        });
        
        // Show company data if available
        if (response.data.reportData?.companyData) {
          console.log(`\n🏢 Company Data Sample (first 5):`);
          response.data.reportData.companyData.slice(0, 5).forEach((company, index) => {
            console.log(`   ${index + 1}. ${company['Company Name']}`);
            console.log(`      Website: ${company['Website']}`);
            console.log(`      Employees: ${company['Employees']}`);
            console.log(`      Industry: ${company['Industry']}`);
            console.log(`      Location: ${company['Location']}`);
          });
          
          console.log(`\n📈 Full dataset contains ${response.data.reportData.companyData.length} companies`);
        }
        
        // Show analysis if available
        if (response.data.reportData?.analysis) {
          const analysis = response.data.reportData.analysis;
          console.log(`\n📊 Analysis:`);
          
          if (analysis.totalCompanies) {
            console.log(`   - Total companies: ${analysis.totalCompanies}`);
            
            if (analysis.employeeRanges) {
              console.log(`   - Employee distribution:`);
              Object.entries(analysis.employeeRanges).forEach(([range, count]) => {
                console.log(`     * ${range}: ${count}`);
              });
            }
            
            if (analysis.industryDistribution) {
              const topIndustries = Object.entries(analysis.industryDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
              console.log(`   - Top industries: ${topIndustries.map(([industry, count]) => `${industry} (${count})`).join(', ')}`);
            }
            
            if (analysis.websiteStatus) {
              console.log(`   - Website availability: ${analysis.websiteStatus.hasWebsite} have websites, ${analysis.websiteStatus.noWebsite} don't`);
            }
          }
        }
        
      } else {
        console.log(`❌ Failed: ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    console.log('\n' + '─'.repeat(80) + '\n');
  }
}

async function testGeneralScraping() {
  console.log('🧪 Testing General Scraping Functionality\n');
  
  const testQueries = [
    {
      name: 'AI Technology Trends',
      query: 'artificial intelligence trends 2025',
      mode: 'quick-scraping',
      maxSources: 5
    },
    {
      name: 'Direct Company Page',
      query: 'https://www.apple.com/about company information employees',
      mode: 'deep-scraping',
      maxSources: 1
    }
  ];

  for (const test of testQueries) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`Query: "${test.query}"`);
    console.log(`Mode: ${test.mode}, Max Sources: ${test.maxSources}\n`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/api/scraping`, {
        query: test.query,
        mode: test.mode,
        maxSources: test.maxSources,
        includeAnalysis: true
      }, {
        timeout: 60000
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      if (response.data.success) {
        console.log(`✅ Success! (${duration}s)`);
        console.log(`📊 Results:`);
        console.log(`   - Steps completed: ${response.data.steps.length}`);
        console.log(`   - Sources found: ${response.data.reportData?.summary?.totalSources || 0}`);
        console.log(`   - Successful extractions: ${response.data.reportData?.summary?.successfulExtractions || 0}`);
        console.log(`   - Total words: ${response.data.reportData?.summary?.totalWords || 0}`);
        
      } else {
        console.log(`❌ Failed: ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '─'.repeat(40) + '\n');
  }
}

async function testAPIStatus() {
  console.log('📡 Testing API Status...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/scraping`);
    console.log('✅ API is online');
    console.log('📋 API Info:');
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Supported modes: ${response.data.supportedModes.join(', ')}`);
    console.log(`   Features: ${response.data.features.join(', ')}`);
    console.log();
    return true;
  } catch (error) {
    console.log('❌ API is not available');
    console.log(`   Error: ${error.message}`);
    console.log(`   Make sure the Tetika server is running on ${BASE_URL}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Tetika Enhanced Scraping System Test Suite');
  console.log('==============================================\n');
  
  const apiOnline = await testAPIStatus();
  
  if (apiOnline) {
    // Test VivaTechnology specific scraping
    await testVivaTechnologyScraping();
    
    // Test general scraping
    await testGeneralScraping();
    
    console.log('✨ Test completed!');
    console.log('\n💡 To use the enhanced scraping system:');
    console.log('   1. For VivaTechnology: "Scrape system: https://vivatechnology.com/partners [request]"');
    console.log('   2. For general scraping: "Scrape system: [your query]" or "@scrape [query]"');
    console.log('   3. The system will automatically detect URLs and use advanced scraping');
    console.log('   4. Company data will be extracted with names, websites, employee counts');
    console.log('   5. Check the Thinking Process sidebar for detailed progress');
    console.log('   6. Download complete reports with Excel-ready company tables');
  }
}

// Run the tests
main().catch(console.error);
