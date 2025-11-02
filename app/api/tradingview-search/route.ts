import { NextRequest, NextResponse } from 'next/server';
import { tradingViewSearchService } from '@/lib/services/tradingViewSearchService';
import { symbolCache } from '@/lib/services/symbolCacheService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, assetName, symbol, localSymbol, tradingViewSymbol, description } = body;

    switch (action) {
      case 'search': {
        // Rechercher des symboles
        const result = await tradingViewSearchService.searchSymbol(query);
        return NextResponse.json(result);
      }

      case 'findBest': {
        // Trouver le meilleur symbole
        const foundSymbol = await tradingViewSearchService.findBestSymbol(assetName);
        
        // Ajouter au cache si trouvé
        if (foundSymbol) {
          symbolCache.add(assetName, foundSymbol.symbol, foundSymbol.description);
        }
        
        return NextResponse.json({ symbol: foundSymbol });
      }

      case 'verify': {
        // Vérifier si un symbole existe
        const exists = await tradingViewSearchService.verifySymbol(query);
        return NextResponse.json({ exists, symbol: query });
      }

      case 'searchMultiple': {
        // Rechercher plusieurs actifs
        const assets = body.assets || [];
        const results = await tradingViewSearchService.searchMultipleAssets(assets);
        
        // Ajouter tous les résultats au cache
        Object.entries(results).forEach(([asset, sym]) => {
          if (sym) {
            symbolCache.add(asset, sym.symbol, sym.description);
          }
        });
        
        return NextResponse.json({ results });
      }

      case 'getCache': {
        // Obtenir un symbole du cache
        const cachedSymbol = symbolCache.get(symbol);
        return NextResponse.json({ 
          symbol: cachedSymbol,
          cached: cachedSymbol !== null
        });
      }

      case 'getAllCache': {
        // Obtenir tout le cache
        const allSymbols = symbolCache.getAll();
        const stats = symbolCache.stats();
        return NextResponse.json({ 
          symbols: allSymbols,
          stats
        });
      }

      case 'addToCache': {
        // Ajouter manuellement au cache
        symbolCache.add(localSymbol, tradingViewSymbol, description || '');
        return NextResponse.json({ 
          success: true,
          message: `Symbole ${localSymbol} ajouté au cache`
        });
      }

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[TradingView Search API] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const action = searchParams.get('action') || 'search';

  try {
    if (action === 'cache') {
      // Retourner le cache complet
      const allSymbols = symbolCache.getAll();
      return NextResponse.json({ symbols: allSymbols });
    }
    
    const result = await tradingViewSearchService.searchSymbol(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[TradingView Search API] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
