/**
 * API de contrôle avancé TradingView
 * Permet à l'IA de manipuler directement le graphique
 */

interface DrawingPoint {
  time: number;
  price: number;
}

// Type pour le widget TradingView
interface TradingViewWidget {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chart(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSymbol(symbol: string, interval: string, callback: () => void): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  takeScreenshot(callback: (blob: Blob) => void): any;
}

export interface ChartControl {
  widget: TradingViewWidget | null;
  
  // Actions disponibles pour l'IA
  changeSymbol(symbol: string): Promise<void>;
  changeInterval(interval: string): Promise<void>;
  setChartType(type: 'candles' | 'line' | 'area' | 'bars'): Promise<void>;
  addIndicator(indicator: string): Promise<void>;
  removeIndicator(indicator: string): Promise<void>;
  addDrawing(type: string, points: DrawingPoint[]): Promise<void>;
  clearDrawings(): Promise<void>;
  takeSnapshot(): Promise<string>;
  setDateRange(from: Date, to: Date): Promise<void>;
  zoom(level: number): Promise<void>;
}

class TradingViewChartController {
  private widgetInstance: TradingViewWidget | null = null;

  /**
   * Initialiser le widget avec contrôle API
   */
  initializeWidget(containerId: string, symbol: string): Promise<TradingViewWidget> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (window as any).TradingView !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.widgetInstance = new (window as any).TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: '15',
            timezone: 'Europe/Paris',
            theme: 'dark',
            style: '1',
            locale: 'fr_FR',
            toolbar_bg: '#1f2937',
            enable_publishing: false,
            container_id: containerId,
            
            // 🔑 API AVANCÉE - Activer le contrôle programmatique
            disabled_features: [],
            enabled_features: [
              'use_localstorage_for_settings',
              'save_chart_properties_to_local_storage',
              'study_templates'
            ],
            
            // Callback quand le widget est prêt
            onReady: () => {
              console.log('[ChartController] Widget prêt pour contrôle');
              if (this.widgetInstance) {
                resolve(this.widgetInstance);
              }
            }
          });
        }
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Changer le symbole affiché
   */
  async changeSymbol(symbol: string): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    return new Promise((resolve) => {
      if (this.widgetInstance) {
        this.widgetInstance.setSymbol(symbol, '15', () => {
          console.log(`[ChartController] ✅ Symbole changé: ${symbol}`);
          resolve();
        });
      }
    });
  }

  /**
   * Changer l'intervalle de temps
   */
  async changeInterval(interval: string): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    this.widgetInstance.chart().setResolution(interval, () => {
      console.log(`[ChartController] ✅ Intervalle changé: ${interval}`);
    });
  }

  /**
   * Ajouter un indicateur technique
   */
  async addIndicator(indicatorName: string, inputs?: any): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    
    // Mapping des indicateurs populaires
    const indicators: Record<string, string> = {
      'rsi': 'RSI@tv-basicstudies',
      'macd': 'MACD@tv-basicstudies',
      'sma': 'MASimple@tv-basicstudies',
      'ema': 'MAExp@tv-basicstudies',
      'bollinger': 'BB@tv-basicstudies',
      'stochastic': 'Stochastic@tv-basicstudies',
      'volume': 'Volume@tv-basicstudies'
    };

    const indicatorId = indicators[indicatorName.toLowerCase()] || indicatorName;

    chart.createStudy(indicatorId, false, false, inputs);
    console.log(`[ChartController] ✅ Indicateur ajouté: ${indicatorName}`);
  }

  /**
   * Supprimer tous les indicateurs
   */
  async clearIndicators(): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    chart.getAllStudies().forEach((study: any) => {
      chart.removeEntity(study.id);
    });
    
    console.log('[ChartController] ✅ Indicateurs supprimés');
  }

  /**
   * Changer le type de graphique
   */
  async setChartType(type: 'candles' | 'line' | 'area' | 'bars'): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const typeMap: Record<string, number> = {
      'bars': 0,
      'candles': 1,
      'line': 2,
      'area': 3
    };

    this.widgetInstance.chart().setChartType(typeMap[type]);
    console.log(`[ChartController] ✅ Type de graphique changé: ${type}`);
  }

  /**
   * Ajouter une ligne de dessin
   */
  async addTrendLine(points: { time: number; price: number }[]): Promise<void> {
    if (!this.widgetInstance || points.length < 2) {
      throw new Error('Widget non initialisé ou points insuffisants');
    }

    const chart = this.widgetInstance.chart();
    
    chart.createShape(
      { time: points[0].time, price: points[0].price },
      {
        shape: 'trend_line',
        overrides: { linecolor: '#2962FF', linewidth: 2 }
      }
    );

    console.log('[ChartController] ✅ Ligne de tendance ajoutée');
  }

  /**
   * Prendre un screenshot du graphique
   */
  async takeSnapshot(): Promise<string> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    return new Promise((resolve) => {
      if (this.widgetInstance) {
        this.widgetInstance.takeScreenshot((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          console.log('[ChartController] ✅ Screenshot capturé');
          resolve(url);
        });
      }
    });
  }

  /**
   * Définir une plage de dates
   */
  async setDateRange(from: Date, to: Date): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    chart.setVisibleRange({
      from: from.getTime() / 1000,
      to: to.getTime() / 1000
    });

    console.log('[ChartController] ✅ Plage de dates définie');
  }

  /**
   * Zoomer sur le graphique
   */
  async zoom(level: number): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    
    if (level > 0) {
      chart.zoomOut();
    } else {
      chart.zoomIn();
    }

    console.log(`[ChartController] ✅ Zoom: ${level > 0 ? 'Out' : 'In'}`);
  }

  /**
   * Obtenir les données de prix actuelles
   */
  async getCurrentPrice(): Promise<number> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    const lastBar = chart.getLastBar();
    
    return lastBar?.close || 0;
  }

  /**
   * Ajouter une alerte de prix
   */
  async addPriceAlert(price: number, message: string): Promise<void> {
    if (!this.widgetInstance) {
      throw new Error('Widget non initialisé');
    }

    const chart = this.widgetInstance.chart();
    
    chart.createShape(
      { price: price },
      {
        shape: 'horizontal_line',
        overrides: {
          linecolor: '#FF0000',
          linewidth: 2,
          linestyle: 1, // Dashed
          showLabel: true,
          text: message
        }
      }
    );

    console.log(`[ChartController] ✅ Alerte ajoutée à ${price}: ${message}`);
  }
}

export const chartController = new TradingViewChartController();
