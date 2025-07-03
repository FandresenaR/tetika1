import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { cleanApiKey } from '@/lib/api';
import { fetchMCPProvider } from '@/lib/fetch-mcp-provider';
// Session management types
interface ScrapingSession {
  sessionId: string;
  url: string;
  step: 'analyzing' | 'analyzed' | 'extracting' | 'completed' | 'initialized';
  pageInfo?: PageInfo;
  instructions?: string;
  results?: ScrapingResults;
  error?: string;
  timestamp: string;
  browser?: Browser;
  page?: Page;
}

interface PageInfo {
  title: string;
  description: string;
  url: string;
  availableElements: PageElement[];
  availableLinks: AvailableLink[];
  totalElements: number;
  bodyTextLength: number;
}

interface ScrapingResults {
  success: boolean;
  totalResults: number;
  extractedData: ExtractedItem[];
  message?: string;
  stats?: {
    withLinks: number;
    withImages: number;
    withPrices: number;
    withEmails: number;
    withPhones: number;
  };
}

interface PageElement {
  type: string;
  count: number;
  selector: string;
  sampleText?: string;
}

interface AvailableLink {
  text: string;
  href: string;
  type: string;
}

interface ExtractedItem {
  [key: string]: unknown;
  link?: string;
  image?: string;
  price?: string;
  email?: string;
  phone?: string;
}

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

// Interactive Scraper Session Management
// Simple in-memory storage for demo (in production, use Redis or database)
const scrapingSessions = new Map<string, ScrapingSession>();

// Interactive Scraper Tool - Step-by-step workflow
async function interactiveScraper(args: Record<string, unknown>) {
  const { action, sessionId, url, instructions, linkSelectors, dataSelectors, aiGuidance } = args;
  
  console.log(`[Interactive Scraper] Action: ${action}`);
  
  try {
    switch (action) {
      case 'start':
        return await startScrapingSession(
          url as string, 
          aiGuidance, 
          instructions as string
        );
      
      case 'analyze':
        return await analyzePageContent(sessionId as string);
      
      case 'extract':
        return await extractWithInstructions(
          sessionId as string, 
          instructions as string,
          linkSelectors as string[],
          dataSelectors as string[]
        );
      
      case 'get_session':
        return await getSessionInfo(sessionId as string);
      
      case 'cleanup':
        return await cleanupSession(sessionId as string);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Interactive scraper error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Interactive scraper failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            action,
            sessionId
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

// Step 1: Start scraping session and navigate to URL
async function startScrapingSession(url: string, aiGuidance?: unknown, instructions?: string) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string');
  }
  
  // Validate and fix URL format
  let validUrl = url.trim();
  
  // Add protocol if missing
  if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = `https://${validUrl}`;
  }
  
  // Validate URL format
  try {
    new URL(validUrl);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }
  
  const sessionId = `scrape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[Interactive Scraper] Starting AI-guided session ${sessionId} for ${validUrl}`);
  
  // Log AI guidance if provided
  if (aiGuidance) {
    console.log(`[Interactive Scraper] AI Guidance:`, aiGuidance);
  }
  
  try {
    // Launch browser with enhanced anti-bot protection
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=VizDisplayCompositor',
        '--force-color-profile=srgb',
        '--disable-background-networking'
      ],
      defaultViewport: null,
      ignoreDefaultArgs: ['--enable-automation']
    });
    
    const page = await browser.newPage();
    
    // Enhanced page configuration with better stealth
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Rotate user agents for better stealth
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    
    // Set additional headers with more realistic values
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });
    
    // Add JavaScript execution context to mask automation
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete (navigator as unknown as { webdriver?: unknown }).webdriver;
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5].map(() => 'plugin')
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'fr']
      });
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      (window.navigator.permissions as unknown as { query: (params: unknown) => Promise<unknown> }).query = (parameters: unknown) => (
        (parameters as { name: string }).name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters as PermissionDescriptor)
      );
    });
    
    // AI-guided navigation strategies
    let navigationSuccess = false;
    let lastError;
    let pageContent = '';
    
    // Use AI guidance to determine optimal navigation strategy
    const guidance = aiGuidance as { websiteType?: string; challenges?: string[]; strategy?: string } | null;
    
    const strategies = [
      {
        name: 'AI-Optimized Navigation',
        options: { 
          waitUntil: guidance?.challenges?.includes('dynamic content') ? 'networkidle0' as const : 'networkidle2' as const, 
          timeout: guidance?.challenges?.includes('slow loading') ? 45000 : 35000 
        },
        postAction: async () => {
          // AI-guided post-action based on website type
          const delay = guidance?.websiteType === 'e-commerce' ? 3000 : 1500;
          await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 2000));
          
          // Simulate realistic user behavior
          await page.mouse.move(Math.random() * 100, Math.random() * 100);
          await page.mouse.move(Math.random() * 200, Math.random() * 200);
          
          // Special handling for different website types
          if (guidance?.websiteType === 'social media' || guidance?.websiteType === 'news') {
            // Scroll to load more content
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight / 3);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      },
      {
        name: 'Standard Navigation with AI Enhancements',
        options: { waitUntil: 'domcontentloaded' as const, timeout: 30000 },
        postAction: async () => {
          // Wait for dynamic content based on AI guidance
          const waitTime = guidance?.challenges?.includes('ajax loading') ? 5000 : 2000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Try to scroll to trigger lazy loading
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 4);
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      },
      {
        name: 'Load Event with AI-Guided Interaction',
        options: { waitUntil: 'load' as const, timeout: 25000 },
        postAction: async () => {
          // AI-guided interactions based on website type
          try {
            if (guidance?.websiteType === 'directory' || guidance?.websiteType === 'listing') {
              // Try to click "Load More" or similar buttons
              const loadMoreSelectors = ['[data-testid*="load"]', '.load-more', '.show-more', '.pagination a'];
              for (const selector of loadMoreSelectors) {
                const element = await page.$(selector);
                if (element) {
                  await element.click();
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  break;
                }
              }
            } else {
              // Default safe click
              await page.click('body');
            }
          } catch {
            // Ignore interaction errors
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      },
      {
        name: 'Fallback Navigation',
        options: { waitUntil: 'networkidle0' as const, timeout: 20000 },
        postAction: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    ];
    
    console.log(`[Interactive Scraper] Using AI-guided navigation for ${guidance?.websiteType || 'unknown'} website`);
    
    for (const strategy of strategies) {
      try {
        console.log(`[Interactive Scraper] Attempting: ${strategy.name}`);
        
        // Add a pre-navigation delay for subsequent attempts
        if (strategies.indexOf(strategy) > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        await page.goto(validUrl, strategy.options);
        
        // Execute AI-guided post-action
        if (strategy.postAction) {
          await strategy.postAction();
        }
        
        // Verify page loaded successfully
        const pageTitle = await page.title();
        pageContent = await page.content();
        
        // AI-guided content validation
        const hasValidContent = pageContent.length > 1000 && 
                               !pageContent.includes('Access denied') &&
                               !pageContent.includes('Blocked') &&
                               !pageContent.includes('Please enable JavaScript') &&
                               !pageContent.includes('bot detected') &&
                               !pageContent.includes('Cloudflare');
        
        if (pageTitle && pageTitle.length > 0 && hasValidContent) {
          console.log(`[Interactive Scraper] Success with ${strategy.name} - Page title: ${pageTitle}`);
          console.log(`[Interactive Scraper] Page content length: ${pageContent.length}`);
          navigationSuccess = true;
          break;
        } else {
          console.log(`[Interactive Scraper] ${strategy.name} loaded but content seems blocked or minimal`);
          console.log(`[Interactive Scraper] Title: ${pageTitle || 'none'}, Content length: ${pageContent.length}`);
        }
        
      } catch (error) {
        console.log(`[Interactive Scraper] ${strategy.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        lastError = error;
        
        // Wait before trying next strategy
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!navigationSuccess) {
      console.error(`[Interactive Scraper] All AI-guided navigation strategies failed for: ${validUrl}`);
      await browser.close();
      
      // Provide detailed error information with AI context
      const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
      
      // Check if this looks like anti-bot protection
      const isAntiBot = errorMessage.includes('timeout') || 
                        errorMessage.includes('TimeoutError') ||
                        errorMessage.includes('Navigation timeout') ||
                        pageContent.includes('Access denied') ||
                        pageContent.includes('Blocked') ||
                        pageContent.includes('bot detected') ||
                        pageContent.includes('Cloudflare');
      
      if (isAntiBot) {
        const aiInsights = guidance?.challenges ? `\n\nAI Analysis: ${guidance.challenges.join(', ')}` : '';
        throw new Error(
          `AI-guided navigation failed - This site appears to have anti-bot protection.\n\n` +
          `Site: ${validUrl}\n` +
          `Error: ${errorMessage}${aiInsights}\n\n` +
          `AI Recommendations:\n` +
          `1. The AI detected this as a ${guidance?.websiteType || 'complex'} website\n` +
          `2. Try accessing the site manually first to verify accessibility\n` +
          `3. The site may require JavaScript, cookies, or human verification\n` +
          `4. Consider using a different URL or testing with a simpler page\n` +
          `5. Some sites block automated access entirely\n\n` +
          `AI Strategy Applied: ${guidance?.strategy || 'Standard navigation'}\n` +
          `For better results, try:\n` +
          `- Simpler pages from the same domain\n` +
          `- Direct content URLs instead of landing pages\n` +
          `- Sites with public APIs or RSS feeds`
        );
      } else {
        throw new Error(`AI-guided navigation failed for ${validUrl}. Error: ${errorMessage}`);
      }
    }
    
    // Create enhanced session with AI guidance
    const session: ScrapingSession = {
      sessionId,
      url: validUrl,
      step: 'initialized',
      browser,
      page,
      instructions: instructions || '',
      timestamp: new Date().toISOString()
    };
    
    scrapingSessions.set(sessionId, session);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId,
            url: validUrl,
            step: 'initialized',
            message: 'AI-guided scraping session started successfully. Ready for intelligent page analysis.',
            nextAction: 'Call with action="analyze" to perform AI-enhanced page analysis',
            timestamp: session.timestamp,
            aiGuidance: guidance ? 'Applied' : 'Not provided'
          }, null, 2)
        }
      ],
      isError: false
    };
    
  } catch (error) {
    console.error(`[Interactive Scraper] Failed to start AI-guided session:`, error);
    throw error;
  }
}

// Step 2: Analyze page content and provide available elements/links
async function analyzePageContent(sessionId: string) {
  const session = scrapingSessions.get(sessionId);
  if (!session || !session.page) {
    throw new Error('Invalid session ID or session not found');
  }
  
  console.log(`[Interactive Scraper] Analyzing page content for session ${sessionId}`);
  
  try {
    const pageInfo = await session.page.evaluate(() => {
      // Analyze available elements
      const elementTypes = [
        { type: 'headings', selector: 'h1, h2, h3, h4, h5, h6' },
        { type: 'links', selector: 'a[href]' },
        { type: 'images', selector: 'img' },
        { type: 'paragraphs', selector: 'p' },
        { type: 'lists', selector: 'ul, ol' },
        { type: 'tables', selector: 'table' },
        { type: 'forms', selector: 'form' },
        { type: 'buttons', selector: 'button, input[type="button"], input[type="submit"]' },
        { type: 'cards', selector: '.card, [class*="card"], .item, [class*="item"]' },
        { type: 'containers', selector: '.container, .wrapper, .content, [class*="container"]' }
      ];
      
      const availableElements = elementTypes.map(({ type, selector }) => {
        const elements = document.querySelectorAll(selector);
        const sampleElement = elements[0];
        
        return {
          type,
          count: elements.length,
          selector,
          sampleText: sampleElement ? 
            sampleElement.textContent?.substring(0, 100) || sampleElement.outerHTML.substring(0, 100) 
            : undefined
        };
      }).filter(item => item.count > 0);
      
      // Analyze available links
      const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 20).map(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        
        let linkType = 'internal';
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
          linkType = 'external';
        } else if (href.startsWith('mailto:')) {
          linkType = 'email';
        } else if (href.startsWith('tel:')) {
          linkType = 'phone';
        }
        
        return {
          text: text.substring(0, 50),
          href: href.startsWith('http') ? href : new URL(href, window.location.href).href,
          type: linkType
        };
      }).filter(link => link.text.length > 0);
      
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        url: window.location.href,
        availableElements,
        availableLinks: links,
        totalElements: document.querySelectorAll('*').length,
        bodyTextLength: document.body.textContent?.length || 0
      };
    });
    
    // Update session
    session.pageInfo = pageInfo;
    session.step = 'analyzed';
    scrapingSessions.set(sessionId, session);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId,
            step: 'analyzed',
            pageInfo,
            message: 'Page analysis complete. You can now provide extraction instructions.',
            nextAction: 'Call with action="extract" and provide instructions for what data to scrape',
            examples: {
              instructions: [
                'Extract all company names and their websites',
                'Get all product names, prices, and descriptions',
                'Find all contact information including emails and phone numbers',
                'Scrape all job listings with titles, companies, and locations',
                'Extract all news article titles, dates, and summaries'
              ],
              linkSelectors: ['a[href*="/company"]', 'a[href*="/product"]', '.company-link'],
              dataSelectors: ['.company-name', '.price', '.description', '.contact-info']
            }
          }, null, 2)
        }
      ],
      isError: false
    };
    
  } catch (error) {
    console.error(`[Interactive Scraper] Failed to analyze page:`, error);
    throw error;
  }
}

// Step 3: Extract data based on user instructions
async function extractWithInstructions(
  sessionId: string, 
  instructions: string,
  linkSelectors?: string[],
  dataSelectors?: string[]
) {
  const session = scrapingSessions.get(sessionId);
  if (!session || !session.page) {
    throw new Error('Invalid session ID or session not found');
  }
  
  console.log(`[Interactive Scraper] Extracting data for session ${sessionId}`);
  console.log(`[Interactive Scraper] Instructions: ${instructions}`);
  
  try {
    // Perform intelligent scrolling first
    await session.page.evaluate(async () => {
      const scrollDelay = 1000;
      const maxScrolls = 3;
      let lastHeight = document.body.scrollHeight;
      
      for (let i = 0; i < maxScrolls; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
        
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight) break;
        lastHeight = newHeight;
      }
      
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Extract data based on instructions
    const extractedData = await session.page.evaluate(
      (instructions: string, linkSelectors?: string[], dataSelectors?: string[]) => {
        console.log('Starting extraction with instructions:', instructions);
        
        const results: ExtractedItem[] = [];
        
        // Generate selectors based on instructions
        const generateSelectors = (instruction: string) => {
          const lowerInst = instruction.toLowerCase();
          const selectors: string[] = [];
          
          // Company-related selectors
          if (lowerInst.includes('company') || lowerInst.includes('business')) {
            selectors.push(
              '.company', '.company-name', '.business-name', '.organization',
              '[class*="company"]', '[class*="business"]', '[data-testid*="company"]',
              'h1, h2, h3', '.title', '.name', '.brand'
            );
          }
          
          // Product-related selectors
          if (lowerInst.includes('product') || lowerInst.includes('item')) {
            selectors.push(
              '.product', '.product-name', '.item', '.item-name',
              '[class*="product"]', '[class*="item"]', '.title', '.name'
            );
          }
          
          // Price-related selectors
          if (lowerInst.includes('price') || lowerInst.includes('cost')) {
            selectors.push(
              '.price', '.cost', '.amount', '[class*="price"]', '[class*="cost"]',
              '[data-testid*="price"]', '.currency'
            );
          }
          
          // Contact information selectors
          if (lowerInst.includes('contact') || lowerInst.includes('email') || lowerInst.includes('phone')) {
            selectors.push(
              '.contact', '.email', '.phone', '.telephone', '[href^="mailto:"]', '[href^="tel:"]',
              '[class*="contact"]', '[class*="email"]', '[class*="phone"]'
            );
          }
          
          // Job/career selectors
          if (lowerInst.includes('job') || lowerInst.includes('career') || lowerInst.includes('position')) {
            selectors.push(
              '.job', '.position', '.role', '.career', '[class*="job"]', '[class*="position"]',
              '.job-title', '.position-title'
            );
          }
          
          // News/article selectors
          if (lowerInst.includes('news') || lowerInst.includes('article') || lowerInst.includes('blog')) {
            selectors.push(
              '.article', '.news', '.blog', '.post', '[class*="article"]', '[class*="news"]',
              '.article-title', '.news-title', '.post-title'
            );
          }
          
          // Generic selectors
          selectors.push(
            '.card', '.item', '.listing', '.entry', '[class*="card"]', '[class*="item"]',
            'article', 'section', '.container > div', '.grid > div'
          );
          
          return [...new Set(selectors)]; // Remove duplicates
        };
        
        // Use provided selectors or generate from instructions
        const targetSelectors = dataSelectors && dataSelectors.length > 0 
          ? dataSelectors 
          : generateSelectors(instructions);
        
        console.log('Using selectors:', targetSelectors);
        
        // Extract data using selectors
        for (const selector of targetSelectors) {
          const elements = document.querySelectorAll(selector);
          console.log(`Selector "${selector}": found ${elements.length} elements`);
          
          if (elements.length > 0) {
            elements.forEach((element, index) => {
              if (results.length >= 50) return; // Limit results
              
              try {
                const extractedItem: ExtractedItem = {};
                
                // Extract primary text content
                const primaryText = element.textContent?.trim();
                if (primaryText && primaryText.length > 2) {
                  extractedItem.text = primaryText.substring(0, 200);
                }
                
                // Extract links
                const linkEl = element.querySelector('a[href]') || (element.tagName === 'A' ? element : null);
                if (linkEl) {
                  const href = linkEl.getAttribute('href');
                  if (href) {
                    extractedItem.link = href.startsWith('http') ? href : new URL(href, window.location.href).href;
                  }
                }
                
                // Extract images
                const imgEl = element.querySelector('img');
                if (imgEl) {
                  const src = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
                  if (src) {
                    extractedItem.image = src.startsWith('http') ? src : new URL(src, window.location.href).href;
                  }
                }
                
                // Extract specific data based on instructions
                if (instructions.toLowerCase().includes('price')) {
                  const priceText = element.textContent || '';
                  const priceMatch = priceText.match(/[\$€£¥₹][\d,.]+(?: ?\w+)?|\d+[.,]\d+\s*[\$€£¥₹]/);
                  if (priceMatch) {
                    extractedItem.price = priceMatch[0];
                  }
                }
                
                if (instructions.toLowerCase().includes('email')) {
                  const emailMatch = element.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                  if (emailMatch) {
                    extractedItem.email = emailMatch[0];
                  }
                }
                
                if (instructions.toLowerCase().includes('phone')) {
                  const phoneMatch = element.textContent?.match(/[\+]?[1-9]?[\d\s\-\(\)]{8,15}/);
                  if (phoneMatch) {
                    extractedItem.phone = phoneMatch[0].trim();
                  }
                }
                
                // Add metadata
                extractedItem.metadata = {
                  selector,
                  tagName: element.tagName,
                  className: element.className,
                  index,
                  timestamp: new Date().toISOString()
                };
                
                if (Object.keys(extractedItem).length > 1) { // More than just metadata
                  results.push(extractedItem);
                }
                
              } catch (elementError) {
                console.warn(`Error processing element ${index}:`, elementError);
              }
            });
            
            if (results.length > 0) break; // Found data, stop trying other selectors
          }
        }
        
        // If specific extraction didn't work, try general text extraction
        if (results.length === 0) {
          console.log('No specific data found, trying general extraction...');
          
          const generalElements = document.querySelectorAll('p, div, span, article, section');
          const textResults: string[] = [];
          
          generalElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10 && text.length < 500) {
              const lowerText = text.toLowerCase();
              const instructionWords = instructions.toLowerCase().split(' ');
              
              // Check if text contains any instruction keywords
              const hasKeyword = instructionWords.some(word => 
                word.length > 3 && lowerText.includes(word)
              );
              
              if (hasKeyword && !textResults.some(existing => existing.includes(text))) {
                textResults.push(text);
                if (textResults.length >= 10) return;
              }
            }
          });
          
          textResults.forEach((text, index) => {
            results.push({
              text,
              metadata: {
                selector: 'general-text-extraction',
                index,
                extractionType: 'keyword-match'
              }
            });
          });
        }
        
        console.log(`Extraction complete. Found ${results.length} items.`);
        return results;
      },
      instructions,
      linkSelectors,
      dataSelectors
    );
    
    // Update session
    session.results = {
      success: true,
      totalResults: extractedData.length,
      extractedData: extractedData,
      message: `Successfully extracted ${extractedData.length} items`,
      stats: {
        withLinks: extractedData.filter(item => item.link).length,
        withImages: extractedData.filter(item => item.image).length,
        withPrices: extractedData.filter(item => item.price).length,
        withEmails: extractedData.filter(item => item.email).length,
        withPhones: extractedData.filter(item => item.phone).length
      }
    };
    session.step = 'completed';
    scrapingSessions.set(sessionId, session);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId,
            step: 'completed',
            instructions,
            totalFound: extractedData.length,
            extractedData: extractedData.slice(0, 20), // Limit for response size
            message: `Data extraction completed. Found ${extractedData.length} items based on your instructions.`,
            summary: {
              withLinks: extractedData.filter((item: ExtractedItem) => item.link).length,
              withImages: extractedData.filter((item: ExtractedItem) => item.image).length,
              withPrices: extractedData.filter((item: ExtractedItem) => item.price).length,
              withEmails: extractedData.filter((item: ExtractedItem) => item.email).length,
              withPhones: extractedData.filter((item: ExtractedItem) => item.phone).length
            },
            nextAction: 'Call with action="cleanup" to close the session, or modify instructions for re-extraction'
          }, null, 2)
        }
      ],
      isError: false
    };
    
  } catch (error) {
    console.error(`[Interactive Scraper] Failed to extract data:`, error);
    throw error;
  }
}

// Get session information
async function getSessionInfo(sessionId: string) {
  const session = scrapingSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          sessionId,
          url: session.url,
          step: session.step,
          timestamp: session.timestamp,
          hasResults: !!session.results,
          resultCount: session.results?.extractedData?.length || 0,
          pageInfo: session.pageInfo
        }, null, 2)
      }
    ],
    isError: false
  };
}

// Cleanup session and close browser
async function cleanupSession(sessionId: string) {
  const session = scrapingSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  try {
    if (session.browser) {
      await session.browser?.close();
    }
    scrapingSessions.delete(sessionId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Session ${sessionId} cleaned up successfully`,
            sessionId
          }, null, 2)
        }
      ],
      isError: false
    };
  } catch (error) {
    console.error(`[Interactive Scraper] Failed to cleanup session:`, error);
    scrapingSessions.delete(sessionId); // Force delete even if cleanup failed
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<MCPResponse>> {
  try {
    const { tool, args }: MCPRequest = await request.json();

    if (!tool) {
      return NextResponse.json({
        success: false,
        error: 'Tool name is required'
      }, { status: 400 });
    }

    let result;
    
    switch (tool) {
      case 'multi_search':
        result = await multiProviderSearch(args);
        break;
        
      case 'web_search':
        result = await searchWeb(args);
        break;

      case 'fetch_web_content':
        // Using web search instead
        result = await searchWeb(args);
        break;

      case 'chat_with_ai':
        result = await chatWithAI(args);
        break;

      case 'analyze_file':
        // File analysis not implemented
        result = { content: [{ type: 'text', text: JSON.stringify({ error: 'File analysis not implemented' }) }] };
        break;

      case 'manage_conversation':
        // Conversation management not implemented
        result = { content: [{ type: 'text', text: JSON.stringify({ error: 'Conversation management not implemented' }) }] };
        break;
        
      case 'intelligent_navigation':
        // Use the interactive scraper for intelligent navigation
        result = await interactiveScraper(args);
        break;
        
      case 'extract_company_data':
        result = await interactiveScraper(args);
        break;

      case 'interactive_scraper':
        result = await interactiveScraper(args);
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
    });  } catch (error) {
    console.error('MCP API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
