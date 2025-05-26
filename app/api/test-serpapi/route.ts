import { NextResponse } from 'next/server';
import { searchWithSerpAPI, cleanApiKey } from '../../../lib/api';

// Define response types for better TypeScript support
interface TestSuccessResponse {
  test: 'successful';
  keyDiagnostics: {
    rawKeyLength: number;
    basicCleanedKeyLength: number;
    fullyCleanedKeyLength: number;
    keyFormat: string;
    keyVisual: string;
  };
  apiResponseDiagnostics: {
    hasResults: boolean;
    resultCount: number;
    searchMetadata: Record<string, unknown>;
    error: string | null;
  };
  recommendations: string;
}

interface TestFailedResponse {
  test: 'failed';
  reason: string;
  keyDiagnostics: {
    rawKeyLength: number;
    basicCleanedKeyLength: number;
    fullyCleanedKeyLength: number;
    keyFormat: string;
    keyVisual: string;
  };
  recommendation: string;
}

interface TestErrorResponse {
  test: 'error';
  error: boolean;
  errorType: string;
  message: string;
  stack?: string;
  recommendation: string;
}

type TestResponse = TestSuccessResponse | TestFailedResponse | TestErrorResponse | { 
  error: string; 
  recommendation: string;
};

// Helper function to get a visual representation of the key
function getKeyVisual(key: string): string {
  if (!key) return '';
  
  const firstChars = key.substring(0, 5);
  const lastChars = key.substring(key.length - 5);
  return `${firstChars}...${lastChars}`;
}

// This is a comprehensive test endpoint to verify SerpAPI functionality
export async function GET(): Promise<NextResponse<TestResponse>> {
  try {
    const apiKey = process.env.SERPAPI_API_KEY || '';
    console.log(`[TEST-SERPAPI] Raw key length from env: ${apiKey.length}`);
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not found in environment variables',
        recommendation: 'Add SERPAPI_API_KEY=your_key to .env.local' 
      });
    }
    
    // Test our cleaning implementations
    const basicCleanedKey = apiKey.replace(/[\r\n\s]/g, '');
    const fullyCleanedKey = cleanApiKey(apiKey, 'serpapi');
    
    // Log diagnostic info
    console.log(`[TEST-SERPAPI] Key processing steps:`);
    console.log(`  - Raw key length: ${apiKey.length}`);
    console.log(`  - After whitespace cleaning: ${basicCleanedKey.length}`);
    console.log(`  - After full cleaning: ${fullyCleanedKey.length}`);
    
    // Validate key format
    const isValidFormat = /^[0-9a-f]{64}$/i.test(fullyCleanedKey);
    console.log(`[TEST-SERPAPI] Final key is valid format: ${isValidFormat}`);
    
    // If we have a valid key, make a test API call
    if (isValidFormat) {
      console.log(`[TEST-SERPAPI] Making test API call with cleaned key: ${getKeyVisual(fullyCleanedKey)}`);
        // Use a simple query to test the API
      const results = await searchWithSerpAPI('test search for Tetika app', fullyCleanedKey);
        // Build comprehensive response with diagnostics
      const response: TestSuccessResponse = {
        test: 'successful',
        keyDiagnostics: {
          rawKeyLength: apiKey.length,
          basicCleanedKeyLength: basicCleanedKey.length,
          fullyCleanedKeyLength: fullyCleanedKey.length,
          keyFormat: isValidFormat ? 'valid_64_hex' : 'invalid',
          keyVisual: getKeyVisual(fullyCleanedKey)
        },
        apiResponseDiagnostics: {
          hasResults: !!results.organic_results,
          resultCount: results.organic_results?.length || 0,
          searchMetadata: results.search_metadata || {},
          error: results.error || null
        },
        recommendations: isValidFormat ? 
          "Key is correctly formatted and working" : 
          "Update your .env.local to use a proper 64-character hex SerpAPI key"
      };
      
      return NextResponse.json(response);    } else {
      const response: TestFailedResponse = {
        test: 'failed',
        reason: 'Invalid key format after cleaning',
        keyDiagnostics: {
          rawKeyLength: apiKey.length,
          basicCleanedKeyLength: basicCleanedKey.length,
          fullyCleanedKeyLength: fullyCleanedKey.length,
          keyFormat: 'invalid',
          keyVisual: getKeyVisual(fullyCleanedKey)
        },
        recommendation: "Update SERPAPI_API_KEY in .env.local to a valid 64-character hex format"
      };
      
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('[TEST-SERPAPI] Error during test:', error);
    
    const err = error as Error;
    const response: TestErrorResponse = {
      test: 'error',
      error: true,
      errorType: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      recommendation: "Check the error details to diagnose the issue"
    };
    
    return NextResponse.json(response);
  }
}
