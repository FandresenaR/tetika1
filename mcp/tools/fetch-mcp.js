import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

/**
 * Fetch MCP implementation for direct web content fetching and extraction
 */
export class FetchMCP {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 15000; // 15 seconds timeout
  }

  /**
   * Fetch content from a URL
   * @param {string} url - The URL to fetch
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Extracted content and metadata
   */
  async fetchUrl(url, options = {}) {
    try {
      console.log(`[Fetch MCP] Fetching URL: ${url}`);
      
      const fetchOptions = {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          ...options.headers
        },
        timeout: this.timeout,
        follow: 5, // Follow up to 5 redirects
        size: 5 * 1024 * 1024, // 5MB max response size
      };

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // Extract content based on content type
      let extractedContent = {};
      
      if (contentType.includes('text/html')) {
        extractedContent = this.extractHtmlContent(text, url);
      } else if (contentType.includes('application/json')) {
        try {
          extractedContent = {
            type: 'json',
            content: JSON.parse(text),
            raw: text
          };
        } catch (e) {
          extractedContent = {
            type: 'text',
            content: text,
            error: 'Failed to parse JSON'
          };
        }
      } else {
        extractedContent = {
          type: 'text',
          content: text.substring(0, 10000) // Limit to first 10k chars
        };
      }

      return {
        success: true,
        url: response.url, // Final URL after redirects
        status: response.status,
        contentType,
        title: extractedContent.title || '',
        content: extractedContent.content || '',
        snippet: extractedContent.snippet || '',
        links: extractedContent.links || [],
        images: extractedContent.images || [],
        metadata: {
          description: extractedContent.description || '',
          keywords: extractedContent.keywords || '',
          author: extractedContent.author || '',
          publishedDate: extractedContent.publishedDate || '',
          language: extractedContent.language || 'fr',
          wordCount: extractedContent.wordCount || 0
        }
      };

    } catch (error) {
      console.error(`[Fetch MCP] Error fetching ${url}:`, error);
      return {
        success: false,
        url,
        error: error.message,
        content: '',
        title: '',
        snippet: `Erreur lors de l'accès à ${url}: ${error.message}`
      };
    }
  }

  /**
   * Extract structured content from HTML
   * @param {string} html - The HTML content
   * @param {string} url - The source URL
   * @returns {Object} - Extracted content and metadata
   */
  extractHtmlContent(html, url) {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());

      // Extract title
      const title = document.querySelector('title')?.textContent?.trim() || 
                   document.querySelector('h1')?.textContent?.trim() || '';

      // Extract meta description
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         '';

      // Extract meta keywords
      const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

      // Extract author
      const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                    document.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
                    '';

      // Extract main content (try multiple selectors)
      let mainContent = '';
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '.article-content',
        '.post-content',
        '.entry-content',
        '#content',
        '.container'
      ];

      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = this.extractTextFromElement(element);
          break;
        }
      }

      // Fallback to body if no main content found
      if (!mainContent) {
        mainContent = this.extractTextFromElement(document.body);
      }

      // Clean and limit content
      mainContent = this.cleanText(mainContent);
      
      // Create snippet (first 200 characters)
      const snippet = description || mainContent.substring(0, 200).trim() + '...';

      // Extract links
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(link => ({
          text: link.textContent?.trim() || '',
          url: this.resolveUrl(link.getAttribute('href'), url)
        }))
        .filter(link => link.url && link.text)
        .slice(0, 20); // Limit to 20 links

      // Extract images
      const images = Array.from(document.querySelectorAll('img[src]'))
        .map(img => ({
          alt: img.getAttribute('alt') || '',
          url: this.resolveUrl(img.getAttribute('src'), url)
        }))
        .filter(img => img.url)
        .slice(0, 10); // Limit to 10 images

      return {
        type: 'html',
        title,
        content: mainContent,
        snippet,
        description,
        keywords,
        author,
        links,
        images,
        wordCount: mainContent.split(/\s+/).length,
        language: document.documentElement.getAttribute('lang') || 'fr'
      };

    } catch (error) {
      console.error('[Fetch MCP] Error extracting HTML content:', error);
      return {
        type: 'html',
        title: '',
        content: html.substring(0, 5000), // Fallback to raw HTML (limited)
        snippet: 'Erreur lors de l\'extraction du contenu HTML',
        error: error.message
      };
    }
  }

  /**
   * Extract clean text from DOM element
   * @param {Element} element - The DOM element
   * @returns {string} - Clean text content
   */
  extractTextFromElement(element) {
    if (!element) return '';

    // Remove unwanted elements
    const unwantedSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.navigation', '.nav', '.menu',
      '.sidebar', '.advertisement', '.ads',
      '.cookie-notice', '.popup', '.modal'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    return element.textContent || '';
  }

  /**
   * Clean and normalize text content
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim()
      .substring(0, 8000); // Limit to 8000 characters
  }

  /**
   * Resolve relative URLs to absolute URLs
   * @param {string} href - The href attribute
   * @param {string} baseUrl - The base URL
   * @returns {string} - Absolute URL
   */
  resolveUrl(href, baseUrl) {
    try {
      return new URL(href, baseUrl).href;
    } catch (error) {
      return href; // Return as-is if resolution fails
    }
  }

  /**
   * Search the web by fetching multiple URLs
   * @param {string} query - Search query (will be used to construct search URLs)
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of fetched results
   */
  async searchWeb(query, options = {}) {
    const { maxResults = 5, searchEngines = ['duckduckgo'] } = options;
    
    console.log(`[Fetch MCP] Searching web for: ${query}`);
    
    const results = [];
    
    // For now, we implement a simple approach
    // In a real implementation, you might want to use search APIs or scrape search results
    try {
      // DuckDuckGo instant answer API (limited but free)
      if (searchEngines.includes('duckduckgo')) {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const ddgResult = await this.fetchUrl(ddgUrl);
        
        if (ddgResult.success && ddgResult.content) {
          try {
            const data = JSON.parse(ddgResult.content);
            if (data.AbstractText) {
              results.push({
                title: data.Heading || query,
                url: data.AbstractURL || '',
                snippet: data.AbstractText,
                source: 'DuckDuckGo Instant Answer'
              });
            }
          } catch (e) {
            console.error('[Fetch MCP] Error parsing DuckDuckGo response:', e);
          }
        }
      }
      
      return results.slice(0, maxResults);
      
    } catch (error) {
      console.error('[Fetch MCP] Error in web search:', error);
      return [{
        title: 'Erreur de recherche',
        url: '',
        snippet: `Erreur lors de la recherche web: ${error.message}`,
        source: 'Fetch MCP Error'
      }];
    }
  }
}

// Export functions for use in MCP tools
export async function fetchWebContent(args) {
  const fetchMcp = new FetchMCP();
  const { url, options = {} } = args;
  
  if (!url) {
    throw new Error('URL parameter is required');
  }
  
  const result = await fetchMcp.fetchUrl(url, options);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: result.success,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          content: result.content.substring(0, 4000), // Limit for MCP response
          links: result.links?.slice(0, 5), // Limit links
          metadata: result.metadata
        }, null, 2)
      }
    ],
    isError: !result.success
  };
}

export async function searchWebWithFetch(args) {
  const fetchMcp = new FetchMCP();
  const { query, maxResults = 5, searchEngines = ['duckduckgo'] } = args;
  
  if (!query) {
    throw new Error('Query parameter is required');
  }
  
  const results = await fetchMcp.searchWeb(query, { maxResults, searchEngines });
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          query,
          results: results.map((result, index) => ({
            position: index + 1,
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            source: result.source
          }))
        }, null, 2)
      }
    ]
  };
}
