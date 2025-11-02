/**
 * Cache global des symboles TradingView découverts
 * Permet de partager les symboles trouvés entre l'IA et le widget
 */

interface CachedSymbol {
  localSymbol: string;      // Ex: "BTC"
  tradingViewSymbol: string; // Ex: "BINANCE:BTCUSDT"
  description: string;
  timestamp: number;
}

class SymbolCacheService {
  private cache: Map<string, CachedSymbol> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * Ajouter un symbole au cache
   */
  add(localSymbol: string, tradingViewSymbol: string, description: string) {
    this.cache.set(localSymbol.toUpperCase(), {
      localSymbol: localSymbol.toUpperCase(),
      tradingViewSymbol,
      description,
      timestamp: Date.now()
    });
    
    console.log(`[SymbolCache] ✅ Ajouté: ${localSymbol} → ${tradingViewSymbol}`);
  }

  /**
   * Récupérer un symbole du cache
   */
  get(localSymbol: string): string | null {
    const cached = this.cache.get(localSymbol.toUpperCase());
    
    if (!cached) return null;

    // Vérifier si le cache est expiré
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(localSymbol.toUpperCase());
      return null;
    }

    return cached.tradingViewSymbol;
  }

  /**
   * Récupérer tous les symboles du cache
   */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    
    this.cache.forEach((value, key) => {
      // Nettoyer les entrées expirées
      if (Date.now() - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      } else {
        result[key] = value.tradingViewSymbol;
      }
    });

    return result;
  }

  /**
   * Vérifier si un symbole est dans le cache
   */
  has(localSymbol: string): boolean {
    return this.get(localSymbol) !== null;
  }

  /**
   * Nettoyer le cache
   */
  clear() {
    this.cache.clear();
    console.log('[SymbolCache] 🗑️ Cache nettoyé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  stats() {
    return {
      size: this.cache.size,
      symbols: Array.from(this.cache.keys())
    };
  }

  /**
   * Pré-charger les symboles statiques connus
   */
  preload() {
    const staticSymbols: Record<string, { tv: string; desc: string }> = {
      // ETF et actions
      'GLD': { tv: 'ARCA:GLD', desc: 'SPDR Gold Trust' },
      'USO': { tv: 'NYMEX:CL1!', desc: 'WTI Crude Oil Futures' },
      'SLV': { tv: 'ARCA:SLV', desc: 'iShares Silver Trust' },
      'AAPL': { tv: 'NASDAQ:AAPL', desc: 'Apple Inc.' },
      'MSFT': { tv: 'NASDAQ:MSFT', desc: 'Microsoft Corp.' },
      'TSLA': { tv: 'NASDAQ:TSLA', desc: 'Tesla Inc.' },
      'GOOGL': { tv: 'NASDAQ:GOOGL', desc: 'Alphabet Inc.' },
      'AMZN': { tv: 'NASDAQ:AMZN', desc: 'Amazon.com Inc.' },
      
      // Cryptomonnaies
      'BITCOIN': { tv: 'BINANCE:BTCUSDT', desc: 'Bitcoin / TetherUS' },
      'BTC': { tv: 'BINANCE:BTCUSDT', desc: 'Bitcoin / TetherUS' },
      'ETHEREUM': { tv: 'BINANCE:ETHUSDT', desc: 'Ethereum / TetherUS' },
      'ETH': { tv: 'BINANCE:ETHUSDT', desc: 'Ethereum / TetherUS' },
      'DOGECOIN': { tv: 'BINANCE:DOGEUSDT', desc: 'Dogecoin / TetherUS' },
      'DOGE': { tv: 'BINANCE:DOGEUSDT', desc: 'Dogecoin / TetherUS' },
      'LITECOIN': { tv: 'BINANCE:LTCUSDT', desc: 'Litecoin / TetherUS' },
      'LTC': { tv: 'BINANCE:LTCUSDT', desc: 'Litecoin / TetherUS' },
      'RIPPLE': { tv: 'BINANCE:XRPUSDT', desc: 'Ripple / TetherUS' },
      'XRP': { tv: 'BINANCE:XRPUSDT', desc: 'Ripple / TetherUS' },
      'SOLANA': { tv: 'BINANCE:SOLUSDT', desc: 'Solana / TetherUS' },
      'SOL': { tv: 'BINANCE:SOLUSDT', desc: 'Solana / TetherUS' },
      'CARDANO': { tv: 'BINANCE:ADAUSDT', desc: 'Cardano / TetherUS' },
      'ADA': { tv: 'BINANCE:ADAUSDT', desc: 'Cardano / TetherUS' },
    };

    Object.entries(staticSymbols).forEach(([local, data]) => {
      this.add(local, data.tv, data.desc);
    });

    console.log(`[SymbolCache] 📦 Pré-chargé ${Object.keys(staticSymbols).length} symboles`);
  }
}

// Instance singleton
export const symbolCache = new SymbolCacheService();

// Pré-charger au démarrage
if (typeof window === 'undefined') {
  symbolCache.preload();
}
