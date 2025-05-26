import { NextResponse } from 'next/server';

/**
 * This is a diagnostic endpoint to debug issues with SerpAPI keys.
 * It will help us understand what's happening with the key formatting.
 */
export async function GET() {
  // Get the raw API key from environment variables
  const rawApiKey = process.env.SERPAPI_API_KEY || '';
  
  // Try basic cleaning
  const basicCleanedKey = rawApiKey.replace(/[\r\n\s]/g, '');
  
  // Create a hex representation of the key to see if there are any invisible characters
  const hexRepresentation = Array.from(rawApiKey.substring(0, 30))
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
  
  // Try to extract a valid 64-character hex key
  const hexKeyMatch = basicCleanedKey.match(/([0-9a-f]{64})/i);
  const extractedKey = hexKeyMatch ? hexKeyMatch[1] : null;
  
  // Check for potential base64 encoding
  let base64DecodedKey = null;
  let hexInDecodedKey = null;
  
  if (/^[A-Za-z0-9+/=]+$/.test(basicCleanedKey)) {
    try {
      const decoded = Buffer.from(basicCleanedKey, 'base64').toString();
      base64DecodedKey = decoded;
      
      // Try to find a hex key in the decoded string
      const hexInDecoded = decoded.match(/([0-9a-f]{64})/i);
      if (hexInDecoded) {
        hexInDecodedKey = hexInDecoded[1];
      }
    } catch {
      // Ignore decoding errors
    }
  }
  
  // Test with the hardcoded key to see if that works
  const hardcodedKey = '6d4e1e067db24c8f99ed3574dc3992b475141e2e9758e78f6799cc8f4bd2a50d';
  
  return NextResponse.json({
    keyDiagnostics: {
      rawKeyLength: rawApiKey.length,
      basicCleanedKeyLength: basicCleanedKey.length,
      firstCharacters: rawApiKey.substring(0, 10),
      hexRepresentation: hexRepresentation,
      hasExtractableHexKey: !!extractedKey,
      extractedKeyFirstChars: extractedKey ? extractedKey.substring(0, 10) : null,
      isPotentiallyBase64: /^[A-Za-z0-9+/=]+$/.test(basicCleanedKey),
      base64DecodedLength: base64DecodedKey ? base64DecodedKey.length : null,
      foundHexKeyInDecodedBase64: !!hexInDecodedKey,
      hardcodedKeyFirstChars: hardcodedKey.substring(0, 10),
      // Compare with the known good key from .env.local
      matchesKnownGoodKey: basicCleanedKey === hardcodedKey || extractedKey === hardcodedKey
    },
    recommendedFix: "Update the SERPAPI_API_KEY in .env.local to exactly match the hardcoded key pattern"
  });
}
