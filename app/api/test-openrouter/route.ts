import { NextResponse } from 'next/server';
import { callOpenRouterAPI, cleanApiKey } from '../../../lib/api';
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
  stack?: string;
}

// This is a test endpoint to verify OpenRouter functionality
export async function GET(): Promise<NextResponse<OpenRouterTestResponse | ErrorResponse | { error: string }>> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    
    // Use the enhanced cleanApiKey function with proper type
    const cleanedKey = cleanApiKey(apiKey, 'openrouter');
    
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
    }// Make a simple test call to OpenRouter
    const messages: Message[] = [{ 
      role: 'user', 
      content: 'Say hello in one sentence',
      id: 'test-message-' + Date.now(),
      timestamp: Date.now()
    }];
    const model = 'mistralai/mistral-small-3.1-24b-instruct:free';
    
    console.log('Making test call to OpenRouter');
    
    // Call OpenRouter API and time the response
    const startTime = Date.now();
    const response = await callOpenRouterAPI(model, messages, false, cleanedKey);
    const endTime = Date.now();
    
    // Get response content
    const content = response.choices?.[0]?.message?.content || 'No response content';      const testResponse: OpenRouterTestResponse = {
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
      
      return NextResponse.json(testResponse);  } catch (error) {
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
