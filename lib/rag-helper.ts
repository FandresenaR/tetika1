// Import server-direct and client-proxy search functions
import { searchWithSerpAPI } from './api';
import { callSerpApiDirectly } from './search-utils';

// Define interfaces for search results
interface SearchResult {
  title?: string;
  link?: string;
  snippet?: string;
  position: number;
}

interface SearchResponse {
  organic_results?: SearchResult[];
  error?: boolean;
  message?: string;
  search_metadata?: {
    fallback?: boolean;
    status?: string;
    query?: string;
    error_details?: unknown;
  };
}

interface Source {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

interface RAGResponse {
  sources: Source[];
  context: string;
  error: string | null;
}

/**
 * Enhances a message with Retrieval Augmented Generation using SerpAPI
 * @param query The user query to enhance with web information
 * @param apiKey SerpAPI API key
 * @returns An object with the enhanced message and sources
 */
export async function enhanceWithRAG(query: string, apiKey: string): Promise<RAGResponse> {
  console.log('Mode RAG activé, recherche web en cours...');
  console.log('Enriching message with RAG using SerpAPI');
  
  try {
    // Determine if we're running on server or client side
    const isServer = typeof window === 'undefined';
    
    // Use the appropriate search function based on environment
    let searchResults: SearchResponse;
    if (isServer) {
      // Server-side: Use direct SerpAPI call to avoid self-reference
      console.log('Server-side RAG: Using direct SerpAPI call');
      searchResults = await callSerpApiDirectly(query, apiKey);
    } else {
      // Client-side: Use the proxy endpoint
      console.log('Client-side RAG: Using proxy endpoint');
      searchResults = await searchWithSerpAPI(query, apiKey);
    }
    
    if (searchResults.organic_results && searchResults.organic_results.length > 0) {
      console.log(`Found ${searchResults.organic_results.length} results from web search`);
      
      // Process the results into a format usable for RAG
      const sources = searchResults.organic_results.map((result: SearchResult) => ({
        title: result.title || 'No title',
        url: result.link || '#',
        snippet: result.snippet || 'No description available',
        position: result.position
      }));
      
      // Create a context from the results
      const context = searchResults.organic_results
        .map((result: SearchResult, index: number) => 
          `[${index + 1}] ${result.title}\n${result.snippet}\nURL: ${result.link}`
        )
        .join('\n\n');
      
      return {
        sources,
        context,
        error: null
      };
    } else {
      console.log('No organic results found or using fallback results');
      return {
        sources: [],
        context: 'No relevant web search results found. Please provide information based on your knowledge.',
        error: 'No results found'
      };
    }
  } catch (error: unknown) {
    console.error('Error in RAG enhancement process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during RAG processing';
    return {
      sources: [],
      context: 'Unable to retrieve web search results due to an error. Please rely on your internal knowledge.',
      error: errorMessage
    };
  }
}
