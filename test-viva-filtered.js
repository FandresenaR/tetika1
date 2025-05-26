// Test script to verify filtered view extraction for Viva Technology partners
import axios from 'axios';

async function testFilteredVivaExtraction() {
  try {
    console.log('Testing filtered view extraction for Viva Technology partners...');
    console.log('Making request to: http://localhost:3003/api/scrape');
    
    // Test healthcare filter specifically using the fixed implementation
    const response = await axios.post('http://localhost:3003/api/scrape', {
      url: 'https://vivatechnology.com/partners?hashtags=Healthcare+%26+Wellness',
      prompt: 'Extract all the healthcare companies with their websites and tags',
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
      
      // Check if we have the expected healthcare companies
      const healthcareCompanies = companies.filter(c => 
        c.tags && c.tags.some(tag => 
          tag.toLowerCase().includes('health') || 
          tag.toLowerCase().includes('wellness')
        )
      );
      
      console.log(`Healthcare-related companies found: ${healthcareCompanies.length}`);
      console.log('\nSample Healthcare companies:');
      healthcareCompanies.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        if (company.website) console.log(`   Website: ${company.website}`);
        if (company.tags) console.log(`   Tags: ${company.tags.join(', ')}`);
        console.log('');
      });
        // Log companies with specific known names from healthcare sector
      const knownHealthcareCompanies = [
        "3D BIOTECHNOLOGY SOLUTIONS", 
        "AALIA.TECH", 
        "AD'OCC - RÉGION OCCITANIE",
        "ADCIS - GROUPE EVOLUCARE",
        "AMAZE",
        "DATEXIM",
        "DEEPGING",
        "FINNOCARE",
        "JURATA",
        "MUHCCS"
      ];
      
      console.log('\nChecking for known Healthcare companies:');
      knownHealthcareCompanies.forEach(name => {
        const foundCompany = companies.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (foundCompany) {
          console.log(`- ${name}: ✅ Found ${foundCompany.website ? `(Website: ${foundCompany.website})` : ''}`);
          if (foundCompany.tags) {
            console.log(`  Tags: ${foundCompany.tags.join(', ')}`);
          }
        } else {
          console.log(`- ${name}: ❌ Not found`);
        }
      });
      
    } else {
      console.log('Failed to retrieve company data');
      console.log(response.data);
    }
  } catch (error) {
    console.error('Error testing filtered extraction:');
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

testFilteredVivaExtraction();
