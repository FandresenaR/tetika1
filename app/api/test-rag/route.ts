import { NextRequest, NextResponse } from 'next/server';
import { enhanceWithRAG } from '@/lib/rag-helper';
import { cleanApiKey } from '@/lib/api';

// This is a diagnostic endpoint to test RAG functionality
export async function POST(request: NextRequest) {
  try {
    // Extract query and API key from request body
    const body = await request.json();
    const { query, apiKey } = body;
    
    if (!query) {
      return NextResponse.json({
        error: 'Missing query parameter',
        status: 'failed'
      }, { status: 400 });
    }
    
    // If API key is not provided, try to use the one from env vars
    const keyToUse = apiKey || process.env.SERPAPI_API_KEY || '';
    
    if (!keyToUse) {
      return NextResponse.json({
        error: 'No SerpAPI key provided or configured in environment variables',
        status: 'failed'
      }, { status: 400 });
    }
    
    // Clean the API key
    const cleanedKey = cleanApiKey(keyToUse, 'serpapi');
    
    // Debug info
    console.log(`[TEST-RAG] Testing RAG with query: "${query}"`);
    console.log(`[TEST-RAG] Using API key with length: ${cleanedKey.length}`);
    console.log(`[TEST-RAG] Key first 5 chars: ${cleanedKey.substring(0, 5)}...`);
    
    // Try to get RAG results
    const ragResults = await enhanceWithRAG(query, cleanedKey);
    
    // Return detailed response
    return NextResponse.json({
      status: 'success',
      message: 'RAG test successful',
      results: {
        context: ragResults.context,
        sourceCount: ragResults.sources.length,
        error: ragResults.error,
        sources: ragResults.sources
      },
    });
  } catch (error: unknown) {
    console.error('[TEST-RAG] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      error: errorMessage,
      message: 'Failed to test RAG functionality'
    }, { status: 500 });
  }
}

// For convenience, also allow GET requests with query params
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const apiKey = searchParams.get('apiKey') || '';
    
    if (!query) {
      return NextResponse.json({
        error: 'Missing query parameter',
        status: 'failed',
        tip: 'Use ?query=your search query&apiKey=your_serpapi_key'
      }, { status: 400 });
    }
    
    // Create a POST request to reuse the same logic
    const testRequest = new Request(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, apiKey })
    });
    
    return POST(testRequest as NextRequest);
  } catch (error: unknown) {
    console.error('[TEST-RAG] Error in GET handler:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to process test RAG request'
    }, { status: 500 });
  }
}
