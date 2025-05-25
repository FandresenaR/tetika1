import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cleanApiKey } from '../../../lib/api';

export const dynamic = 'force-dynamic'; // Ne pas mettre en cache cette route

// Define interfaces for error handling
interface SerpApiError extends Error {
  query?: string;
  code?: string;
  response?: {
    status?: number;
    data?: unknown;
  };
  config?: {
    url?: string;
    method?: string;
    baseURL?: string;
  };
}

// Helper function to make SerpAPI request
async function performSerpApiSearch(query: string, apiKey: string) {
  if (!query || !apiKey) {
    throw new Error('Query and API key are required for SerpAPI search');
  }
  
  console.log(`[API] Proxy SerpAPI - Actual search query: "${query.substring(0, 30)}..."`);
  
  // Clean the API key with our centralized cleanApiKey function
  const cleanedApiKey = cleanApiKey(apiKey, 'serpapi');
  
  if (!cleanedApiKey) {
    throw new Error('Failed to clean or extract a valid SerpAPI key');
  }
  
  // Log the first 5 characters of the cleaned API key being used (safe to log)
  console.log(`[API] Proxy SerpAPI - Using API key: ${cleanedApiKey.substring(0, 5)}...`);
  console.log(`[API] Proxy SerpAPI - API key length: ${cleanedApiKey.length}, is valid format: ${/^[0-9a-f]{64}$/i.test(cleanedApiKey)}`);
  
  // Paramètres pour SerpAPI
  const serpApiParams = {
    q: query,
    api_key: cleanedApiKey, // Use the cleaned key
    engine: 'google',
    gl: 'fr',  // Localisation pour des résultats plus pertinents
    hl: 'fr',  // Langue des résultats
    num: 5,    // Limiter le nombre de résultats pour améliorer la performance
  };
  
  try {
    // Set the URL explicitly as a string to avoid any URL parsing issues
    const serpApiUrl = 'https://serpapi.com/search';
    
    // Debug request params
    console.log(`[API] Proxy SerpAPI - Making request to ${serpApiUrl}`);
    
    // Use axios.get with explicit options to avoid any configuration issues
    const response = await axios({
      method: 'GET',
      url: serpApiUrl,
      params: serpApiParams,
      timeout: 25000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TetikaChatApp/1.0 Server',
      },
      // Disable any automatic URL parsing
      paramsSerializer: params => {
        return Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
      }
    });
    
    console.log(`[API] Proxy SerpAPI - ${response.data?.organic_results?.length || 0} résultats trouvés`);
    
    return response.data;
  } catch (error: unknown) {
    // Enhanced error logging
    const serpError = error as SerpApiError;
    console.error('[API] Proxy SerpAPI - Error details:', {
      message: serpError.message,
      code: serpError.code,
      responseStatus: serpError.response?.status,
      config: serpError.config ? {
        url: serpError.config.url,
        method: serpError.config.method,
        baseURL: serpError.config.baseURL
      } : 'No config available'
    });
    
    // Add query to error object for better error handling
    serpError.query = query;
    throw serpError;
  }
}

// Handle errors consistently
function handleSerpApiError(error: SerpApiError, query: string) {
  console.error('[API] Proxy SerpAPI - Erreur:', error.message);
  
  // Construction d'une réponse d'erreur détaillée
  const errorResponse = {
    error: true,
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    status: error.response?.status,
    details: error.response?.data || {}
  };
  
  // Si c'est une erreur de timeout ou de réseau, créer une réponse de fallback
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
    return NextResponse.json({
      error: true,
      message: `Erreur réseau: ${error.message}`,
      organic_results: [
        {
          title: "Résultats de recherche non disponibles",
          link: "https://example.com",
          snippet: "Impossible de récupérer les résultats de recherche en raison d'une erreur réseau. Les informations fournies seront basées uniquement sur les connaissances internes du modèle."
        }
      ],
      search_metadata: {
        fallback: true,
        status: "Connection Error",
        query: query,
        error_details: errorResponse
      }
    }, { status: 200 }); // Retourne 200 même en cas d'erreur pour que le client puisse traiter les résultats de fallback
  }
  
  // Sinon retourner une erreur standard
  return NextResponse.json(errorResponse, { 
    status: error.response?.status || 500
  });
}

export async function POST(request: NextRequest) {
  let query = 'unknown query';
  
  try {    // Extract data from the request body
    const data = await request.json();
    query = data.query || query;
    const apiKey = data.apiKey;
    
    // Vérifier les paramètres requis
    if (!query || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters (query, apiKey)' },
        { status: 400 }
      );
    }
    
    // Log initial key info but don't clean here - we'll let performSerpApiSearch handle cleaning
    console.log(`[API] Proxy SerpAPI - Received API key with length: ${apiKey.length}`);
    if (apiKey.length > 100) {
      console.log(`[API] Proxy SerpAPI - Warning: API key is unusually long (${apiKey.length} chars)`);
    }
    
    // Make the SerpAPI request with the original key - cleaning happens inside performSerpApiSearch
    const responseData = await performSerpApiSearch(query, apiKey);
    
    // Return the results
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    return handleSerpApiError(error as SerpApiError, query);
  }
}

// Keep the GET method for backward compatibility
export async function GET(request: NextRequest) {
  let query = '';
  try {
    // Extract query from URL params with proper error handling
    if (!request.nextUrl) {
      return NextResponse.json(
        { error: 'Failed to parse URL. Invalid request structure.' },
        { status: 400 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    query = searchParams.get('q') || '';
    const apiKey = searchParams.get('apiKey');
    
    if (!query || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters (q, apiKey)' },
        { status: 400 }
      );
    }
    
    // Log minimal information about the received key
    console.log(`[API] Proxy SerpAPI - GET request received with key length: ${apiKey.length}`);
    
    // Make the SerpAPI request - cleaning happens inside performSerpApiSearch
    const responseData = await performSerpApiSearch(query, apiKey);
    
    // Return the results
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    return handleSerpApiError(error as SerpApiError, query || 'unknown query');
  }
}