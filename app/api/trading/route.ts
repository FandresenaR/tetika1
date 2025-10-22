import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/lib/services/finnhubService';
import { alphaVantageService } from '@/lib/services/alphaVantageService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, symbol, marketData, newsData, technicalIndicators, modelId } = body;

    console.log('[Trading API] Action:', action, 'Symbol:', symbol);

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
          const prompt = `Tu es un expert en trading et analyse financière. Analyse les données suivantes pour ${symbol}:

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
