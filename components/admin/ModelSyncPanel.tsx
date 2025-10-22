/**
 * Composant pour gérer la synchronisation des modèles OpenRouter
 */

import React, { useState } from 'react';
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';

interface ModelSyncPanelProps {
  onModelsUpdated?: (count: number) => void;
  className?: string;
}

export function ModelSyncPanel({ onModelsUpdated, className = '' }: ModelSyncPanelProps) {
  const {
    models,
    isLoading,
    error,
    lastSync,
    stats,
    refreshModels,
    getProviders,
  } = useOpenRouterModels();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await refreshModels();
      if (onModelsUpdated) {
        onModelsUpdated(models.length);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const providers = getProviders();

  return (
    <div className={`model-sync-panel space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Modèles Gratuits OpenRouter
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Synchronisation automatique depuis l&apos;API OpenRouter
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={isLoading || isSyncing}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                     text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {(isLoading || isSyncing) ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Synchronisation...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualiser</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">
            ❌ Erreur: {error}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </p>
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Providers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Object.keys(stats.byProvider).length}
            </p>
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Avec Vision</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.withVision}
            </p>
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Contexte Max</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(stats.maxContextLength / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      )}

      {/* Last sync */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Dernière synchronisation: {formatLastSync(lastSync)}</span>
        <span>{models.length} modèles chargés</span>
      </div>

      {/* Providers */}
      {providers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Providers disponibles:
          </p>
          <div className="flex flex-wrap gap-2">
            {providers.map(provider => {
              const count = stats?.byProvider[provider] || 0;
              return (
                <span
                  key={provider}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 
                           rounded-full text-xs font-medium"
                >
                  {provider} ({count})
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
