import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { cleanApiKey } from '@/lib/api';
import { fetchMCPProvider } from '@/lib/fetch-mcp-provider';

interface MCPRequest {
  tool: string;
  args: Record<string, unknown>;
}

interface MCPResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

interface OrganicResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface FetchMCPResult {
  organic_results?: OrganicResult[];
  search_metadata?: {
    status: string;
    query: string;
    total_results?: number;
    error?: string;
    provider: string;
  };
}

interface FetchOptions {
  maxResults?: number;
  headers?: Record<string, string>;
}

interface SearchResponse {
  results: SearchResult[];
  provider: string;
  success: boolean;
  category?: string;
  totalResults?: number;
}

// Helper function to select optimal engines based on search category/subject
function getOptimalEngines(category: string): string {
  const engineMaps: Record<string, string> = {
    'general': 'google,bing,duckduckgo,wikipedia,startpage',
    'science': 'google scholar,arxiv,pubmed,semantic scholar,crossref,base',
    'it': 'stackoverflow,github,searchcode code,google,bing',
    'academic': 'google scholar,semantic scholar,arxiv,pubmed,crossref',
    'news': 'google,bing,reddit,hackernews',
    'technical': 'stackoverflow,github,searchcode code,reddit',
    'research': 'google scholar,arxiv,semantic scholar,wikipedia,library genesis',
    'programming': 'stackoverflow,github,searchcode code,hackernews',
    'medical': 'pubmed,google scholar,semantic scholar',
    'physics': 'arxiv,google scholar,semantic scholar',
    'biology': 'pubmed,arxiv,google scholar',
    'computer science': 'arxiv,stackoverflow,github,google scholar'
  };
  
  return engineMaps[category] || engineMaps['general'];
}

// Enhanced function to determine search category from query content
function detectSearchCategory(query: string): string {
  const keywords = query.toLowerCase();
  
  // Programming/IT keywords
  if (/\b(code|programming|javascript|python|react|api|database|algorithm|software|bug|debug|framework|library)\b/.test(keywords)) {
    return 'it';
  }
  
  // Academic/Scientific keywords
  if (/\b(research|study|analysis|paper|journal|academic|scholar|thesis|publication|peer.review)\b/.test(keywords)) {
    return 'academic';
  }
  
  // Medical keywords
  if (/\b(medical|health|disease|treatment|medicine|clinical|patient|therapy|drug|diagnosis)\b/.test(keywords)) {
    return 'medical';
  }
  
  // Physics keywords  
  if (/\b(physics|quantum|relativity|mechanics|thermodynamics|electromagnetism|particle|wave)\b/.test(keywords)) {
    return 'physics';
  }
  
  // Biology keywords
  if (/\b(biology|genetics|dna|rna|cell|organism|evolution|ecology|molecular|protein)\b/.test(keywords)) {
    return 'biology';
  }
  
  // News/Current events
  if (/\b(news|breaking|latest|today|current|recent|update|happened|event)\b/.test(keywords)) {
    return 'news';
  }
  
  // Default to general for broad research
  return 'general';
}

// Enhanced SearXNG search function optimized for RAG research
async function performSearXNGSearch(query: string, category?: string) {
  if (!query) {
    throw new Error('Query is required for SearXNG search');
  }
  
  // Auto-detect category if not provided
  const searchCategory = category || detectSearchCategory(query);
  console.log(`[SearXNG] Recherche RAG: "${query}" dans la catégorie: ${searchCategory}`);
  
  // Optimized SearXNG instances with better research capabilities
  const instances = [
    'https://searx.be',
    'https://searx.tiekoetter.com', 
    'https://opnxng.com',
    'https://searxng.world',
    'https://searx.oloke.xyz',
    'https://search.sapti.me',
    'https://searx.work'
  ];
  
  for (const instance of instances) {
    try {      console.log(`[SearXNG] Tentative avec l'instance: ${instance}`);
        // Enhanced search parameters for better RAG research results
      const params = new URLSearchParams({
        q: query,
        language: 'auto',  // Auto-detect for international research
        time_range: '',
        categories: searchCategory,
        engines: getOptimalEngines(searchCategory), // Dynamic engine selection
        format: 'html',
        pageno: '1'
      });
      
      const response = await axios({
        method: 'GET',
        url: `${instance}/search?${params.toString()}`,
        timeout: 12000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      
      if (response.status === 200 && response.data.includes('results')) {
        console.log(`[SearXNG] Succès avec l'instance: ${instance}`);
        return response.data;
      } else {
        console.warn(`[SearXNG] Réponse invalide de ${instance}`);
        continue;
      }    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[SearXNG] Échec avec ${instance}: ${errorMessage}`);
      continue;
    }
  }
  
  throw new Error('Toutes les instances SearXNG ont échoué');
}

function transformSearXNGResults(htmlData: string): SearchResult[] {
  if (!htmlData || typeof htmlData !== 'string') {
    console.warn('[SearXNG] Données HTML invalides');
    return [];
  }
  
  try {    
    const $ = cheerio.load(htmlData);
    const results: SearchResult[] = [];
    
    // Log du HTML reçu pour debug (premières lignes seulement)
    console.log('[SearXNG] HTML reçu (extrait):', htmlData.substring(0, 500) + '...');
    console.log('[SearXNG] Longueur totale du HTML:', htmlData.length);
      // Vérifier si on a des résultats de recherche optimisés pour RAG
    console.log('[SearXNG] Recherche de conteneurs de résultats RAG...');
    
    // Extended SearXNG result selectors optimized for research content
    const resultSelectors = [
      '.result',
      '#results .result',
      '.result-default',
      'article.result',
      '.result-default.result-paper',
      '#main .result',
      '.result.result-default'
    ];
    
    let foundResults = false;
    
    // First, let's see what containers exist
    resultSelectors.forEach(selector => {
      const elements = $(selector);
      console.log(`[SearXNG] Sélecteur "${selector}": ${elements.length} éléments trouvés`);
    });
    
    for (const selector of resultSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`[SearXNG] Found ${elements.length} results with selector: ${selector}`);
        
        elements.each((i, element) => {
          if (i >= 10) return false; // Limit to 10 results
          
          const $el = $(element);
          
          // Try multiple title selectors
          const titleSelectors = ['h3 a', '.result-title a', 'a h3', 'h3', '.title a', '.result-header a'];
          let title = '';
          for (const titleSel of titleSelectors) {
            title = $el.find(titleSel).first().text().trim();
            if (title) break;
          }
          
          // Try multiple URL selectors
          const urlSelectors = ['h3 a', '.result-title a', 'a h3', '.title a', '.result-header a'];
          let url = '';
          for (const urlSel of urlSelectors) {
            url = $el.find(urlSel).first().attr('href') || '';
            if (url) break;
          }
          
          // Try multiple snippet selectors
          const snippetSelectors = ['.result-content', '.content', 'p', '.result-snippet', '.snippet'];
          let snippet = '';
          for (const snippetSel of snippetSelectors) {
            snippet = $el.find(snippetSel).first().text().trim();
            if (snippet) break;
          }
          
          console.log(`[SearXNG] Résultat ${i + 1} - Titre: "${title}", URL: "${url}", Snippet: "${snippet?.substring(0, 50)}..."`);
          
          if (title && url) {
            results.push({
              title,
              url: url.startsWith('http') ? url : `https://${url}`,
              snippet: snippet || `Résultat de recherche pour: ${title}`,
              position: results.length + 1
            });
          } else {
            console.warn(`[SearXNG] Résultat ${i + 1} ignoré - Titre vide: ${!title}, URL vide: ${!url}`);
          }
        });
        
        foundResults = true;
        break;
      }
    }
    
    if (!foundResults) {
      console.warn('[SearXNG] Aucun résultat trouvé avec les sélecteurs connus');
      
      // Debug: essayons de voir ce qu'il y a dans la page
      console.log('[SearXNG] Debug - Recherche d\'éléments génériques...');
      const anyLinks = $('a[href]');
      console.log(`[SearXNG] Debug - Liens trouvés: ${anyLinks.length}`);
      
      const anyHeadings = $('h1, h2, h3, h4, h5, h6');
      console.log(`[SearXNG] Debug - Titres trouvés: ${anyHeadings.length}`);
      
      // Essayons de trouver des patterns alternatifs
      const alternativeSelectors = [
        'article',
        '[class*="result"]',
        '[id*="result"]',
        '.search-result',
        '.item'
      ];
      
      alternativeSelectors.forEach(altSel => {
        const altElements = $(altSel);
        console.log(`[SearXNG] Debug - Sélecteur alternatif "${altSel}": ${altElements.length} éléments`);
      });
    }
      return results;
  } catch (error) {
    console.error('[SearXNG] Erreur lors du parsing HTML:', error);
    return [];
  }
}

// Direct search function using SerpAPI (extracted from search API route)
async function performDirectSearch(query: string, apiKey: string, location?: string, numResults = 10) {
  if (!query || !apiKey) {
    throw new Error('Query and API key are required for search');
  }
    console.log('[SerpAPI] Clé API reçue (longueur):', apiKey.length);
  console.log('[SerpAPI] Clé API reçue (preview):', apiKey ? `${apiKey.substring(0, 10)}...` : 'VIDE');
  
  // Essayer de nettoyer la clé API, mais utiliser l'originale si le nettoyage échoue
  let cleanedApiKey = cleanApiKey(apiKey, 'serpapi');
  
  // Si le nettoyage retourne une clé vide, utiliser la clé originale (après avoir retiré les espaces)
  if (!cleanedApiKey) {
    console.warn('[SerpAPI] Le nettoyage de la clé API a échoué, utilisation de la clé originale');
    cleanedApiKey = apiKey.trim().replace(/[\r\n\s]/g, '');
  }
  
  console.log('[SerpAPI] Clé API finale (longueur):', cleanedApiKey.length);
  console.log('[SerpAPI] Clé API finale (preview):', cleanedApiKey ? `${cleanedApiKey.substring(0, 10)}...` : 'VIDE');
  
  if (!cleanedApiKey) {
    console.error('[SerpAPI] Aucune clé API valide disponible');
    throw new Error('Invalid SerpAPI key');
  }
  
  const serpApiParams = {
    q: query,
    api_key: cleanedApiKey,
    engine: 'google',
    gl: location ? 'us' : 'fr',
    hl: location ? 'en' : 'fr',
    num: Math.min(numResults, 10),
  };
  
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://serpapi.com/search',
      params: serpApiParams,
      timeout: 25000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TetikaChatApp/1.0 MCP',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Direct search error:', error);
    throw error;
  }
}

// Direct chat function using OpenRouter (simplified version)
async function performDirectChat(messages: unknown[], model: string, apiKey: string) {
  if (!messages || !apiKey) {
    throw new Error('Messages and API key are required for chat');
  }
  
  const cleanedApiKey = cleanApiKey(apiKey, 'openrouter');
  
  if (!cleanedApiKey) {
    throw new Error('Invalid OpenRouter API key');
  }
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${cleanedApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tetika.ai',
        'X-Title': 'Tetika MCP Agent',
      },
      data: {
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        stream: false,
      },
      timeout: 60000,
    });
    
    return response.data.choices?.[0]?.message?.content || 'No response from AI';
  } catch (error) {
    console.error('Direct chat error:', error);
    throw error;
  }
}

// Tool implementations
export async function multiProviderSearch(args: Record<string, unknown>): Promise<SearchResponse> {
  const { provider, query, apiKeys = {} } = args;
  const typedApiKeys = apiKeys as Record<string, string>;
  
  if (!query || typeof query !== 'string') {
    throw new Error('Query is required');
  }

  console.log(`[MCP] Recherche avec ${provider} pour: "${query}"`);
  
  // Debug: Log des clés API reçues
  console.log('[MCP] Clés API reçues:', {
    serpapi: typedApiKeys.serpapi ? `${typedApiKeys.serpapi.substring(0, 10)}...` : 'NON FOURNIE',
    hasKeys: Object.keys(typedApiKeys),
    totalKeys: Object.keys(typedApiKeys).length
  });
  
  // For now, implement basic provider routing
  switch (provider) {
    case 'fetch-mcp':
      // Fetch MCP doesn't require API key
      try {        console.log('[MCP] Utilisation de Fetch MCP (recherche et extraction directe)');
        const fetchResults: FetchMCPResult = await fetchMCPProvider.search(query, { maxResults: 5 });
        
        if (fetchResults.organic_results && fetchResults.organic_results.length > 0) {
          return {
            results: fetchResults.organic_results.map((result: OrganicResult, index: number) => ({
              title: result.title,
              url: result.link,
              snippet: result.snippet,
              position: index + 1
            })),
            provider: 'fetch-mcp',
            success: true
          };
        } else {
          console.warn('[Fetch MCP] Aucun résultat trouvé, fallback vers SearXNG');
          return multiProviderSearch({ ...args, provider: 'searxng' });
        }
      } catch (fetchError) {
        console.error('[Fetch MCP] Erreur lors de la recherche:', fetchError);
        console.log('[Fetch MCP] Fallback vers SearXNG après erreur');
        return multiProviderSearch({ ...args, provider: 'searxng' });
      }
        case 'serpapi':
      const serpApiKey = typedApiKeys.serpapi || process.env.SERPAPI_API_KEY;
      console.log('[MCP] SerpAPI - Clé du client:', typedApiKeys.serpapi ? `${typedApiKeys.serpapi.substring(0, 10)}...` : 'NON FOURNIE');
      console.log('[MCP] SerpAPI - Clé du serveur:', process.env.SERPAPI_API_KEY ? `${process.env.SERPAPI_API_KEY.substring(0, 10)}...` : 'NON FOURNIE');
      console.log('[MCP] SerpAPI - Clé finale utilisée:', serpApiKey ? `${serpApiKey.substring(0, 10)}...` : 'AUCUNE');      
      if (!serpApiKey) {
        console.error('[MCP] SerpAPI - Aucune clé API disponible');
        throw new Error('SerpAPI key is required for SerpAPI provider. Veuillez configurer votre clé API SerpAPI dans les paramètres.');
      }
      
      try {
        const serpResults = await performDirectSearch(query, serpApiKey);
        return {
          results: transformSerpResults(serpResults),
          provider: 'serpapi',
          success: true
        };
      } catch (searchError) {
        console.error('[MCP] SerpAPI - Erreur lors de la recherche:', searchError);
        const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
        throw new Error(`Erreur SerpAPI: ${errorMessage}`);
      }        case 'searxng':
      // Enhanced SearXNG with intelligent category detection for RAG
      try {
        console.log('[MCP] Utilisation de SearXNG optimisé pour RAG');
        const searxResults = await performSearXNGSearch(query);
        const transformedResults = transformSearXNGResults(searxResults);
        
        if (transformedResults.length > 0) {
          console.log(`[SearXNG] ${transformedResults.length} résultats RAG trouvés`);
          return {
            results: transformedResults,
            provider: 'searxng-rag',
            success: true,
            category: detectSearchCategory(query), // Include detected category
            totalResults: transformedResults.length
          };
        } else {
          console.warn('[SearXNG] Aucun résultat RAG trouvé, fallback vers SerpAPI');
          return multiProviderSearch({ ...args, provider: 'serpapi' });
        }
      } catch (searxError) {
        console.error('[SearXNG] Erreur lors de la recherche RAG:', searxError);
        console.log('[SearXNG] Fallback vers SerpAPI après erreur');
        return multiProviderSearch({ ...args, provider: 'serpapi' });
      }
    default:
      // Fallback to SerpAPI
      console.log(`[MCP] Fournisseur ${provider} non supporté, fallback vers SerpAPI`);
      return multiProviderSearch({ ...args, provider: 'serpapi' });
  }
}

function transformSerpResults(serpData: unknown): SearchResult[] {
  if (!serpData || typeof serpData !== 'object' || !serpData || !('organic_results' in serpData)) {
    return [];
  }
  
  const data = serpData as { organic_results: unknown[] };
  
  return data.organic_results.map((result: unknown, index: number) => {
    const typedResult = result as Record<string, string>;
    return {
      title: typedResult.title || '',
      url: typedResult.link || '',
      snippet: typedResult.snippet || '',
      position: index + 1
    };
  });
}

// Tool implementations
async function searchWeb(args: Record<string, unknown>) {  try {
    const { query, location, num_results = 10 } = args;
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query is required and must be a string');
    }
    
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      throw new Error('SERPAPI_API_KEY not configured');
    }
    
    const typedLocation = location as string | undefined;
    const typedNumResults = typeof num_results === 'number' ? num_results : 10;
    
    const data = await performDirectSearch(query, apiKey, typedLocation, typedNumResults);
      if (data && typeof data === 'object' && 'organic_results' in data && Array.isArray(data.organic_results)) {
      const results = data.organic_results.slice(0, typedNumResults).map((result: unknown, index: number) => {
        const typedResult = result as Record<string, string>;
        return {
          title: typedResult.title || 'No title',
          url: typedResult.link || '',
          snippet: typedResult.snippet || 'No description',
          position: index + 1,
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              total_results: results.length,
              results,
            }, null, 2),
          },
        ],
      };
    } else {
      throw new Error('No search results returned');
    }
  } catch (error) {
    console.error('Web search error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Web search failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            query: args.query,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function chatWithAI(args: Record<string, unknown>) {  try {
    const { 
      message, 
      model = 'gpt-3.5-turbo', 
      system_prompt 
    } = args;

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Prepare messages array
    const messages = [];
    
    if (system_prompt && typeof system_prompt === 'string') {
      messages.push({
        role: 'system',
        content: system_prompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: message,
    });

    const typedModel = typeof model === 'string' ? model : 'gpt-3.5-turbo';
    const aiResponse = await performDirectChat(messages, typedModel, apiKey);
    
    return {
      content: [
        {
          type: 'text',
          text: aiResponse,
        },
      ],      metadata: {
        model_used: typedModel,
      },
    };
  } catch (error) {
    console.error('AI chat error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'AI chat failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            original_message: args.message,
            model_requested: args.model,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function getTetikaStatus(args: Record<string, unknown>) {
  const { include_models = true, include_settings = true } = args;

  const status = {
    name: 'Tetika AI Agent',
    version: '0.2.0',
    description: 'Advanced AI chat interface with multi-model support and RAG capabilities',
    capabilities: [
      'Multi-model AI chat (OpenRouter integration)',
      'RAG-enhanced responses with web search',
      'File analysis (documents, images, videos)',
      'Conversation management',
      'Real-time web search',
      'Secure local API key storage',
    ],
    status: 'active',
    timestamp: new Date().toISOString(),
  };

  const responseData: Record<string, unknown> = { ...status };

  if (include_models) {
    responseData.available_models = [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      'gemini-pro',
      'llama-2-70b-chat',
      'mistral-large',
    ];
  }
  if (include_settings) {
    responseData.configuration = {
      default_mode: 'standard',
      rag_enabled: true,
      web_search_enabled: true,
      file_analysis_enabled: true,
      max_conversation_history: 50,
      api_keys_configured: {
        openrouter: !!process.env.OPENROUTER_API_KEY,
        serpapi: !!process.env.SERPAPI_API_KEY,
      },
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(responseData, null, 2),
      },
    ],
  };
}

async function manageConversation(args: Record<string, unknown>) {
  const { action, session_id, title, limit = 10 } = args;

  try {
    switch (action) {
      case 'create':
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newSession = {
          id: newSessionId,
          title: title || 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'create',
                session: newSession,
                message: 'Conversation created successfully',
              }, null, 2),
            },
          ],
        };

      case 'list':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'list',
                total: 0,
                limit,
                sessions: [],
                message: 'No conversations found (mock implementation)',
              }, null, 2),
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action,
                message: `Action "${action}" completed (mock implementation)`,
              }, null, 2),
            },
          ],
        };
    }
  } catch (error) {
    console.error('Conversation management error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Conversation management failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            action,
            session_id,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function analyzeFile(args: Record<string, unknown>) {
  const { 
    file_path, 
    file_type, 
    analysis_type = 'auto', 
    questions = [] 
  } = args;

  try {
    const fileName = file_path && typeof file_path === 'string' ? file_path.split('/').pop() || 'unknown' : 'uploaded_file';
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            file_name: fileName,
            file_type: file_type,
            analysis_type: analysis_type,
            questions_asked: questions,
            analysis: `File analysis completed for ${fileName} (${file_type}). This is a mock implementation. In a full implementation, this would analyze the file content using AI capabilities.`,
            note: 'This is a mock implementation. Full file analysis would require integration with vision models and document parsing capabilities.',
          }, null, 2),
        },
      ],
      metadata: {
        file_analyzed: fileName,
        file_type: file_type,
        analysis_method: analysis_type,
        mock: true,
      },
    };
  } catch (error) {
    console.error('File analysis error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'File analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            file_path: file_path || 'content provided',
            file_type: file_type,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

async function fetchWebContent(args: Record<string, unknown>) {
  try {
    const { url, options = {} } = args;
    
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    
    console.log(`[MCP] Fetch de contenu web: ${url}`);
    
    const result = await fetchMCPProvider.fetchUrl(url, options as FetchOptions);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            url: result.url,
            title: result.title,
            snippet: result.snippet,
            content: result.content.substring(0, 4000), // Limit for response size
            metadata: result.metadata,
            error: result.error
          }, null, 2)
        }
      ],
      isError: !result.success
    };
  } catch (error) {
    console.error('Fetch web content error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Failed to fetch web content',
            message: error instanceof Error ? error.message : 'Unknown error',
            url: args.url || 'Invalid URL'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<MCPResponse>> {
  try {
    const { tool, args }: MCPRequest = await request.json();

    if (!tool) {
      return NextResponse.json({
        success: false,
        error: 'Tool name is required'
      }, { status: 400 });    }

    let result;
      switch (tool) {
      case 'multi_search':
        result = await multiProviderSearch(args);
        break;
        
      case 'web_search':
        result = await searchWeb(args);
        break;

      case 'fetch_web_content':
        result = await fetchWebContent(args);
        break;

      case 'chat_with_ai':
        result = await chatWithAI(args);
        break;

      case 'analyze_file':
        result = await analyzeFile(args);
        break;

      case 'manage_conversation':
        result = await manageConversation(args);
        break;

      case 'get_tetika_status':
        result = await getTetikaStatus(args);
        break;

      case 'fetch_web_content':
        result = await fetchWebContent(args);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown tool: ${tool}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
