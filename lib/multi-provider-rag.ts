import { multiProviderSearch } from '@/app/api/mcp/route';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

interface RAGResponse {
  sources: SearchResult[];
  context: string;
  error: string | null;
}

/**
 * Enhances a message with multi-provider RAG by calling the MCP API
 * @param query The user query to enhance with web information
 * @param ragProvider The RAG provider to use (e.g., 'searxng', 'serpapi')
 * @param apiKeys Object containing API keys for various providers
 * @returns An object with the enhanced message and sources
 */
export async function enhanceWithMultiProviderRAG(
  query: string, 
  ragProvider: string,
  apiKeys: Record<string, string>
): Promise<RAGResponse> {
  console.log(`[RAG] Enrichissement avec ${ragProvider} pour: "${query}"`);
  
  // Debug: Log des clés API transmises
  console.log('[RAG] Clés API transmises à MCP:', {
    serpapi: apiKeys.serpapi ? `${apiKeys.serpapi.substring(0, 10)}...` : 'NON FOURNIE',
    keys: Object.keys(apiKeys),
    provider: ragProvider
  });
  
    try {
    // Call the MCP function directly instead of making HTTP request
    const mcpResult = await multiProviderSearch({
      query,
      provider: ragProvider,
      apiKeys
    });
    
    if (mcpResult.success && mcpResult.results?.length > 0) {
      console.log(`[RAG] Résultats obtenus via ${mcpResult.provider}:`, mcpResult.results.length);
      const sources: SearchResult[] = mcpResult.results.map((result: SearchResult, index: number) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        position: index + 1
      }));
      
      const context = sources
        .map((source, index) => `[${index + 1}] ${source.title}: ${source.snippet}`)
        .join('\n\n');
        
      return {
        sources,
        context,
        error: null
      };
    } else {
      const errorMsg = 'Aucun résultat trouvé';
      console.warn('[RAG] Erreur ou aucun résultat:', errorMsg);
      return {
        sources: [],
        context: '',
        error: errorMsg
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[RAG] Erreur lors de la recherche:', errorMessage);
    return {
      sources: [],
      context: '',
      error: errorMessage
    };
  }
}
