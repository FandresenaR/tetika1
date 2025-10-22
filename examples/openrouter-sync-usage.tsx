/**
 * Exemple d'utilisation du système de synchronisation OpenRouter
 * Ce fichier démontre les différentes façons d'utiliser le système
 */

// ============================================================================
// 1. UTILISATION BASIQUE AVEC LE HOOK REACT
// ============================================================================

import { useState, useEffect } from 'react';
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';
import type { AIModel } from '@/types';

function ModelList() {
  const { models, isLoading, error } = useOpenRouterModels();
  
  if (isLoading) return <div>Chargement des modèles...</div>;
  if (error) return <div>Erreur: {error}</div>;
  
  return (
    <div>
      <h2>{models.length} modèles gratuits disponibles</h2>
      <ul>
        {models.map(model => (
          <li key={model.id}>
            {model.name} - {model.contextLength.toLocaleString()} tokens
            {model.features.vision && ' 👁️'}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// 2. FILTRAGE AVANCÉ
// ============================================================================

function FilteredModels() {
  const { models, filterModels } = useOpenRouterModels();
  
  // Filtrer les modèles Google avec vision
  const googleVisionModels = filterModels({
    provider: 'google',
    hasVision: true
  });
  
  // Filtrer les modèles avec grand contexte
  const longContextModels = filterModels({
    minContextLength: 100000
  });
  
  // Recherche textuelle
  const llamaModels = filterModels({
    search: 'llama'
  });
  
  return (
    <div>
      <h3>Google avec Vision: {googleVisionModels.length}</h3>
      <h3>Grand contexte: {longContextModels.length}</h3>
      <h3>LLaMA: {llamaModels.length}</h3>
    </div>
  );
}

// ============================================================================
// 3. SYNCHRONISATION MANUELLE
// ============================================================================

function AdminPanel() {
  const { refreshModels, lastSync, stats } = useOpenRouterModels();
  const [syncing, setSyncing] = useState(false);
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      await refreshModels();
      alert('Synchronisation réussie !');
    } catch (err) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <div>
      <button onClick={handleSync} disabled={syncing}>
        {syncing ? 'Synchronisation...' : 'Synchroniser'}
      </button>
      <p>Dernière synchro: {lastSync?.toLocaleString()}</p>
      {stats && (
        <div>
          <p>Total: {stats.total}</p>
          <p>Avec vision: {stats.withVision}</p>
          <p>Contexte max: {stats.maxContextLength.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. SÉLECTEUR DE MODÈLE
// ============================================================================

function ModelSelector({ onChange }: { onChange: (modelId: string) => void }) {
  const { models, isLoading, getProviders } = useOpenRouterModels();
  const [selectedProvider, setSelectedProvider] = useState('all');
  
  const providers = getProviders();
  const filteredModels = selectedProvider === 'all'
    ? models
    : models.filter(m => m.id.startsWith(selectedProvider + '/'));
  
  return (
    <div>
      <select 
        value={selectedProvider} 
        onChange={e => setSelectedProvider(e.target.value)}
      >
        <option value="all">Tous les providers</option>
        {providers.map(provider => (
          <option key={provider} value={provider}>{provider}</option>
        ))}
      </select>
      
      <select onChange={e => onChange(e.target.value)} disabled={isLoading}>
        <option value="">Choisir un modèle...</option>
        {filteredModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name} ({(model.contextLength / 1000).toFixed(0)}k)
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// 5. UTILISATION DE L'API DIRECTEMENT
// ============================================================================

async function fetchModelsFromAPI() {
  // Récupération simple
  const response = await fetch('/api/models/sync');
  const data = await response.json();
  console.log('Modèles:', data.models);
  
  // Avec statistiques
  const responseWithStats = await fetch('/api/models/sync?includeStats=true');
  const dataWithStats = await responseWithStats.json();
  console.log('Stats:', dataWithStats.stats);
  
  // Force refresh
  const refreshResponse = await fetch('/api/models/sync?refresh=true');
  const refreshData = await refreshResponse.json();
  console.log('Modèles rafraîchis:', refreshData.models);
}

// ============================================================================
// 6. UTILISATION DU SERVICE DIRECTEMENT (CÔTÉ SERVEUR)
// ============================================================================

import { getCachedFreeModels, getFreeModelsStats } from '@/lib/services/openRouterSync';

async function serverSideUsage() {
  // Récupérer les modèles
  const models = await getCachedFreeModels();
  console.log('Modèles gratuits:', models.length);
  
  // Force refresh
  const freshModels = await getCachedFreeModels(true);
  console.log('Modèles rafraîchis:', freshModels.length);
  
  // Statistiques
  const stats = await getFreeModelsStats();
  console.log('Stats:', stats);
}

// ============================================================================
// 7. INTÉGRATION DANS UN CHAT
// ============================================================================

function ChatWithAutoSync() {
  const { models, filterModels, refreshModels } = useOpenRouterModels();
  const [selectedModel, setSelectedModel] = useState<any>(null);
  
  // Synchronisation automatique toutes les 6 heures
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('Auto-sync des modèles...');
      await refreshModels();
    }, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshModels]);
  
  // Sélectionner automatiquement le premier modèle
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel]);
  
  // Filtrer pour n'afficher que les modèles recommandés
  const recommendedModels = filterModels({
    minContextLength: 50000 // Au moins 50k tokens
  }).slice(0, 10); // Top 10
  
  return (
    <div>
      <h3>Modèles recommandés</h3>
      <select onChange={e => setSelectedModel(models.find(m => m.id === e.target.value) || null)}>
        {recommendedModels.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      
      {selectedModel && (
        <div>
          <p>Contexte: {selectedModel.contextLength.toLocaleString()} tokens</p>
          <p>Streaming: {selectedModel.features?.streaming ? 'Oui' : 'Non'}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. COMPOSANT AVEC PANEL D'ADMINISTRATION
// ============================================================================

import { ModelSyncPanel } from '@/components/admin/ModelSyncPanel';

function SettingsPage() {
  const handleModelsUpdated = (count: number) => {
    console.log(`${count} modèles mis à jour`);
    // Afficher une notification, etc.
  };
  
  return (
    <div className="settings-page">
      <h1>Paramètres</h1>
      
      <section>
        <h2>Synchronisation des modèles</h2>
        <ModelSyncPanel 
          onModelsUpdated={handleModelsUpdated}
          className="my-4"
        />
      </section>
    </div>
  );
}

export {
  ModelList,
  FilteredModels,
  AdminPanel,
  ModelSelector,
  ChatWithAutoSync,
  SettingsPage,
  fetchModelsFromAPI,
  serverSideUsage,
};
