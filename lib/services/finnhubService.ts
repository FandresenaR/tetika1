/**
 * Finnhub Service - Données de marché, actualités et sentiment
 * API gratuite: 60 calls/minute
 * Documentation: https://finnhub.io/docs/api
 */

export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubSentiment {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
}

class FinnhubService {
  private readonly baseUrl = 'https://finnhub.io/api/v1';
  
  // Vous devrez obtenir votre clé gratuite sur https://finnhub.io
  private getApiKey(): string {
    // Côté serveur, utiliser les variables d'environnement en priorité
    if (typeof window === 'undefined') {
      const serverKey = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_KEY;
      if (serverKey) {
        console.log('[Finnhub] Clé API trouvée (longueur:', serverKey.length, ')');
        return serverKey;
      }
    }
    
    // Côté client, essayer localStorage puis env
    if (typeof window !== 'undefined') {
      const clientKey = localStorage.getItem('tetika-finnhub-key') || process.env.NEXT_PUBLIC_FINNHUB_KEY;
      if (clientKey) {
        console.log('[Finnhub] Utilisation de la clé du client');
        return clientKey;
      }
    }
    
    console.warn('[Finnhub] ⚠️ AUCUNE CLÉ API FINNHUB - Obtenez-en une sur https://finnhub.io/register');
    return '';
  }

  /**
   * Récupère les données de marché en temps réel
   * @param symbol Symbole de l'actif (ex: AAPL, GLD, USO)
   */
  async getQuote(symbol: string): Promise<FinnhubQuote | null> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[Finnhub] Clé API manquante');
        return null;
      }

      // Utiliser directement le symbole US (ex: GLD, USO, AAPL)
      const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${apiKey}`;
      console.log('[Finnhub] Requête quote URL:', url.replace(apiKey, 'KEY_HIDDEN'));
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Finnhub] Erreur détaillée:', errorText);
        throw new Error(`Finnhub API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Finnhub] Erreur lors de la récupération du quote:', error);
      return null;
    }
  }

  /**
   * Récupère les actualités financières
   * @param symbol Symbole de l'actif
   * @param from Date de début (YYYY-MM-DD)
   * @param to Date de fin (YYYY-MM-DD)
   */
  async getCompanyNews(symbol: string, from?: string, to?: string): Promise<FinnhubNews[]> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[Finnhub] Clé API manquante');
        return [];
      }

      // Dates par défaut: 7 derniers jours
      const toDate = to || new Date().toISOString().split('T')[0];
      const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `${this.baseUrl}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('[Finnhub] Erreur lors de la récupération des news:', error);
      return [];
    }
  }

  /**
   * Récupère les actualités générales du marché
   * @param category Catégorie (general, forex, crypto, merger)
   */
  async getMarketNews(category: string = 'forex'): Promise<FinnhubNews[]> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[Finnhub] Clé API manquante');
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/news?category=${category}&token=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('[Finnhub] Erreur lors de la récupération des news de marché:', error);
      return [];
    }
  }

  /**
   * Récupère le sentiment des actualités pour un symbole
   * @param symbol Symbole de l'actif
   */
  async getNewsSentiment(symbol: string): Promise<FinnhubSentiment | null> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[Finnhub] Clé API manquante');
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/news-sentiment?symbol=${symbol}&token=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Finnhub] Erreur lors de la récupération du sentiment:', error);
      return null;
    }
  }

  /**
   * Convertit un symbole trading vers le format Finnhub
   */
  convertSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'XAUUSD': 'OANDA:XAU_USD', // Or
      'XTIUSD': 'OANDA:XTI_USD', // Pétrole WTI
      'EURUSD': 'OANDA:EUR_USD', // EUR/USD
      'GBPUSD': 'OANDA:GBP_USD',
      'USDJPY': 'OANDA:USD_JPY',
    };

    return symbolMap[symbol] || symbol;
  }
}

export const finnhubService = new FinnhubService();
