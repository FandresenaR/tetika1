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
      // Server-side: Use direct API call to SerpAPI instead of going through our own proxy
      // This avoids the self-request issue in production
      return await callSerpApiDirectly(query, apiKey);
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

/**
 * Makes a direct call to SerpAPI without going through our proxy
 * This is used server-side to avoid self-reference issues
 */
async function callSerpApiDirectly(query: string, apiKey: string) {
  try {
    console.log('Making direct request to SerpAPI (server-side)');
    
    // Build the SerpAPI request URL with parameters
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: 'google',
      gl: 'fr',
      hl: 'fr',
      num: '5'
    });
    
    const serpApiUrl = `https://serpapi.com/search?${params.toString()}`;
    
    // Make the request
    const response = await fetch(serpApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TetikaChatApp/1.0 Server'
      },
      // Add timeout handling if needed
      signal: AbortSignal.timeout(25000)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `SerpAPI responded with ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Direct SerpAPI call: ${data?.organic_results?.length || 0} results found`);
    return data;
  } catch (error: unknown) {
    console.error('Error in direct SerpAPI call:', error);
    throw error; // Let the main function handle the error response
  }
}
