/**
 * Système d'actions autonomes pour l'IA de trading
 * Permet à l'IA de décider et exécuter des actions (recherche, analyse, etc.)
 */

import { tradingSearchService } from './tradingSearchService';
import { finnhubService } from './finnhubService';
import { alphaVantageService } from './alphaVantageService';
import { tradingViewSearchService } from './tradingViewSearchService';
import { symbolCache } from './symbolCacheService';

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  actionType: string;
}

export class TradingAgentActions {
  /**
   * Rechercher des actualités en temps réel sur un actif
   */
  async searchNews(symbol: string, assetName?: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🔍 Recherche d'actualités pour ${symbol}`);
      
      const news = await tradingSearchService.searchAssetNews(symbol, assetName);
      
      return {
        success: true,
        actionType: 'search_news',
        data: {
          count: news.length,
          news: news.slice(0, 5).map(n => ({
            title: n.title,
            source: n.source,
            date: n.date,
            snippet: n.snippet,
            link: n.link
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'search_news',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Rechercher des analyses d'experts
   */
  async searchAnalysis(symbol: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 📊 Recherche d'analyses pour ${symbol}`);
      
      const analysis = await tradingSearchService.searchAssetAnalysis(symbol);
      
      return {
        success: true,
        actionType: 'search_analysis',
        data: {
          count: analysis.length,
          analysis: analysis.map(a => ({
            title: a.title,
            source: a.source,
            snippet: a.snippet,
            link: a.link
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'search_analysis',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Rechercher des tendances de marché générales
   */
  async searchMarketTrends(query: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 📈 Recherche de tendances: ${query}`);
      
      const trends = await tradingSearchService.searchMarketTrends(query);
      
      return {
        success: true,
        actionType: 'search_trends',
        data: {
          count: trends.length,
          trends: trends.map(t => ({
            title: t.title,
            source: t.source,
            snippet: t.snippet
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'search_trends',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Rechercher un symbole boursier par nom de société
   */
  async searchSymbol(companyName: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🔎 Recherche de symbole pour: ${companyName}`);
      
      const results = await tradingSearchService.searchSymbol(companyName);
      
      return {
        success: true,
        actionType: 'search_symbol',
        data: {
          count: results.length,
          symbols: results
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'search_symbol',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir des données de marché en temps réel
   */
  async getMarketData(symbol: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 💹 Obtention des données de marché pour ${symbol}`);
      
      const quote = await finnhubService.getQuote(symbol);
      
      if (!quote) {
        throw new Error('Données non disponibles');
      }
      
      return {
        success: true,
        actionType: 'get_market_data',
        data: {
          symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          high: quote.h,
          low: quote.l,
          open: quote.o,
          previousClose: quote.pc
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'get_market_data',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Calculer des indicateurs techniques supplémentaires
   */
  async getTechnicalIndicators(symbol: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 📉 Calcul des indicateurs techniques pour ${symbol}`);
      
      const rsi = await alphaVantageService.getRSI(symbol);
      
      return {
        success: true,
        actionType: 'get_technical_indicators',
        data: {
          symbol,
          rsi: rsi ? rsi.toFixed(2) : 'N/A',
          note: 'Autres indicateurs disponibles via appels API supplémentaires'
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'get_technical_indicators',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Sélectionner un actif à trader (permet à l'IA de changer d'actif)
   */
  async selectAsset(symbol: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🎯 Sélection de l'actif: ${symbol}`);
      
      const availableAssets = [
        // ETF et actions
        'GLD', 'USO', 'SLV', 'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN',
        // Cryptos
        'BITCOIN', 'BTC', 'ETHEREUM', 'ETH', 'DOGECOIN', 'DOGE',
        'LITECOIN', 'LTC', 'RIPPLE', 'XRP', 'SOLANA', 'SOL',
        'CARDANO', 'ADA'
      ];
      
      // Vérifier avec normalisation
      const normalizedSymbol = symbol.toUpperCase();
      if (!availableAssets.includes(normalizedSymbol) && !availableAssets.includes(symbol)) {
        return {
          success: false,
          actionType: 'select_asset',
          error: `Symbole ${symbol} non disponible. Actifs disponibles: ${availableAssets.join(', ')}`
        };
      }

      return {
        success: true,
        actionType: 'select_asset',
        data: {
          symbol: normalizedSymbol,
          message: `Actif ${normalizedSymbol} sélectionné pour le trading`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'select_asset',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  /**
   * Rechercher des symboles TradingView disponibles
   * L'IA peut découvrir quels symboles existent vraiment
   */
  async searchTradingViewSymbol(query: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🔍 Recherche de symbole TradingView: ${query}`);
      
      const result = await tradingViewSearchService.searchSymbol(query);
      
      if (!result.found) {
        return {
          success: false,
          actionType: 'search_tradingview_symbol',
          error: `Aucun symbole trouvé pour: ${query}`
        };
      }

      return {
        success: true,
        actionType: 'search_tradingview_symbol',
        data: {
          query,
          symbolsFound: result.symbols.length,
          symbols: result.symbols.map(s => ({
            symbol: s.symbol,
            description: s.description,
            type: s.type,
            exchange: s.exchange
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'search_tradingview_symbol',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Trouver le meilleur symbole TradingView pour un actif
   */
  async findBestTradingViewSymbol(assetName: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🎯 Recherche du meilleur symbole pour: ${assetName}`);
      
      const symbol = await tradingViewSearchService.findBestSymbol(assetName);
      
      if (!symbol) {
        return {
          success: false,
          actionType: 'find_best_tradingview_symbol',
          error: `Aucun symbole approprié trouvé pour: ${assetName}`
        };
      }

      // Ajouter au cache pour utilisation future
      symbolCache.add(assetName, symbol.symbol, symbol.description);

      return {
        success: true,
        actionType: 'find_best_tradingview_symbol',
        data: {
          assetName,
          bestSymbol: symbol.symbol,
          description: symbol.description,
          type: symbol.type,
          exchange: symbol.exchange,
          cached: true // Indique que le symbole a été mis en cache
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'find_best_tradingview_symbol',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Ajouter un symbole au cache (pour que le widget puisse l'utiliser)
   */
  async addSymbolToCache(localSymbol: string, tradingViewSymbol: string, description?: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 💾 Ajout au cache: ${localSymbol} → ${tradingViewSymbol}`);
      
      symbolCache.add(localSymbol, tradingViewSymbol, description || '');

      return {
        success: true,
        actionType: 'add_symbol_to_cache',
        data: {
          localSymbol,
          tradingViewSymbol,
          message: `Symbole ${localSymbol} ajouté au cache et sera utilisé par le widget`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'add_symbol_to_cache',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir le cache des symboles
   */
  async getSymbolCache(): Promise<ActionResult> {
    try {
      const stats = symbolCache.stats();
      const allSymbols = symbolCache.getAll();

      return {
        success: true,
        actionType: 'get_symbol_cache',
        data: {
          cacheSize: stats.size,
          symbols: allSymbols,
          availableSymbols: stats.symbols
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'get_symbol_cache',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * ACTIONS DE CONTRÔLE DU GRAPHIQUE
   * Permettent à l'IA de manipuler directement le graphique TradingView
   */

  /**
   * Changer le symbole affiché sur le graphique
   */
  async changeChartSymbol(symbol: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 📊 Changement du symbole du graphique: ${symbol}`);
      
      // Cette action sera exécutée côté client via un event
      return {
        success: true,
        actionType: 'change_chart_symbol',
        data: {
          symbol,
          message: `Graphique changé vers ${symbol}`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'change_chart_symbol',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Changer l'intervalle de temps du graphique
   */
  async changeChartInterval(interval: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] ⏱️ Changement d'intervalle: ${interval}`);
      
      return {
        success: true,
        actionType: 'change_chart_interval',
        data: {
          interval,
          message: `Intervalle changé à ${interval}`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'change_chart_interval',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Ajouter un indicateur technique au graphique
   */
  async addChartIndicator(indicator: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 📈 Ajout d'indicateur: ${indicator}`);
      
      const validIndicators = ['rsi', 'macd', 'sma', 'ema', 'bollinger', 'stochastic', 'volume'];
      
      if (!validIndicators.includes(indicator.toLowerCase())) {
        return {
          success: false,
          actionType: 'add_chart_indicator',
          error: `Indicateur ${indicator} non supporté. Disponibles: ${validIndicators.join(', ')}`
        };
      }

      return {
        success: true,
        actionType: 'add_chart_indicator',
        data: {
          indicator,
          message: `Indicateur ${indicator} ajouté au graphique`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'add_chart_indicator',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Changer le type de graphique
   */
  async changeChartType(type: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🎨 Changement de type de graphique: ${type}`);
      
      const validTypes = ['candles', 'line', 'area', 'bars'];
      
      if (!validTypes.includes(type.toLowerCase())) {
        return {
          success: false,
          actionType: 'change_chart_type',
          error: `Type ${type} non supporté. Disponibles: ${validTypes.join(', ')}`
        };
      }

      return {
        success: true,
        actionType: 'change_chart_type',
        data: {
          type,
          message: `Type de graphique changé à ${type}`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'change_chart_type',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Ajouter une alerte de prix
   */
  async addPriceAlert(price: number, message: string): Promise<ActionResult> {
    try {
      console.log(`[TradingAgent] 🔔 Ajout d'alerte à ${price}`);
      
      return {
        success: true,
        actionType: 'add_price_alert',
        data: {
          price,
          message,
          alertMessage: `Alerte ajoutée à ${price}: ${message}`
        }
      };
    } catch (error) {
      return {
        success: false,
        actionType: 'add_price_alert',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Exécuter une action en fonction du type
   */
  async executeAction(actionType: string, params: Record<string, unknown>): Promise<ActionResult> {
    switch (actionType) {
      case 'search_news':
        return this.searchNews(params.symbol as string, params.assetName as string | undefined);
      
      case 'search_analysis':
        return this.searchAnalysis(params.symbol as string);
      
      case 'search_trends':
        return this.searchMarketTrends(params.query as string);
      
      case 'search_symbol':
        return this.searchSymbol(params.companyName as string);
      
      case 'get_market_data':
        return this.getMarketData(params.symbol as string);
      
      case 'get_technical_indicators':
        return this.getTechnicalIndicators(params.symbol as string);
      
      case 'select_asset':
        return this.selectAsset(params.symbol as string);
      
      case 'search_tradingview_symbol':
        return this.searchTradingViewSymbol(params.query as string);
      
      case 'find_best_tradingview_symbol':
        return this.findBestTradingViewSymbol(params.assetName as string);
      
      case 'add_symbol_to_cache':
        return this.addSymbolToCache(
          params.localSymbol as string,
          params.tradingViewSymbol as string,
          params.description as string | undefined
        );
      
      case 'get_symbol_cache':
        return this.getSymbolCache();
      
      // Actions de contrôle du graphique
      case 'change_chart_symbol':
        return this.changeChartSymbol(params.symbol as string);
      
      case 'change_chart_interval':
        return this.changeChartInterval(params.interval as string);
      
      case 'add_chart_indicator':
        return this.addChartIndicator(params.indicator as string);
      
      case 'change_chart_type':
        return this.changeChartType(params.type as string);
      
      case 'add_price_alert':
        return this.addPriceAlert(params.price as number, params.message as string);
      
      default:
        return {
          success: false,
          actionType: 'unknown',
          error: `Action non reconnue: ${actionType}`
        };
    }
  }
}

export const tradingAgent = new TradingAgentActions();
