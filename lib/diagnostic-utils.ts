/**
 * Utility functions for diagnostics and troubleshooting
 */

/**
 * Analyzes an API key and provides diagnostic information about its format
 * @param key The API key to analyze
 * @returns Diagnostic information about the key
 */
export function analyzeApiKey(key: string | undefined | null) {
  if (!key) {
    return {
      length: 0,
      format: 'empty',
      valid: false,
      message: 'No API key provided'
    };
  }
  
  // Clean the key of any whitespace
  const cleanKey = key.trim();
  
  let format = 'unknown';
  let valid = false;
  let message = 'Unknown key format';
  
  // Check standard OpenRouter format
  if (cleanKey.startsWith('sk-or-')) {
    format = 'openrouter-standard';
    valid = true;
    message = 'Valid OpenRouter key (sk-or- prefix)';
  } 
  // Check OpenRouter o1 format
  else if (cleanKey.startsWith('sk-o1-')) {
    format = 'openrouter-alternative';
    valid = true;
    message = 'Valid OpenRouter key (sk-o1- prefix)';
  }
  // Check if it's a hex key (for OpenRouter or SerpAPI)
  else if (/^[0-9a-f]{64}$/i.test(cleanKey)) {
    format = 'hex';
    // Valid for SerpAPI, but needs conversion for OpenRouter
    message = '64-character hex key (needs conversion for OpenRouter)';
    
    // For OpenRouter, we need to add the prefix
    const convertedKey = `sk-or-v1-${cleanKey}`;
    return {
      length: cleanKey.length,
      format: format,
      valid: false, // Not valid for direct use with OpenRouter
      message: message,
      needsConversion: true,
      convertedKey: convertedKey,
      convertedFormat: 'openrouter-standard',
      firstChars: cleanKey.substring(0, 8) + '...',
      convertedFirstChars: convertedKey.substring(0, 12) + '...'
    };
  }
  
  return {
    length: cleanKey.length,
    format: format,
    valid: valid,
    message: message,
    firstChars: cleanKey.length > 0 ? cleanKey.substring(0, Math.min(8, cleanKey.length)) + '...' : ''
  };
}

/**
 * Creates a safe representation of an API key for logging (masks most characters)
 * @param key The API key to mask
 * @returns A masked version of the key (e.g., sk-or-****...abcd)
 */
export function maskApiKey(key: string | undefined | null): string {
  if (!key) return 'undefined';
  if (key.length <= 12) return '*'.repeat(key.length);
  
  const prefix = key.substring(0, Math.min(8, key.length));
  const suffix = key.length > 4 ? key.substring(key.length - 4) : '';
  
  return `${prefix}${'*'.repeat(Math.min(10, key.length - 12))}...${suffix}`;
}

/**
 * Logs detailed diagnostics about an API authentication error
 * @param error The error object from the API call
 * @param modelProvider The API provider (e.g., 'openrouter', 'serpapi')
 * @param additionalInfo Any additional information to include in the log
 */
export function logApiAuthError(
  error: { 
    response?: { 
      status?: number; 
      statusText?: string; 
      data?: unknown 
    }; 
    message?: string 
  }, 
  modelProvider: string, 
  additionalInfo?: Record<string, unknown>
): void {
  console.error(`[${modelProvider.toUpperCase()}-AUTH-ERROR] Details:`, {
    status: error?.response?.status || 'unknown',
    statusText: error?.response?.statusText || 'unknown',
    message: error?.message || 'unknown',
    errorData: error?.response?.data || 'none',
    ...additionalInfo
  });
  
  // Log recommendations based on status code
  if (error?.response?.status === 401) {
    console.error(`[${modelProvider.toUpperCase()}-AUTH-ERROR] Recommendations:`, [
      'Verify the API key is correct and active',
      'Check that the key has the proper format',
      'Ensure the key is properly formatted in the Authorization header',
      `For OpenRouter, keys should start with "sk-or-" or "sk-o1-"`
    ]);
  }
}
