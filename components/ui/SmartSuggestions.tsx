import React from 'react';

interface SmartSuggestionsProps {
  inputText: string;
  onSuggestionClick: (suggestion: string) => void;
  visible: boolean;
}

const TRIGGER_KEYWORDS = [
  { keyword: "recherche", suggestions: ["articles scientifiques sur", "dernières nouvelles sur", "sites web sur"] },
  { keyword: "script", suggestions: ["python pour", "javascript pour", "bash pour"] },
  { keyword: "analyse", suggestions: ["des données de", "de texte pour", "d'image pour"] },
  { keyword: "ecrit", suggestions: ["un code pour", "un email à", "un résumé de"] },
];

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ 
  inputText, 
  onSuggestionClick,
  visible 
}) => {
  // Recherche des mots clés dans le texte d'entrée
  const findSuggestions = () => {
    const lowercaseInput = inputText.toLowerCase();
    
    for (const item of TRIGGER_KEYWORDS) {
      if (lowercaseInput.includes(item.keyword) && lowercaseInput.endsWith(item.keyword)) {
        return item.suggestions.map(suggestion => `${item.keyword} ${suggestion}`);
      }
    }
    
    return [];
  };
  
  const suggestions = findSuggestions();
  
  if (!visible || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="absolute -top-14 left-12 right-12 bg-gray-800/90 backdrop-blur-sm border border-cyan-900/50 rounded-lg p-2 shadow-lg z-10 transition-all duration-300 ease-in-out">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-900/70 to-blue-900/70 text-cyan-300 hover:from-cyan-800 hover:to-blue-800 transition-all"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};