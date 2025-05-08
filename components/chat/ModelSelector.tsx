import React, { useState } from 'react';
import { AIModel } from '@/types';
import { getAllModels, getAvailableCategories } from '@/lib/models';

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
  
  const allModels = getAllModels();
  const availableCategories = getAvailableCategories();
  
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
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(term) || 
        model.description.toLowerCase().includes(term)
      );
    }
    
    // Filtre par catégorie si activé
    if (categoryFilter) {
      filtered = filtered.filter(model => model.category === categoryFilter);
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
  };

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
      {/* Barre de recherche */}
      <div className="mb-4">
        <div className={`flex items-center border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
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
      </div>
      
      {/* Filtres par catégorie */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'}`}>
            Filtrer par spécialité
          </h4>
          {(categoryFilter || searchTerm) && (
            <button 
              onClick={handleResetFilters}
              className={`text-xs ${theme === 'dark' ? 'text-cyan-300 hover:text-cyan-100' : 'text-blue-600 hover:text-blue-800'}`}
            >
              Réinitialiser
            </button>
          )}
        </div>
        
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
      {(searchTerm || categoryFilter) && (
        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          {filteredModels.length} modèle(s) trouvé(s)
          {searchTerm && <span> pour &quot;{searchTerm}&quot;</span>}
          {categoryFilter && <span> dans la catégorie &quot;{categoryTranslations[categoryFilter]}&quot;</span>}
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
        <div className="flex items-center">
          <h5 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{model.name}</h5>
          {model.free && (
            <span className={`ml-2 text-xs ${theme === 'dark' ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'} px-1.5 py-0.5 rounded-full`}>
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