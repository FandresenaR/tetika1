import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { AIModel } from '@/types';
import { getAllModels, getAvailableCategories } from '@/lib/models';
import { isModelNew } from '@/lib/services/openRouterSync';
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';

interface ModelSelectorProps {
  selectedModelId?: string;
  onModelSelect?: (modelId: string) => void;
  currentModel?: string;
  onModelChange?: (model: string) => void;
  theme?: 'dark' | 'light';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onModelSelect,
  currentModel,
  onModelChange,
  theme = 'dark',
}) => {
  // État pour stocker la catégorie sélectionnée pour le filtre
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  // État pour stocker le terme de recherche
  const [searchTerm, setSearchTerm] = useState('');
  // Filtres spéciaux
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyMultimodal, setShowOnlyMultimodal] = useState(false);
  
  // Utiliser le hook pour charger les modèles depuis OpenRouter
  const { 
    models: openRouterModels, 
    isLoading, 
    refreshModels 
  } = useOpenRouterModels();
  
  // Obtenir les modèles statiques comme fallback
  const staticModels = getAllModels();
  const availableCategories = getAvailableCategories();
  
  // Utiliser les modèles OpenRouter s'ils sont disponibles, sinon fallback sur statiques
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allModels: any[] = openRouterModels.length > 0 ? openRouterModels : staticModels;
  
  // Fonction pour actualiser les modèles
  const handleRefreshModels = async () => {
    try {
      // Vider le cache localStorage
      localStorage.removeItem('tetika-free-models');
      localStorage.removeItem('tetika-models-last-sync');
      
      // Utiliser le hook pour rafraîchir
      await refreshModels();
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  };
  
  // Déterminer quelle prop utiliser pour le modèle sélectionné
  const effectiveSelectedModelId = selectedModelId || currentModel || '';
  const handleModelSelection = onModelSelect || onModelChange || (() => {});
  
  // Traduction des catégories pour l'affichage
  const categoryTranslations: Record<string, string> = {
    'general': 'Général',
    'coding': 'Programmation',
    'vision': 'Vision',
    'creative': 'Créativité',
    'reasoning': 'Raisonnement',
    'research': 'Recherche'
  };
  
  // Fonction pour filtrer les modèles selon les critères actuels
  const getFilteredModels = () => {
    let filtered = allModels;
    
    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((model: any) => 
        model.name.toLowerCase().includes(term) || 
        model.description.toLowerCase().includes(term)
      );
    }
    
    // Filtre par catégorie si activé
    if (categoryFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((model: any) => model.category === categoryFilter);
    }
    
    // Filtre "Nouveau" - modèles ajoutés il y a moins de 3 mois
    if (showOnlyNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((model: any) => isModelNew(model.isNew));
    }
    
    // Filtre "Multimodal" - modèles avec vision
    if (showOnlyMultimodal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((model: any) => model.features?.rag && model.category === 'vision');
    }
    
    return filtered;
  };
  
  const filteredModels = getFilteredModels();
  
  // Split models by provider and free status
  const openRouterFreeModels = filteredModels.filter(model => 
    model.provider === 'openrouter' && model.free
  );
  
  const openRouterPaidModels = filteredModels.filter(model => 
    model.provider === 'openrouter' && !model.free
  );
  
  const notDiamondModels = filteredModels.filter(model => 
    model.provider === 'notdiamond'
  );
  
  // Réinitialiser tous les filtres
  const handleResetFilters = () => {
    setCategoryFilter(null);
    setSearchTerm('');
    setShowOnlyNew(false);
    setShowOnlyMultimodal(false);
  };
  
  // Compter les modèles nouveaux et multimodaux
  const newModelsCount = allModels.filter(m => isModelNew(m.isNew)).length;
  const multimodalModelsCount = allModels.filter(m => m.features.rag && m.category === 'vision').length;

  // Classes conditionnelles selon le thème
  const sectionBgClass = theme === 'dark' 
    ? 'bg-gray-900/70' 
    : 'bg-white';
    
  const inputBgClass = theme === 'dark' 
    ? 'bg-gray-900/70 border-cyan-800/30 text-gray-200 placeholder-gray-500' 
    : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400';
    
  const categoryButtonClass = theme === 'dark'
    ? 'bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50'
    : 'bg-blue-100/50 text-blue-700 hover:bg-blue-200/50';
    
  const categoryActiveClass = theme === 'dark'
    ? 'bg-cyan-700 text-white'
    : 'bg-blue-600 text-white';
    
  const sectionHeaderClass = theme === 'dark'
    ? 'text-cyan-300/70'
    : 'text-blue-700';
    
  const freeTagClass = theme === 'dark'
    ? 'bg-green-900/50 text-green-300'
    : 'bg-green-100 text-green-700';
    return (
    <div className={`p-4 max-h-[90vh] overflow-y-auto ${sectionBgClass} rounded-lg transition-colors duration-300`}>
      {/* Modèle actuellement sélectionné */}
      {effectiveSelectedModelId && (() => {
        const selectedModel = allModels.find(model => model.id === effectiveSelectedModelId);
        return selectedModel ? (
          <div className={`mb-4 p-3 rounded-lg border-2 ${theme === 'dark' 
            ? 'bg-cyan-950/30 border-cyan-700/50 text-cyan-200' 
            : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-cyan-300/70' : 'text-blue-600'}`}>
                  Modèle actuel
                </p>
                <h3 className="font-medium text-sm mb-1">{selectedModel.name}</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-cyan-300/60' : 'text-blue-600/70'}`}>
                  {selectedModel.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' 
                    ? 'bg-gray-800/50 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'}`}>
                    {selectedModel.provider === 'openrouter' ? 'OpenRouter' : selectedModel.provider === 'notdiamond' ? 'NotDiamond' : selectedModel.provider}
                  </span>
                  {selectedModel.free && (
                    <span className={`text-xs px-2 py-1 rounded-full ${freeTagClass}`}>
                      Gratuit
                    </span>
                  )}
                  {selectedModel.category && (
                    <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' 
                      ? 'bg-indigo-900/50 text-indigo-300' 
                      : 'bg-indigo-100 text-indigo-700'}`}>
                      {categoryTranslations[selectedModel.category] || selectedModel.category}
                    </span>
                  )}
                </div>
              </div>
              <div className={`ml-3 p-2 rounded-full ${theme === 'dark' ? 'bg-cyan-700/50' : 'bg-blue-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        ) : null;
      })()}
      
      {/* Barre de recherche et bouton actualiser */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className={`flex items-center border rounded-lg overflow-hidden flex-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-200 ${inputBgClass}`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className={`px-2 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
                aria-label="Effacer la recherche"
              >
                &times;
              </button>
            )}
          </div>
          
          {/* Bouton Actualiser */}
          <button
            onClick={handleRefreshModels}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white'
            } disabled:cursor-not-allowed`}
            title="Actualiser la liste des modèles depuis OpenRouter"
          >
            <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} size={16} />
            <span className="text-sm font-medium">
              {isLoading ? 'Actualisation...' : 'Actualiser'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Filtres spéciaux (Nouveau & Multimodal) */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'}`}>
            Filtres rapides
          </h4>
          {(categoryFilter || searchTerm || showOnlyNew || showOnlyMultimodal) && (
            <button 
              onClick={handleResetFilters}
              className={`text-xs ${theme === 'dark' ? 'text-cyan-300 hover:text-cyan-100' : 'text-blue-600 hover:text-blue-800'}`}
            >
              Réinitialiser
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Filtre Nouveau */}
          <button
            onClick={() => setShowOnlyNew(!showOnlyNew)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              showOnlyNew
                ? theme === 'dark'
                  ? 'bg-green-700 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'bg-green-600 text-white shadow-md'
                : theme === 'dark'
                  ? 'bg-green-950/50 text-green-300 hover:bg-green-900/50 border border-green-700/30'
                  : 'bg-green-100/50 text-green-700 hover:bg-green-200/50 border border-green-300'
            }`}
          >
            <span className="text-base">🆕</span>
            <span>Nouveau</span>
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              showOnlyNew
                ? 'bg-white/20'
                : theme === 'dark'
                  ? 'bg-green-900/50'
                  : 'bg-green-200'
            }`}>
              {newModelsCount}
            </span>
          </button>
          
          {/* Filtre Multimodal */}
          <button
            onClick={() => setShowOnlyMultimodal(!showOnlyMultimodal)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              showOnlyMultimodal
                ? theme === 'dark'
                  ? 'bg-purple-700 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-purple-600 text-white shadow-md'
                : theme === 'dark'
                  ? 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/50 border border-purple-700/30'
                  : 'bg-purple-100/50 text-purple-700 hover:bg-purple-200/50 border border-purple-300'
            }`}
          >
            <span className="text-base">👁️</span>
            <span>Multimodal</span>
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              showOnlyMultimodal
                ? 'bg-white/20'
                : theme === 'dark'
                  ? 'bg-purple-900/50'
                  : 'bg-purple-200'
            }`}>
              {multimodalModelsCount}
            </span>
          </button>
        </div>
      </div>
      
      {/* Filtres par catégorie */}
      <div className="mb-6">
        <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'} mb-2`}>
          Par spécialité
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category === categoryFilter ? null : category)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                categoryFilter === category
                  ? categoryActiveClass
                  : categoryButtonClass
              }`}
            >
              {categoryTranslations[category] || category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Statistiques de recherche */}
      {(searchTerm || categoryFilter || showOnlyNew || showOnlyMultimodal) && (
        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          {filteredModels.length} modèle(s) trouvé(s)
          {searchTerm && <span> pour &quot;{searchTerm}&quot;</span>}
          {categoryFilter && <span> dans la catégorie &quot;{categoryTranslations[categoryFilter]}&quot;</span>}
          {showOnlyNew && <span> · <span className="text-green-400">Nouveaux uniquement</span></span>}
          {showOnlyMultimodal && <span> · <span className="text-purple-400">Multimodaux uniquement</span></span>}
        </div>
      )}
      
      <div className="space-y-6">
        {openRouterFreeModels.length > 0 && (
          <div className={`${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'} p-4 rounded-lg`}>
            <h4 className={`text-sm uppercase tracking-wider ${theme === 'dark' ? 'text-green-400' : 'text-green-700'} mb-3 flex items-center`}>
              <span>OpenRouter (Gratuit)</span>
              <span className={`ml-2 text-xs ${freeTagClass} px-2 py-0.5 rounded-full`}>
                Sans API key
              </span>
            </h4>
            <div className="space-y-3">
              {openRouterFreeModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={effectiveSelectedModelId === model.id}
                  onSelect={() => handleModelSelection(model.id)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
        
        {openRouterPaidModels.length > 0 && (
          <div className={`${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'} p-4 rounded-lg`}>
            <h4 className={`text-sm uppercase tracking-wider ${sectionHeaderClass} mb-3`}>
              OpenRouter (Standard)
            </h4>
            <div className="space-y-3">
              {openRouterPaidModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={effectiveSelectedModelId === model.id}
                  onSelect={() => handleModelSelection(model.id)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
        
        {notDiamondModels.length > 0 && (
          <div className={`${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'} p-4 rounded-lg`}>
            <h4 className={`text-sm uppercase tracking-wider ${sectionHeaderClass} mb-3`}>
              NotDiamond (Premium)
            </h4>
            <div className="space-y-3">
              {notDiamondModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={effectiveSelectedModelId === model.id}
                  onSelect={() => handleModelSelection(model.id)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Message si aucun modèle ne correspond aux filtres */}
        {filteredModels.length === 0 && (
          <div className={`py-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>Aucun modèle ne correspond à vos critères de recherche.</p>
            <button 
              onClick={handleResetFilters}
              className={`mt-2 ${theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-500'} underline`}
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  theme?: 'dark' | 'light';
}

const ModelCard: React.FC<ModelCardProps> = ({ model, isSelected, onSelect, theme = 'dark' }) => {
  // Définir les couleurs pour les différentes catégories
  const getCategoryColor = (category?: string) => {
    const darkModeColors: Record<string, string> = {
      'coding': 'bg-purple-900/40 text-purple-300',
      'vision': 'bg-yellow-900/40 text-yellow-300',
      'creative': 'bg-pink-900/40 text-pink-300',
      'reasoning': 'bg-blue-900/40 text-blue-300',
      'research': 'bg-green-900/40 text-green-300',
      'general': 'bg-gray-800/40 text-gray-300'
    };
    
    const lightModeColors: Record<string, string> = {
      'coding': 'bg-purple-100 text-purple-700',
      'vision': 'bg-yellow-100 text-yellow-700',
      'creative': 'bg-pink-100 text-pink-700',
      'reasoning': 'bg-blue-100 text-blue-700',
      'research': 'bg-green-100 text-green-700',
      'general': 'bg-gray-200 text-gray-700'
    };
    
    if (!category) return theme === 'dark' ? 'bg-gray-800/40 text-gray-300' : 'bg-gray-200 text-gray-700';
    
    return theme === 'dark' 
      ? darkModeColors[category] || darkModeColors['general']
      : lightModeColors[category] || lightModeColors['general'];
  };
  
  // Traduction des catégories pour l'affichage
  const getCategoryName = (category?: string) => {
    if (!category) return '';
    
    const translations: Record<string, string> = {
      'general': 'Général',
      'coding': 'Programmation',
      'vision': 'Vision',
      'creative': 'Créativité',
      'reasoning': 'Raisonnement',
      'research': 'Recherche'
    };
    
    return translations[category] || category;
  };
  
  // Classes conditionnelles pour la carte de modèle selon le thème
  const cardClass = theme === 'dark'
    ? isSelected 
      ? 'bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
      : 'hover:bg-blue-950/30 border-transparent hover:border-cyan-500/30'
    : isSelected
      ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-500/70 shadow-sm'
      : 'hover:bg-blue-50 border-transparent hover:border-blue-200';
  
  // Classes supplémentaires pour les badges selon le thème
  const featureBadgeClass = {
    streaming: theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
    rag: theme === 'dark' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
    code: theme === 'dark' ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'
  };
  
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${cardClass} border`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-wrap gap-2">
          <h5 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{model.name}</h5>
          {isModelNew(model.isNew) && (
            <span className={`text-xs font-bold ${theme === 'dark' ? 'bg-green-900/40 text-green-300 border border-green-600/30' : 'bg-green-100 text-green-700 border border-green-300'} px-2 py-0.5 rounded`}>
              NEW
            </span>
          )}
          {model.free && (
            <span className={`text-xs ${theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'} px-1.5 py-0.5 rounded-full`}>
              Gratuit
            </span>
          )}
        </div>
        <div className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-cyan-950/50 text-cyan-300' : 'bg-blue-100/60 text-blue-700'}`}>
          {model.provider === 'openrouter' ? 'OpenRouter' : 'NotDiamond'}
        </div>
      </div>
      
      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{model.description}</p>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {/* Ajouter la catégorie comme premier badge */}
        {model.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(model.category)}`}>
            {getCategoryName(model.category)}
          </span>
        )}
        
        {model.features.streaming && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${featureBadgeClass.streaming}`}>
            Streaming
          </span>
        )}
        {model.features.rag && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${featureBadgeClass.rag}`}>
            RAG
          </span>
        )}
        {model.features.codeCompletion && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${featureBadgeClass.code}`}>
            Code
          </span>
        )}
      </div>
    </div>
  );
};