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
      // Essayer de charger depuis localStorage d'abord
      if (!forceRefresh) {
        const cachedModels = loadFreeModelsFromLocalStorage();
        if (cachedModels && cachedModels.length > 0) {
          setModels(cachedModels);
          setLastSync(new Date());
          setIsLoading(false);
          
          // Charger les stats en arrière-plan
          getFreeModelsStats().then(setStats).catch(console.error);
          
          return;
        }
      }

      // Charger depuis l'API
      console.log('[useOpenRouterModels] Loading models from API...');
      const fetchedModels = await getCachedFreeModels(forceRefresh);
      
      setModels(fetchedModels);
      setLastSync(new Date());
      
      // Sauvegarder dans localStorage
      saveFreeModelsToLocalStorage(fetchedModels);
      
      // Charger les stats
      const fetchedStats = await getFreeModelsStats();
      setStats(fetchedStats);
      
    } catch (err) {
      console.error('[useOpenRouterModels] Error loading models:', err);
      setError(err instanceof Error ? err.message : 'Failed to load models');
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
