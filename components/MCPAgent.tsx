'use client';

import React, { useState } from 'react';
import { FaSearch, FaFile, FaComments, FaCog, FaPlay, FaCheckCircle, FaSpinner, FaLightbulb, FaCode, FaMagic, FaBrain, FaListUl, FaTable, FaExclamationTriangle, FaInfoCircle, FaCopy, FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';

interface MCPTool {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  color: string;
  examples: string[];
}

interface MCPAgentProps {
  onToolExecute?: (tool: string, args: Record<string, unknown>) => void;
}

interface MCPResult {
  success?: boolean;
  error?: string;
  details?: string;
  results?: Array<{
    title?: string;
    description?: string;
    url?: string;
    content?: string;
    position?: number;
    [key: string]: unknown;
  }>;
  provider?: string;
  totalResults?: number;
  message?: string;
  response?: string;
  content?: string;
  model?: string;
  headers?: string[];
  rows?: unknown[][];
  [key: string]: unknown;
}

const MCPAgent: React.FC<MCPAgentProps> = ({ onToolExecute }) => {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<Record<string, unknown>>({});
  const [isExecuting, setIsExecuting] = useState(false);  const [result, setResult] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [executionStep, setExecutionStep] = useState<string>('');
  const [viewMode, setViewMode] = useState<'human' | 'json'>('human');

  const tools: MCPTool[] = [
    {
      name: 'web_search',
      description: 'Recherche web intelligente avec filtrage avancé',
      icon: <FaSearch className="w-6 h-6" />,
      category: 'Search',
      color: 'blue',
      examples: [
        'Dernières innovations en IA 2025',
        'Startups françaises intelligence artificielle',
        'Tendances technologiques émergentes'
      ]
    },
    {
      name: 'chat_with_ai',
      description: 'Dialogue avec des modèles IA de pointe',
      icon: <FaBrain className="w-6 h-6" />,
      category: 'AI',
      color: 'purple',
      examples: [
        'Analyse comparative des modèles IA',
        'Génération de contenu créatif',
        'Résolution de problèmes complexes'
      ]
    },
    {
      name: 'analyze_file',
      description: 'Analyse multi-format avec IA vision',
      icon: <FaFile className="w-6 h-6" />,
      category: 'Analysis',
      color: 'green',
      examples: [
        'Extraction de données de documents',
        'Analyse d\'images et graphiques',
        'Traitement de fichiers techniques'
      ]
    },
    {
      name: 'manage_conversation',
      description: 'Gestion avancée des sessions de chat',
      icon: <FaComments className="w-6 h-6" />,
      category: 'Conversation',
      color: 'cyan',
      examples: [
        'Recherche dans l\'historique',
        'Organisation des conversations',
        'Export et partage de sessions'
      ]
    },
    {
      name: 'get_tetika_status',
      description: 'Monitoring système et configuration',
      icon: <FaCog className="w-6 h-6" />,
      category: 'System',
      color: 'orange',
      examples: [
        'État des services connectés',
        'Métriques de performance',
        'Configuration des APIs'
      ]
    }
  ];

  const categories = ['all', 'Search', 'AI', 'Analysis', 'Conversation', 'System'];

  const filteredTools = activeCategory === 'all' 
    ? tools 
    : tools.filter(tool => tool.category === activeCategory);

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setToolArgs({});
    setResult(null);
    setExecutionStep('');
  };

  const handleArgChange = (key: string, value: unknown) => {
    setToolArgs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStringValue = (key: string, defaultValue = ''): string => {
    const value = toolArgs[key];
    return typeof value === 'string' ? value : defaultValue;
  };

  const getNumberValue = (key: string, defaultValue = 0): number => {
    const value = toolArgs[key];
    return typeof value === 'number' ? value : defaultValue;
  };

  const getArrayValue = (key: string): string[] => {
    const value = toolArgs[key];
    return Array.isArray(value) ? value : [];
  };

  const executeTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    setExecutionStep('Initialisation...');
    
    try {
      // Simulation des étapes d'exécution
      await new Promise(resolve => setTimeout(resolve, 800));
      setExecutionStep('Connexion aux services...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExecutionStep('Traitement des données...');

      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: selectedTool,
          args: toolArgs
        })
      });

      setExecutionStep('Finalisation...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = await response.json();
      setResult(data);
      setExecutionStep('Terminé ✓');
      onToolExecute?.(selectedTool, toolArgs);
    } catch (error) {
      console.error('Tool execution error:', error);
      setResult(JSON.stringify({
        success: false,
        error: 'Failed to execute tool'
      }, null, 2));
      setExecutionStep('Erreur');
    } finally {
      setIsExecuting(false);
    }
  };

  // Fonction pour charger un exemple dans le formulaire
  const loadExample = (example: string) => {
    if (!selectedTool) return;
    
    switch (selectedTool) {
      case 'web_search':
        setToolArgs({
          query: example,
          location: '',
          num_results: 10
        });
        break;
      case 'chat_with_ai':
        setToolArgs({
          message: example,
          model: 'gpt-4-turbo-preview',
          mode: 'standard'
        });
        break;
      case 'analyze_file':
        setToolArgs({
          file_path: '/path/to/example.pdf',
          task: example
        });
        break;
      case 'manage_conversation':
        setToolArgs({
          action: 'search',
          query: example
        });
        break;
      case 'get_tetika_status':
        setToolArgs({
          include_models: true,
          include_settings: true
        });
        break;
      default:
        break;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'from-blue-500 to-cyan-500 border-blue-500/50',
      purple: 'from-purple-500 to-pink-500 border-purple-500/50',
      green: 'from-green-500 to-emerald-500 border-green-500/50',
      cyan: 'from-cyan-500 to-teal-500 border-cyan-500/50',
      orange: 'from-orange-500 to-red-500 border-orange-500/50'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };  const renderToolForm = () => {
    switch (selectedTool) {
      case 'web_search':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                <FaSearch className="w-4 h-4 mr-2" />
                Requête de recherche
              </label>
              <input
                type="text"
                value={getStringValue('query')}
                onChange={(e) => handleArgChange('query', e.target.value)}
                className="w-full p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Entrez votre recherche..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Localisation (optionnelle)
                </label>
                <input
                  type="text"
                  value={getStringValue('location')}
                  onChange={(e) => handleArgChange('location', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 transition-all"
                  placeholder="ex: Paris, France"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3" htmlFor="num_results">
                  Nombre de résultats
                </label>
                <input
                  id="num_results"
                  type="number"
                  value={getNumberValue('num_results', 10)}
                  onChange={(e) => handleArgChange('num_results', parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white focus:border-blue-500/50 transition-all"
                  min="1"
                  max="20"
                  aria-label="Nombre de résultats"
                />
              </div>
            </div>
          </div>
        );

      case 'chat_with_ai':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                <FaBrain className="w-4 h-4 mr-2" />
                Message
              </label>
              <textarea
                value={getStringValue('message')}
                onChange={(e) => handleArgChange('message', e.target.value)}
                className="w-full p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                rows={4}
                placeholder="Entrez votre message..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>                <label className="block text-sm font-medium text-gray-300 mb-3" htmlFor="ai_model_select">
                  Modèle IA
                </label>
                <select
                  id="ai_model_select"
                  value={getStringValue('model', 'gpt-4-turbo-preview')}
                  onChange={(e) => handleArgChange('model', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white focus:border-purple-500/50 transition-all"
                >
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
              <div>                <label className="block text-sm font-medium text-gray-300 mb-3" htmlFor="mode_select">
                  Mode
                </label>
                <select
                  id="mode_select"
                  value={getStringValue('mode', 'standard')}
                  onChange={(e) => handleArgChange('mode', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white focus:border-purple-500/50 transition-all"
                >
                  <option value="standard">Standard</option>
                  <option value="rag">RAG Enhanced</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'analyze_file':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                <FaFile className="w-4 h-4 mr-2" />
                Chemin du fichier
              </label>
              <input
                type="text"
                value={getStringValue('file_path')}
                onChange={(e) => handleArgChange('file_path', e.target.value)}
                className="w-full p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="Chemin vers le fichier..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Type de fichier
              </label>
              <input
                type="text"
                value={getStringValue('file_type')}
                onChange={(e) => handleArgChange('file_type', e.target.value)}
                className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-green-500/50 transition-all"
                placeholder="ex: image/jpeg, text/plain, application/pdf"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Questions (optionnelles)
              </label>
              <textarea
                value={getArrayValue('questions').join('\n')}
                onChange={(e) => handleArgChange('questions', e.target.value.split('\n').filter(q => q.trim()))}
                className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-green-500/50 transition-all"
                rows={3}
                placeholder="Entrez les questions, une par ligne..."
              />
            </div>
          </div>
        );

      case 'manage_conversation':
        return (
          <div className="space-y-6">
            <div>              <label className="block text-sm font-medium text-gray-300 mb-3" htmlFor="action_select">
                Action
              </label>
              <select
                id="action_select"
                value={getStringValue('action', 'list')}
                onChange={(e) => handleArgChange('action', e.target.value)}
                className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white focus:border-cyan-500/50 transition-all"
              >
                <option value="create">Créer</option>
                <option value="list">Lister</option>
                <option value="get">Obtenir</option>
                <option value="update">Mettre à jour</option>
                <option value="delete">Supprimer</option>
                <option value="search">Rechercher</option>
              </select>
            </div>
            {['get', 'update', 'delete'].includes(getStringValue('action')) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  ID de session
                </label>
                <input
                  type="text"
                  value={getStringValue('session_id')}
                  onChange={(e) => handleArgChange('session_id', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500/50 transition-all"
                  placeholder="Entrez l'ID de session..."
                />
              </div>
            )}
            {['create', 'update'].includes(getStringValue('action')) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Titre
                </label>
                <input
                  type="text"
                  value={getStringValue('title')}
                  onChange={(e) => handleArgChange('title', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500/50 transition-all"
                  placeholder="Entrez le titre de la conversation..."
                />
              </div>
            )}
            {toolArgs.action === 'search' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Terme de recherche
                </label>
                <input
                  type="text"
                  value={getStringValue('search_term')}
                  onChange={(e) => handleArgChange('search_term', e.target.value)}
                  className="w-full p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500/50 transition-all"
                  placeholder="Entrez le terme de recherche..."
                />
              </div>
            )}
          </div>
        );

      case 'get_tetika_status':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center p-4 bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-lg hover:bg-slate-700/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={toolArgs.include_models !== false}
                  onChange={(e) => handleArgChange('include_models', e.target.checked)}
                  className="mr-3 w-4 h-4 text-orange-500 bg-slate-800 border-slate-600 rounded focus:ring-orange-500"
                  aria-label="Inclure les modèles"
                />
                <span className="text-gray-300">Inclure les modèles</span>
              </label>
              <label className="flex items-center p-4 bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-lg hover:bg-slate-700/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={toolArgs.include_settings !== false}
                  onChange={(e) => handleArgChange('include_settings', e.target.checked)}
                  className="mr-3 w-4 h-4 text-orange-500 bg-slate-800 border-slate-600 rounded focus:ring-orange-500"
                  aria-label="Inclure les paramètres"
                />
                <span className="text-gray-300">Inclure les paramètres</span>
              </label>
            </div>
          </div>
        );      default:
        return null;
    }
  };  // Function to intelligently render results based on content type
  const renderResult = (data: MCPResult | string | unknown) => {
    if (!data) return null;

    // Helper function to copy text to clipboard with toast feedback
    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        toast.textContent = '✓ Copié !';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    // Enhanced error display
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const errorData = data as MCPResult;
      return (
        <div className="bg-gradient-to-r from-red-900/20 via-red-800/20 to-orange-900/20 border border-red-500/40 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="bg-red-500/20 p-3 rounded-full">
              <FaExclamationTriangle className="text-red-400 text-xl" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-300 font-bold text-lg mb-2 flex items-center">
                Erreur d&apos;exécution
                <span className="ml-2 text-xs bg-red-500/20 px-2 py-1 rounded-full">FAILED</span>
              </h4>
              <p className="text-red-100 mb-4 leading-relaxed">{errorData.error}</p>
              {errorData.details && (
                <details className="group">
                  <summary className="cursor-pointer text-red-300 hover:text-red-200 transition-colors mb-2 flex items-center">
                    <span className="group-open:rotate-90 transition-transform mr-2">▶</span>
                    Détails techniques
                  </summary>
                  <pre className="text-xs text-red-200 bg-red-900/40 p-4 rounded-lg overflow-x-auto border border-red-500/30">
                    {JSON.stringify(errorData.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Enhanced search results display
    if (typeof data === 'object' && data !== null && 'results' in data && Array.isArray((data as MCPResult).results)) {
      const searchData = data as MCPResult;
      const results = searchData.results || [];
      
      return (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-gradient-to-r from-blue-900/30 via-cyan-900/30 to-teal-900/30 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <FaGlobe className="text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Résultats de Recherche</h3>
                  <p className="text-blue-300">
                    {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(formatJsonToHumanReadable(data))}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-sm text-green-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaFile className="w-4 h-4" />
                  <span>Copier Texte</span>
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg text-sm text-blue-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaCopy className="w-4 h-4" />
                  <span>Copier JSON</span>
                </button>
              </div>
            </div>
            
            {/* Search Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{results.length}</div>
                <div className="text-xs text-blue-300">Résultats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {searchData.provider || 'MCP'}
                </div>
                <div className="text-xs text-cyan-300">Source</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-400">
                  {searchData.totalResults || '∞'}
                </div>
                <div className="text-xs text-teal-300">Total</div>
              </div>
            </div>
          </div>

          {/* Toggle between Human-readable and JSON view */}
          <div className="flex justify-center">
            <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-600/30">
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('human')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    viewMode === 'human'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FaFile className="w-4 h-4" />
                  <span>📄 Vue Lisible</span>
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    viewMode === 'json'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <FaCode className="w-4 h-4" />
                  <span>🔧 Vue JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Human-readable view */}
          {viewMode === 'human' && (
            <div className="bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20 rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm animate-fadeIn">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <FaFile className="text-green-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">📄 Version Lisible</h3>
                  <p className="text-green-300">Résultats de recherche formatés pour une lecture facile</p>
                </div>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 custom-scrollbar max-h-96 overflow-y-auto">
                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {formatJsonToHumanReadable(data)}
                </div>
              </div>
            </div>
          )}

          {/* JSON view */}
          {viewMode === 'json' && (
            <div className="bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20 rounded-2xl p-6 border border-amber-500/30 backdrop-blur-sm animate-fadeIn">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-amber-500/20 p-3 rounded-full">
                  <FaCode className="text-amber-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">🔧 Structure JSON</h3>
                  <p className="text-amber-300">Données brutes pour les développeurs</p>
                </div>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 custom-scrollbar max-h-96 overflow-y-auto">
                <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Results Cards - Always visible */}
          <div className="grid gap-4 md:gap-6">
            {results.map((result, index: number) => {
              const resultData = result as { title?: string; description?: string; content?: string; url?: string; position?: number };
              return (
                <div key={index} className="group bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/70 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                  {/* Result Header */}
                  {resultData.title && (
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2 rounded-lg flex-shrink-0">
                        <FaExternalLinkAlt className="text-blue-400 text-sm" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-300 transition-colors">
                          {resultData.title}
                        </h4>
                        {resultData.url && (
                          <a 
                            href={resultData.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 transition-colors"
                          >
                            <span className="truncate">{resultData.url}</span>
                            <FaExternalLinkAlt className="w-3 h-3 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Result Content */}
                  {resultData.description && (
                    <div className="mb-4">
                      <p className="text-gray-300 leading-relaxed text-sm">{resultData.description}</p>
                    </div>
                  )}

                  {/* Extended Content */}
                  {resultData.content && (
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-xs font-medium">CONTENU ÉTENDU</span>
                        <button
                          onClick={() => copyToClipboard(String(resultData.content))}
                          className="text-gray-400 hover:text-green-400 transition-colors"
                          title="Copier le contenu"
                        >
                          <FaCopy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-gray-200 text-sm leading-relaxed">
                        {typeof resultData.content === 'string' && resultData.content.length > 400 ? (
                          <details className="group/content">
                            <summary className="cursor-pointer text-blue-400 hover:text-blue-300 mb-2">
                              {resultData.content.substring(0, 400)}...
                              <span className="text-xs ml-2">[Cliquer pour voir plus]</span>
                            </summary>
                            <div className="mt-2 pt-2 border-t border-slate-600/30">
                              {resultData.content.substring(400)}
                            </div>
                          </details>
                        ) : (
                          <p>{resultData.content}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Résultat #{index + 1}</span>
                      {resultData.position && (
                        <span>Position: {resultData.position}</span>
                      )}
                    </div>
                    {resultData.url && (
                      <a 
                        href={resultData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1 transition-colors"
                      >
                        <span>Voir la source</span>
                        <FaExternalLinkAlt className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Enhanced Chat/AI Response Display  
    if (data && typeof data === 'object' && (('message' in data) || ('response' in data) || ('content' in data))) {
      const messageData = data as { message?: string; response?: string; content?: string; model?: string };
      const messageContent = messageData.message || messageData.response || messageData.content;
      
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 rounded-2xl p-6 border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <FaBrain className="text-purple-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">🤖 Réponse IA</h3>
                  <p className="text-purple-300">
                    {messageData.model || 'Modèle'} • {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(formatJsonToHumanReadable(data))}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-sm text-green-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaFile className="w-4 h-4" />
                  <span>Copier Texte</span>
                </button>
                <button
                  onClick={() => copyToClipboard(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent))}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded-lg text-sm text-purple-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaCopy className="w-4 h-4" />
                  <span>Copier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toggle View */}
          <div className="flex justify-center">
            <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-600/30">
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('human')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'human'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 Vue Lisible
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'json'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔧 Vue Brute
                </button>
              </div>
            </div>
          </div>
          
          {viewMode === 'human' ? (
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 animate-fadeIn">
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {formatJsonToHumanReadable(data)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 animate-fadeIn">
              <div className="prose prose-invert max-w-none">
                {typeof messageContent === 'string' ? (
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{messageContent}</p>
                ) : (
                  <pre className="text-gray-200 text-sm overflow-x-auto">
                    {JSON.stringify(messageContent, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Enhanced list display
    if (Array.isArray(data)) {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900/30 via-green-900/30 to-teal-900/30 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500/20 p-3 rounded-full">
                  <FaListUl className="text-emerald-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Liste de Données</h3>
                  <p className="text-emerald-300">{data.length} élément{data.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 rounded-lg text-sm text-emerald-300 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <FaCopy className="w-4 h-4" />
                <span>Copier</span>
              </button>
            </div>
          </div>          <div className="space-y-3">
            {data.map((item: unknown, index: number) => (
              <div key={index} className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/70 transition-all backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-emerald-500/20 px-2 py-1 rounded-lg text-xs text-emerald-400 font-semibold flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    {typeof item === 'string' ? (
                      <p className="text-gray-200 leading-relaxed">{item}</p>
                    ) : (
                      <pre className="text-gray-200 text-sm whitespace-pre-wrap overflow-x-auto bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }    // Check if it's tabular data
    if (typeof data === 'object' && data !== null && 'headers' in data && 'rows' in data) {
      const tableData = data as MCPResult;
      const headers = tableData.headers || [];
      const rows = tableData.rows || [];
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaTable className="text-purple-400" />
              <span className="text-white font-medium">Données tabulaires ({rows.length} ligne{rows.length > 1 ? 's' : ''})</span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-gray-300 flex items-center space-x-1 transition-colors"
            >
              <FaCopy className="w-3 h-3" />
              <span>Copier</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg">
              <thead>
                <tr className="bg-slate-800/50">
                  {headers.map((header: string, index: number) => (
                    <th key={index} className="px-4 py-3 text-left text-gray-200 font-semibold border-b border-slate-700/50">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: unknown[], rowIndex: number) => (
                  <tr key={rowIndex} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    {row.map((cell: unknown, cellIndex: number) => (
                      <td key={cellIndex} className="px-4 py-3 text-gray-200">
                        {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }    // Enhanced simple object display (status, config, etc.)
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);
      const hasComplexValues = entries.some(([, value]) => 
        typeof value === 'object' && value !== null
      );

      if (!hasComplexValues && entries.length <= 15) {
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-cyan-500/20 p-3 rounded-full">
                    <FaInfoCircle className="text-cyan-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">⚙️ Informations Système</h3>
                    <p className="text-cyan-300">{entries.length} propriétés</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(formatJsonToHumanReadable(data))}
                    className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-sm text-green-300 flex items-center space-x-2 transition-all hover:scale-105"
                  >
                    <FaFile className="w-4 h-4" />
                    <span>Lisible</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                    className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 rounded-lg text-sm text-cyan-300 flex items-center space-x-2 transition-all hover:scale-105"
                  >
                    <FaCopy className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle View */}
            <div className="flex justify-center">
              <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-600/30">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setViewMode('human')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'human'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📋 Vue Organisée
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'json'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔧 Vue JSON
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'human' ? (
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 animate-fadeIn">
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {formatJsonToHumanReadable(data)}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm animate-fadeIn">
                <div className="grid divide-y divide-slate-700/30">
                  {entries.map(([key, value]) => (
                    <div key={key} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                          <span className="text-gray-400 font-medium">{key}</span>
                        </div>
                        <span className="text-gray-200 font-mono text-sm bg-slate-800/50 px-3 py-1 rounded-lg">
                          {String(value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }// Enhanced text display
    if (typeof data === 'string') {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-indigo-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500/20 p-3 rounded-full">
                  <FaInfoCircle className="text-indigo-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">📝 Réponse Textuelle</h3>
                  <p className="text-indigo-300">{data.length} caractères • {data.split('\n').length} lignes</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(formatJsonToHumanReadable(data))}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-sm text-green-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaFile className="w-4 h-4" />
                  <span>Formaté</span>
                </button>
                <button
                  onClick={() => copyToClipboard(data)}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded-lg text-sm text-indigo-300 flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <FaCopy className="w-4 h-4" />
                  <span>Copier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toggle View */}
          <div className="flex justify-center">
            <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-600/30">
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('human')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'human'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📄 Vue Formatée
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'json'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📝 Texte Brut
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 animate-fadeIn">
            <div className="prose prose-invert max-w-none">
              {viewMode === 'human' ? (
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {formatJsonToHumanReadable(data)}
                </div>
              ) : (
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{data}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Fallback: Enhanced JSON display for complex objects
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500/20 p-3 rounded-full">
                <FaCode className="text-amber-400 text-xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Données Complexes</h3>
                <p className="text-amber-300">Structure JSON</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
              className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 rounded-lg text-sm text-amber-300 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <FaCopy className="w-4 h-4" />
              <span>Copier JSON</span>
            </button>
          </div>
        </div>        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 overflow-x-auto custom-scrollbar">
            <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to format JSON data into human-readable text
  const formatJsonToHumanReadable = (data: unknown, depth = 0): string => {
    const indent = '  '.repeat(depth);
    
    if (data === null) return 'Aucune donnée';
    if (data === undefined) return 'Non défini';
    
    if (typeof data === 'string') {
      // Clean up common JSON artifacts
      const cleaned = data
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\/g, '');
      
      // If it's a URL, format it nicely
      if (cleaned.startsWith('http')) {
        return `🔗 ${cleaned}`;
      }
      
      // If it's a date-like string
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          const date = new Date(cleaned);
          return `📅 ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`;
        } catch {
          return cleaned;
        }
      }
      
      return cleaned;
    }
    
    if (typeof data === 'number') {
      // Format large numbers with separators
      if (data > 1000) {
        return data.toLocaleString('fr-FR');
      }
      return data.toString();
    }
    
    if (typeof data === 'boolean') {
      return data ? '✅ Oui' : '❌ Non';
    }
    
    if (Array.isArray(data)) {
      if (data.length === 0) return 'Liste vide';
      
      let result = `📋 Liste de ${data.length} élément${data.length > 1 ? 's' : ''} :\n`;
      data.forEach((item, index) => {
        result += `${indent}  ${index + 1}. ${formatJsonToHumanReadable(item, depth + 1)}\n`;
      });
      return result.trim();
    }
    
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data as Record<string, unknown>);
      if (entries.length === 0) return 'Objet vide';
      
      let result = '';
      entries.forEach(([key, value]) => {
        // Translate common keys to French
        const translatedKey = translateKey(key);
        const emoji = getKeyEmoji(key);
        
        if (typeof value === 'object' && value !== null) {
          result += `${indent}${emoji} ${translatedKey} :\n`;
          result += `${formatJsonToHumanReadable(value, depth + 1)}\n`;
        } else {
          result += `${indent}${emoji} ${translatedKey} : ${formatJsonToHumanReadable(value, depth + 1)}\n`;
        }
      });
      return result.trim();
    }
    
    return String(data);
  };

  // Helper function to translate common JSON keys to French
  const translateKey = (key: string): string => {
    const translations: Record<string, string> = {
      'title': 'Titre',
      'description': 'Description',
      'url': 'URL',
      'link': 'Lien',
      'content': 'Contenu',
      'text': 'Texte',
      'message': 'Message',
      'response': 'Réponse',
      'error': 'Erreur',
      'success': 'Succès',
      'data': 'Données',
      'results': 'Résultats',
      'status': 'Statut',
      'type': 'Type',
      'name': 'Nom',
      'id': 'Identifiant',
      'created_at': 'Créé le',
      'updated_at': 'Modifié le',
      'timestamp': 'Horodatage',
      'score': 'Score',
      'position': 'Position',
      'snippet': 'Extrait',
      'provider': 'Fournisseur',
      'model': 'Modèle',
      'query': 'Requête',
      'total_results': 'Total des résultats',
      'num_results': 'Nombre de résultats',
      'location': 'Localisation',
      'language': 'Langue',
      'category': 'Catégorie',
      'tags': 'Tags',
      'author': 'Auteur',
      'date': 'Date',
      'time': 'Heure',
      'size': 'Taille',
      'format': 'Format',
      'version': 'Version',
      'config': 'Configuration',
      'settings': 'Paramètres',
      'options': 'Options',
      'metadata': 'Métadonnées',
      'headers': 'En-têtes',
      'body': 'Corps',
      'method': 'Méthode',
      'path': 'Chemin',
      'filename': 'Nom de fichier',
      'extension': 'Extension',
      'mime_type': 'Type MIME'
    };
    
    return translations[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  // Helper function to get appropriate emoji for keys
  const getKeyEmoji = (key: string): string => {
    const emojiMap: Record<string, string> = {
      'title': '📝',
      'description': '📄',
      'url': '🔗',
      'link': '🔗',
      'content': '📑',
      'text': '💬',
      'message': '💬',
      'response': '🤖',
      'error': '❌',
      'success': '✅',
      'data': '📊',
      'results': '🎯',
      'status': '🔍',
      'type': '🏷️',
      'name': '🏃',
      'id': '🆔',
      'created_at': '📅',
      'updated_at': '🔄',
      'timestamp': '⏰',
      'score': '⭐',
      'position': '📍',
      'snippet': '✂️',
      'provider': '🏢',
      'model': '🧠',
      'query': '🔍',
      'total_results': '📈',
      'num_results': '🔢',
      'location': '🌍',
      'language': '🌐',
      'category': '📂',
      'tags': '🏷️',
      'author': '👤',
      'date': '📅',
      'time': '⏰',
      'size': '📏',
      'format': '📋',
      'version': '🔖',
      'config': '⚙️',
      'settings': '🛠️',
      'options': '⚪',
      'metadata': '📋',
      'headers': '📋',
      'body': '📄',
      'method': '🔧',
      'path': '📁',
      'filename': '📄',
      'extension': '🔧',
      'mime_type': '📎'
    };
    
    return emojiMap[key.toLowerCase()] || '•';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Console d&apos;Outils MCP
          </span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Interface avancée pour accéder aux capacités de Tetika via le Model Context Protocol
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === category
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {category === 'all' ? 'Tous' : category}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredTools.map((tool) => {
          const isSelected = selectedTool === tool.name;
          const colorClasses = getColorClasses(tool.color);
          
          return (
            <div
              key={tool.name}
              onClick={() => handleToolSelect(tool.name)}
              className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                isSelected ? 'ring-2 ring-cyan-500/50' : ''
              }`}
            >
              <div className={`
                p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300
                ${isSelected 
                  ? `bg-gradient-to-br ${colorClasses} bg-opacity-20 border-2` 
                  : 'bg-slate-800/30 border border-slate-600/30 hover:bg-slate-700/40'
                }
              `}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isSelected 
                      ? `bg-gradient-to-br ${colorClasses}` 
                      : 'bg-slate-700/50'
                    }
                  `}>
                    <div className={isSelected ? 'text-white' : 'text-gray-400'}>
                      {tool.icon}
                    </div>
                  </div>
                  {isSelected && (
                    <FaCheckCircle className="text-cyan-400 text-xl animate-pulse" />
                  )}
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${
                  isSelected ? 'text-white' : 'text-gray-200'
                }`}>
                  {tool.name.replace('_', ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h3>
                
                <p className={`text-sm mb-4 ${
                  isSelected ? 'text-gray-200' : 'text-gray-400'
                }`}>
                  {tool.description}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exemples d&apos;usage
                  </span>
                  {tool.examples.slice(0, 2).map((example, index) => (
                    <div key={index} className="text-xs text-gray-400 flex items-center">
                      <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                      {example}
                    </div>
                  ))}
                </div>
                
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl pointer-events-none"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Panel */}
      {selectedTool && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white flex items-center">
              <FaCog className="w-6 h-6 mr-3 text-cyan-400" />
              Configuration : {selectedTool.replace('_', ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </h3>
            
            {/* Quick Examples */}
            <div className="flex items-center space-x-2">
              <FaLightbulb className="text-yellow-400 text-sm" />
              <span className="text-sm text-gray-400">Exemples rapides :</span>
              {tools.find(t => t.name === selectedTool)?.examples.slice(0, 2).map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(example)}
                  className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full hover:bg-yellow-500/30 transition-all"
                >
                  {example.slice(0, 20)}...
                </button>
              ))}
            </div>
          </div>

          {renderToolForm()}

          {/* Execution Button */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isExecuting && (
                <div className="flex items-center text-cyan-400">
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">{executionStep}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={executeTool}
              disabled={isExecuting}
              className={`
                px-8 py-4 rounded-xl font-medium text-white transition-all duration-300 flex items-center space-x-2
                ${isExecuting 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-cyan-500/30'
                }
              `}
            >
              {isExecuting ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  <span>Exécution...</span>
                </>
              ) : (
                <>
                  <FaPlay className="w-5 h-5" />
                  <span>Exécuter l&apos;Outil</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedTool && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaMagic className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Sélectionnez un outil pour commencer
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">            Choisissez parmi nos outils avancés pour exploiter la puissance du Model Context Protocol
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <FaCode className="w-5 h-5 mr-3 text-green-400" />
            Résultat de l&apos;Exécution
          </h3>
          {renderResult(result)}
        </div>
      )}

      {/* Enhanced Results Section */}
      {result && (
        <div className="mt-8 animate-fadeIn">
          <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-teal-900/20 rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-500/20 p-3 rounded-full">
                <FaCheckCircle className="text-green-400 text-xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Exécution Terminée</h3>
                <p className="text-green-300">
                  Outil: {selectedTool.replace('_', ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </p>
              </div>
            </div>
          </div>
          
          {renderResult(result)}
        </div>
      )}

      {/* Loading State */}
      {isExecuting && (
        <div className="mt-8 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-blue-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/30 rounded-full animate-spin">
                <div className="w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Exécution en cours...</h3>
              <p className="text-blue-300">{executionStep}</p>
            </div>
          </div>            {/* Progress Animation */}
            <div className="w-full bg-slate-700/50 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          
          <div className="text-center text-gray-400 text-sm">
            Cette opération peut prendre quelques secondes...
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPAgent;
