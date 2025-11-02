'use client';

import { useEffect, useRef, useState } from 'react';
import { chartController } from '@/lib/services/chartController';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  height?: number;
}

/**
 * Widget TradingView pour afficher les graphiques de trading
 * Documentation: https://www.tradingview.com/widget/advanced-chart/
 * 
 * Utilise un système de cache partagé avec l'IA pour les symboles découverts
 * Permet le contrôle programmatique via chartController
 */
export default function TradingViewWidget({ symbol, theme = 'dark', height = 500 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);
  const [tradingViewSymbol, setTradingViewSymbol] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  
  // ID unique pour le conteneur du widget - généré côté client uniquement pour éviter hydration mismatch
  const [containerId] = useState(() => `tradingview_${Date.now()}_${symbol}`);

  // Marquer le composant comme monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Rechercher dynamiquement le symbole TradingView
  useEffect(() => {
    async function findTradingViewSymbol() {
      // Normaliser les symboles français vers leurs équivalents US d'abord
      const symbolNormalization: Record<string, string> = {
        'OR': 'GLD',  // Or → Gold ETF
        'PETROLE': 'USO', // Pétrole → Oil ETF
        'ARGENT': 'SLV', // Argent → Silver ETF
      };
      
      const normalizedSymbol = symbolNormalization[symbol?.toUpperCase()] || symbol;
      
      // Mapping statique pour les symboles connus (cache local)
      const symbolMap: Record<string, string> = {
        // Commodités - Utiliser des symboles universels qui fonctionnent en mode gratuit
        'GLD': 'TVC:GOLD',          // Or - TradingView Composite
        'USO': 'TVC:USOIL',         // Pétrole - TradingView Composite  
        'SLV': 'TVC:SILVER',        // Argent - TradingView Composite
        // Actions
        'AAPL': 'NASDAQ:AAPL',
        'MSFT': 'NASDAQ:MSFT',
        'TSLA': 'NASDAQ:TSLA',
        'GOOGL': 'NASDAQ:GOOGL',
        'AMZN': 'NASDAQ:AMZN',
        
        // Cryptomonnaies
        'BITCOIN': 'BINANCE:BTCUSDT',
        'BTC': 'BINANCE:BTCUSDT',
        'ETHEREUM': 'BINANCE:ETHUSDT',
        'ETH': 'BINANCE:ETHUSDT',
        'DOGECOIN': 'BINANCE:DOGEUSDT',
        'DOGE': 'BINANCE:DOGEUSDT',
        'LITECOIN': 'BINANCE:LTCUSDT',
        'LTC': 'BINANCE:LTCUSDT',
        'RIPPLE': 'BINANCE:XRPUSDT',
        'XRP': 'BINANCE:XRPUSDT',
        'SOLANA': 'BINANCE:SOLUSDT',
        'SOL': 'BINANCE:SOLUSDT',
        'CARDANO': 'BINANCE:ADAUSDT',
        'ADA': 'BINANCE:ADAUSDT',
      };

      // Étape 1: Vérifier le cache statique avec le symbole normalisé
      if (symbolMap[normalizedSymbol]) {
        console.log(`[TradingView Widget] ✅ Symbole trouvé dans le cache statique: ${symbolMap[normalizedSymbol]}`);
        setTradingViewSymbol(symbolMap[normalizedSymbol]);
        setError('');
        return;
      }

      // Étape 1.5: Vérifier par similarité (bitcoin → BITCOIN)
      const upperSymbol = normalizedSymbol.toUpperCase();
      if (symbolMap[upperSymbol]) {
        console.log(`[TradingView Widget] ✅ Symbole trouvé (normalisé): ${symbolMap[upperSymbol]}`);
        setTradingViewSymbol(symbolMap[upperSymbol]);
        setError('');
        return;
      }

            // Recherche du symbole mappé
      if (symbolMap[normalizedSymbol]) {
        const mappedSymbol = symbolMap[normalizedSymbol];
        console.log(`[TradingView Widget] ✅ Symbole mappé: ${symbol} → ${mappedSymbol}`);
        setTradingViewSymbol(mappedSymbol);
        setError('');
        return;
      }

      // Étape 2: Vérifier le cache partagé (symboles découverts par l'IA)
      try {
        const cacheResponse = await fetch('/api/tradingview-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getCache',
            symbol: symbol
          })
        });

        const cacheData = await cacheResponse.json();
        
        if (cacheData.symbol) {
          console.log(`[TradingView Widget] ✅ Symbole trouvé dans le cache partagé: ${cacheData.symbol}`);
          setTradingViewSymbol(cacheData.symbol);
          setError('');
          return;
        }
      } catch {
        console.log('[TradingView Widget] Cache partagé non disponible, recherche dynamique...');
      }

      // Étape 3: Recherche dynamique via l'API
      setIsSearching(true);
      setError('');

      try {
        console.log(`[TradingView Widget] 🔍 Recherche dynamique pour: ${symbol}`);
        
        const response = await fetch('/api/tradingview-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'findBest',
            assetName: symbol
          })
        });

        const data = await response.json();

        if (data.symbol) {
          console.log(`[TradingView Widget] ✅ Symbole trouvé par recherche: ${data.symbol.symbol}`);
          setTradingViewSymbol(data.symbol.symbol);
          setError('');
        } else {
          console.warn(`[TradingView Widget] ⚠️ Aucun symbole trouvé pour ${symbol}`);
          setTradingViewSymbol(`NASDAQ:${symbol}`); // Fallback
          setError(`Symbole ${symbol} non trouvé, utilisation de NASDAQ:${symbol}`);
        }
      } catch (err) {
        console.error('[TradingView Widget] Erreur de recherche:', err);
        setTradingViewSymbol(`NASDAQ:${symbol}`); // Fallback
        setError('Erreur de recherche, utilisation du symbole par défaut');
      } finally {
        setIsSearching(false);
      }
    }

    findTradingViewSymbol();
  }, [symbol]);

  useEffect(() => {
    if (!tradingViewSymbol || isSearching || !containerRef.current || !isMounted) {
      return;
    }

    // Attendre que le DOM soit complètement prêt
    const timer = setTimeout(() => {
      if (!containerRef.current) {
        console.error('[TradingViewWidget] ❌ Conteneur non disponible après timeout');
        return;
      }

      // Nettoyer le contenu précédent
      containerRef.current.innerHTML = '';

      // Créer le script TradingView
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onerror = () => {
        console.error('[TradingViewWidget] ❌ Erreur de chargement du script TradingView');
        setError('Impossible de charger TradingView. Vérifiez votre connexion.');
      };
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (window as any).TradingView !== 'undefined' && containerRef.current) {
          try {
            console.log('[TradingViewWidget] 🔨 Création du widget pour:', tradingViewSymbol);
            
            // Vérifier que le conteneur existe
            if (!containerRef.current) {
              console.error('[TradingViewWidget] ❌ Conteneur non trouvé');
              setError('Erreur: conteneur du graphique introuvable');
              return;
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const widget = new (window as any).TradingView.widget({
              autosize: true,
              symbol: tradingViewSymbol,
              interval: 'D',              // Journalier plutôt que 15min pour plus de stabilité
              timezone: 'Europe/Paris',
              theme: theme === 'dark' ? 'dark' : 'light',
              style: '1',
              locale: 'fr_FR',
              toolbar_bg: theme === 'dark' ? '#1f2937' : '#f3f4f6',
              enable_publishing: false,
              withdateranges: true,
              hide_side_toolbar: false,
              allow_symbol_change: true,
              details: true,
              hotlist: true,
              calendar: true,
              studies_overrides: {},      // Pas d'override par défaut
              overrides: {
                "mainSeriesProperties.showCountdown": false
              },
              disabled_features: [],
              enabled_features: [
                'use_localstorage_for_settings',
                'study_templates'
              ],
              container_id: containerId,
              height: height,
              
              // Callback quand le graphique est prêt
              onChartReady: () => {
                console.log('[TradingViewWidget] 📊 Widget prêt - Symbole:', tradingViewSymbol);
                
                // Stocker la référence du widget pour le contrôleur
                widgetRef.current = widget;
                if (containerId) {
                  chartController.initializeWidget(containerId, tradingViewSymbol);
                }
                
                // Ajouter les indicateurs techniques avec délai pour assurer que le graphique est chargé
                setTimeout(() => {
                  try {
                    console.log('[TradingViewWidget] 🔧 Tentative d\'ajout des indicateurs...');
                    
                    // Vérifier que chart() existe
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const chart = (widget as any).chart?.();
                    if (!chart) {
                      console.warn('[TradingViewWidget] ⚠️ chart() non disponible - les indicateurs ne peuvent pas être ajoutés');
                      console.log('[TradingViewWidget] ℹ️ Le widget fonctionne mais l\'API chart() n\'est pas accessible (limitation du widget gratuit)');
                      return;
                    }
                    
                    console.log('[TradingViewWidget] ✅ API chart() accessible, ajout des indicateurs...');
                    
                    // RSI
                    chart.createStudy('RSI', false, false, [14]);
                    console.log('[TradingViewWidget] ✅ RSI(14) ajouté');
                    
                    // SMA
                    chart.createStudy('Moving Average', false, false, [50]);
                    console.log('[TradingViewWidget] ✅ SMA(50) ajouté');
                    
                    // MACD
                    chart.createStudy('MACD', false, false, [12, 26, "close", 9]);
                    console.log('[TradingViewWidget] ✅ MACD(12,26,9) ajouté');
                    
                  } catch (error) {
                    console.warn('[TradingViewWidget] ⚠️ Erreur lors de l\'ajout des indicateurs:', error);
                    console.log('[TradingViewWidget] ℹ️ Ceci peut être normal avec le widget gratuit - le graphique fonctionne quand même');
                  }
                }, 2000); // Attendre 2 secondes pour que le graphique soit complètement chargé
              },
              
              // Gérer les erreurs du widget
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onerror: (error: any) => {
                console.error('[TradingViewWidget] ❌ Erreur du widget TradingView:', error);
                setError(`Erreur TradingView: ${error?.message || 'Symbole invalide ou données indisponibles'}`);
              }
            });
          } catch (error) {
            console.error('[TradingViewWidget] ❌ Erreur lors de la création du widget:', error);
            setError('Erreur lors du chargement du graphique TradingView');
          }
        }
      };

      document.head.appendChild(script);
    }, 100); // Petit délai pour que le DOM soit prêt

    return () => {
      clearTimeout(timer);
    };
  }, [tradingViewSymbol, theme, height, isSearching, isMounted, containerId]);

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px` }}>
      {!isMounted ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">⏳ Chargement du graphique...</p>
        </div>
      ) : null}
      {isSearching && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">🔍 Recherche du symbole...</p>
        </div>
      )}
      {error && (
        <div className="text-xs text-yellow-600 p-2">
          ⚠️ {error}
        </div>
      )}
      {isMounted && (
        <div 
          id={containerId}
          ref={containerRef}
          style={{ height: '100%', width: '100%' }}
        />
      )}
      {isMounted && (
        <div className="tradingview-widget-copyright mt-2">
          <a 
            href={`https://www.tradingview.com/symbols/${tradingViewSymbol || symbol}/`} 
            rel="noopener noreferrer" 
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <span className="blue-text">Voir {tradingViewSymbol || symbol} sur TradingView</span>
          </a>
        </div>
      )}
    </div>
  );
}
