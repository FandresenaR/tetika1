// Script to test SerpAPI key directly
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Function to clean API key (simplified version of the one in api.ts)
const cleanApiKey = (key, apiType = 'serpapi') => {
  if (!key) return '';
  
  // First simple cleaning - remove any whitespace, newlines and carriage returns
  let cleaned = key.replace(/[\r\n\s]/g, '');
  
  // For SerpAPI keys, validate hex format
  if (apiType === 'serpapi') {
    // Check if already valid
    if (cleaned.length === 64 && /^[0-9a-f]{64}$/i.test(cleaned)) {
      console.log('Valid SerpAPI key format detected');
    } else {
      // Try to extract a direct hex match
      const hexKeyMatch = cleaned.match(/([0-9a-f]{64})/i);
      if (hexKeyMatch && hexKeyMatch[1]) {
        cleaned = hexKeyMatch[1];
        console.log('Extracted a 64-character hex key from a longer string');
      }
    }
  }
  
  return cleaned;
};

async function testSerpAPI() {
  try {
    console.log('Testing SerpAPI key from .env.local...');
    
    // Get the API key from environment
    const rawKey = process.env.SERPAPI_API_KEY || '';
    console.log(`Raw key length: ${rawKey.length}, first chars: ${rawKey.substring(0, 6)}...`);
    
    // Clean and validate the key
    const cleanedKey = cleanApiKey(rawKey);
    console.log(`Cleaned key: ${cleanedKey.substring(0, 10)}..., valid hex format: ${/^[0-9a-f]{64}$/i.test(cleanedKey)}`);
    
    if (!cleanedKey) {
      console.error('No SerpAPI key found in .env.local');
      return;
    }
    
    // Make a simple API call
    const params = new URLSearchParams({
      q: 'tetika app test',
      api_key: cleanedKey,
      engine: 'google',
      gl: 'fr',
      hl: 'fr',
      num: '1'
    });
    
    const response = await axios({
      method: 'GET',
      url: `https://serpapi.com/search?${params.toString()}`,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TetikaChatApp/1.0 APIStatusCheck'
      }
    });
    
    console.log('API call successful! Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Results found: ${response.data?.organic_results?.length || 0}`);
    
    if (response.data?.organic_results?.length > 0) {
      const firstResult = response.data.organic_results[0];
      console.log(`First result title: ${firstResult.title}`);
    }
    
    console.log('\nYour SerpAPI key is working correctly!');
    
  } catch (error) {
    console.error('Error testing SerpAPI:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.response?.data?.error || error.message}`);
    console.error('\nSuggestions to fix:');
    console.error('1. Verify the key in .env.local is correct (should be 64-character hex)');
    console.error('2. Make sure the key is active on your SerpAPI dashboard');
    console.error('3. Check if your account has sufficient credits');
  }
}

testSerpAPI();
