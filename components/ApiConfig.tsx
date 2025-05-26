import React, { useState, useEffect } from 'react';

interface ApiConfigProps {
  onConfigSaved: () => void;
}

export const ApiConfig: React.FC<ApiConfigProps> = ({ onConfigSaved }) => {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [notDiamondKey, setNotDiamondKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipConfig, setSkipConfig] = useState(false);

  useEffect(() => {
    // Vérifier les variables d'environnement d'abord
    const envOpenRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    const envNotDiamondKey = process.env.NEXT_PUBLIC_NOTDIAMOND_API_KEY || '';
    const envSerpApiKey = process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '';
    
    // Vérifier si les clés existent déjà dans le localStorage
    const savedOpenRouterKey = localStorage.getItem('tetika-openrouter-key') || envOpenRouterKey;
    const savedNotDiamondKey = localStorage.getItem('tetika-notdiamond-key') || envNotDiamondKey;
    const savedSerpApiKey = localStorage.getItem('tetika-serpapi-key') || envSerpApiKey;
    
    if (savedOpenRouterKey) setOpenRouterKey(savedOpenRouterKey);
    if (savedNotDiamondKey) setNotDiamondKey(savedNotDiamondKey);
    if (savedSerpApiKey) setSerpApiKey(savedSerpApiKey);
    
    // Si toutes les clés requises sont présentes, considérer la configuration comme terminée
    if (savedOpenRouterKey) {
      // Sauvegarder dans localStorage pour les futures sessions
      localStorage.setItem('tetika-openrouter-key', savedOpenRouterKey);
      if (savedNotDiamondKey) localStorage.setItem('tetika-notdiamond-key', savedNotDiamondKey);
      if (savedSerpApiKey) localStorage.setItem('tetika-serpapi-key', savedSerpApiKey);
      
      // Informer le parent que la configuration est déjà faite
      onConfigSaved();
    }
    
    setIsLoading(false);
  }, [onConfigSaved]);

  const handleSaveConfig = () => {
    if (skipConfig) {
      // Si l'utilisateur choisit de sauter la configuration, on enregistre une chaîne vide
      localStorage.setItem('tetika-openrouter-key', '');
      localStorage.setItem('tetika-skip-config', 'true');
      onConfigSaved();
      return;
    }      // Validation de base
    if (!openRouterKey.trim() && !skipConfig) {
      setError('La clé OpenRouter est requise pour utiliser les modèles payants.');
      return;
    }    
    
    // Log pour le debugging
    console.log('Clé OpenRouter (premiers caractères):', openRouterKey.trim().substring(0, 10) + '...');
    
    // Validation du format de la clé OpenRouter (doit commencer par sk-or-, sk-or-v1- ou sk-o1)
    if (openRouterKey.trim() && !openRouterKey.trim().startsWith('sk-or-') && !openRouterKey.trim().startsWith('sk-o1') && !openRouterKey.trim().startsWith('sk-or-v1-')) {
      setError('Le format de la clé API OpenRouter est invalide. Les clés doivent commencer par "sk-or-", "sk-or-v1-" ou "sk-o1"');
      return;
    }
    
    try {
      // Sauvegarder les clés dans localStorage
      if (openRouterKey.trim()) {
        localStorage.setItem('tetika-openrouter-key', openRouterKey.trim());
      }
      
      if (notDiamondKey.trim()) {
        localStorage.setItem('tetika-notdiamond-key', notDiamondKey.trim());
      }
      
      if (serpApiKey.trim()) {
        localStorage.setItem('tetika-serpapi-key', serpApiKey.trim());
      }
      
      // Informer le parent que la configuration est terminée
      onConfigSaved();
    } catch (e) {
      setError('Erreur lors de la sauvegarde des clés API. Veuillez réessayer.');
      console.error('Error saving API keys:', e);
    }
  };

  const handleSkipConfig = () => {
    setSkipConfig(true);
    handleSaveConfig();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="futuristic-panel p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Configuration des API</h2>
      
      <div className="bg-green-900/30 border border-green-500/50 text-green-200 p-4 rounded-md mb-6">
        <h3 className="font-medium text-green-300 mb-1">Bon à savoir !</h3>
        <p className="text-sm">
          Vous pouvez utiliser les modèles <strong>gratuits</strong> d&apos;OpenRouter sans clé API. 
          Ces modèles incluent Claude 3 Haiku, Llama 3, Gemma et d&apos;autres options performantes.
        </p>
        <button 
          onClick={handleSkipConfig}
          className="mt-2 bg-green-800/50 hover:bg-green-700/50 border border-green-600/50 text-green-100 px-4 py-1.5 rounded-md text-sm transition-colors"
        >
          Continuer sans clé API
        </button>
      </div>
      
      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label htmlFor="openrouter-key" className="block text-sm font-medium text-cyan-300 mb-1">
            Clé API OpenRouter
          </label>          <input
            id="openrouter-key"
            type="password"
            className="futuristic-input w-full"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            placeholder="Entrez votre clé API OpenRouter (commence par sk-or-, sk-or-v1- ou sk-o1)"
          />          <p className="text-xs text-gray-400 mt-1">
            Requis pour accéder aux modèles payants. La clé doit commencer par &quot;sk-or-&quot;, &quot;sk-or-v1-&quot; ou &quot;sk-o1&quot;. Obtenez une clé sur <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">openrouter.ai</a>
          </p>
        </div>
        
        <div>
          <label htmlFor="notdiamond-key" className="block text-sm font-medium text-cyan-300 mb-1">
            Clé API NotDiamond
          </label>
          <input
            id="notdiamond-key"
            type="password"
            className="futuristic-input w-full"
            value={notDiamondKey}
            onChange={(e) => setNotDiamondKey(e.target.value)}
            placeholder="Entrez votre clé API NotDiamond (optionnel)"
          />
          <p className="text-xs text-gray-400 mt-1">
            Pour accéder aux modèles premium. Obtenez une clé sur <a href="https://notdiamond.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">notdiamond.ai</a>
          </p>
        </div>
        
        <div>
          <label htmlFor="serpapi-key" className="block text-sm font-medium text-cyan-300 mb-1">
            Clé API SerpAPI
          </label>
          <input
            id="serpapi-key"
            type="password"
            className="futuristic-input w-full"
            value={serpApiKey}
            onChange={(e) => setSerpApiKey(e.target.value)}
            placeholder="Entrez votre clé SerpAPI (optionnel)"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nécessaire pour les recherches web (mode RAG). Obtenez une clé sur <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">serpapi.com</a>
          </p>
        </div>
        
        <div className="pt-4">
          <button
            className="futuristic-button w-full py-3"
            onClick={handleSaveConfig}
          >
            Sauvegarder la configuration
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">
            Vos clés API sont stockées localement sur votre appareil uniquement et ne sont jamais partagées.
          </p>
        </div>
      </div>
    </div>
  );
};