/**
 * Service d'analyse technique avancée
 * Détection de patterns, support/résistance, signaux de trading
 */

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TechnicalPattern {
  type: string;
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
}

export interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
}

export class AdvancedTechnicalAnalysis {
  /**
   * Détecte les patterns de chandeliers
   */
  detectCandlestickPatterns(data: PriceData[]): TechnicalPattern[] {
    const patterns: TechnicalPattern[] = [];
    
    if (data.length < 3) return patterns;

    const last3 = data.slice(-3);
    const [, prev1, current] = last3;

    // Doji
    if (Math.abs(current.close - current.open) < (current.high - current.low) * 0.1) {
      patterns.push({
        type: 'doji',
        name: 'Doji',
        signal: 'neutral',
        confidence: 0.7,
        description: 'Indécision du marché, possibilité de retournement'
      });
    }

    // Hammer (Marteau)
    const bodySize = Math.abs(current.close - current.open);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const upperWick = current.high - Math.max(current.open, current.close);

    if (lowerWick > bodySize * 2 && upperWick < bodySize) {
      patterns.push({
        type: 'hammer',
        name: 'Marteau (Hammer)',
        signal: 'bullish',
        confidence: 0.75,
        description: 'Signal haussier, possible retournement à la hausse'
      });
    }

    // Shooting Star (Étoile filante)
    if (upperWick > bodySize * 2 && lowerWick < bodySize) {
      patterns.push({
        type: 'shooting_star',
        name: 'Étoile filante (Shooting Star)',
        signal: 'bearish',
        confidence: 0.75,
        description: 'Signal baissier, possible retournement à la baisse'
      });
    }

    // Engulfing Pattern (Engloutissant)
    if (prev1 && current) {
      const prev1Bullish = prev1.close > prev1.open;
      const currentBullish = current.close > current.open;
      
      if (!prev1Bullish && currentBullish && 
          current.open < prev1.close && 
          current.close > prev1.open) {
        patterns.push({
          type: 'bullish_engulfing',
          name: 'Engloutissant haussier',
          signal: 'bullish',
          confidence: 0.85,
          description: 'Fort signal d\'achat, retournement haussier probable'
        });
      }
      
      if (prev1Bullish && !currentBullish && 
          current.open > prev1.close && 
          current.close < prev1.open) {
        patterns.push({
          type: 'bearish_engulfing',
          name: 'Engloutissant baissier',
          signal: 'bearish',
          confidence: 0.85,
          description: 'Fort signal de vente, retournement baissier probable'
        });
      }
    }

    return patterns;
  }

  /**
   * Calcule les niveaux de support et résistance
   */
  calculateSupportResistance(data: PriceData[], numLevels: number = 3): SupportResistance[] {
    if (data.length < 20) return [];

    const highs = data.map(d => d.high).sort((a, b) => b - a);
    const lows = data.map(d => d.low).sort((a, b) => a - b);
    
    const levels: SupportResistance[] = [];
    
    // Niveaux de résistance (plus hauts)
    const resistanceLevels = this.findSignificantLevels(highs.slice(0, 20), 'resistance');
    levels.push(...resistanceLevels.slice(0, numLevels));
    
    // Niveaux de support (plus bas)
    const supportLevels = this.findSignificantLevels(lows.slice(0, 20), 'support');
    levels.push(...supportLevels.slice(0, numLevels));
    
    return levels.sort((a, b) => b.level - a.level);
  }

  private findSignificantLevels(prices: number[], type: 'support' | 'resistance'): SupportResistance[] {
    const tolerance = 0.02; // 2% de tolérance
    const clusters: { [key: number]: number } = {};
    
    // Grouper les prix similaires
    prices.forEach(price => {
      const key = Math.round(price / tolerance) * tolerance;
      clusters[key] = (clusters[key] || 0) + 1;
    });
    
    // Convertir en array et trier par fréquence
    return Object.entries(clusters)
      .map(([level, touches]) => ({
        level: parseFloat(level),
        type,
        strength: touches / prices.length,
        touches
      }))
      .sort((a, b) => b.touches - a.touches);
  }

  /**
   * Calcule le RSI manuellement (si Alpha Vantage est indisponible)
   */
  calculateRSI(data: PriceData[], period: number = 14): number | null {
    if (data.length < period + 1) return null;

    const prices = data.map(d => d.close);
    const changes = [];
    
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Détecte la tendance générale
   */
  detectTrend(data: PriceData[]): { trend: 'uptrend' | 'downtrend' | 'sideways'; strength: number } {
    if (data.length < 20) {
      return { trend: 'sideways', strength: 0 };
    }

    const recent = data.slice(-20);
    const sma20 = recent.reduce((sum, d) => sum + d.close, 0) / 20;
    const sma10 = data.slice(-10).reduce((sum, d) => sum + d.close, 0) / 10;
    const current = data[data.length - 1].close;

    const diff = ((current - sma20) / sma20) * 100;

    if (sma10 > sma20 && diff > 2) {
      return { trend: 'uptrend', strength: Math.min(Math.abs(diff) / 10, 1) };
    } else if (sma10 < sma20 && diff < -2) {
      return { trend: 'downtrend', strength: Math.min(Math.abs(diff) / 10, 1) };
    } else {
      return { trend: 'sideways', strength: 0.5 };
    }
  }

  /**
   * Génère un signal de trading global
   */
  generateTradingSignal(data: PriceData[], rsi?: number): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let buyScore = 0;
    let sellScore = 0;

    // Analyse du RSI
    if (rsi !== undefined) {
      if (rsi < 30) {
        buyScore += 2;
        reasons.push('RSI en zone de survente (<30)');
      } else if (rsi > 70) {
        sellScore += 2;
        reasons.push('RSI en zone de surachat (>70)');
      }
    }

    // Analyse de la tendance
    const trend = this.detectTrend(data);
    if (trend.trend === 'uptrend') {
      buyScore += trend.strength * 2;
      reasons.push(`Tendance haussière forte (${(trend.strength * 100).toFixed(0)}%)`);
    } else if (trend.trend === 'downtrend') {
      sellScore += trend.strength * 2;
      reasons.push(`Tendance baissière forte (${(trend.strength * 100).toFixed(0)}%)`);
    }

    // Analyse des patterns
    const patterns = this.detectCandlestickPatterns(data);
    patterns.forEach(pattern => {
      if (pattern.signal === 'bullish') {
        buyScore += pattern.confidence;
        reasons.push(`Pattern haussier détecté: ${pattern.name}`);
      } else if (pattern.signal === 'bearish') {
        sellScore += pattern.confidence;
        reasons.push(`Pattern baissier détecté: ${pattern.name}`);
      }
    });

    // Décision finale
    const totalScore = buyScore + sellScore;
    const buyConfidence = totalScore > 0 ? buyScore / totalScore : 0.5;

    if (buyScore > sellScore && buyConfidence > 0.6) {
      return { signal: 'BUY', confidence: buyConfidence, reasons };
    } else if (sellScore > buyScore && (1 - buyConfidence) > 0.6) {
      return { signal: 'SELL', confidence: 1 - buyConfidence, reasons };
    } else {
      return { signal: 'HOLD', confidence: 0.5, reasons: ['Signaux mixtes, prudence recommandée'] };
    }
  }
}

export const advancedTA = new AdvancedTechnicalAnalysis();
