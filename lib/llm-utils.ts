// Helper functions for handling responses from different LLM providers

/**
 * Extracts content from Mistral model responses that might be truncated
 * @param responseStr The raw response string to parse
 * @returns Extracted content or null if nothing could be extracted
 */
export function extractMistralResponse(responseStr: string): string | null {
  // Try various patterns specific to Mistral responses
  const mistralPatterns = [
    /"content"\s*:\s*"([^"]+)"/,
    /"content"\s*:\s*'([^']+)'/,
    /"message"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/,
    /"content[^}]*"\s*:\s*"([^"]+)"/,
    /"fin"[^,]*,"content":("([^"]+)")/
  ];
  
  for (const pattern of mistralPatterns) {
    const match = responseStr.match(pattern);
    if (match && match[1]) {
      console.log("Successfully extracted content from Mistral model response");
      return match[1];
    }
  }
  
  return null;
}

/**
 * Tries to recover content from any truncated or malformed JSON API response
 * @param responseStr The raw response string
 * @returns Extracted content or null if nothing could be extracted
 */
export function extractFromTruncatedResponse(responseStr: string): string | null {
  // Try different patterns to extract content
  const patterns = [
    /"content"\s*:\s*"([^"]+)"/,
    /"text"\s*:\s*"([^"]+)"/,
    /"delta"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/,
    /"message"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/
  ];
  
  for (const pattern of patterns) {
    const match = responseStr.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Special handling for DeepSeek models
  if (responseStr.includes('deepseek')) {
    // First try to match delta content patterns specific to DeepSeek
    const deepseekPatterns = [
      /"delta"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/,
      /"content"\s*:\s*"([^"]*)"/
    ];
    
    for (const pattern of deepseekPatterns) {
      const match = responseStr.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If still nothing, try more aggressive extraction for DeepSeek
    // Look for content after the last occurrence of "delta"
    const deltaIndex = responseStr.lastIndexOf('"delta"');
    if (deltaIndex > 0) {
      const contentAfterDelta = responseStr.substring(deltaIndex);
      const contentMatch = contentAfterDelta.match(/"content"\s*:\s*"([^"]*)"/);
      if (contentMatch && contentMatch[1]) {
        return contentMatch[1];
      }
    }
  }
  
  // Try to repair truncated JSON
  try {
    // Add closing brackets to potentially truncated JSON
    let fixedJson = responseStr;
    if (!fixedJson.endsWith('}')) {
      fixedJson += '"}}}]}';
    }
    const partialData = JSON.parse(fixedJson);
    
    // Try to extract content from various possible locations
    if (partialData?.choices?.[0]?.message?.content) {
      return partialData.choices[0].message.content;
    } else if (partialData?.choices?.[0]?.delta?.content) {
      return partialData.choices[0].delta.content;
    }
  } catch (error) {
    console.error('Failed to repair truncated JSON:', error);
  }
  
  return null;
}
