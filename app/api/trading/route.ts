import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/lib/services/finnhubService';
import { alphaVantageService } from '@/lib/services/alphaVantageService';
import { tradingAgent } from '@/lib/services/tradingAgentActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol: originalSymbol, marketData, newsData, technicalIndicators, modelId } = body;

    // Normaliser les symboles français vers leurs équivalents US
    const symbolNormalization: Record<string, string> = {
      'OR': 'GLD',  // Or → Gold ETF
      'PETROLE': 'USO', // Pétrole → Oil ETF
      'ARGENT': 'SLV', // Argent → Silver ETF
    };

    // Appliquer la normalisation si nécessaire
    const symbol = symbolNormalization[originalSymbol?.toUpperCase()] || originalSymbol;

    console.log('[Trading API] Action:', action, 'Symbol:', originalSymbol, 'Normalized:', symbol);

    switch (action) {
      case 'getMarketData': {
        // Récupérer les données de marché depuis Finnhub
        // Utiliser directement le symbole US (GLD, USO, AAPL)
        const quote = await finnhubService.getQuote(symbol);

        if (!quote) {
          return NextResponse.json({
            price: 'N/A',
            change: 0,
            volume: 'N/A',
            high: 'N/A',
            low: 'N/A'
          });
        }

        return NextResponse.json({
          price: quote.c.toFixed(2),
          change: quote.dp.toFixed(2),
          volume: quote.d ? quote.d.toLocaleString() : 'N/A',
          high: quote.h.toFixed(2),
          low: quote.l.toFixed(2),
          previousClose: quote.pc.toFixed(2),
          timestamp: quote.t
        });
      }

      case 'getNews': {
        // Récupérer les actualités depuis Finnhub
        // Utiliser l'API des news d'entreprise pour les ETFs
        const news = await finnhubService.getCompanyNews(symbol);

        // Note: Le sentiment n'est pas disponible dans le plan gratuit de Finnhub
        // On pourrait l'analyser avec OpenRouter si nécessaire

        return NextResponse.json({
          news: news.slice(0, 10).map(item => ({
            title: item.headline,
            snippet: item.summary,
            url: item.url,
            source: item.source,
            datetime: item.datetime,
            image: item.image,
            sentiment: null // Désactivé pour l'API gratuite
          }))
        });
      }

      case 'getTechnicalIndicators': {
        // Récupérer les indicateurs techniques depuis Alpha Vantage
        // Note: Avec la limite de 5 calls/minute, on ne récupère qu'un indicateur à la fois
        // En production, il faudrait implémenter un système de cache
        
        try {
          const rsi = await alphaVantageService.getRSI(symbol);
          
          return NextResponse.json({
            rsi: rsi ? rsi.toFixed(2) : 'N/A',
            macd: 'En attente...', // Nécessiterait un appel supplémentaire
            sma50: 'En attente...', // Nécessiterait un appel supplémentaire
            note: 'Les indicateurs sont récupérés progressivement pour respecter les limites API'
          });
        } catch (error) {
          console.error('[Trading API] Erreur indicateurs:', error);
          return NextResponse.json({
            rsi: 'N/A',
            macd: 'N/A',
            sma50: 'N/A',
            error: 'Clé API manquante ou limite atteinte'
          });
        }
      }

      case 'aiAnalysis': {
        // Utiliser OpenRouter pour l'analyse IA
        try {
          const openRouterKey = process.env.OPENROUTER_API_KEY || 
                                process.env.NEXT_PUBLIC_OPENROUTER_KEY || 
                                request.headers.get('x-openrouter-key') || '';

          if (!openRouterKey) {
            throw new Error('Clé OpenRouter manquante');
          }

          // Construire le prompt avec toutes les données disponibles
          const prompt = `Tu es un expert en trading et analyse financière. Analyse les données suivantes pour ${symbol} (${originalSymbol}):

**Données de marché:**
- Prix actuel: ${marketData?.price || 'N/A'}
- Variation: ${marketData?.change || 'N/A'}%
- Volume: ${marketData?.volume || 'N/A'}
- Haut/Bas: ${marketData?.high || 'N/A'} / ${marketData?.low || 'N/A'}

**Indicateurs techniques:**
- RSI: ${technicalIndicators?.rsi || 'N/A'}
- MACD: ${technicalIndicators?.macd || 'N/A'}
- SMA 50: ${technicalIndicators?.sma50 || 'N/A'}

**Actualités récentes:**
${newsData?.slice(0, 5).map((news: { title: string; sentiment?: string }, i: number) => 
  `${i + 1}. ${news.title} (${news.sentiment || 'neutre'})`
).join('\n') || 'Aucune actualité disponible'}

Fournis une analyse complète incluant:
1. **Tendance actuelle** du marché
2. **Signaux techniques** (surachat/survente, momentum)
3. **Impact des actualités** sur le prix
4. **Recommandation** de trading (BUY/SELL/HOLD) avec niveau de confiance
5. **Niveaux clés** (support/résistance)
6. **Gestion du risque** recommandée

Sois concis mais précis. Utilise des émojis pour la lisibilité.`;

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://tetika.app',
              'X-Title': 'Tetika AI Trader'
            },
            body: JSON.stringify({
              model: modelId || 'mistralai/mistral-7b-instruct:free',
              messages: [
                {
                  role: 'system',
                  content: 'Tu es un expert en trading financier spécialisé dans l\'analyse technique et fondamentale. Tu fournis des analyses claires, professionnelles et actionnables.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 1500
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Trading API] Erreur OpenRouter:', errorText);
            throw new Error(`OpenRouter API error: ${response.status}`);
          }

          const data = await response.json();
          const analysis = data.choices?.[0]?.message?.content || 'Analyse non disponible';

          return NextResponse.json({
            analysis,
            model: modelId,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('[Trading API] Erreur analyse IA:', error);
          return NextResponse.json({
            analysis: `❌ **Erreur lors de l'analyse IA**

${error instanceof Error ? error.message : 'Erreur inconnue'}

💡 **Solutions:**
- Vérifiez que vous avez configuré votre clé API OpenRouter
- Essayez un autre modèle
- Réessayez dans quelques instants`,
            error: true
          });
        }
      }

      case 'chatAnalysis': {
        // Chat conversationnel avec contexte de trading
        const { message, context, history } = body;
        
        try {
          const openRouterKey = process.env.OPENROUTER_API_KEY || 
                                process.env.NEXT_PUBLIC_OPENROUTER_KEY || 
                                request.headers.get('x-openrouter-key') || '';

          if (!openRouterKey) {
            throw new Error('Clé OpenRouter manquante');
          }

          // Construire l'historique des messages
          const conversationMessages = [
            {
              role: 'system',
              content: `Tu es un assistant de trading IA expert. Tu aides les traders à analyser les marchés et prendre des décisions éclairées.

Contexte actuel:
${context}

Réponds de manière concise, professionnelle et actionnable. Utilise des émojis pour améliorer la lisibilité.`
            },
            ...(history || []).map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: message
            }
          ];

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://tetika.app',
              'X-Title': 'Tetika AI Trader'
            },
            body: JSON.stringify({
              model: modelId || 'mistralai/mistral-7b-instruct:free',
              messages: conversationMessages,
              temperature: 0.7,
              max_tokens: 800
            })
          });

          if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
          }

          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content || 'Désolé, je ne peux pas répondre pour le moment.';

          return NextResponse.json({
            response: responseText,
            model: modelId,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('[Trading API] Erreur chat:', error);
          return NextResponse.json({
            response: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            error: true
          });
        }
      }

      case 'smartChat': {
        // Chat intelligent avec capacité d'effectuer des actions autonomes
        const { message, context, history } = body;
        
        try {
          const openRouterKey = process.env.OPENROUTER_API_KEY || 
                                process.env.NEXT_PUBLIC_OPENROUTER_KEY || 
                                request.headers.get('x-openrouter-key') || '';

          if (!openRouterKey) {
            throw new Error('Clé OpenRouter manquante');
          }

          // Détecter les mots-clés qui nécessitent une recherche de symbole
          const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'dogecoin', 'doge', 'litecoin', 'ltc', 'ripple', 'xrp'];
          const needsSymbolSearch = cryptoKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
          );

          // Première étape : Déterminer si l'IA doit effectuer des actions
          const analysisSystemPrompt = `Tu es un assistant de trading IA expert avec accès à plusieurs outils.

OUTILS DISPONIBLES:

📊 DONNÉES & RECHERCHE:
1. search_news - Rechercher des actualités récentes sur un actif (params: {symbol, assetName?})
2. search_analysis - Rechercher des analyses d'experts (params: {symbol})
3. search_trends - Rechercher des tendances de marché générales (params: {query})
4. search_symbol - Trouver le symbole d'une action par nom de société (params: {companyName})
5. get_market_data - Obtenir des données de marché en temps réel (params: {symbol})
6. get_technical_indicators - Calculer des indicateurs techniques (params: {symbol})

🎯 GESTION D'ACTIFS:
7. select_asset - Changer l'actif à trader (params: {symbol})
8. search_tradingview_symbol - Rechercher des symboles disponibles sur TradingView (params: {query})
9. find_best_tradingview_symbol - Trouver et METTRE EN CACHE le meilleur symbole TradingView (params: {assetName})

📈 CONTRÔLE DU GRAPHIQUE:
10. change_chart_symbol - Changer le symbole affiché sur le graphique (params: {symbol})
11. change_chart_interval - Changer l'intervalle de temps (params: {interval}) - Valeurs: 1, 5, 15, 30, 60, 1D, 1W, 1M
12. add_chart_indicator - Ajouter un indicateur technique (params: {indicator}) - Valeurs: rsi, macd, sma, ema, bollinger, stochastic, volume
13. change_chart_type - Changer le type de graphique (params: {type}) - Valeurs: candles, line, area, bars
14. add_price_alert - Ajouter une alerte de prix (params: {price, message})

RÈGLES CRITIQUES - TU DOIS LES SUIVRE:
❗ Si Bitcoin, BTC, Ethereum, ETH, crypto → UTILISE find_best_tradingview_symbol
❗ Si l'utilisateur demande "montre", "affiche", "graphique" → UTILISE change_chart_symbol
❗ Si l'utilisateur demande d'ajouter un indicateur (RSI, MACD, etc.) → UTILISE add_chart_indicator
❗ Si l'utilisateur demande de changer l'intervalle (1h, 15m, etc.) → UTILISE change_chart_interval
❗ Tu peux CONTRÔLER directement le graphique maintenant!

ACTIFS CONNUS (pas besoin de recherche):
- GLD, USO, SLV, AAPL, MSFT, TSLA, GOOGL, AMZN
- BTC, ETH, DOGE, LTC, XRP, SOL, ADA (cryptos)

WORKFLOW OBLIGATOIRE:
1. Pour nouveaux symboles inconnus → utiliser find_best_tradingview_symbol d'abord
2. Pour changer le graphique → utiliser change_chart_symbol
3. Pour ajouter analyse technique → utiliser add_chart_indicator

Contexte actuel:
${context}

IMPORTANT: Analyse la question. Si elle contient "Bitcoin", "BTC", "crypto", "Ethereum", etc. → needs_tools DOIT être true!

Format de réponse STRICT:
Si outils nécessaires: {"needs_tools": true, "tools": [{"type": "find_best_tradingview_symbol", "params": {"assetName": "Bitcoin"}}]}
Si réponse directe OK: {"needs_tools": false, "response": "Ta réponse ici"}

Question: ${message}`;

          // Premier appel : Déterminer les actions
          const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://tetika.app',
              'X-Title': 'Tetika AI Trader'
            },
            body: JSON.stringify({
              model: modelId || 'mistralai/mistral-7b-instruct:free',
              messages: [
                { role: 'system', content: analysisSystemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.3,
              max_tokens: 500
            })
          });

          if (!analysisResponse.ok) {
            throw new Error(`OpenRouter API error: ${analysisResponse.status}`);
          }

          const analysisData = await analysisResponse.json();
          const analysisText = analysisData.choices?.[0]?.message?.content || '{}';

          // Parser la réponse pour voir si des outils sont nécessaires
          let needsTools = false;
          let toolsToExecute: Array<{ type: string; params: Record<string, unknown> }> = [];

          try {
            const parsed = JSON.parse(analysisText);
            needsTools = parsed.needs_tools || false;
            toolsToExecute = parsed.tools || [];
          } catch {
            // Si parsing échoue, répondre directement
            needsTools = false;
          }

          // FORCER l'utilisation de find_best_tradingview_symbol si crypto détectée et pas dans les outils
          if (needsSymbolSearch && !toolsToExecute.some(t => t.type === 'find_best_tradingview_symbol')) {
            console.log('[Trading API] 🔍 Crypto détectée, ajout forcé de find_best_tradingview_symbol');
            
            // Extraire le nom de la crypto du message
            let cryptoName = 'Bitcoin'; // Par défaut
            if (message.toLowerCase().includes('ethereum') || message.toLowerCase().includes('eth')) {
              cryptoName = 'Ethereum';
            } else if (message.toLowerCase().includes('dogecoin') || message.toLowerCase().includes('doge')) {
              cryptoName = 'Dogecoin';
            } else if (message.toLowerCase().includes('litecoin') || message.toLowerCase().includes('ltc')) {
              cryptoName = 'Litecoin';
            } else if (message.toLowerCase().includes('ripple') || message.toLowerCase().includes('xrp')) {
              cryptoName = 'Ripple';
            }

            toolsToExecute.push({
              type: 'find_best_tradingview_symbol',
              params: { assetName: cryptoName }
            });
            needsTools = true;
          }

          let toolResults = '';
          let assetChanged = false;
          let newAsset = '';

          // Exécuter les outils si nécessaire
          if (needsTools && toolsToExecute.length > 0) {
            console.log('[Trading API] 🤖 Exécution d\'actions autonomes:', toolsToExecute);
            
            const results = await Promise.all(
              toolsToExecute.map((tool) => tradingAgent.executeAction(tool.type, tool.params))
            );

            // Vérifier si l'actif a été changé
            const assetSelection = results.find(r => r.actionType === 'select_asset' && r.success);
            if (assetSelection && assetSelection.data) {
              assetChanged = true;
              newAsset = (assetSelection.data as { symbol: string }).symbol;
            }

            toolResults = results.map((result, index) => {
              if (result.success) {
                return `\n\n📊 Résultat ${index + 1} (${result.actionType}):\n${JSON.stringify(result.data, null, 2)}`;
              } else {
                return `\n\n❌ Erreur ${index + 1} (${result.actionType}): ${result.error}`;
              }
            }).join('');
          }

          // Deuxième appel : Générer la réponse finale avec les résultats des outils
          const finalSystemPrompt = `Tu es un assistant de trading IA expert. 

Contexte actuel:
${context}

${toolResults ? `Résultats des recherches et analyses:\n${toolResults}` : ''}

${needsSymbolSearch && toolsToExecute.some(t => t.type === 'find_best_tradingview_symbol') 
  ? `\n⚠️ IMPORTANT: Tu viens de découvrir et mettre en cache un nouveau symbole TradingView. Mentionne EXPLICITEMENT dans ta réponse que le graphique va maintenant s'afficher avec le bon symbole.`
  : ''
}

Utilise ces informations pour répondre de manière professionnelle et actionnable. Utilise des émojis pour améliorer la lisibilité.`;

          const conversationMessages = [
            { role: 'system', content: finalSystemPrompt },
            ...(history || []).slice(-4).map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ];

          const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterKey}`,
              'HTTP-Referer': 'https://tetika.app',
              'X-Title': 'Tetika AI Trader'
            },
            body: JSON.stringify({
              model: modelId || 'mistralai/mistral-7b-instruct:free',
              messages: conversationMessages,
              temperature: 0.7,
              max_tokens: 1000
            })
          });

          if (!finalResponse.ok) {
            throw new Error(`OpenRouter API error: ${finalResponse.status}`);
          }

          const finalData = await finalResponse.json();
          const responseText = finalData.choices?.[0]?.message?.content || 'Désolé, je ne peux pas répondre pour le moment.';

          return NextResponse.json({
            response: responseText,
            model: modelId,
            timestamp: Date.now(),
            usedTools: needsTools,
            toolsExecuted: toolsToExecute.length,
            assetChanged,
            newAsset: assetChanged ? newAsset : undefined
          });
        } catch (error) {
          console.error('[Trading API] Erreur smart chat:', error);
          return NextResponse.json({
            response: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            error: true
          });
        }
      }

      case 'executeAction': {
        // Endpoint pour exécuter une action spécifique
        const { actionType, params } = body;
        
        try {
          const result = await tradingAgent.executeAction(actionType, params);
          return NextResponse.json(result);
        } catch (error) {
          return NextResponse.json({
            success: false,
            actionType: actionType || 'unknown',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Trading API] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
