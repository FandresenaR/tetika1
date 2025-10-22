/**
 * Service de recherche web spécialisé pour le trading
 * Utilise SerpAPI pour obtenir des actualités et analyses en temps réel
 */

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date?: string;
}

interface NewsSearchResult {
  position: number;
  title: string;
  link: string;
  source: string;
  date: string;
  snippet: string;
  thumbnail?: string;
}

export class TradingSearchService {
  private serpApiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor() {
    this.serpApiKey = process.env.SERPAPI_API_KEY || process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '';
  }

  /**
   * Recherche d'actualités financières sur un actif
   */
  async searchAssetNews(symbol: string, assetName?: string): Promise<NewsSearchResult[]> {
    if (!this.serpApiKey) {
      console.warn('[TradingSearch] Clé SerpAPI manquante');
      return [];
    }

    try {
      const query = assetName 
        ? `${assetName} ${symbol} stock news today`
        : `${symbol} stock market news`;

      const url = new URL(this.baseUrl);
      url.searchParams.append('q', query);
      url.searchParams.append('api_key', this.serpApiKey);
      url.searchParams.append('engine', 'google');
      url.searchParams.append('tbm', 'nws'); // News search
      url.searchParams.append('num', '10');
      url.searchParams.append('hl', 'fr');
      url.searchParams.append('gl', 'fr');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.news_results || []).map((item: any, index: number) => ({
        position: index + 1,
        title: item.title || '',
        link: item.link || '',
        source: item.source || '',
        date: item.date || '',
        snippet: item.snippet || '',
        thumbnail: item.thumbnail
      }));
    } catch (error) {
      console.error('[TradingSearch] Erreur recherche news:', error);
      return [];
    }
  }

  /**
   * Recherche d'analyses et prévisions sur un actif
   */
  async searchAssetAnalysis(symbol: string): Promise<SearchResult[]> {
    if (!this.serpApiKey) {
      console.warn('[TradingSearch] Clé SerpAPI manquante');
      return [];
    }

    try {
      const query = `${symbol} stock analysis prediction forecast`;

      const url = new URL(this.baseUrl);
      url.searchParams.append('q', query);
      url.searchParams.append('api_key', this.serpApiKey);
      url.searchParams.append('engine', 'google');
      url.searchParams.append('num', '5');
      url.searchParams.append('hl', 'en');
      url.searchParams.append('gl', 'us');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.organic_results || []).map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        source: item.source || item.displayed_link || '',
        date: item.date
      }));
    } catch (error) {
      console.error('[TradingSearch] Erreur recherche analyse:', error);
      return [];
    }
  }

  /**
   * Recherche générale sur le marché
   */
  async searchMarketTrends(query: string): Promise<SearchResult[]> {
    if (!this.serpApiKey) {
      console.warn('[TradingSearch] Clé SerpAPI manquante');
      return [];
    }

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('q', `${query} stock market`);
      url.searchParams.append('api_key', this.serpApiKey);
      url.searchParams.append('engine', 'google');
      url.searchParams.append('num', '5');
      url.searchParams.append('hl', 'fr');
      url.searchParams.append('gl', 'fr');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.organic_results || []).map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        source: item.source || item.displayed_link || '',
        date: item.date
      }));
    } catch (error) {
      console.error('[TradingSearch] Erreur recherche marché:', error);
      return [];
    }
  }

  /**
   * Recherche de symboles boursiers
   */
  async searchSymbol(companyName: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    // Utiliser Finnhub pour la recherche de symboles
    const finnhubKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_KEY;
    
    if (!finnhubKey) {
      console.warn('[TradingSearch] Clé Finnhub manquante pour recherche de symboles');
      return [];
    }

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(companyName)}&token=${finnhubKey}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub search error: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.result || []).slice(0, 10).map((item: any) => ({
        symbol: item.symbol || '',
        name: item.description || '',
        type: item.type || 'Common Stock'
      }));
    } catch (error) {
      console.error('[TradingSearch] Erreur recherche symbole:', error);
      return [];
    }
  }
}

export const tradingSearchService = new TradingSearchService();
