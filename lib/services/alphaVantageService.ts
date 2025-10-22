/**
 * Alpha Vantage Service - Indicateurs techniques et données historiques
 * API gratuite: 5 calls/minute, 500 calls/jour
 * Documentation: https://www.alphavantage.co/documentation/
 */

export interface AlphaVantageRSI {
  'Meta Data': {
    Symbol: string;
    Indicator: string;
    'Last Refreshed': string;
    Interval: string;
    'Time Period': number;
    'Series Type': string;
  };
  'Technical Analysis: RSI': {
    [date: string]: {
      RSI: string;
    };
  };
}

export interface AlphaVantageMACD {
  'Meta Data': {
    Symbol: string;
    Indicator: string;
  };
  'Technical Analysis: MACD': {
    [date: string]: {
      MACD: string;
      MACD_Signal: string;
      MACD_Hist: string;
    };
  };
}

export interface AlphaVantageSMA {
  'Meta Data': {
    Symbol: string;
    Indicator: string;
  };
  'Technical Analysis: SMA': {
    [date: string]: {
      SMA: string;
    };
  };
}

class AlphaVantageService {
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  
  // Vous devrez obtenir votre clé gratuite sur https://www.alphavantage.co/support/#api-key
  private getApiKey(): string {
    // Côté serveur, utiliser les variables d'environnement en priorité
    if (typeof window === 'undefined') {
      const serverKey = process.env.ALPHAVANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY;
      if (serverKey) {
        console.log('[AlphaVantage] Utilisation de la clé du serveur');
        return serverKey;
      }
    }
    
    // Côté client, essayer localStorage puis env
    if (typeof window !== 'undefined') {
      const clientKey = localStorage.getItem('tetika-alphavantage-key') || process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY;
      if (clientKey) {
        console.log('[AlphaVantage] Utilisation de la clé du client');
        return clientKey;
      }
    }
    
    console.warn('[AlphaVantage] Aucune clé API trouvée');
    return '';
  }

  /**
   * Récupère l'indicateur RSI (Relative Strength Index)
   * @param symbol Symbole de l'actif
   * @param interval Intervalle (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
   * @param timePeriod Période de calcul (défaut: 14)
   */
  async getRSI(
    symbol: string,
    interval: string = 'daily',
    timePeriod: number = 14
  ): Promise<number | null> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[AlphaVantage] Clé API manquante');
        return null;
      }

      const convertedSymbol = this.convertSymbol(symbol);
      const response = await fetch(
        `${this.baseUrl}?function=RSI&symbol=${convertedSymbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data: AlphaVantageRSI = await response.json();
      
      // Récupérer la valeur RSI la plus récente
      const technicalAnalysis = data['Technical Analysis: RSI'];
      if (technicalAnalysis) {
        const dates = Object.keys(technicalAnalysis);
        if (dates.length > 0) {
          const latestDate = dates[0];
          return parseFloat(technicalAnalysis[latestDate].RSI);
        }
      }

      return null;
    } catch (error) {
      console.error('[AlphaVantage] Erreur lors de la récupération du RSI:', error);
      return null;
    }
  }

  /**
   * Récupère l'indicateur MACD (Moving Average Convergence Divergence)
   * @param symbol Symbole de l'actif
   * @param interval Intervalle
   */
  async getMACD(
    symbol: string,
    interval: string = 'daily'
  ): Promise<{ macd: number; signal: number; histogram: number } | null> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[AlphaVantage] Clé API manquante');
        return null;
      }

      const convertedSymbol = this.convertSymbol(symbol);
      const response = await fetch(
        `${this.baseUrl}?function=MACD&symbol=${convertedSymbol}&interval=${interval}&series_type=close&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data: AlphaVantageMACD = await response.json();
      
      // Récupérer les valeurs MACD les plus récentes
      const technicalAnalysis = data['Technical Analysis: MACD'];
      if (technicalAnalysis) {
        const dates = Object.keys(technicalAnalysis);
        if (dates.length > 0) {
          const latestDate = dates[0];
          const latest = technicalAnalysis[latestDate];
          return {
            macd: parseFloat(latest.MACD),
            signal: parseFloat(latest.MACD_Signal),
            histogram: parseFloat(latest.MACD_Hist)
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[AlphaVantage] Erreur lors de la récupération du MACD:', error);
      return null;
    }
  }

  /**
   * Récupère la moyenne mobile simple (SMA)
   * @param symbol Symbole de l'actif
   * @param interval Intervalle
   * @param timePeriod Période (défaut: 50)
   */
  async getSMA(
    symbol: string,
    interval: string = 'daily',
    timePeriod: number = 50
  ): Promise<number | null> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.warn('[AlphaVantage] Clé API manquante');
        return null;
      }

      const convertedSymbol = this.convertSymbol(symbol);
      const response = await fetch(
        `${this.baseUrl}?function=SMA&symbol=${convertedSymbol}&interval=${interval}&time_period=${timePeriod}&series_type=close&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data: AlphaVantageSMA = await response.json();
      
      // Récupérer la valeur SMA la plus récente
      const technicalAnalysis = data['Technical Analysis: SMA'];
      if (technicalAnalysis) {
        const dates = Object.keys(technicalAnalysis);
        if (dates.length > 0) {
          const latestDate = dates[0];
          return parseFloat(technicalAnalysis[latestDate].SMA);
        }
      }

      return null;
    } catch (error) {
      console.error('[AlphaVantage] Erreur lors de la récupération du SMA:', error);
      return null;
    }
  }

  /**
   * Récupère tous les indicateurs techniques pour un symbole
   */
  async getAllIndicators(symbol: string): Promise<{
    rsi: number | null;
    macd: { macd: number; signal: number; histogram: number } | null;
    sma50: number | null;
    sma200: number | null;
  }> {
    // Note: Avec la limite de 5 calls/minute, on doit espacer les appels
    const rsi = await this.getRSI(symbol);
    await this.delay(15000); // Attendre 15s entre chaque appel
    
    const macd = await this.getMACD(symbol);
    await this.delay(15000);
    
    const sma50 = await this.getSMA(symbol, 'daily', 50);
    await this.delay(15000);
    
    const sma200 = await this.getSMA(symbol, 'daily', 200);

    return { rsi, macd, sma50, sma200 };
  }

  /**
   * Convertit un symbole trading vers le format Alpha Vantage
   */
  private convertSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'XAUUSD': 'XAUUSD', // Or - Alpha Vantage supporte directement
      'XTIUSD': 'WTI', // Pétrole WTI
      'EURUSD': 'EURUSD', // EUR/USD - Format Forex
      'GBPUSD': 'GBPUSD',
      'USDJPY': 'USDJPY',
    };

    return symbolMap[symbol] || symbol;
  }

  /**
   * Délai pour respecter les limites de l'API
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const alphaVantageService = new AlphaVantageService();
