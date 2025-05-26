// Test script to verify the enhanced scraping functionality
import axios from 'axios';

async function testScraping() {
  try {
    console.log('Testing enhanced scraping functionality...');      const response = await axios.post('http://localhost:3001/api/scrape', {
      url: 'https://vivatechnology.com/partners',
      prompt: 'I want to obtain all the company name inside this link with their respective websites, employ range number and hashtags',
      mode: 'metadata'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data structure:', Object.keys(response.data));
    
    if (response.data.metadata && response.data.metadata.companies) {
      console.log('✅ Companies found:', response.data.metadata.companies.length);
      console.log('Sample companies:', response.data.metadata.companies.slice(0, 3));
    } else {
      console.log('❌ No companies found in metadata');
    }
    
    console.log('Links found:', response.data.links?.length || 0);
    console.log('Images found:', response.data.images?.length || 0);
    console.log('Content length:', response.data.content?.length || 0);
    
  } catch (error) {
    console.error('❌ Error testing scraping:', error.response?.data || error.message);
  }
}

testScraping();
