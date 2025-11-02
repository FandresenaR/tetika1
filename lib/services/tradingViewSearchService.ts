/**
 * Service de recherche de symboles TradingView
 * Permet de trouver les symboles exacts disponibles sur TradingView
 */

export interface TradingViewSymbol {
  symbol: string;          // Ex: "ARCA:GLD"
  description: string;     // Ex: "SPDR Gold Trust"
  type: string;           // Ex: "fund", "stock", "futures"
  exchange: string;       // Ex: "ARCA", "NASDAQ"
  ticker: string;         // Ex: "GLD"
  provider_id?: string;
}

export interface SymbolSearchResult {
  symbols: TradingViewSymbol[];
  query: string;
  found: boolean;
}

class TradingViewSearchService {
  private baseUrl = 'https://symbol-search.tradingview.com';

  // Mapping statique de secours pour les symboles populaires
  private readonly FALLBACK_SYMBOLS: Record<string, TradingViewSymbol> = {
    'BITCOIN': {
      symbol: 'BINANCE:BTCUSDT',
      description: 'Bitcoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'BTCUSDT'
    },
    'BTC': {
      symbol: 'BINANCE:BTCUSDT',
      description: 'Bitcoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'BTCUSDT'
    },
    'ETHEREUM': {
      symbol: 'BINANCE:ETHUSDT',
      description: 'Ethereum / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'ETHUSDT'
    },
    'ETH': {
      symbol: 'BINANCE:ETHUSDT',
      description: 'Ethereum / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'ETHUSDT'
    },
    'DOGECOIN': {
      symbol: 'BINANCE:DOGEUSDT',
      description: 'Dogecoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'DOGEUSDT'
    },
    'DOGE': {
      symbol: 'BINANCE:DOGEUSDT',
      description: 'Dogecoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'DOGEUSDT'
    },
    'LITECOIN': {
      symbol: 'BINANCE:LTCUSDT',
      description: 'Litecoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'LTCUSDT'
    },
    'LTC': {
      symbol: 'BINANCE:LTCUSDT',
      description: 'Litecoin / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'LTCUSDT'
    },
    'RIPPLE': {
      symbol: 'BINANCE:XRPUSDT',
      description: 'Ripple / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'XRPUSDT'
    },
    'XRP': {
      symbol: 'BINANCE:XRPUSDT',
      description: 'Ripple / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'XRPUSDT'
    },
    'SOLANA': {
      symbol: 'BINANCE:SOLUSDT',
      description: 'Solana / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'SOLUSDT'
    },
    'SOL': {
      symbol: 'BINANCE:SOLUSDT',
      description: 'Solana / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'SOLUSDT'
    },
    'CARDANO': {
      symbol: 'BINANCE:ADAUSDT',
      description: 'Cardano / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'ADAUSDT'
    },
    'ADA': {
      symbol: 'BINANCE:ADAUSDT',
      description: 'Cardano / TetherUS',
      type: 'crypto',
      exchange: 'BINANCE',
      ticker: 'ADAUSDT'
    }
  };

  /**
   * Rechercher des symboles sur TradingView
   */
  async searchSymbol(query: string, type?: string): Promise<SymbolSearchResult> {
    try {
      console.log(`[TradingView Search] 🔍 Recherche de: ${query}`);

      // Vérifier d'abord le fallback
      const fallback = this.FALLBACK_SYMBOLS[query.toUpperCase()];
      if (fallback) {
        console.log(`[TradingView Search] ✅ Trouvé dans le mapping de secours: ${fallback.symbol}`);
        return {
          symbols: [fallback],
          query,
          found: true
        };
      }

      // Construire l'URL de recherche
      const params = new URLSearchParams({
        text: query,
        exchange: '', // Tous les exchanges
        type: type || '', // stock, fund, futures, crypto, etc.
        limit: '10'
      });

      const url = `${this.baseUrl}/symbol_search/?${params}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[TradingView Search] Erreur API:', response.status);
        
        // Si erreur API, essayer de trouver dans le fallback avec recherche partielle
        const partialMatch = Object.keys(this.FALLBACK_SYMBOLS).find(key => 
          key.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(key.toLowerCase())
        );
        
        if (partialMatch) {
          console.log(`[TradingView Search] ⚠️ API échoué, utilisation du fallback: ${this.FALLBACK_SYMBOLS[partialMatch].symbol}`);
          return {
            symbols: [this.FALLBACK_SYMBOLS[partialMatch]],
            query,
            found: true
          };
        }
        
        return {
          symbols: [],
          query,
          found: false
        };
      }

      const data = await response.json();
      
      // Parser les résultats
      const symbols: TradingViewSymbol[] = (data.symbols || []).map((item: {
        symbol: string;
        description: string;
        type: string;
        exchange: string;
        provider_id?: string;
      }) => ({
        symbol: item.symbol,
        description: item.description,
        type: item.type,
        exchange: item.exchange,
        ticker: item.symbol.split(':')[1] || item.symbol,
        provider_id: item.provider_id
      }));

      console.log(`[TradingView Search] ✅ Trouvé ${symbols.length} symbole(s)`);

      return {
        symbols,
        query,
        found: symbols.length > 0
      };

    } catch (error) {
      console.error('[TradingView Search] Erreur:', error);
      
      // Dernier recours : fallback
      const fallback = this.FALLBACK_SYMBOLS[query.toUpperCase()];
      if (fallback) {
        console.log(`[TradingView Search] ⚠️ Erreur réseau, utilisation du fallback: ${fallback.symbol}`);
        return {
          symbols: [fallback],
          query,
          found: true
        };
      }
      
      return {
        symbols: [],
        query,
        found: false
      };
    }
  }

  /**
   * Trouver le meilleur symbole pour un actif
   * Priorise : ETF > Stock > Futures
   */
  async findBestSymbol(assetName: string): Promise<TradingViewSymbol | null> {
    try {
      const result = await this.searchSymbol(assetName);
      
      if (!result.found || result.symbols.length === 0) {
        return null;
      }

      // Priorité 1: ETF (fonds)
      const etf = result.symbols.find(s => 
        s.type === 'fund' && 
        (s.exchange === 'ARCA' || s.exchange === 'NASDAQ' || s.exchange === 'AMEX')
      );
      if (etf) return etf;

      // Priorité 2: Actions
      const stock = result.symbols.find(s => 
        s.type === 'stock' && 
        (s.exchange === 'NASDAQ' || s.exchange === 'NYSE')
      );
      if (stock) return stock;

      // Priorité 3: Futures
      const futures = result.symbols.find(s => 
        s.type === 'futures' && 
        s.exchange === 'NYMEX'
      );
      if (futures) return futures;

      // Par défaut: premier résultat
      return result.symbols[0];

    } catch (error) {
      console.error('[TradingView Search] Erreur findBestSymbol:', error);
      return null;
    }
  }

  /**
   * Rechercher plusieurs actifs et retourner les meilleurs symboles
   */
  async searchMultipleAssets(assets: string[]): Promise<Record<string, TradingViewSymbol | null>> {
    const results: Record<string, TradingViewSymbol | null> = {};

    await Promise.all(
      assets.map(async (asset) => {
        results[asset] = await this.findBestSymbol(asset);
      })
    );

    return results;
  }

  /**
   * Vérifier si un symbole existe
   */
  async verifySymbol(symbol: string): Promise<boolean> {
    try {
      const result = await this.searchSymbol(symbol);
      return result.found && result.symbols.some(s => 
        s.symbol.toLowerCase() === symbol.toLowerCase() ||
        s.ticker.toLowerCase() === symbol.toLowerCase()
      );
    } catch {
      return false;
    }
  }
}

export const tradingViewSearchService = new TradingViewSearchService();
