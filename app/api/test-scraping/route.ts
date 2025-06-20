import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to isolate the issue
export async function POST(request: NextRequest) {
  console.log('[TEST-API] Received POST request');
  
  try {
    // Try to parse the request body
    const body = await request.json();
    console.log('[TEST-API] Request body parsed successfully:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.query) {
      console.log('[TEST-API] Missing query field');
      return NextResponse.json({
        success: false,
        error: 'Query is required',
        receivedBody: body
      }, { status: 400 });
    }
    
    console.log('[TEST-API] All validations passed');
    
    // Return a simple successful response
    return NextResponse.json({
      success: true,
      message: 'Test API working correctly',
      receivedQuery: body.query,
      receivedMode: body.mode,
      receivedMaxSources: body.maxSources,
      receivedIncludeAnalysis: body.includeAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (parseError) {
    console.error('[TEST-API] JSON parsing failed:', parseError);
    return NextResponse.json({
      success: false,
      error: 'JSON parsing failed',
      details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test API Endpoint',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
}
