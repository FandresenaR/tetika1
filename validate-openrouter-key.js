#!/usr/bin/env node

/**
 * OpenRouter Key Validator and Conversion Tool
 * 
 * This script helps diagnose and fix issues with OpenRouter API keys by 
 * validating the format, attempting to convert keys, and testing them 
 * with a simple API call.
 * 
 * Usage:
 * node validate-openrouter-key.js YOUR_API_KEY
 */

import axios from 'axios';

// Validate key format
function validateKeyFormat(key) {
  if (!key) {
    return {
      valid: false,
      reason: 'Key is empty',
      format: 'none'
    };
  }
  
  // Clean the key of any whitespace
  const cleanKey = key.trim();
  
  // Check standard OpenRouter format
  if (cleanKey.startsWith('sk-or-')) {
    return {
      valid: true,
      reason: 'Valid OpenRouter format (sk-or-)',
      format: 'standard'
    };
  } 
  // Check alternative OpenRouter format
  else if (cleanKey.startsWith('sk-o1-')) {
    return {
      valid: true,
      reason: 'Valid OpenRouter format (sk-o1-)',
      format: 'alternative'
    };
  } 
  // Check if it's a hex key that needs formatting
  else if (/^[0-9a-f]{64}$/i.test(cleanKey)) {
    return {
      valid: false,
      reason: 'Hex key needs to be converted to OpenRouter format',
      format: 'hex',
      convertedKey: `sk-or-v1-${cleanKey}`
    };
  } 
  // Unknown format
  else {
    return {
      valid: false,
      reason: 'Unknown key format',
      format: 'unknown'
    };
  }
}

// Test the key with a simple API call
async function testKey(key) {
  try {
    console.log('Testing key with a simple API call...');
    
    // Make a minimal API call to validate the key
    const response = await axios({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tetika.app',
        'X-Title': 'Tetika API Key Validator'
      },
      data: {
        model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      },
      timeout: 10000
    });
    
    return {
      success: true,
      status: response.status,
      model: response.data.model || 'unknown',
      message: 'API call successful'
    };
  } catch (error) {
    // Handle error response
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.error?.message || error.message
      };
    } else if (error.request) {
      return {
        success: false,
        status: 'network-error',
        message: 'Network error or no response received'
      };
    } else {
      return {
        success: false,
        status: 'error',
        message: error.message
      };
    }
  }
}

// Get key from command line argument
const key = process.argv[2];

if (!key) {
  console.log('Please provide an OpenRouter API key as a command line argument:');
  console.log('node validate-openrouter-key.js YOUR_API_KEY');
  process.exit(1);
}

(async () => {
  console.log('\n=== OpenRouter Key Validator ===\n');
  
  // Step 1: Format validation
  console.log('1. Validating key format...');
  const formatResult = validateKeyFormat(key);
  console.log(`- Format: ${formatResult.format}`);
  console.log(`- Valid format: ${formatResult.valid}`);
  console.log(`- Reason: ${formatResult.reason}`);
  
  // Step 2: If the format is invalid but convertible, convert it
  let keyToTest = key;
  if (!formatResult.valid && formatResult.format === 'hex') {
    const convertedKey = formatResult.convertedKey;
    console.log('\n2. Converting hex key to OpenRouter format:');
    console.log(`- Original: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
    console.log(`- Converted: ${convertedKey.substring(0, 12)}...${convertedKey.substring(convertedKey.length - 4)}`);
    keyToTest = convertedKey;
  } else {
    console.log('\n2. Key conversion: Not needed or not possible');
  }
  
  // Step 3: Test the key with API
  console.log('\n3. Testing key with OpenRouter API...');
  const testResult = await testKey(keyToTest);
  console.log(`- Success: ${testResult.success}`);
  console.log(`- Status: ${testResult.status}`);
  console.log(`- Message: ${testResult.message}`);
  if (testResult.model) {
    console.log(`- Model: ${testResult.model}`);
  }
  
  // Step 4: Summary and recommendations
  console.log('\n=== Summary ===');
  if (testResult.success) {
    console.log('✓ Your key works successfully with OpenRouter!');
    
    if (!formatResult.valid && formatResult.format === 'hex') {
      console.log('\nRecommendation:');
      console.log('- Update your .env.local file to use this converted key format:');
      console.log(`OPENROUTER_API_KEY=${keyToTest}`);
    }
  } else {
    console.log('✗ Your key has issues with OpenRouter.');
    
    if (testResult.status === 401) {
      console.log('\nRecommendation for 401 Unauthorized:');
      console.log('1. Check that you\'re using the correct and current API key');
      console.log('2. Ensure the key has the proper format (starts with sk-or- or sk-o1-)');
      if (formatResult.format === 'hex') {
        console.log('3. Try using the converted key format in your .env.local file:');
        console.log(`OPENROUTER_API_KEY=${keyToTest}`);
      }
    } else {
      console.log('\nGeneral recommendations:');
      console.log('1. Verify your OpenRouter account is active');
      console.log('2. Check your rate limits and subscription status');
      console.log('3. Try generating a new API key from the OpenRouter dashboard');
    }
  }
  
  console.log('\n=== End of Report ===\n');
})();
