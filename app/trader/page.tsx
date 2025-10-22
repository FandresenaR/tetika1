'use client';

import { useState, useEffect } from 'react';
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';
import { openRouterModels } from '@/lib/models';
import TradingViewWidget from '@/components/trading/TradingViewWidget';
import TradingChat from '@/components/trading/TradingChat';

export default function TraderPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedAsset, setSelectedAsset] = useState<'GLD' | 'USO' | 'AAPL'>('GLD');
  const [marketData, setMarketData] = useState<{ price: string; change: string; volume: string; high: string; low: string } | null>(null);
  const [newsData, setNewsData] = useState<Array<{ title: string; snippet: string; datetime: number; sentiment?: string }>>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState<{ rsi: string; macd: string; sma50: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState('mistralai/mistral-7b-instruct:free');
  
  const { models: dynamicModels } = useOpenRouterModels();
  const allModels = [...dynamicModels, ...openRouterModels];

  useEffect(() => {
    // Charger les données initiales
    loadMarketData();
    loadNews();
    loadTechnicalIndicators();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAsset]);

  const loadMarketData = async () => {
    try {
      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getMarketData',
          symbol: selectedAsset
        })
      });
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données de marché:', error);
    }
  };

  const loadNews = async () => {
    try {
      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getNews',
          symbol: selectedAsset
        })
      });
      const data = await response.json();
      setNewsData(data.news || []);
    } catch (error) {
      console.error('Erreur lors du chargement des news:', error);
    }
  };

  const loadTechnicalIndicators = async () => {
    try {
      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getTechnicalIndicators',
          symbol: selectedAsset
        })
      });
      const data = await response.json();
      setTechnicalIndicators(data);
    } catch (error) {
      console.error('Erreur lors du chargement des indicateurs techniques:', error);
    }
  };

  const assetNames: Record<string, string> = {
    'GLD': '🪙 Or (SPDR Gold Trust ETF)',
    'USO': '🛢️ Pétrole (US Oil Fund ETF)',
    'AAPL': '📱 Apple Inc.'
  };

  const themeClasses = theme === 'dark'
    ? 'bg-gray-900 text-white'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${
        theme === 'dark' ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'
      } backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
              📈 TETIKA Trader
            </h1>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Powered by AI
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              }`}
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              ← Retour au Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className={`mb-4 rounded-lg p-4 ${
          theme === 'dark' ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
        } border`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
            ℹ️ <strong>Mode démo avec API gratuite :</strong> Utilisation d&apos;ETFs US (GLD = Or, USO = Pétrole) 
            au lieu de symboles Forex directs. Les ETFs suivent fidèlement les prix des matières premières.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Data & Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Selector */}
            <div className={`rounded-lg p-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h2 className="text-lg font-semibold mb-3">Sélectionner un actif</h2>
              <div className="flex gap-3">
                {(['GLD', 'USO', 'AAPL'] as const).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedAsset === asset
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                        : theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {assetNames[asset]}
                  </button>
                ))}
              </div>
            </div>

            {/* TradingView Chart */}
            <div className={`rounded-lg p-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h2 className="text-lg font-semibold mb-3">
                📊 Graphique {assetNames[selectedAsset]}
              </h2>
              <TradingViewWidget 
                symbol={selectedAsset}
                theme={theme}
                height={500}
              />
            </div>

            {/* API Key Warning */}
            {!marketData?.price || marketData.price === 'N/A' ? (
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-yellow-900/20 border-yellow-600/50' : 'bg-yellow-50 border-yellow-200'
              } border-2`}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  ⚠️ Configuration requise
                </h2>
                <p className="mb-3">
                  Les clés API sont manquantes ou invalides. Pour utiliser TETIKA Trader, vous devez obtenir des clés API gratuites.
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>1. Finnhub</strong> (Données de marché) : 
                    <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">
                      Obtenir la clé →
                    </a>
                  </div>
                  <div>
                    <strong>2. Alpha Vantage</strong> (Indicateurs) : 
                    <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">
                      Obtenir la clé →
                    </a>
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  📖 <a href="/TRADING-API-SETUP.md" className="text-blue-500 hover:underline">
                    Guide complet de configuration
                  </a>
                </p>
              </div>
            ) : null}

            {/* Market Data */}
            {marketData && marketData.price !== 'N/A' && (
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h2 className="text-lg font-semibold mb-3">Données de marché en temps réel</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Prix actuel</p>
                    <p className="text-2xl font-bold text-green-500">
                      {marketData.price || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Variation</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(marketData.change) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {marketData.change || 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Volume</p>
                    <p className="text-xl font-semibold">
                      {marketData.volume || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Haut/Bas</p>
                    <p className="text-sm">
                      {marketData.high || 'N/A'} / {marketData.low || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Indicators */}
            {technicalIndicators && (
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <h2 className="text-lg font-semibold mb-3">Indicateurs techniques</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">RSI (14)</p>
                    <p className="text-xl font-bold">
                      {technicalIndicators.rsi || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MACD</p>
                    <p className="text-xl font-bold">
                      {technicalIndicators.macd || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SMA (50)</p>
                    <p className="text-xl font-bold">
                      {technicalIndicators.sma50 || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Trading Chat & News */}
          <div className="space-y-6">
            {/* Trading Chat */}
            <div className={`rounded-lg overflow-hidden ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`} style={{ height: '600px' }}>
              <TradingChat
                theme={theme}
                selectedAsset={selectedAsset}
                marketData={marketData}
                newsData={newsData}
                technicalIndicators={technicalIndicators}
                models={allModels}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>

            {/* News Feed */}
            <div className={`rounded-lg p-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h2 className="text-lg font-semibold mb-3">📰 Actualités financières</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {newsData.length > 0 ? (
                  newsData.map((news, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <h3 className="font-medium mb-1">{news.title}</h3>
                      <p className="text-sm text-gray-500">{news.snippet}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(news.datetime * 1000).toLocaleDateString()}
                        </span>
                        {news.sentiment && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            news.sentiment === 'positive'
                              ? 'bg-green-500/20 text-green-400'
                              : news.sentiment === 'negative'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {news.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Aucune actualité disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
