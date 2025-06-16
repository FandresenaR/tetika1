/**
 * Fetch MCP integration for web search and content extraction
 */

interface SearchOptions {
  maxResults?: number;
  headers?: Record<string, string>;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  source: string;
}

interface FetchResult {
  success: boolean;
  url: string;
  contentType?: string;
  title: string;
  content: string;
  snippet?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface FormattedSearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  source: string;
}

interface SearchResponse {
  organic_results: FormattedSearchResult[];
  search_metadata: {
    status: string;
    query: string;
    total_results?: number;
    error?: string;
    provider: string;
  };
}

interface DuckDuckGoTopic {
  Text?: string;
  FirstURL?: string;
}

export class FetchMCPProvider {
  public readonly name: string;
  public readonly id: string;
  public readonly description: string;
  public readonly requiresApiKey: boolean;
  public readonly priority: number;

  constructor() {
    this.name = 'Fetch MCP';
    this.id = 'fetch-mcp';
    this.description = 'Direct web fetching with content extraction';
    this.requiresApiKey = false;
    this.priority = 3;
  }  /**
   * Search the web using Fetch MCP
   * @param {string} query - Search query
   * @param {SearchOptions} options - Search options
   * @returns {Promise<SearchResponse>} - Search results
   */  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    console.log(`[Fetch MCP Provider] Searching for: ${query}`);
    
    try {
      // For web search, we'll use a combination of approaches:
      // 1. Try to search using DuckDuckGo instant answers
      // 2. Try DuckDuckGo HTML scraping (backup)
      // 3. If that fails, try to fetch content from known sources
      
      const results: SearchResult[] = [];
      
      // Method 1: DuckDuckGo Instant Answer API
      try {
        console.log('[Fetch MCP] Tentative DuckDuckGo Instant Answer API...');
        const ddgResult = await this.searchDuckDuckGo(query);
        if (ddgResult && ddgResult.length > 0) {
          console.log(`[Fetch MCP] DuckDuckGo Instant Answer: ${ddgResult.length} résultats`);
          results.push(...ddgResult);
        } else {
          console.log('[Fetch MCP] DuckDuckGo Instant Answer: aucun résultat');
        }
      } catch (error) {
        const err = error as Error;
        console.warn('[Fetch MCP] DuckDuckGo Instant Answer failed:', err.message);
      }
      
      // Method 2: DuckDuckGo HTML Search (if instant answer failed)
      if (results.length === 0) {
        try {
          console.log('[Fetch MCP] Tentative DuckDuckGo HTML scraping...');
          const ddgHtmlResults = await this.searchDuckDuckGoHTML(query);
          if (ddgHtmlResults && ddgHtmlResults.length > 0) {
            console.log(`[Fetch MCP] DuckDuckGo HTML scraping: ${ddgHtmlResults.length} résultats`);
            results.push(...ddgHtmlResults);
          } else {
            console.log('[Fetch MCP] DuckDuckGo HTML scraping: aucun résultat');
          }
        } catch (error) {
          const err = error as Error;
          console.warn('[Fetch MCP] DuckDuckGo HTML scraping failed:', err.message);
        }
      }
      
      // Method 3: Try to fetch from common knowledge sources
      if (results.length < 3) {
        try {
          console.log('[Fetch MCP] Tentative sources de connaissances...');
          const knowledgeResults = await this.searchKnowledgeSources(query);
          console.log(`[Fetch MCP] Sources de connaissances: ${knowledgeResults.length} résultats`);
          results.push(...knowledgeResults);
        } catch (error) {
          const err = error as Error;
          console.warn('[Fetch MCP] Knowledge source search failed:', err.message);
        }
      }
      
      // Format results for the standard interface
      const formattedResults = results.slice(0, options.maxResults || 5).map((result, index) => ({
        title: result.title || 'Sans titre',
        link: result.url || '#',
        snippet: result.snippet || result.content?.substring(0, 200) || 'Pas de description disponible',
        position: index + 1,
        source: 'Fetch MCP'
      }));
      
      console.log(`[Fetch MCP Provider] Total des résultats formatés: ${formattedResults.length}`);
      
      return {
        organic_results: formattedResults,
        search_metadata: {
          status: 'Success',
          query,
          total_results: formattedResults.length,
          provider: 'fetch-mcp'
        }
      };
      
    } catch (error) {
      const err = error as Error;
      console.error('[Fetch MCP Provider] Search error:', error);
      return {
        organic_results: [],
        search_metadata: {
          status: 'Error',
          query,
          error: err.message,
          provider: 'fetch-mcp'
        }
      };
    }
  }
  /**
   * Search using DuckDuckGo Instant Answer API
   * @param {string} query - Search query
   * @returns {Promise<SearchResult[]>} - Search results
   */
  async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(ddgUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`DuckDuckGo API responded with ${response.status}`);
      }
      
      const data = await response.json();
      const results = [];
      
      // Process instant answer
      if (data.AbstractText && data.AbstractText.trim()) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || '',
          snippet: data.AbstractText,
          content: data.AbstractText,
          source: 'DuckDuckGo Instant Answer'
        });
      }        // Process related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 3).forEach((topic: DuckDuckGoTopic) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Sujet connexe',
              url: topic.FirstURL,
              snippet: topic.Text,
              content: topic.Text,
              source: 'DuckDuckGo Related Topic'
            });
          }
        });
      }
      
      // Process answer if available
      if (data.Answer && data.AnswerType) {
        results.push({
          title: `${data.AnswerType}: ${query}`,
          url: '',
          snippet: data.Answer,
          content: data.Answer,
          source: 'DuckDuckGo Direct Answer'
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('[Fetch MCP] DuckDuckGo search error:', error);
      return [];
    }
  }
  /**
   * Search using DuckDuckGo HTML scraping (alternative method)
   * @param {string} query - Search query
   * @returns {Promise<SearchResult[]>} - Search results
   */
  async searchDuckDuckGoHTML(query: string): Promise<SearchResult[]> {
    try {
      // Note: DuckDuckGo HTML scraping is more complex and may be blocked
      // This is a simplified version that attempts to get some results
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`DuckDuckGo HTML responded with ${response.status}`);
      }
      
      const html = await response.text();
      
      // This is a basic implementation - in practice, HTML scraping is complex
      // and DuckDuckGo may block such requests
      const results: SearchResult[] = [];
      
      // Try to extract some basic information from the HTML
      // Note: This is a simplified parser and may not work reliably
      const titleMatches = html.match(/<h2[^>]*class="result__title"[^>]*>[\s\S]*?<\/h2>/g) || [];
      const snippetMatches = html.match(/<a[^>]*class="result__snippet"[^>]*>[\s\S]*?<\/a>/g) || [];
      
      for (let i = 0; i < Math.min(titleMatches.length, 3); i++) {
        const titleHtml = titleMatches[i];
        const snippetHtml = snippetMatches[i] || '';
        
        // Extract title and URL (very basic)
        const titleMatch = titleHtml.match(/>(.*?)<\/a>/);
        const urlMatch = titleHtml.match(/href="([^"]*)"/) || titleHtml.match(/href='([^']*)'/);
        const snippetMatch = snippetHtml.match(/>(.*?)<\/a>/);
        
        if (titleMatch && urlMatch) {
          results.push({
            title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
            url: urlMatch[1],
            snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '',
            content: '',
            source: 'DuckDuckGo HTML'
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('[Fetch MCP] DuckDuckGo HTML search error:', error);
      return [];
    }
  }  /**
   * Search knowledge sources by fetching content from known reliable sources
   * @param {string} query - Search query
   * @returns {Promise<SearchResult[]>} - Search results
   */
  async searchKnowledgeSources(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Define knowledge sources that are likely to have good content
    const knowledgeSources = [
      {
        name: 'Wikipedia (English)',
        searchUrl: `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`,
        type: 'wikipedia-en'
      },
      {
        name: 'Wikipedia (French)',
        searchUrl: `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=2&namespace=0&format=json&origin=*`,
        type: 'wikipedia-fr'
      }
    ];
    
    for (const source of knowledgeSources) {
      try {
        if (source.type === 'wikipedia-en') {
          const wikiResults = await this.searchWikipedia(query, 'en');
          results.push(...wikiResults);
        } else if (source.type === 'wikipedia-fr') {
          const wikiResults = await this.searchWikipedia(query, 'fr');
          results.push(...wikiResults);
        }
      } catch (error) {
        const err = error as Error;
        console.warn(`[Fetch MCP] Error searching ${source.name}:`, err.message);
      }
    }
    
    return results;
  }
  /**
   * Search Wikipedia
   * @param {string} query - Search query
   * @param {string} lang - Language code (en, fr, etc.)
   * @returns {Promise<SearchResult[]>} - Wikipedia results
   */
  async searchWikipedia(query: string, lang: string = 'fr'): Promise<SearchResult[]> {
    try {
      // First, search for articles
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=2&namespace=0&format=json&origin=*`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
      }        const searchData = await searchResponse.json();
      const [, titles, descriptions, urls] = searchData;
      
      const results: SearchResult[] = [];
      
      // Process each result
      for (let i = 0; i < Math.min(titles.length, 2); i++) {
        if (titles[i] && urls[i]) {
          try {
            // Get article extract
            const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(titles[i])}&prop=extracts&exintro=&explaintext=&exsectionformat=plain&origin=*`;
            
            const extractResponse = await fetch(extractUrl);
            if (extractResponse.ok) {
              const extractData = await extractResponse.json();
              const pages = extractData.query.pages;
              const pageId = Object.keys(pages)[0];
              const extract = pages[pageId]?.extract || descriptions[i] || '';
              
              results.push({
                title: titles[i],
                url: urls[i],
                snippet: extract.substring(0, 300) + (extract.length > 300 ? '...' : ''),
                content: extract,
                source: `Wikipedia (${lang.toUpperCase()})`
              });
            }          } catch {
            // Fallback to just the description
            results.push({
              title: titles[i],
              url: urls[i],
              snippet: descriptions[i] || 'Article Wikipedia',
              content: descriptions[i] || '',
              source: `Wikipedia (${lang.toUpperCase()})`
            });
          }
        }
      }
      
      return results;
      
    } catch (error) {
      console.error(`[Fetch MCP] Wikipedia (${lang}) search error:`, error);
      return [];
    }
  }
  /**
   * Fetch content from a specific URL
   * @param {string} url - URL to fetch
   * @param {SearchOptions} options - Fetch options
   * @returns {Promise<FetchResult>} - Fetched content
   */
  async fetchUrl(url: string, options: SearchOptions = {}): Promise<FetchResult> {
    try {
      console.log(`[Fetch MCP Provider] Fetching URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          ...(options.headers || {})
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        return {
          success: true,
          url: response.url,
          contentType,
          title: 'JSON Data',
          content: JSON.stringify(jsonData, null, 2),
          metadata: { type: 'json' }
        };
      } else {
        const text = await response.text();
        
        // Basic HTML content extraction for client-side
        let title = '';
        let cleanContent = text;
        
        if (contentType.includes('text/html')) {
          // Extract title
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          title = titleMatch ? titleMatch[1].trim() : '';
          
          // Basic cleanup - remove scripts and styles
          cleanContent = text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
        }
        
        return {
          success: true,
          url: response.url,
          contentType,
          title: title || 'Contenu Web',
          content: cleanContent,
          snippet: cleanContent.substring(0, 200) + '...',
          metadata: { type: 'html' }
        };
      }      
    } catch (error) {
      const err = error as Error;
      console.error(`[Fetch MCP Provider] Error fetching ${url}:`, error);
      return {
        success: false,
        url,
        error: err.message,
        title: 'Erreur de récupération',
        content: '',
        snippet: `Erreur lors de l'accès à ${url}: ${err.message}`
      };
    }
  }
}

// Export for use in the main search system
export const fetchMCPProvider = new FetchMCPProvider();
