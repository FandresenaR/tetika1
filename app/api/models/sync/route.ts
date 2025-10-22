import { NextRequest, NextResponse } from 'next/server';
import {
  fetchOpenRouterModels,
  filterFreeModels,
  convertToAppModel,
  sortModelsByQuality,
} from '@/lib/services/openRouterSync';

/**
 * GET /api/models/sync
 * Récupère la liste des modèles gratuits depuis OpenRouter
 * 
 * Query params:
 * - refresh: force refresh (true/false)
 * - includeStats: inclure les statistiques (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    console.log('[Models Sync API] Fetching models, forceRefresh:', forceRefresh);

    // Récupérer tous les modèles
    const allModels = await fetchOpenRouterModels();
    
    // Filtrer les modèles gratuits
    const freeModels = filterFreeModels(allModels);
    
    // Convertir au format de l'application
    const appModels = freeModels.map(convertToAppModel);
    
    // Trier par qualité
    const sortedModels = sortModelsByQuality(appModels);

    // Préparer la réponse
    const response: {
      success: boolean;
      models: typeof sortedModels;
      count: number;
      timestamp: string;
      stats?: {
        total: number;
        totalAvailable: number;
        free: number;
        byProvider: Record<string, number>;
        withVision: number;
        averageContextLength: number;
        maxContextLength: number;
      };
    } = {
      success: true,
      models: sortedModels,
      count: sortedModels.length,
      timestamp: new Date().toISOString(),
    };

    // Ajouter les statistiques si demandées
    if (includeStats) {
      const stats = {
        total: sortedModels.length,
        totalAvailable: allModels.length,
        free: sortedModels.length,
        byProvider: {} as Record<string, number>,
        withVision: sortedModels.filter(m => m.features.vision).length,
        averageContextLength: Math.round(
          sortedModels.reduce((sum, m) => sum + m.contextLength, 0) / sortedModels.length
        ),
        maxContextLength: Math.max(...sortedModels.map(m => m.contextLength)),
      };

      // Compter par provider
      sortedModels.forEach(model => {
        const provider = model.id.split('/')[0];
        stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
      });

      response.stats = stats;
    }

    console.log('[Models Sync API] Successfully returned', sortedModels.length, 'models');

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Models Sync API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
        models: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/sync
 * Déclenche une synchronisation forcée des modèles
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Models Sync API] Force sync requested');

    // Récupérer et traiter les modèles
    const allModels = await fetchOpenRouterModels();
    const freeModels = filterFreeModels(allModels);
    const appModels = freeModels.map(convertToAppModel);
    const sortedModels = sortModelsByQuality(appModels);

    return NextResponse.json({
      success: true,
      message: 'Models synchronized successfully',
      count: sortedModels.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Models Sync API] Sync error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
