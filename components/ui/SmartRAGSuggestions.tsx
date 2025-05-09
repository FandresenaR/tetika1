import React from 'react';

// Liste de suggestions de prompts RAG à afficher après une réponse en mode standard
const ragSuggestions = [
  {
    text: "Pourrais-tu me fournir des données récentes sur ce sujet?",
    description: "Obtient des informations à jour depuis le web"
  },
  {
    text: "Quelles sont les dernières actualités concernant ce domaine?",
    description: "Recherche des informations récentes en ligne"
  },
  {
    text: "Y a-t-il eu des développements significatifs sur ce sujet récemment?",
    description: "Accède à des données actualisées pour compléter la réponse"
  },
  {
    text: "Peux-tu enrichir cette réponse avec des sources externes?",
    description: "Améliore la réponse avec des références vérifiables"
  },
  {
    text: "Quelles sont les statistiques les plus récentes disponibles à ce sujet?",
    description: "Recherche des données chiffrées actualisées"
  }
];

interface SmartRAGSuggestionsProps {
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  lastStandardQuestion?: string;
  theme?: 'dark' | 'light';
}

export const SmartRAGSuggestions: React.FC<SmartRAGSuggestionsProps> = ({
  isVisible,
  onSuggestionClick,
  lastStandardQuestion = '',
  theme = 'dark'
}) => {
  if (!isVisible) return null;

  // Fonction pour déterminer la pertinence des suggestions en fonction de la dernière question
  const getRelevantSuggestions = () => {
    // On pourrait implémenter une logique plus sophistiquée ici pour filtrer ou trier
    // les suggestions en fonction du contexte de la conversation
    return ragSuggestions;
  };

  const relevantSuggestions = getRelevantSuggestions();

  return (
    <div className={`w-full mt-2 p-3 rounded-lg transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-indigo-900/20 border border-indigo-800/30' 
        : 'bg-indigo-50 border border-indigo-100'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
          Questions suggérées avec recherche web (RAG)
        </h3>
      </div>

      <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
        Essayez ces questions pour obtenir des informations récentes et des sources externes
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {relevantSuggestions.map((suggestion, index) => (
          <div 
            key={index}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={`cursor-pointer p-2 rounded transition-all hover:scale-[1.01]
              ${theme === 'dark' 
                ? 'bg-indigo-800/30 border border-indigo-700/40 hover:bg-indigo-800/40' 
                : 'bg-indigo-100/80 border border-indigo-200 hover:bg-indigo-200/70'}`}
          >
            <p className={`text-sm ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
              "{suggestion.text}"
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded mr-2
                ${theme === 'dark' 
                  ? 'bg-indigo-700/60 text-indigo-300' 
                  : 'bg-indigo-200 text-indigo-700'}`}>
                RAG
              </span>
              <span className="text-xs opacity-70">{suggestion.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
