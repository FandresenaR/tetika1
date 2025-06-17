'use client';

import { useState, useEffect } from 'react';
import MCPAgent from '@/components/MCPAgent';
import MarketAnalysis from '@/components/MarketAnalysis';
import { FaArrowLeft, FaBrain, FaChartLine, FaNetworkWired, FaEye, FaDatabase, FaLightbulb } from 'react-icons/fa';
import Link from 'next/link';

interface AgentTask {
  id: string;
  title: string;
  status: 'idle' | 'searching' | 'analyzing' | 'generating' | 'completed';
  progress: number;
  sources: number;
  insights: number;
  startTime: Date;
  estimatedTime?: number;
}

export default function MCPAgentPage() {
  const [executedTools, setExecutedTools] = useState<Array<{
    tool: string;
    args: Record<string, unknown>;
    timestamp: string;
  }>>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [agentMode, setAgentMode] = useState<'autonomous' | 'guided' | 'analytical'>('autonomous');
  const [connectedSources, setConnectedSources] = useState(12);
  const [processingPower, setProcessingPower] = useState(85);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);

  // Animation des statistiques
  useEffect(() => {
    const interval = setInterval(() => {      setConnectedSources(Math.floor(Math.random() * 5) + 10);
      setProcessingPower(Math.floor(Math.random() * 15) + 80);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToolExecute = (tool: string, args: Record<string, unknown>) => {
    setExecutedTools(prev => [{
      tool,
      args,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 9)]);
  };  const startAgentTask = (title: string) => {
    // Pour l'analyse de marché IA, on va utiliser le nouveau composant
    if (title.includes("Analyse complète du marché IA français 2025")) {
      setShowMarketAnalysis(true);
      return;
    }
    
    const newTask: AgentTask = {
      id: Date.now().toString(),
      title,
      status: 'searching',
      progress: 0,
      sources: 0,
      insights: 0,
      startTime: new Date(),
      estimatedTime: Math.floor(Math.random() * 180) + 60
    };
    
    setActiveTask(newTask);
    
    // Simulation d'une tâche complexe
    const simulate = () => {
      setActiveTask(prev => {
        if (!prev) return null;
        
        let newProgress = prev.progress + Math.random() * 15;
        let newStatus = prev.status;
        
        if (newProgress > 25 && prev.status === 'searching') {
          newStatus = 'analyzing';
        } else if (newProgress > 60 && prev.status === 'analyzing') {
          newStatus = 'generating';
        } else if (newProgress >= 100) {
          newStatus = 'completed';
          newProgress = 100;
        }
        
        return {
          ...prev,
          progress: Math.min(newProgress, 100),
          status: newStatus,
          sources: Math.floor(newProgress / 8) + Math.floor(Math.random() * 3),
          insights: Math.floor(newProgress / 12) + Math.floor(Math.random() * 2)
        };
      });
    };
    
    const timer = setInterval(() => {
      simulate();
    }, 800);
    
    setTimeout(() => {
      clearInterval(timer);
      setActiveTask(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
    }, 8000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Neural Network Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" className="animate-pulse">
          <defs>
            <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="currentColor"/>
              <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="0.5"/>
              <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="0.5"/>
              <line x1="50" y1="50" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)"/>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:scale-105"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Retour à Tetika</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              {/* Agent Status */}
              <div className="flex items-center space-x-2 bg-green-900/20 px-4 py-2 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">Agent Actif</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FaBrain className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  MCP Neural Agent
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                TETIKA MCP
              </span>
              <br/>
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Neural Agent
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Intelligence artificielle autonome propulsée par le Model Context Protocol.
              <br/>
              <span className="text-cyan-300">Recherche multi-sources • Raisonnement avancé • Génération de rapports intelligents</span>
            </p>
          </div>

          {/* Real-time Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <FaNetworkWired className="text-cyan-400 text-xl" />
                <span className="text-cyan-300 text-2xl font-bold">{connectedSources}</span>
              </div>
              <p className="text-gray-300 text-sm">Sources Connectées</p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div className="bg-cyan-400 h-1 rounded-full" style={{width: `${(connectedSources/15)*100}%`}}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <FaBrain className="text-purple-400 text-xl" />
                <span className="text-purple-300 text-2xl font-bold">{processingPower}%</span>
              </div>
              <p className="text-gray-300 text-sm">Puissance de Traitement</p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div className="bg-purple-400 h-1 rounded-full" style={{width: `${processingPower}%`}}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <FaDatabase className="text-green-400 text-xl" />
                <span className="text-green-300 text-2xl font-bold">847K</span>
              </div>
              <p className="text-gray-300 text-sm">Points de Données</p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div className="bg-green-400 h-1 rounded-full animate-pulse" style={{width: '92%'}}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-4 border border-orange-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <FaLightbulb className="text-orange-400 text-xl" />
                <span className="text-orange-300 text-2xl font-bold">15</span>
              </div>
              <p className="text-gray-300 text-sm">Insights Générés</p>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div className="bg-orange-400 h-1 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>

          {/* Agent Mode Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-600/30">
              <div className="flex space-x-2">
                {[
                  { id: 'autonomous', label: 'Autonome', icon: FaBrain, color: 'cyan' },
                  { id: 'guided', label: 'Guidé', icon: FaEye, color: 'purple' },
                  { id: 'analytical', label: 'Analytique', icon: FaChartLine, color: 'green' }
                ].map((mode) => {
                  const IconComponent = mode.icon;
                  const isActive = agentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setAgentMode(mode.id as 'autonomous' | 'guided' | 'analytical')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? `bg-${mode.color}-500/20 text-${mode.color}-300 border border-${mode.color}-500/50` 
                          : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/30'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="font-medium">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>        {/* MCP Agent Component */}
        <MCPAgent onToolExecute={handleToolExecute} />

        {/* Active Task Monitor */}
        {activeTask && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <FaBrain className="w-5 h-5 mr-3 text-cyan-400 animate-pulse" />
                  Tâche Agent en Cours
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    activeTask.status === 'searching' ? 'bg-blue-400' :
                    activeTask.status === 'analyzing' ? 'bg-yellow-400' :
                    activeTask.status === 'generating' ? 'bg-purple-400' :
                    'bg-green-400'
                  }`}></div>
                  <span className="text-sm text-gray-300 capitalize">{activeTask.status}</span>
                </div>
              </div>
              
              <h4 className="text-lg text-white mb-4">{activeTask.title}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{activeTask.sources}</div>
                  <div className="text-sm text-gray-400">Sources Analysées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{activeTask.insights}</div>
                  <div className="text-sm text-gray-400">Insights Extraits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{Math.floor(activeTask.progress)}%</div>
                  <div className="text-sm text-gray-400">Progression</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{width: `${activeTask.progress}%`}}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Task Showcase */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Capacités Avancées du Neural Agent
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Découvrez la puissance de l&apos;intelligence artificielle autonome avec des tâches complexes 
              combinant recherche multi-sources, analyse profonde et génération de rapports intelligents.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Task Card 1: Market Analysis */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Analyse de Marché IA Complète</h3>
                  <p className="text-cyan-300 text-sm">Recherche autonome • Analyse prédictive • Rapport structuré</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                L&apos;agent scrape automatiquement les sites d&apos;actualités tech, LinkedIn, bases de données d&apos;investissement, 
                analyse les tendances avec l&apos;IA et génère un rapport complet avec graphiques et recommandations.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Scraping de 15+ sources (TechCrunch, VentureBeat, LinkedIn)</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Analyse des patterns d&apos;investissement et technologies émergentes</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Génération de graphiques interactifs et insights prédictifs</span>
                </div>
              </div>
              
              <button 
                onClick={() => startAgentTask("Analyse complète du marché IA français 2025")}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Lancer l&apos;Analyse Autonome
              </button>
            </div>

            {/* Task Card 2: Competitive Intelligence */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <FaEye className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Intelligence Concurrentielle</h3>
                  <p className="text-purple-300 text-sm">Surveillance continue • Benchmarking • Alertes</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Surveillance automatisée des concurrents, analyse comparative des fonctionnalités, 
                prix et stratégies marketing avec alertes en temps réel sur les changements significatifs.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Monitoring de sites web et réseaux sociaux</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Comparaison automatisée des features et pricing</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Dashboard temps réel avec alertes intelligentes</span>
                </div>
              </div>
              
              <button 
                onClick={() => startAgentTask("Veille concurrentielle ChatGPT vs Claude vs Gemini")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Activer la Surveillance
              </button>
            </div>

            {/* Task Card 3: Research Synthesis */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                  <FaDatabase className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Synthèse de Recherche Académique</h3>
                  <p className="text-green-300 text-sm">Bases de données • Synthèse • Citations</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Recherche automatisée dans les bases de données académiques, synthèse intelligente 
                des publications récentes et génération de bibliographies annotées avec analyse critique.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Accès à arXiv, PubMed, IEEE Xplore, Google Scholar</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Synthèse automatique et détection de tendances</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Bibliographie formatée avec annotations critiques</span>
                </div>
              </div>
              
              <button 
                onClick={() => startAgentTask("Synthèse recherche: Transformers et attention mechanisms 2024-2025")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Démarrer la Recherche
              </button>
            </div>

            {/* Task Card 4: Trend Prediction */}
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/30 backdrop-blur-sm hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
                  <FaLightbulb className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Prédiction de Tendances Tech</h3>
                  <p className="text-orange-300 text-sm">Machine Learning • Prédictions • Insights</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Analyse prédictive des tendances technologiques basée sur des milliers de sources, 
                utilisant des modèles ML pour identifier les technologies émergentes avant qu&apos;elles deviennent mainstream.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Analyse de brevets, publications et investissements</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Modèles prédictifs avec scoring de probabilité</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Timeline prédictive avec recommandations stratégiques</span>
                </div>
              </div>
              
              <button 
                onClick={() => startAgentTask("Prédiction des technologies émergentes 2025-2030")}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Générer les Prédictions
              </button>
            </div>
          </div>          {/* Neural Network Visualization */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-600/30 mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Architecture Neural Agent MCP
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center">
                  <FaNetworkWired className="text-white text-2xl" />
                </div>
                <h4 className="text-xl font-semibold text-white">Couche d&apos;Acquisition</h4>
                <p className="text-gray-300 text-sm">
                  Scraping intelligent, APIs multiples, bases de données, flux RSS, 
                  monitoring temps réel avec filtrage adaptatif des sources.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
                  <FaBrain className="text-white text-2xl" />
                </div>
                <h4 className="text-xl font-semibold text-white">Couche de Raisonnement</h4>
                <p className="text-gray-300 text-sm">
                  Traitement par LLM, analyse sémantique, extraction d&apos;insights, 
                  corrélations complexes et génération d&apos;hypothèses.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center">
                  <FaChartLine className="text-white text-2xl" />
                </div>
                <h4 className="text-xl font-semibold text-white">Couche de Synthèse</h4>
                <p className="text-gray-300 text-sm">
                  Génération de rapports structurés, visualisations dynamiques, 
                  recommandations actionnables et alertes intelligentes.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-500/30 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4 flex items-center">
              <FaLightbulb className="w-5 h-5 mr-3" />
              💡 Optimisation de l&apos;Agent Neural
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">Maximiser l&apos;Efficacité :</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• Définissez des objectifs précis et mesurables</li>
                  <li>• Utilisez des mots-clés spécifiques pour le scraping</li>
                  <li>• Configurez les filtres de pertinence par domaine</li>
                  <li>• Planifiez les tâches récurrentes en mode batch</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Sources Recommandées :</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• APIs officielles pour données structurées</li>
                  <li>• Flux RSS pour monitoring temps réel</li>
                  <li>• Bases académiques pour recherche approfondie</li>
                  <li>• Réseaux sociaux pour sentiment analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>        {/* Recent Executions */}
        {executedTools.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FaBrain className="w-5 h-5 mr-3 text-cyan-400" />
              Exécutions Récentes des Outils
            </h3>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {executedTools.map((execution, index) => (
                  <div 
                    key={index}
                    className="p-4 border-b border-slate-600/30 last:border-b-0 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-400 font-medium">
                        {execution.tool}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(execution.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      <code className="bg-slate-800 px-2 py-1 rounded text-xs">
                        {JSON.stringify(execution.args, null, 2)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About MCP */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30 p-8">
            <h3 className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                À Propos du Model Context Protocol (MCP)
              </span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <FaNetworkWired className="w-5 h-5 mr-3 text-cyan-400" />
                    Outils Connectés
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Recherche Web via SerpAPI avec filtrage intelligent</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Chat IA avec modèles multiples (GPT, Claude, Gemini)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Analyse de fichiers (Images, Documents, Vidéos)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Gestion des conversations et historique</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">APIs de scraping et monitoring temps réel</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <FaLightbulb className="w-5 h-5 mr-3 text-purple-400" />
                    Capacités Avancées
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Intégration de recherche web en temps réel</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Réponses IA enrichies par RAG (Retrieval Augmented Generation)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Traitement multi-format avec analyse intelligente</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Workflows automatisés avec chaînage d&apos;outils</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">Sécurité avancée pour les clés API et données</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-lg border border-slate-500/30">
              <p className="text-gray-300 text-center leading-relaxed">
                Le <span className="text-cyan-300 font-semibold">Model Context Protocol (MCP)</span> est un standard ouvert qui permet aux applications IA 
                d&apos;accéder de manière sécurisée à des sources de données externes et des outils. 
                <br/>
                <span className="text-purple-300 font-semibold">Tetika Neural Agent</span> implémente MCP pour fournir un accès structuré 
                à ses capacités avancées de recherche, d&apos;analyse et de génération de rapports.
              </p>            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis Section */}
      {showMarketAnalysis && (
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">
              Analyse de Marché IA Autonome
            </h2>
            <button
              onClick={() => setShowMarketAnalysis(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Fermer l&apos;analyse
            </button>
          </div>
          
          <MarketAnalysis 
            query="Analyse complète du marché IA français 2025"
            onAnalysisComplete={(data) => {
              console.log('Analysis completed:', data);
            }}
          />
        </div>
      )}
    </div>
  );
}
