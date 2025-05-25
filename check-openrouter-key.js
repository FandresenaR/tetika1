// Script to test OpenRouter API key directly
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Function to clean API key (simplified version of the one in api.ts)
const cleanApiKey = (key, apiType = 'openrouter') => {
  if (!key) return '';
  
  // First simple cleaning - remove any whitespace, newlines and carriage returns
  let cleaned = key.replace(/[\r\n\s]/g, '');
  
  // For OpenRouter keys, ensure correct format
  if (apiType === 'openrouter' && !cleaned.startsWith('sk-or-') && !cleaned.startsWith('sk-o1-')) {
    // If we have a hex key for OpenRouter, add proper formatting
    if (/^[0-9a-f]{64}$/i.test(cleaned)) {
      console.log('Converting hex key to OpenRouter format');
      cleaned = `sk-or-v1-${cleaned}`;
    }
  }
  
  return cleaned;
};

async function testOpenRouterAPI() {
  try {
    console.log('Testing OpenRouter API key from .env.local...');
    
    // Get the API key from environment
    const rawKey = process.env.OPENROUTER_API_KEY || '';
    console.log(`Raw key length: ${rawKey.length}, first chars: ${rawKey.substring(0, 6)}...`);
    
    // Clean and validate the key
    const cleanedKey = cleanApiKey(rawKey);
    console.log(`Cleaned key: ${cleanedKey.substring(0, 10)}..., format valid: ${cleanedKey.startsWith('sk-or-') || cleanedKey.startsWith('sk-o1-')}`);
    
    if (!cleanedKey) {
      console.error('No OpenRouter API key found in .env.local');
      return;
    }
    
    // Make a simple API call
    const response = await axios({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tetika.app',
        'X-Title': 'Tetika API Check'
      },
      data: {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      }
    });
    
    console.log('API call successful! Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Model used: ${response.data.model}`);
    console.log(`Content: ${response.data.choices[0].message.content}`);
    
    console.log('\nYour OpenRouter API key is working correctly!');
    
  } catch (error) {
    console.error('Error testing OpenRouter API:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.response?.data?.error?.message || error.message}`);
    console.error('\nSuggestions to fix:');
    console.error('1. Verify the key in .env.local is correct (should start with sk-or- or sk-o1-)');
    console.error('2. Make sure the key is active on your OpenRouter dashboard');
    console.error('3. Check if your account has sufficient credits');
  }
}

testOpenRouterAPI();
