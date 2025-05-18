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
export async function callSerpApiDirectly(query: string, apiKey: string) {
  try {
    console.log('Making direct request to SerpAPI (server-side)');
    
    // First, do basic cleaning of whitespace
    const basicCleanedKey = apiKey.replace(/[\r\n\s]/g, '');
    
    // Debug logging for API key issues
    console.log(`API key length before cleaning: ${apiKey.length}, after basic cleaning: ${basicCleanedKey.length}`);
    
    // Enhanced SerpAPI key extraction and cleaning
    // SerpAPI keys should be 64-character hexadecimal strings
    let finalApiKey = basicCleanedKey;
    
    // Check if key is valid as is (correct length and hexadecimal)
    const isValidHexKey = /^[0-9a-f]{64}$/i.test(basicCleanedKey);
    
    if (isValidHexKey) {
      console.log('API key appears to be a valid 64-character hex key');
      finalApiKey = basicCleanedKey;
    } else {
      console.log('API key is not a valid 64-character hex key, attempting to extract one');
      
      // Try multiple approaches to extract the valid key
      
      // Approach 1: Look for a 64-character hex pattern anywhere in the string
      const hexKeyMatch = basicCleanedKey.match(/([0-9a-f]{64})/i);
      if (hexKeyMatch && hexKeyMatch[1]) {
        finalApiKey = hexKeyMatch[1];
        console.log('Found a 64-character hex key within the API key, using that instead');
        console.log('Extracted key length:', finalApiKey.length);
      } else {
        // Approach 2: If extremely long (potentially URL-encoded or similar), try decoding
        console.log('Could not extract a direct hex key, checking for encoded format');
        
        // Check for URI encoding
        try {
          if (basicCleanedKey.includes('%')) {
            const uriDecodedKey = decodeURIComponent(basicCleanedKey);
            console.log('Attempted URI decode, result length:', uriDecodedKey.length);
            
            // Check if the decoded string contains a hex key
            const hexKeyInDecoded = uriDecodedKey.match(/([0-9a-f]{64})/i);
            if (hexKeyInDecoded && hexKeyInDecoded[1]) {
              finalApiKey = hexKeyInDecoded[1];
              console.log('Found hex key in URI decoded string');
            }
          }
        } catch (decodeError) {
          console.error('Error attempting to decode URI key:', decodeError);
        }
        
        // Approach 3: Try base64 decoding as a last resort
        try {
          // Check if the key might be base64 encoded
          if (/^[A-Za-z0-9+/=]+$/.test(basicCleanedKey) && basicCleanedKey.length % 4 === 0) {
            const decodedKey = Buffer.from(basicCleanedKey, 'base64').toString();
            console.log('Attempted base64 decode, result length:', decodedKey.length);
            
            // Check if the decoded string contains a hex key
            const hexKeyInDecoded = decodedKey.match(/([0-9a-f]{64})/i);
            if (hexKeyInDecoded && hexKeyInDecoded[1]) {
              finalApiKey = hexKeyInDecoded[1];
              console.log('Found hex key in decoded base64 string');
            }
          }
        } catch (decodeError) {
          console.error('Error attempting to decode key:', decodeError);
        }
        
        // Approach 4: Handle the case where the key might be inside a JSON string
        try {
          if (basicCleanedKey.includes('"') || basicCleanedKey.includes("'")) {
            // Try to extract anything that looks like a potential key inside quotes
            const jsonMatch = basicCleanedKey.match(/["']([0-9a-f]{64})["']/i);
            if (jsonMatch && jsonMatch[1]) {
              finalApiKey = jsonMatch[1];
              console.log('Found hex key inside quotes');
            }
          }
        } catch (jsonError) {
          console.error('Error trying to extract key from JSON-like string:', jsonError);
        }
        
        // For extreme cases, use the hardcoded fallback key from .env.local
        if (finalApiKey.length !== 64 || !/^[0-9a-f]{64}$/i.test(finalApiKey)) {
          const fallbackKey = '6d4e1e067db24c8f99ed3574dc3992b475141e2e9758e78f6799cc8f4bd2a50d';
          console.log('Using fallback SerpAPI key after all extraction attempts failed');
          console.log(`Original key was ${finalApiKey.length} characters long and not in valid format`);
          finalApiKey = fallbackKey;
        }
      }
    }
    
    // Print first 8 chars of the key for debugging (safe to log)
    console.log(`Using SerpAPI key with first 8 chars: ${finalApiKey.substring(0, 8)}...`);
    console.log(`Final key length: ${finalApiKey.length}, is valid format: ${/^[0-9a-f]{64}$/i.test(finalApiKey)}`);
    
    if (!isValidHexKey) {
      // Log a hex dump of the first 10 characters of the original key for debugging
      const hexDump = Array.from(apiKey.substring(0, 10))
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`Original key hex dump (first 10 chars): ${hexDump}`);
    }
    
    // Build the SerpAPI request URL with parameters
    const params = new URLSearchParams({
      q: query,
      api_key: finalApiKey,
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
      console.error('SerpAPI error response:', errorData);
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
