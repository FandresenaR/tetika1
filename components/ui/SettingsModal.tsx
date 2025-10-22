import React, { useState, useEffect } from 'react';
import { FiSettings, FiX, FiCheck, FiEye, FiEyeOff, FiSearch, FiInfo, FiRefreshCw, FiDatabase } from 'react-icons/fi';
import { RAG_PROVIDERS, DEFAULT_RAG_PROVIDER } from '@/lib/rag-providers';
import { useOpenRouterModels } from '@/lib/hooks/useOpenRouterModels';
import { isModelNew } from '@/lib/services/openRouterSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKeyInfo {
  key: string;
  status: 'valid' | 'invalid' | 'checking' | 'unknown';
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [openRouterKey, setOpenRouterKey] = useState<ApiKeyInfo>({ key: '', status: 'unknown' });
  const [notDiamondKey, setNotDiamondKey] = useState<ApiKeyInfo>({ key: '', status: 'unknown' });
  const [serpApiKey, setSerpApiKey] = useState<ApiKeyInfo>({ key: '', status: 'unknown' });
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showNotDiamondKey, setShowNotDiamondKey] = useState(false);  const [showSerpApiKey, setShowSerpApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'api' | 'rag' | 'models'>('api');
  const [selectedRAGProvider, setSelectedRAGProvider] = useState<string>(DEFAULT_RAG_PROVIDER);
  const [ragApiKeys, setRagApiKeys] = useState<Record<string, string>>({});
  
  // Hook pour la synchronisation des modèles
  const {
    models,
    isLoading: isLoadingModels,
    error: modelsError,
    lastSync,
    stats,
    refreshModels,
    getProviders,
  } = useOpenRouterModels();

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);
  const loadApiKeys = () => {
    // Charger les clés API depuis le localStorage
    const savedOpenRouterKey = localStorage.getItem('tetika-openrouter-key') || '';
    const savedNotDiamondKey = localStorage.getItem('tetika-notdiamond-key') || '';
    const savedSerpApiKey = localStorage.getItem('tetika-serpapi-key') || '';
    
    setOpenRouterKey({ 
      key: savedOpenRouterKey, 
      status: savedOpenRouterKey ? 'valid' : 'unknown' 
    });
    
    setNotDiamondKey({ 
      key: savedNotDiamondKey, 
      status: savedNotDiamondKey ? 'valid' : 'unknown' 
    });
    
    setSerpApiKey({ 
      key: savedSerpApiKey, 
      status: savedSerpApiKey ? 'valid' : 'unknown' 
    });

    // Load RAG provider settings
    const savedRAGProvider = localStorage.getItem('tetika-rag-provider') || DEFAULT_RAG_PROVIDER;
    setSelectedRAGProvider(savedRAGProvider);

    // Load RAG API keys
    const ragKeys: Record<string, string> = {};
    RAG_PROVIDERS.forEach(provider => {
      if (provider.requiresApiKey) {
        ragKeys[provider.id] = localStorage.getItem(`tetika-rag-${provider.id}-key`) || '';
      }
    });
    setRagApiKeys(ragKeys);
  };


  const handleSaveApiKey = (type: 'openrouter' | 'notdiamond' | 'serpapi', key: string) => {
    if (type === 'openrouter') {
      localStorage.setItem('tetika-openrouter-key', key);
      setOpenRouterKey({ key, status: key ? 'valid' : 'unknown' });
    } else if (type === 'notdiamond') {
      localStorage.setItem('tetika-notdiamond-key', key);
      setNotDiamondKey({ key, status: key ? 'valid' : 'unknown' });
    } else if (type === 'serpapi') {
      localStorage.setItem('tetika-serpapi-key', key);
      setSerpApiKey({ key, status: key ? 'valid' : 'unknown' });
    }
    
    // Effet de notification visuelle temporaire
    const button = document.getElementById(`save-${type}`);
    if (button) {
      button.classList.add('bg-green-600');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      
      setTimeout(() => {
        button.classList.remove('bg-green-600');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      }, 1500);    }
  };
  const handleRAGProviderChange = (providerId: string) => {
    setSelectedRAGProvider(providerId);
    localStorage.setItem('tetika-rag-provider', providerId);
    
    // Déclencher un événement personnalisé pour notifier le changement
    window.dispatchEvent(new CustomEvent('rag-provider-changed', { 
      detail: { providerId } 
    }));
  };

  const handleRAGApiKeySave = (providerId: string, apiKey: string) => {
    setRagApiKeys(prev => ({ ...prev, [providerId]: apiKey }));
    localStorage.setItem(`tetika-rag-${providerId}-key`, apiKey);
  };

  const getRagKeyStatus = (providerId: string): 'valid' | 'invalid' | 'unknown' => {
    const key = ragApiKeys[providerId];
    return key && key.length > 0 ? 'valid' : 'unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiSettings className="mr-2" size={20} />
            Paramètres
          </h2>          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            title="Fermer les paramètres"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex mb-6 border-b border-gray-800 overflow-x-auto">
          <button
            className={`px-4 py-2 whitespace-nowrap ${activeTab === 'account' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('account')}
          >
            Compte
          </button>          <button
            className={`px-4 py-2 whitespace-nowrap ${activeTab === 'api' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('api')}
          >
            Clés API
          </button>
          <button
            className={`px-4 py-2 whitespace-nowrap ${activeTab === 'rag' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('rag')}
          >
            <FiSearch className="inline-block mr-1" />
            Recherche Web
          </button>
          <button
            className={`px-4 py-2 whitespace-nowrap ${activeTab === 'models' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('models')}
          >
            <FiDatabase className="inline-block mr-1" />
            Modèles
          </button>
        </div>

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-white">U</span>
              </div>
              <h3 className="text-lg font-medium text-white">Utilisateur</h3>
              <p className="text-gray-400 text-sm mt-1">Connexion locale</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-4">
                Tetika fonctionne actuellement avec vos clés API locales. 
                Aucun compte utilisateur n&apos;est requis.
              </p>
              <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors">
                Créer un compte (bientôt disponible)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* OpenRouter API Key */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-white">OpenRouter API</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    openRouterKey.status === 'valid' ? 'bg-green-500 animate-pulse' : 
                    openRouterKey.status === 'invalid' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-sm text-gray-300">
                    {openRouterKey.status === 'valid' ? 'Opérationnelle' : 
                     openRouterKey.status === 'invalid' ? 'Non valide' : 'Non définie'}
                  </span>
                </div>
              </div>
              
              <div className="flex mt-2">
                <div className="relative flex-grow">
                  <input
                    type={showOpenRouterKey ? "text" : "password"}
                    value={openRouterKey.key}
                    onChange={(e) => setOpenRouterKey({ ...openRouterKey, key: e.target.value })}
                    placeholder="Saisir votre clé API OpenRouter"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    title={showOpenRouterKey ? "Masquer la clé" : "Afficher la clé"}
                  >
                    {showOpenRouterKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>                <button
                  id="save-openrouter"
                  onClick={() => handleSaveApiKey('openrouter', openRouterKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
                  title="Sauvegarder la clé OpenRouter"
                >
                  <FiCheck size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Requis pour accéder aux modèles d&apos;IA
              </p>
            </div>

            {/* NotDiamond API Key */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-white">NotDiamond API</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    notDiamondKey.status === 'valid' ? 'bg-green-500' : 
                    notDiamondKey.status === 'invalid' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-sm text-gray-300">
                    {notDiamondKey.status === 'valid' ? 'Opérationnelle' : 
                     notDiamondKey.status === 'invalid' ? 'Non valide' : 'Non définie'}
                  </span>
                </div>
              </div>
              
              <div className="flex mt-2">
                <div className="relative flex-grow">
                  <input
                    type={showNotDiamondKey ? "text" : "password"}
                    value={notDiamondKey.key}
                    onChange={(e) => setNotDiamondKey({ ...notDiamondKey, key: e.target.value })}
                    placeholder="Saisir votre clé API NotDiamond"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />                  <button
                    type="button"
                    onClick={() => setShowNotDiamondKey(!showNotDiamondKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    title={showNotDiamondKey ? "Masquer la clé" : "Afficher la clé"}
                  >
                    {showNotDiamondKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>                <button
                  onClick={() => handleSaveApiKey('notdiamond', notDiamondKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
                  title="Sauvegarder la clé NotDiamond"
                >
                  <FiCheck size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Optionnelle - Pour les fonctionnalités d&apos;analyse avancées
              </p>
            </div>

            {/* SerpApi API Key */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-white">SerpAPI</h3>
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    serpApiKey.status === 'valid' ? 'bg-green-500' : 
                    serpApiKey.status === 'invalid' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-sm text-gray-300">
                    {serpApiKey.status === 'valid' ? 'Opérationnelle' : 
                     serpApiKey.status === 'invalid' ? 'Non valide' : 'Non définie'}
                  </span>
                </div>
              </div>
              
              <div className="flex mt-2">
                <div className="relative flex-grow">
                  <input
                    type={showSerpApiKey ? "text" : "password"}
                    value={serpApiKey.key}
                    onChange={(e) => setSerpApiKey({ ...serpApiKey, key: e.target.value })}
                    placeholder="Saisir votre clé API SerpApi"
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />                  <button
                    type="button"
                    onClick={() => setShowSerpApiKey(!showSerpApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    title={showSerpApiKey ? "Masquer la clé" : "Afficher la clé"}
                  >
                    {showSerpApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>                <button
                  onClick={() => handleSaveApiKey('serpapi', serpApiKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
                  title="Sauvegarder la clé SerpAPI"
                >
                  <FiCheck size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Optionnelle - Pour les recherches web en temps réel
              </p>
            </div>          </div>
        )}

        {activeTab === 'rag' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <FiSearch className="text-cyan-400 mr-2" />
                <h3 className="font-medium text-white">Fournisseurs de recherche web</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Choisissez votre méthode préférée pour les recherches web et RAG. 
                SerpAPI sera utilisé en dernier recours.
              </p>
              
              <div className="space-y-3">
                {RAG_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`provider-${provider.id}`}
                          name="rag-provider"
                          value={provider.id}
                          checked={selectedRAGProvider === provider.id}
                          onChange={() => handleRAGProviderChange(provider.id)}
                          className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500 focus:ring-2"
                        />
                        <label 
                          htmlFor={`provider-${provider.id}`}
                          className="ml-3 text-white font-medium cursor-pointer"
                        >
                          {provider.name}
                        </label>
                        {!provider.requiresApiKey && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Gratuit
                          </span>
                        )}
                      </div>
                      {provider.requiresApiKey && (
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            getRagKeyStatus(provider.id) === 'valid' ? 'bg-green-500' : 'bg-gray-500'
                          }`}></span>
                          <span className="text-sm text-gray-300">
                            {getRagKeyStatus(provider.id) === 'valid' ? 'Configuré' : 'Non configuré'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">{provider.description}</p>
                    
                    {provider.requiresApiKey && (
                      <div className="flex mt-2">
                        <input
                          type="password"
                          value={ragApiKeys[provider.id] || ''}
                          onChange={(e) => setRagApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={`Saisir votre ${provider.apiKeyLabel}`}
                          className="flex-grow bg-gray-700 text-white border border-gray-600 rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleRAGApiKeySave(provider.id, ragApiKeys[provider.id] || '')}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
                          title="Sauvegarder la clé API"
                        >
                          <FiCheck size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
                <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-3 mt-4">
                <div className="flex items-start">
                  <FiInfo className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Ordre de priorité automatique :</p>                    <p className="text-blue-300 mb-2">
                      Le système utilisera les fournisseurs dans l&apos;ordre de priorité. 
                      Les fournisseurs sans clé API valide seront ignorés.
                      SerpAPI sera toujours disponible en dernier recours.
                    </p>
                    <p className="text-sm text-green-300 bg-green-900/20 rounded px-2 py-1">
                      💡 <strong>Fetch MCP</strong> est recommandé pour commencer : gratuit, rapide et sans configuration !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FiDatabase className="text-cyan-400 mr-2" />
                  <h3 className="font-medium text-white">Modèles Gratuits OpenRouter</h3>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await refreshModels();
                      
                      // Déclencher un événement pour notifier les autres composants
                      window.dispatchEvent(new CustomEvent('models-synced', { 
                        detail: { 
                          count: models.length,
                          timestamp: new Date().toISOString()
                        } 
                      }));
                      
                      // Notification visuelle temporaire
                      const button = document.activeElement as HTMLButtonElement;
                      if (button) {
                        const originalText = button.innerHTML;
                        button.innerHTML = '<svg class="inline-block" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Synchronisé!</span>';
                        setTimeout(() => {
                          button.innerHTML = originalText;
                        }, 2000);
                      }
                    } catch (err) {
                      console.error('Erreur de synchronisation:', err);
                    }
                  }}
                  disabled={isLoadingModels}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                  title="Actualiser la liste des modèles"
                >
                  <FiRefreshCw className={isLoadingModels ? 'animate-spin' : ''} size={16} />
                  <span>{isLoadingModels ? 'Synchronisation...' : 'Actualiser'}</span>
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-4">
                Synchronisez automatiquement la liste des modèles gratuits disponibles depuis OpenRouter.
              </p>

              {/* Erreur */}
              {modelsError && (
                <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-200">
                    ❌ Erreur: {modelsError}
                  </p>
                </div>
              )}

              {/* Statistiques */}
              {stats && !isLoadingModels && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Providers</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {Object.keys(stats.byProvider).length}
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Nouveaux</p>
                    <p className="text-2xl font-bold text-green-400">{stats.new}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Avec Vision</p>
                    <p className="text-2xl font-bold text-cyan-400">{stats.withVision}</p>
                  </div>
                </div>
              )}

              {/* Catégories */}
              {stats && !isLoadingModels && stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    Par catégorie:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(stats.byCategory).map(([category, count]) => {
                      const categoryLabels: Record<string, string> = {
                        general: '🌐 Général',
                        coding: '💻 Code',
                        vision: '👁️ Vision',
                        creative: '🎨 Créatif',
                        reasoning: '🧠 Raisonnement',
                        research: '🔬 Recherche',
                      };
                      return (
                        <div key={category} className="bg-gray-700 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">{categoryLabels[category] || category}</p>
                          <p className="text-lg font-bold text-cyan-400">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* État de synchronisation */}
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>
                  Dernière synchro: {
                    lastSync 
                      ? (() => {
                          const now = new Date();
                          const diffMs = now.getTime() - lastSync.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          
                          if (diffMins < 1) return 'À l\'instant';
                          if (diffMins < 60) return `Il y a ${diffMins} min`;
                          if (diffHours < 24) return `Il y a ${diffHours}h`;
                          return lastSync.toLocaleDateString('fr-FR');
                        })()
                      : 'Jamais'
                  }
                </span>
                <span className="text-cyan-400 font-medium">{models.length} modèles</span>
              </div>

              {/* Providers */}
              {!isLoadingModels && getProviders().length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    Providers disponibles:
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {getProviders().map(provider => {
                      const count = stats?.byProvider[provider] || 0;
                      return (
                        <span
                          key={provider}
                          className="px-3 py-1 bg-cyan-900/30 text-cyan-300 rounded-full text-xs font-medium border border-cyan-700/30"
                        >
                          {provider} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nouveaux modèles */}
              {!isLoadingModels && models.filter(m => isModelNew(m.isNew)).length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    🆕 Modèles récemment ajoutés (moins de 3 mois):
                  </p>
                  <div className="bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {models.filter(m => isModelNew(m.isNew)).slice(0, 10).map(model => {
                        const categoryIcons: Record<string, string> = {
                          general: '🌐',
                          coding: '💻',
                          vision: '👁️',
                          creative: '🎨',
                          reasoning: '🧠',
                          research: '🔬',
                        };
                        return (
                          <div key={model.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-base">{categoryIcons[model.category || 'general']}</span>
                              <span className="text-white font-medium truncate">{model.name}</span>
                              <span className="px-2 py-0.5 bg-green-900/40 text-green-300 rounded text-xs font-bold border border-green-600/30 flex-shrink-0">
                                NEW
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                              {(model.contextLength / 1000).toFixed(0)}k ctx
                            </span>
                          </div>
                        );
                      })}
                      {models.filter(m => isModelNew(m.isNew)).length > 10 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          ... et {models.filter(m => isModelNew(m.isNew)).length - 10} autres nouveaux modèles
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-3 mt-4">
                <div className="flex items-start">
                  <FiInfo className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Mise à jour automatique</p>
                    <p className="text-blue-300">
                      La liste est mise en cache pendant 1 heure. Cliquez sur &quot;Actualiser&quot; 
                      pour forcer une synchronisation immédiate depuis l&apos;API OpenRouter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
