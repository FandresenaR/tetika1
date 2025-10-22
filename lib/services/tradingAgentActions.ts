/**
 * Système d'actions autonomes pour l'IA de trading
 * Permet à l'IA de décider et exécuter des actions (recherche, analyse, etc.)
 */

import { tradingSearchService } from './tradingSearchService';
import { finnhubService } from './finnhubService';
import { alphaVantageService } from './alphaVantageService';
import { advancedTA } from './advancedTechnicalAnalysis';

export interface ActionResult {
  success: boolean;
  data?: any;
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
   * Exécuter une action en fonction du type
   */
  async executeAction(actionType: string, params: any): Promise<ActionResult> {
    switch (actionType) {
      case 'search_news':
        return this.searchNews(params.symbol, params.assetName);
      
      case 'search_analysis':
        return this.searchAnalysis(params.symbol);
      
      case 'search_trends':
        return this.searchMarketTrends(params.query);
      
      case 'search_symbol':
        return this.searchSymbol(params.companyName);
      
      case 'get_market_data':
        return this.getMarketData(params.symbol);
      
      case 'get_technical_indicators':
        return this.getTechnicalIndicators(params.symbol);
      
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
