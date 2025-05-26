// Test script to verify the enhanced scraping functionality
import axios from 'axios';

async function testScraping() {
  try {
    console.log('Testing enhanced scraping functionality...');
    console.log('Making request to: http://localhost:3003/api/scrape');
      const response = await axios.post('http://localhost:3003/api/scrape', {
      url: 'https://vivatechnology.com/partners',
      prompt: 'I want to obtain all the company name inside this link with their respective websites, employ range number and hashtags',
      mode: 'metadata'
    }, {
      timeout: 120000, // 120 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data structure:', Object.keys(response.data));
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('✅ Title:', data.title);
      console.log('✅ Content length:', data.content?.length || 0);
      console.log('✅ Links found:', data.links?.length || 0);
      console.log('✅ Images found:', data.images?.length || 0);
      
      if (data.metadata && data.metadata.companies) {
        console.log('✅ Companies found:', data.metadata.companies.length);
        console.log('Sample companies:');
        data.metadata.companies.slice(0, 5).forEach((company, index) => {
          console.log(`${index + 1}. ${company.name}`);
          if (company.website) console.log(`   Website: ${company.website}`);
          if (company.employees) console.log(`   Employees: ${company.employees}`);
          if (company.tags && company.tags.length > 0) console.log(`   Tags: ${company.tags.join(', ')}`);
          console.log('');
        });
      } else {
        console.log('❌ No companies found in metadata');
      }
    } else {
      console.log('❌ Unsuccessful response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing scraping:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Request setup error:', error.message);
    }
    console.error('Full error:', error);
  }
}

testScraping();
