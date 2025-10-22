/**
 * Hook React pour gérer la synchronisation automatique des modèles OpenRouter
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCachedFreeModels,
  invalidateModelCache,
  getFreeModelsStats,
  saveFreeModelsToLocalStorage,
  loadFreeModelsFromLocalStorage,
  convertToAppModel,
} from '@/lib/services/openRouterSync';

export function useOpenRouterModels() {
  const [models, setModels] = useState<ReturnType<typeof convertToAppModel>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    new: number;
    byProvider: Record<string, number>;
    byCategory: Record<string, number>;
    withVision: number;
    averageContextLength: number;
    maxContextLength: number;
  } | null>(null);

  /**
   * Charge les modèles (depuis le cache ou l'API)
   */
  const loadModels = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier la fraîcheur du cache localStorage
      const lastSyncTimestamp = localStorage.getItem('tetika-models-last-sync');
      const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 heures
      const cacheIsStale = !lastSyncTimestamp || 
        (Date.now() - parseInt(lastSyncTimestamp)) > cacheMaxAge;

      // Essayer de charger depuis localStorage si le cache est frais
      if (!forceRefresh && !cacheIsStale) {
        const cachedModels = loadFreeModelsFromLocalStorage();
        if (cachedModels && cachedModels.length > 0) {
          console.log('[useOpenRouterModels] Using fresh localStorage cache');
          setModels(cachedModels);
          setLastSync(new Date(parseInt(lastSyncTimestamp)));
          setIsLoading(false);
          
          // Charger les stats en arrière-plan
          getFreeModelsStats().then(setStats).catch(console.error);
          
          return;
        }
      }

      // Cache périmé ou force refresh - charger depuis l'API
      console.log('[useOpenRouterModels] Cache stale or force refresh, loading from API...');
      const fetchedModels = await getCachedFreeModels(true);
      
      setModels(fetchedModels);
      const now = new Date();
      setLastSync(now);
      
      // Sauvegarder dans localStorage avec timestamp
      saveFreeModelsToLocalStorage(fetchedModels);
      localStorage.setItem('tetika-models-last-sync', now.getTime().toString());
      
      // Charger les stats
      const fetchedStats = await getFreeModelsStats();
      setStats(fetchedStats);
      
      console.log('[useOpenRouterModels] Successfully synced', fetchedModels.length, 'models');
      
    } catch (err) {
      console.error('[useOpenRouterModels] Error loading models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load models');
      
      // En cas d'erreur, essayer de charger depuis localStorage même si périmé
      const cachedModels = loadFreeModelsFromLocalStorage();
      if (cachedModels && cachedModels.length > 0) {
        console.log('[useOpenRouterModels] Fallback to stale cache after error');
        setModels(cachedModels);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Force un refresh des modèles
   */
  const refreshModels = useCallback(async () => {
    invalidateModelCache();
    await loadModels(true);
  }, [loadModels]);

  /**
   * Charge les modèles au montage du composant
   */
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  /**
   * Filtre les modèles par critères
   */
  const filterModels = useCallback((filters: {
    provider?: string;
    category?: 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research';
    hasVision?: boolean;
    minContextLength?: number;
    search?: string;
    onlyNew?: boolean;
  }) => {
    return models.filter(model => {
      if (filters.provider) {
        const modelProvider = model.id.split('/')[0];
        if (modelProvider !== filters.provider) return false;
      }

      if (filters.category) {
        if (model.category !== filters.category) return false;
      }

      if (filters.onlyNew) {
        if (!model.isNew) return false;
      }

      if (filters.hasVision !== undefined) {
        if (model.features.vision !== filters.hasVision) return false;
      }

      if (filters.minContextLength) {
        if (model.contextLength < filters.minContextLength) return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = model.name.toLowerCase().includes(searchLower);
        const idMatch = model.id.toLowerCase().includes(searchLower);
        const descMatch = model.description.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !idMatch && !descMatch) return false;
      }

      return true;
    });
  }, [models]);

  /**
   * Obtient les providers uniques
   */
  const getProviders = useCallback(() => {
    const providers = new Set<string>();
    models.forEach(model => {
      const provider = model.id.split('/')[0];
      providers.add(provider);
    });
    return Array.from(providers).sort();
  }, [models]);

  return {
    models,
    isLoading,
    error,
    lastSync,
    stats,
    refreshModels,
    filterModels,
    getProviders,
  };
}
