'use client';

import React, { useState } from 'react';
import { 
  FaPlay, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaChartLine, 
  FaUsers, 
  FaArrowUp, 
  FaShieldAlt, 
  FaLightbulb, 
  FaBullseye,
  FaSearch,
  FaCopy,
  FaDownload,
  FaEye,
  FaCog
} from 'react-icons/fa';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  data?: Record<string, unknown>;
  timestamp: string;
}

interface MarketAnalysisData {
  marketData?: {
    marketSize: {
      current: string;
      projected2025: string;
      growthRate: string;
      confidence: string;
    };
    segments: Array<{
      name: string;
      size: string;
      growth: string;
    }>;
    keyMetrics: {
      totalCompanies: number;
      startups: number;
      totalFunding: string;
      avgFundingRound: string;
    };
  };
  competitors?: {
    topCompetitors: Array<{
      name: string;
      marketShare: string;
      strengths: string[];
      weaknesses: string[];
    }>;
    competitiveGaps: string[];
  };
  trends?: {
    emergingTrends: Array<{
      name: string;
      impact: string;
      timeline: string;
      description: string;
    }>;
    adoptionDrivers: string[];
  };
  insights?: {
    keyInsights: Array<{
      category: string;
      title: string;
      description: string;
      confidence: string;
      actionability: string;
    }>;
    strategicImplications: string[];
  };
  recommendations?: {
    immediateActions: Array<{
      action: string;
      priority: string;
      effort: string;
      impact: string;
      timeline: string;
    }>;
    strategicRecommendations: Array<{
      recommendation: string;
      rationale: string;
      timeline: string;
      investmentRequired: string;
    }>;
    kpis: string[];
  };
}

interface MarketAnalysisResponse {
  success: boolean;
  analysisId: string;
  steps: AnalysisStep[];
  currentStep: string;
  overallProgress: number;
  data?: MarketAnalysisData;
  error?: string;
}

interface MarketAnalysisProps {
  query: string;
  onAnalysisComplete?: (data: MarketAnalysisData) => void;
}

const MarketAnalysisComponent: React.FC<MarketAnalysisProps> = ({ query, onAnalysisComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysisResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const startAnalysis = async () => {
    setIsRunning(true);
    setAnalysis(null);
    setShowResults(false);

    try {
      const response = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          market: 'France',
          year: '2025'
        })
      });

      const data: MarketAnalysisResponse = await response.json();
      setAnalysis(data);
      
      if (data.success && data.data) {
        onAnalysisComplete?.(data.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis({
        success: false,
        analysisId: 'error',
        steps: [],
        currentStep: 'error',
        overallProgress: 0,
        error: 'Erreur lors de l\'analyse'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (stepId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'data-collection': <FaSearch className="w-5 h-5" />,
      'market-sizing': <FaChartLine className="w-5 h-5" />,
      'competitor-analysis': <FaUsers className="w-5 h-5" />,
      'trend-analysis': <FaArrowUp className="w-5 h-5" />,
      'risk-assessment': <FaShieldAlt className="w-5 h-5" />,
      'insights-generation': <FaLightbulb className="w-5 h-5" />,
      'recommendations': <FaBullseye className="w-5 h-5" />
    };
    return iconMap[stepId] || <FaSpinner className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResults = () => {
    if (!analysis?.data) return;
    
    const exportData = {
      analysis: analysis.data,
      query,
      timestamp: new Date().toISOString(),
      analysisId: analysis.analysisId
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Analyse de Marché IA Complète</h3>
            <p className="text-blue-300">Requête: {query}</p>
          </div>
          <div className="flex items-center space-x-3">
            {analysis?.data && (
              <>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg text-sm text-blue-300 flex items-center space-x-2 transition-all"
                >
                  <FaEye className="w-4 h-4" />
                  <span>{showResults ? 'Masquer' : 'Voir'} Résultats</span>
                </button>
                <button
                  onClick={exportResults}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg text-sm text-green-300 flex items-center space-x-2 transition-all"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </>
            )}
            <button
              onClick={startAnalysis}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all flex items-center space-x-2 ${
                isRunning 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:scale-105'
              }`}
            >
              {isRunning ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <FaPlay className="w-5 h-5" />
                  <span>Lancer l&apos;Analyse Autonome</span>
                </>
              )}
            </button>
          </div>
        </div>        {/* Progress Bar */}
        {analysis && (
          <div className="w-full bg-slate-700/50 rounded-full h-3 mb-2">
            <div className={`h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-500`} />
          </div>
        )}
      </div>

      {/* Analysis Steps */}
      {analysis && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <FaCog className="w-5 h-5 mr-2 text-cyan-400" />
            Raisonnement Étape par Étape
          </h4>
          
          {analysis.steps.map((step, index) => (
            <div key={step.id} className={`border rounded-xl transition-all ${getStatusColor(step.status)}`}>
              <div 
                className="p-4 cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => toggleStepExpansion(step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full border ${getStatusColor(step.status)}`}>
                      {step.status === 'running' ? (
                        <FaSpinner className="w-5 h-5 animate-spin" />
                      ) : step.status === 'completed' ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : step.status === 'error' ? (
                        <FaExclamationTriangle className="w-5 h-5" />
                      ) : (
                        getStepIcon(step.id)
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold">
                        Étape {index + 1}: {step.title}
                      </h5>
                      <p className="text-sm opacity-75">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {step.status === 'running' && (
                      <div className="text-sm">
                        {step.progress}%
                      </div>
                    )}
                    <div className={`w-2 h-2 rounded-full transition-all ${
                      expandedSteps.has(step.id) ? 'rotate-180' : ''
                    }`}>
                      <div className="w-full h-full bg-current rounded-full"></div>
                    </div>
                  </div>
                </div>                {/* Step Progress Bar */}
                {step.status === 'running' && (
                  <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-300 bg-blue-500 origin-left" />
                  </div>
                )}
              </div>

              {/* Expanded Step Content */}
              {expandedSteps.has(step.id) && step.data && (
                <div className="p-4 border-t border-current/20 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="font-medium">Données collectées</h6>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(step.data, null, 2))}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs flex items-center space-x-1 transition-all"
                    >
                      <FaCopy className="w-3 h-3" />
                      <span>Copier</span>
                    </button>
                  </div>
                  <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(step.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Section */}
      {showResults && analysis?.data && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Résultats de l&apos;Analyse</h4>
          
          {/* Market Data */}
          {analysis.data.marketData && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30">
              <h5 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FaChartLine className="w-5 h-5 mr-2 text-green-400" />
                Dimensionnement du Marché
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Taille actuelle:</div>
                  <div className="text-xl font-bold text-green-400">
                    {analysis.data.marketData.marketSize.current}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Projection 2025:</div>
                  <div className="text-xl font-bold text-blue-400">
                    {analysis.data.marketData.marketSize.projected2025}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {analysis && !analysis.success && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-400 text-xl" />
            <div>
              <h5 className="font-semibold text-red-400">Erreur d&apos;Analyse</h5>
              <p className="text-red-300">{analysis.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketAnalysisComponent;
