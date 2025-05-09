import React from 'react';

interface SmartSuggestionsProps {
  inputText: string;
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
  previousMessages?: Array<{ role: string; content: string }>;
  ragMode?: boolean;
}

const TRIGGER_KEYWORDS = [
  { keyword: "recherche", suggestions: ["articles scientifiques sur", "dernières nouvelles sur", "sites web sur"], useRag: true },
  { keyword: "actualités", suggestions: ["récentes sur", "du jour concernant", "internationales sur"], useRag: true },
  { keyword: "explique", suggestions: ["la situation actuelle", "les derniers développements", "le fonctionnement de"], useRag: true },
  { keyword: "compare", suggestions: ["les différentes approches de", "les technologies récentes pour", "les méthodes actuelles de"], useRag: true },
  { keyword: "script", suggestions: ["python pour", "javascript pour", "bash pour"], useRag: false },
  { keyword: "analyse", suggestions: ["des données de", "de texte pour", "d'image pour"], useRag: false },
  { keyword: "ecrit", suggestions: ["un code pour", "un email à", "un résumé de"], useRag: false },
];

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ 
  inputText, 
  onSuggestionClick,
  visible,
  previousMessages = [],
  ragMode = false
}) => {
  // Recherche des mots clés dans le texte d'entrée
  const findSuggestions = () => {
    const lowercaseInput = inputText.toLowerCase();
    
    // Suggestions basées sur les mots-clés
    for (const item of TRIGGER_KEYWORDS) {
      if (lowercaseInput.includes(item.keyword) && lowercaseInput.endsWith(item.keyword)) {
        // Si nous sommes en mode RAG, prioriser les suggestions qui utilisent RAG
        if (ragMode && item.useRag) {
          return item.suggestions.map(suggestion => `${item.keyword} ${suggestion}`);
        } else if (!ragMode) {
          return item.suggestions.map(suggestion => `${item.keyword} ${suggestion}`);
        }
      }
    }
    
    // Suggestions contextuelles basées sur les interactions précédentes
    if (lowercaseInput.length === 0 && previousMessages.length > 0) {
      const contextualSuggestions: string[] = [];
      
      // Obtenir les 3 derniers messages (maximum)
      const recentMessages = previousMessages.slice(-3);
      
      // Si une des dernières interactions concernait un sujet d'actualité ou technique
      const topics = extractTopicsFromMessages(recentMessages);
      
      if (topics.length > 0) {
        // Créer des suggestions pour approfondir ces sujets
        topics.forEach(topic => {
          // Pour les sujets d'actualité, encourager l'utilisation du RAG
          if (isCurrentEventTopic(topic) && ragMode) {
            contextualSuggestions.push(`Quelles sont les dernières actualités sur ${topic} ?`);
            contextualSuggestions.push(`Explique les développements récents concernant ${topic}`);
          } else if (isTechnicalTopic(topic)) {
            contextualSuggestions.push(`Comment fonctionne ${topic} exactement ?`);
            contextualSuggestions.push(`Quels sont les cas d'usage de ${topic} ?`);
          }
        });
      }
      
      // Si nous avons des suggestions contextuelles, les retourner (max 3)
      if (contextualSuggestions.length > 0) {
        return contextualSuggestions.slice(0, 3);
      }
    }
    
    return [];
  };
  
  // Extrait les sujets principaux des messages récents
  const extractTopicsFromMessages = (messages: Array<{ role: string; content: string }>) => {
    const topics = new Set<string>();
    
    // Mots-clés à ignorer (articles, prépositions, etc.)
    const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'de', 'du', 'sur', 'pour', 'dans', 'en', 'par'];
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        // Tokeniser le message et identifier les sujets potentiels (simplifiés ici)
        const words = msg.content.toLowerCase().split(/[\s,.?!]+/);
        
        // Chercher des mots significatifs (noms propres, termes techniques, etc.)
        words.forEach(word => {
          if (word.length > 4 && !stopWords.includes(word)) {
            topics.add(word);
          }
        });
      }
    });
    
    return Array.from(topics);
  };
  
  // Détermine si un sujet est probablement lié à l'actualité
  const isCurrentEventTopic = (topic: string) => {
    const currentEventKeywords = ['ukraine', 'russie', 'guerre', 'élection', 'président', 'économie', 'inflation', 'crise', 'covid', 'pandémie', 'climat'];
    return currentEventKeywords.some(keyword => topic.includes(keyword));
  };
  
  // Détermine si un sujet est probablement technique
  const isTechnicalTopic = (topic: string) => {
    const technicalKeywords = ['ia', 'intelligence', 'artificielle', 'machine', 'learning', 'neural', 'réseau', 'blockchain', 'crypto', 'programm', 'dévelop', 'code', 'tech'];
    return technicalKeywords.some(keyword => topic.includes(keyword));
  };
  
  const suggestions = findSuggestions();
    if (!visible || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="absolute -top-14 left-12 right-12 bg-gray-800/90 backdrop-blur-sm border border-cyan-900/50 rounded-lg p-2 shadow-lg z-10 transition-all duration-300 ease-in-out">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          // Détermine si la suggestion est liée à l'actualité (aidant à influencer le style)
          const isCurrentEventSuggestion = isCurrentEventTopic(suggestion.toLowerCase());
          const isTechnicalSuggestion = isTechnicalTopic(suggestion.toLowerCase());
          const isRagRelated = isCurrentEventSuggestion || suggestion.toLowerCase().includes('dernières') || 
                               suggestion.toLowerCase().includes('récents') || suggestion.toLowerCase().includes('actualités');
          
          return (
            <button
              key={index}
              className={`text-xs px-3 py-1.5 rounded-full transition-all
                ${isRagRelated
                  ? "bg-gradient-to-r from-cyan-900/70 to-blue-900/70 text-cyan-300 hover:from-cyan-800 hover:to-blue-800"
                  : isTechnicalSuggestion
                    ? "bg-gradient-to-r from-purple-900/70 to-indigo-900/70 text-purple-300 hover:from-purple-800 hover:to-indigo-800"
                    : "bg-gradient-to-r from-gray-800/70 to-gray-700/70 text-gray-300 hover:from-gray-700 hover:to-gray-600"
                }`}
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
              {isRagRelated && 
                <span className="ml-1 inline-flex items-center justify-center w-3 h-3 bg-blue-500/30 rounded-full">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                </span>
              }
            </button>
          );
        })}
      </div>
    </div>
  );
};