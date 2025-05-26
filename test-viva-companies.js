// Test script to verify the regex-based company name extraction
import axios from 'axios';

async function testVivaCompanyExtraction() {
  try {
    console.log('Testing regex-based company name extraction...');
    console.log('Making request to: http://localhost:3003/api/scrape');
    
    const response = await axios.post('http://localhost:3003/api/scrape', {
      url: 'https://vivatechnology.com/partners',
      prompt: 'Extract company names in different formats: Pascal case, camel case, and multi-word',
      mode: 'metadata'
    }, {
      timeout: 120000, // 120 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data?.metadata?.companies) {
      const companies = response.data.data.metadata.companies;
      console.log(`Total companies found: ${companies.length}`);
      
      // Group companies by naming pattern
      const pascalCase = companies.filter(c => /^[A-Z][a-z]+[A-Z][a-z]+/.test(c.name));
      const camelCase = companies.filter(c => /^[a-z]+[A-Z][a-z]+/.test(c.name));
      const multiWord = companies.filter(c => /\s+/.test(c.name));
      const abbreviations = companies.filter(c => /^[A-Z]{2,}$/.test(c.name));
      
      console.log(`\nCompany naming patterns:`);
      console.log(`- PascalCase: ${pascalCase.length}`);
      console.log(`- camelCase: ${camelCase.length}`);
      console.log(`- Multi-word: ${multiWord.length}`);
      console.log(`- Abbreviations: ${abbreviations.length}`);
      
      // Sample companies of different patterns
      console.log('\nSample PascalCase companies:');
      pascalCase.slice(0, 5).forEach(c => console.log(`- ${c.name}`));
      
      console.log('\nSample camelCase companies:');
      camelCase.slice(0, 5).forEach(c => console.log(`- ${c.name}`));
      
      console.log('\nSample multi-word companies:');
      multiWord.slice(0, 5).forEach(c => console.log(`- ${c.name}`));
      
      console.log('\nSample abbreviation companies:');
      abbreviations.slice(0, 5).forEach(c => console.log(`- ${c.name}`));
      
      // Special case for any companies with websites
      const companiesWithWebsites = companies.filter(c => c.website);
      console.log(`\nCompanies with websites: ${companiesWithWebsites.length}`);
      companiesWithWebsites.forEach(c => {
        console.log(`- ${c.name}: ${c.website}`);
      });
      
    } else {
      console.log('Failed to retrieve company data');
    }
  } catch (error) {
    console.error('Error testing company extraction:', error);
  }
}

testVivaCompanyExtraction();
