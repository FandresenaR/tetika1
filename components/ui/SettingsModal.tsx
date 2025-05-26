import React, { useState, useEffect } from 'react';
import { FiSettings, FiX, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';

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
  const [showNotDiamondKey, setShowNotDiamondKey] = useState(false);
  const [showSerpApiKey, setShowSerpApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'api'>('api');

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
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
            <FiSettings className="mr-2" size={20} />
            Paramètres
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex mb-6 border-b border-gray-800">
          <button
            className={`px-4 py-2 ${activeTab === 'account' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('account')}
          >
            Compte
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'api' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('api')}
          >
            Clés API
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showOpenRouterKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <button
                  id="save-openrouter"
                  onClick={() => handleSaveApiKey('openrouter', openRouterKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowNotDiamondKey(!showNotDiamondKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNotDiamondKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey('notdiamond', notDiamondKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowSerpApiKey(!showSerpApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSerpApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey('serpapi', serpApiKey.key)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-r-md px-4 transition-colors"
                >
                  <FiCheck size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Optionnelle - Pour les recherches web en temps réel
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
