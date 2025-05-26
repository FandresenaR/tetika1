import { NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../../../lib/api';
import { Message } from '../../../types';

// Define response types
interface OpenRouterTestResponse {
  success: boolean;
  apiKeyLength: number;
  responseTime: number;
  responseContent: string;
  hasValidResponse: boolean;
  responseFormat: {
    hasChoices: boolean;
    choicesLength: number;
    responseStructure: string[];
  };
}

interface ErrorResponse {
  error: boolean;
  message: string;
  details?: string;
  stack?: string;
  keyInfo?: {
    length: number;
    format: string;
    validFormat: boolean;
  };
}

// Local implementation of cleanApiKey function to fix dependency issues
function cleanApiKey(key: string, apiType: 'openrouter' | 'serpapi' | 'unknown' = 'unknown'): string {
  if (!key) return '';
  
  // First simple cleaning - remove any whitespace, newlines and carriage returns
  let cleaned = key.replace(/[\r\n\s]/g, '');
  
  // Handle OpenRouter keys
  if (apiType === 'openrouter') {
    if (!cleaned.startsWith('sk-or-') && !cleaned.startsWith('sk-o1-')) {
      // If the key contains the prefix somewhere but not at the beginning
      if (cleaned.includes('sk-or-') || cleaned.includes('sk-o1')) {
        // Try to extract the OpenRouter key with regex
        const orKeyMatch = cleaned.match(/(sk-or-[a-zA-Z0-9-]+)|(sk-o1-[a-zA-Z0-9-]+)/);
        if (orKeyMatch && orKeyMatch[0]) {
          cleaned = orKeyMatch[0];
        }
      } 
      // If we have a hex key for OpenRouter, add proper formatting
      else if (/^[0-9a-f]{64}$/i.test(cleaned)) {
        cleaned = `sk-or-v1-${cleaned}`;
      }
    }
  }
  
  return cleaned;
}

// This is a test endpoint to verify OpenRouter functionality
export async function GET(): Promise<NextResponse<OpenRouterTestResponse | ErrorResponse | { error: string }>> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
      // Use the enhanced cleanApiKey function with proper type
    let cleanedKey = cleanApiKey(apiKey, 'openrouter');
    
    // Validate key format - OpenRouter keys typically start with sk-or- or sk-o1-
    const isValidFormat = cleanedKey && (cleanedKey.startsWith('sk-or-') || cleanedKey.startsWith('sk-o1-'));
    
    // Log key info with better diagnostics
    console.log(`OpenRouter API key diagnostics:
      - Original length: ${apiKey.length}
      - Cleaned length: ${cleanedKey.length}
      - Valid format: ${isValidFormat}
      - First chars: ${cleanedKey.substring(0, 6)}...
    `);
      
    if (!cleanedKey) {
      return NextResponse.json({ error: 'API key not found' });
    }
      
    if (!isValidFormat) {
      console.warn('OpenRouter API key format appears invalid');
      // Try to fix the format if it's a hex key
      if (/^[0-9a-f]{64}$/i.test(cleanedKey)) {
        console.log('Fixing hex key format to OpenRouter format for testing');
        const fixedKey = `sk-or-v1-${cleanedKey}`;
        console.log(`Fixed key: ${fixedKey.substring(0, 10)}...`);
        
        // Instead of returning an error, use the fixed key for testing
        console.log('Automatically using converted key format for testing');
        cleanedKey = fixedKey;
        
        // But still warn the user about the format issue
        console.warn('The API key was automatically converted from hex to OpenRouter format, but it should be updated in .env.local');
      } else {
        return NextResponse.json({
          error: true,
          message: `Your OpenRouter API key appears to be in an incorrect format. OpenRouter keys should start with sk-or- or sk-o1-. Please update your .env.local file with a correctly formatted key.`
        });
      }
    }
      // Make a simple test call to OpenRouter
    const messages: Message[] = [{ 
      role: 'user', 
      content: 'Say hello in one sentence',
      id: 'test-message-' + Date.now(),
      timestamp: Date.now()
    }];
    // Use a model known to be free and reliable for testing
    const model = 'mistralai/mistral-small-3.1-24b-instruct:free';
    
    console.log('Making test call to OpenRouter');
    console.log(`Using API key: ${cleanedKey.substring(0, 10)}... (length: ${cleanedKey.length})`);
    
    // Call OpenRouter API and time the response
    const startTime = Date.now();
    const response = await callOpenRouterAPI(model, messages, false, cleanedKey);
    const endTime = Date.now();
      // Get response content
    const content = response.choices?.[0]?.message?.content || 'No response content';
    
    const testResponse: OpenRouterTestResponse = {
      success: true,
      apiKeyLength: cleanedKey.length,
      responseTime: endTime - startTime,
      responseContent: content,
      hasValidResponse: !!response.choices?.[0]?.message?.content,
      responseFormat: {
        hasChoices: !!response.choices,
        choicesLength: response.choices?.length || 0,
        responseStructure: Object.keys(response)
      }
    };
    
    return NextResponse.json(testResponse);
  } catch (error) {
    const err = error as Error;
    console.error('Error in OpenRouter test:', error);
    
    // Enhanced error response with more diagnostic info
    const errorResponse: ErrorResponse = {
      error: true,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorResponse);
  }
}
