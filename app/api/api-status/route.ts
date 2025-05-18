import { NextResponse } from 'next/server';
import axios from 'axios';
import { cleanApiKey } from '../../../lib/api';

// Helper function to check if a key matches correct format for each API type
function isValidApiFormat(key: string, type: 'openrouter' | 'serpapi'): boolean {
  if (!key) return false;
  
  switch (type) {
    case 'openrouter':
      return key.startsWith('sk-or-') || key.startsWith('sk-o1-');
    case 'serpapi':
      return /^[0-9a-f]{64}$/i.test(key);
    default:
      return false;
  }
}

// Helper to mask most of the key while showing enough to identify it
function maskApiKey(key: string): string {
  if (!key) return 'undefined';
  if (key.length <= 12) return '***';
  
  const firstPart = key.substring(0, 8);
  const lastPart = key.substring(key.length - 4);
  return `${firstPart}...${lastPart}`;
}

// Define response types
interface ApiTestSuccessResponse {
  success: true;
  status: number;
  model?: string;
  resultCount?: number;
}

interface ApiTestFailureResponse {
  success: false;
  reason?: string;
  status?: number;
  message?: string;
}

type ApiTestResponse = ApiTestSuccessResponse | ApiTestFailureResponse;

// Test if the OpenRouter API works
async function testOpenRouterApi(key: string): Promise<ApiTestResponse> {
  if (!key) return { success: false, reason: 'No API key provided' };
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10
      },
      timeout: 5000
    });
    
    return {
      success: true,
      status: response.status,
      model: response.data.model
    };
  } catch (error) {
    const err = error as Error;
    const axiosError = error as { response?: { status?: number, data?: { error?: { message?: string } } } };
    return {
      success: false,
      status: axiosError.response?.status,
      message: axiosError.response?.data?.error?.message || err.message
    };
  }
}

// Test if the SerpAPI works
async function testSerpApi(key: string): Promise<ApiTestResponse> {
  if (!key) return { success: false, reason: 'No API key provided' };

  try {
    const params = new URLSearchParams({
      q: 'tetika api test',
      api_key: key,
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
      },
      timeout: 5000
    });

    return {
      success: true,
      status: response.status,
      resultCount: response.data?.organic_results?.length || 0
    };
  } catch (error) {
    const axiosError = error as { response?: { status?: number, data?: { error?: string } }, message?: string };
    
    return {
      success: false,
      status: axiosError.response?.status,
      message: axiosError.response?.data?.error || axiosError.message
    };
  }
}

interface ApiStatusResponse {
  timestamp: string;
  environment: string;
  apiKeysStatus: {
    openRouter: {
      present: boolean;
      formatValid: boolean;
      originalLength: number;
      cleanedLength: number;
      maskedValue: string;
      test: ApiTestResponse;
    };
    serpApi: {
      present: boolean;
      formatValid: boolean;
      originalLength: number;
      cleanedLength: number;
      maskedValue: string;
      test: ApiTestResponse;
    };
  };
  appStatus: {
    ready: boolean;
    issues: string[];
  };
}

interface ApiStatusErrorResponse {
  status: string;
  message: string;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<ApiStatusResponse | ApiStatusErrorResponse>> {
  try {
    // Get the raw keys from environment
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY || '';
    const rawSerpApiKey = process.env.SERPAPI_API_KEY || '';

    // Clean the keys using our enhanced function
    const cleanedOpenRouterKey = cleanApiKey(rawOpenRouterKey, 'openrouter');
    const cleanedSerpApiKey = cleanApiKey(rawSerpApiKey, 'serpapi');

    // Check if keys match required formats
    const openRouterFormatValid = isValidApiFormat(cleanedOpenRouterKey, 'openrouter');
    const serpApiFormatValid = isValidApiFormat(cleanedSerpApiKey, 'serpapi');

    // Test the APIs if keys have valid formats
    let openRouterTest: ApiTestResponse = { success: false, reason: 'Invalid key format' };
    let serpApiTest: ApiTestResponse = { success: false, reason: 'Invalid key format' };

    if (openRouterFormatValid) {
      openRouterTest = await testOpenRouterApi(cleanedOpenRouterKey);
    }

    if (serpApiFormatValid) {
      serpApiTest = await testSerpApi(cleanedSerpApiKey);
    }

    // Return comprehensive status results
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      apiKeysStatus: {
        openRouter: {
          present: !!rawOpenRouterKey,
          formatValid: openRouterFormatValid,
          originalLength: rawOpenRouterKey.length,
          cleanedLength: cleanedOpenRouterKey.length,
          maskedValue: maskApiKey(cleanedOpenRouterKey),
          test: openRouterTest
        },
        serpApi: {
          present: !!rawSerpApiKey,
          formatValid: serpApiFormatValid,
          originalLength: rawSerpApiKey.length,
          cleanedLength: cleanedSerpApiKey.length,
          maskedValue: maskApiKey(cleanedSerpApiKey),
          test: serpApiTest
        }
      },
      appStatus: {
        ready: openRouterFormatValid && serpApiFormatValid && 
               openRouterTest.success && serpApiTest.success,
        issues: []
      }
    });
  } catch (error) {
    console.error('Error in API status check:', error);
    
    const err = error as Error;
    return NextResponse.json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString()    }, { status: 500 });
  }
}
