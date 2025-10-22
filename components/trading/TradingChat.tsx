'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TradingChatProps {
  theme: 'dark' | 'light';
  selectedAsset: string;
  marketData: { price: string; change: string; volume: string; high: string; low: string } | null;
  newsData: Array<{ title: string; snippet: string; datetime: number; sentiment?: string }>;
  technicalIndicators: { rsi: string; macd: string; sma50: string } | null;
  models: Array<{ id: string; name: string; pricing?: { prompt: string } }>;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TradingChat({
  theme,
  selectedAsset,
  marketData,
  newsData,
  technicalIndicators,
  models,
  selectedModel,
  onModelChange
}: TradingChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Bonjour ! Je suis votre assistant de trading IA **avec capacités autonomes**.

Je peux :
🔍 Rechercher des actualités en temps réel
📊 Analyser des tendances de marché
🔎 Trouver des symboles boursiers
💹 Obtenir des données de marché
📈 Calculer des indicateurs techniques

Actuellement analysé : **${selectedAsset}**

Posez-moi n'importe quelle question, je ferai les recherches nécessaires automatiquement !`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Construire le contexte de trading
      const tradingContext = `
Actif analysé: ${selectedAsset}
Prix actuel: ${marketData?.price || 'N/A'}
Variation: ${marketData?.change || 'N/A'}%
Plus haut: ${marketData?.high || 'N/A'}
Plus bas: ${marketData?.low || 'N/A'}

Indicateurs techniques:
- RSI: ${technicalIndicators?.rsi || 'N/A'}
- MACD: ${technicalIndicators?.macd || 'N/A'}
- SMA 50: ${technicalIndicators?.sma50 || 'N/A'}

Dernières actualités:
${newsData.slice(0, 3).map((news, i) => `${i + 1}. ${news.title}`).join('\n')}
`;

      const response = await fetch('/api/trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smartChat', // Utiliser le mode intelligent avec actions autonomes
          symbol: selectedAsset,
          message: inputMessage,
          context: tradingContext,
          history: messages.slice(-6), // Derniers 3 échanges
          modelId: selectedModel
        })
      });

      const data = await response.json();

      // Afficher si l'IA a utilisé des outils
      const responseContent = data.usedTools 
        ? `${data.response}\n\n🤖 _J'ai effectué ${data.toolsExecuted} recherche(s) pour vous répondre._`
        : data.response || 'Désolé, je n\'ai pas pu générer de réponse.';

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Erreur lors de la communication avec l\'IA. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const themeClasses = theme === 'dark'
    ? 'bg-gray-800 text-white'
    : 'bg-white text-gray-800';

  const inputClasses = theme === 'dark'
    ? 'bg-gray-700 text-white border-gray-600'
    : 'bg-gray-50 text-gray-800 border-gray-300';

  return (
    <div className={`flex flex-col h-full rounded-lg ${themeClasses}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-lg font-semibold mb-2">💬 Trading Chat IA</h2>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm ${inputClasses}`}
        >
          <option value="">Sélectionner un modèle</option>
          {models.filter(m => m.id).map((model) => {
            const isFree = model.pricing?.prompt === '0';
            return (
              <option key={model.id} value={model.id}>
                {model.name} {isFree ? '(Gratuit)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700'
                  : 'bg-gray-100'
              }`}
            >
              <div className="text-sm mb-1 opacity-70">
                {message.role === 'user' ? '👤 Vous' : '🤖 Assistant'}
                <span className="ml-2 text-xs">
                  {message.timestamp.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
                <span className="text-sm">L&apos;assistant réfléchit...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez une question sur le trading..."
            rows={2}
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded-lg border resize-none ${inputClasses} disabled:opacity-50`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
