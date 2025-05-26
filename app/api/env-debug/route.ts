import { NextResponse } from 'next/server';

// Enhanced helper function to analyze API keys
const cleanApiKey = (key: string): string => {
  if (!key) return '';
  
  // First simple cleaning - remove any whitespace, newlines and carriage returns
  let cleaned = key.replace(/[\r\n\s]/g, '');
  
  // Handle potential Base64 or other unexpected encoding of API keys
  // For SerpAPI (hex keys of 64 characters)
  if (cleaned.length !== 64 && cleaned.length > 70) {
    // Try to extract a 64-character hexadecimal key
    const hexKeyMatch = cleaned.match(/([0-9a-f]{64})/i);
    if (hexKeyMatch && hexKeyMatch[1]) {
      cleaned = hexKeyMatch[1];
      console.log('DEBUG env-debug: Extracted hex key');
    }
  }
  
  // For OpenRouter keys (should start with sk-or- or sk-o1)
  if (!cleaned.startsWith('sk-or-') && !cleaned.startsWith('sk-o1')) {
    // If the key contains the prefix somewhere but not at the beginning
    if (cleaned.includes('sk-or-') || cleaned.includes('sk-o1')) {
      // Try to extract the OpenRouter key with a more comprehensive regex pattern
      const orKeyMatch = cleaned.match(/(sk-or-[a-zA-Z0-9-]+)|(sk-o1-[a-zA-Z0-9-]+)/);
      if (orKeyMatch && orKeyMatch[0]) {
        cleaned = orKeyMatch[0];
        console.log('DEBUG env-debug: Extracted OpenRouter key');
      }
    } 
    // If we have a v1 prefix embedded incorrectly
    else if (cleaned.includes('v1-')) {
      // Try to prepend the proper prefix
      if (/^v1-[a-zA-Z0-9-]+$/.test(cleaned)) {
        cleaned = `sk-or-${cleaned}`;
        console.log('DEBUG env-debug: Added sk-or- prefix to v1- key');
      }
    }
    // If we have a hex key where we need an OpenRouter key format
    else if (/^[0-9a-f]{64}$/i.test(cleaned)) {
      console.log('DEBUG env-debug: Found hex key where OpenRouter key expected');
      // Potentially transform to OpenRouter format if needed
      const reformattedKey = `sk-or-v1-${cleaned}`;
      console.log('DEBUG env-debug: Reformatted key first chars:', reformattedKey.substring(0, 10));
      // Use the reformatted key only for OpenRouter (this is just for debugging, not actual usage)
    }
  }
  
  return cleaned;
};

// Helper function to analyze an API key's format
function analyzeApiKey(key: string) {
  if (!key) return { length: 0, format: 'none', isValid: false };
  
  // Clean the key of whitespace
  const cleaned = key.replace(/[\r\n\s]/g, '');
  
  // Determine the format
  let format = 'unknown';
  let isValid = false;
  
  if (cleaned.startsWith('sk-or-')) {
    format = 'openrouter-prefix';
    isValid = true;
  } else if (cleaned.startsWith('sk-o1-')) {
    format = 'openrouter-o1-prefix';
    isValid = true;
  } else if (/^[0-9a-f]{64}$/i.test(cleaned)) {
    format = '64-character-hex';
    isValid = cleaned.length === 64; // Valid for SerpAPI
  } else {
    // Try to detect embedded formats
    if (cleaned.includes('sk-or-')) {
      format = 'contains-openrouter-prefix';
      isValid = false;  // Not valid as-is, needs extraction
    } else if (cleaned.includes('v1-')) {
      format = 'contains-v1-prefix';
      isValid = false;  // Not valid as-is, needs prefix
    }
  }
  
  return {
    length: cleaned.length,
    format,
    isValid,
    containsSpecialChars: /[^\w\d\-_.]/.test(cleaned),
    prefix: cleaned.substring(0, Math.min(10, cleaned.length)),
    rawLength: key.length,
    containsWhitespace: key !== cleaned
  };
}

// Hex representation of characters to detect encoding issues
function getHexRepresentation(str: string, start: number = 0, length: number = 10): string {
  if (!str) return '';
  const subStr = str.substring(start, start + length);
  return Array.from(subStr)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
};

export async function GET() {
  // Get and analyze API keys
  const openRouterKey = process.env.OPENROUTER_API_KEY || '';
  const nextPublicOpenRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  const serpApiKey = process.env.SERPAPI_API_KEY || '';
  const nextPublicSerpApiKey = process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '';
  
  // Clean the keys
  const cleanedOpenRouterKey = cleanApiKey(openRouterKey);
  const cleanedNextPublicOpenRouterKey = cleanApiKey(nextPublicOpenRouterKey);
  const cleanedSerpApiKey = cleanApiKey(serpApiKey);
  const cleanedNextPublicSerpApiKey = cleanApiKey(nextPublicSerpApiKey);
  
  // Generate special OpenRouter format key for testing
  let specialOpenRouterKeyFormat = '';
  if (/^[0-9a-f]{64}$/i.test(cleanedOpenRouterKey)) {
    // If we have a hex key, format it as OpenRouter expects
    specialOpenRouterKeyFormat = `sk-or-v1-${cleanedOpenRouterKey}`;
  }
  
  // Return a safe, detailed view of environment variables for debugging
  return NextResponse.json({
    // Server environment info
    nodeEnv: process.env.NODE_ENV,
    
    // OpenRouter key analysis
    openRouterKey: {
      ...analyzeApiKey(openRouterKey),
      cleanedKey: {
        ...analyzeApiKey(cleanedOpenRouterKey),
        hexFirstChars: getHexRepresentation(cleanedOpenRouterKey, 0, 5)
      }
    },
    
    nextPublicOpenRouterKey: {
      ...analyzeApiKey(nextPublicOpenRouterKey),
      cleanedKey: analyzeApiKey(cleanedNextPublicOpenRouterKey)
    },
      // SerpAPI key analysis
    serpApiKey: {
      ...analyzeApiKey(serpApiKey),
      cleanedKey: {
        ...analyzeApiKey(cleanedSerpApiKey),
        hexFirstChars: getHexRepresentation(cleanedSerpApiKey, 0, 5)
      },
      // Add extra diagnostics for SerpAPI key issues
      rawKeyLength: serpApiKey.length,
      cleanedKeyLength: cleanedSerpApiKey.length,
      hexDump: getHexRepresentation(serpApiKey, 0, 20),
      hasValidHexKeyFormat: /^[0-9a-f]{64}$/i.test(cleanedSerpApiKey),
      extractedHexKey: cleanedSerpApiKey.match(/([0-9a-f]{64})/i) ? 
        cleanedSerpApiKey.match(/([0-9a-f]{64})/i)![1].substring(0, 10) + '...' : 'none',
      isAbnormallyLong: serpApiKey.length > 100,
      correctKeyFromEnvLocal: '6d4e1e067db24c8f99ed3574dc3992b475141e2e9758e78f6799cc8f4bd2a50d'.substring(0, 10) + '...'
    },
    
    nextPublicSerpApiKey: {
      ...analyzeApiKey(nextPublicSerpApiKey),
      cleanedKey: analyzeApiKey(cleanedNextPublicSerpApiKey)
    },
    
    // Special info for improving OpenRouter auth
    specialFormat: {
      formattedAsOpenRouter: specialOpenRouterKeyFormat ? 
        specialOpenRouterKeyFormat.substring(0, 15) + '...' : 'N/A',
      recommendation: specialOpenRouterKeyFormat ? 
        'Replace your OpenRouter key in .env.local with the specialFormatKey' : 'N/A'
    },
    
    // Environment variables list
    envKeys: Object.keys(process.env).filter(key => 
      key.includes('OPENROUTER') || 
      key.includes('SERPAPI') || 
      key.includes('API_KEY')),
  });
}
