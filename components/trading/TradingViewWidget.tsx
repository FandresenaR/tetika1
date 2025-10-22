'use client';

import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  height?: number;
}

/**
 * Widget TradingView pour afficher les graphiques de trading
 * Documentation: https://www.tradingview.com/widget/advanced-chart/
 */
export default function TradingViewWidget({ symbol, theme = 'dark', height = 500 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mapper les symboles d'ETF vers les symboles TradingView appropriés
    const symbolMap: Record<string, string> = {
      'GLD': 'ARCA:GLD',      // SPDR Gold Trust
      'USO': 'ARCA:USO',      // United States Oil Fund
      'AAPL': 'NASDAQ:AAPL',  // Apple Inc.
    };

    const tradingViewSymbol = symbolMap[symbol] || `NASDAQ:${symbol}`;

    if (containerRef.current) {
      // Nettoyer le contenu précédent
      containerRef.current.innerHTML = '';

      // Créer le script TradingView
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if (typeof (window as any).TradingView !== 'undefined') {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: tradingViewSymbol,
            interval: '15', // 15 minutes
            timezone: 'Europe/Paris',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '1', // Chandeliers
            locale: 'fr_FR',
            toolbar_bg: theme === 'dark' ? '#1f2937' : '#f3f4f6',
            enable_publishing: false,
            withdateranges: true,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            details: true,
            hotlist: true,
            calendar: true,
            studies: [
              'RSI@tv-basicstudies',
              'MASimple@tv-basicstudies',
              'MACD@tv-basicstudies'
            ],
            container_id: containerRef.current?.id || 'tradingview_widget',
            height: height
          });
        }
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [symbol, theme, height]);

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px` }}>
      <div 
        id={`tradingview_${symbol}`} 
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
      />
      <div className="tradingview-widget-copyright mt-2">
        <a 
          href={`https://www.tradingview.com/symbols/${symbol}/`} 
          rel="noopener noreferrer" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          <span className="blue-text">Voir {symbol} sur TradingView</span>
        </a>
      </div>
    </div>
  );
}
