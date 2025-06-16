import { NextRequest, NextResponse } from 'next/server';
import { fetchMCPProvider } from '@/lib/fetch-mcp-provider';

export const dynamic = 'force-dynamic';

interface FetchMCPRequest {
  action: 'search' | 'fetch';
  url?: string;
  query?: string;
  options?: {
    maxResults?: number;
    headers?: Record<string, string>;
  };
}

interface FetchMCPResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * API endpoint for Fetch MCP operations
 * Supports both web search and direct URL fetching
 */
export async function POST(request: NextRequest): Promise<NextResponse<FetchMCPResponse>> {
  try {
    const { action, url, query, options = {} }: FetchMCPRequest = await request.json();

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required (search or fetch)'
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query is required for search action'
          }, { status: 400 });
        }

        console.log(`[Fetch MCP API] Recherche: "${query}"`);
        result = await fetchMCPProvider.search(query, options);
        
        return NextResponse.json({
          success: true,
          data: {
            query,
            results: result.organic_results || [],
            metadata: result.search_metadata || {},
            provider: 'fetch-mcp'
          }
        });

      case 'fetch':
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL is required for fetch action'
          }, { status: 400 });
        }

        console.log(`[Fetch MCP API] Fetch URL: "${url}"`);
        result = await fetchMCPProvider.fetchUrl(url, options);
        
        return NextResponse.json({
          success: result.success,
          data: {
            url: result.url,
            title: result.title,
            content: result.content,
            snippet: result.snippet,
            metadata: result.metadata,
            contentType: result.contentType
          },
          error: result.error
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}. Supported actions: search, fetch`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[Fetch MCP API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * GET endpoint for simple URL fetching via query parameters
 */
export async function GET(request: NextRequest): Promise<NextResponse<FetchMCPResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const query = searchParams.get('q') || searchParams.get('query');
    const action = searchParams.get('action') || (url ? 'fetch' : 'search');

    if (action === 'fetch' && !url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required for fetch action'
      }, { status: 400 });
    }

    if (action === 'search' && !query) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter (q or query) is required for search action'
      }, { status: 400 });
    }

    let result;

    if (action === 'fetch' && url) {
      console.log(`[Fetch MCP API GET] Fetch URL: "${url}"`);
      result = await fetchMCPProvider.fetchUrl(url);
      
      return NextResponse.json({
        success: result.success,
        data: {
          url: result.url,
          title: result.title,
          content: result.content.substring(0, 5000), // Limit for GET requests
          snippet: result.snippet,
          metadata: result.metadata
        },
        error: result.error
      });
    } else if (action === 'search' && query) {
      console.log(`[Fetch MCP API GET] Recherche: "${query}"`);
      result = await fetchMCPProvider.search(query, { maxResults: 5 });
      
      return NextResponse.json({
        success: true,
        data: {
          query,
          results: result.organic_results || [],
          metadata: result.search_metadata || {}
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('[Fetch MCP API GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
