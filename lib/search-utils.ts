/**
 * Utility for performing web searches using SerpAPI through our local proxy
 */

/**
 * Performs a web search using SerpAPI through the local proxy endpoint
 * @param query The search query
 * @param apiKey Your SerpAPI key
 * @returns The search results or an error object
 */
export async function searchWithSerpApi(query: string, apiKey: string) {
  console.log(`Calling local proxy for SerpAPI with query: ${query.substring(0, 30)}...`);
  
  try {
    // Verify API key is provided
    if (!apiKey) {
      console.error('SerpAPI key not provided to searchWithSerpApi function');
      throw new Error('SerpAPI key is required for web search');
    }
    
    // Ensure we're using an absolute URL with the origin
    let apiUrl;
    if (typeof window !== 'undefined') {
      // Client-side: Use window.location.origin
      apiUrl = new URL('/api/search', window.location.origin).toString();
    } else {
      // Server-side: Use an absolute URL with the local API route
      // In Next.js API routes, we need to make requests to our own API differently
      apiUrl = 'http://localhost:3000/api/search';
    }
      
    console.log(`Making request to SerpAPI proxy at: ${apiUrl}`);
    
    // Make the request using fetch API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Unknown error from SerpAPI');
    }
    
    return data;
  } catch (error: unknown) {
    console.error('Error details from SerpAPI proxy:', error);
    
    // Return a standardized fallback response
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Failed to fetch search results',
      organic_results: [],
      search_metadata: {
        fallback: true,
        status: 'Error',
        query: query,
        error_details: error
      }
    };
  }
}
