import React, { useEffect, useState } from 'react';
import { detectLanguage } from '@/lib/speech-utils';

// Types for suggestions
interface Suggestion {
  text: string;
  description: string;
}

// Pre-defined suggestions in French and English
const frenchSuggestions = [
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

const englishSuggestions = [
  {
    text: "Could you provide me with recent data on this topic?",
    description: "Gets up-to-date information from the web"
  },
  {
    text: "What are the latest news regarding this field?",
    description: "Searches for recent information online"
  },
  {
    text: "Have there been any significant developments on this topic recently?",
    description: "Accesses updated data to complement the response"
  },
  {
    text: "Can you enhance this answer with external sources?",
    description: "Improves the response with verifiable references"
  },
  {
    text: "What are the most recent statistics available on this subject?",
    description: "Searches for updated numerical data"
  }
];

// Keywords and topics to identify for contextual suggestions
interface Topic {
  fr: string[];
  en: string[];
  categories: string[];
}

// Common topics to detect in conversations
const topics: Topic[] = [
  {
    fr: ['intelligence artificielle', 'ia', 'ml', 'machine learning', 'apprentissage automatique'],
    en: ['artificial intelligence', 'ai', 'ml', 'machine learning'],
    categories: ['tech', 'ai']
  },
  {
    fr: ['climat', 'réchauffement', 'environnement', 'développement durable', 'écologie'],
    en: ['climate', 'warming', 'environment', 'sustainable development', 'ecology'],
    categories: ['climate', 'environment']
  },
  {
    fr: ['politique', 'gouvernement', 'élection', 'démocratie', 'président'],
    en: ['politics', 'government', 'election', 'democracy', 'president'],
    categories: ['politics', 'news']
  },
  {
    fr: ['économie', 'finance', 'bourse', 'investissement', 'marché'],
    en: ['economy', 'finance', 'stock market', 'investment', 'market'],
    categories: ['finance', 'business']
  },
  {
    fr: ['santé', 'médecine', 'pandémie', 'vaccination', 'maladie'],
    en: ['health', 'medicine', 'pandemic', 'vaccination', 'disease'],
    categories: ['health', 'science']
  }
];

interface SmartRAGSuggestionsProps {
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  theme?: 'dark' | 'light';
  previousMessages?: Array<{ role: string; content: string }>;
}

export const SmartRAGSuggestions: React.FC<SmartRAGSuggestionsProps> = ({
  isVisible,
  onSuggestionClick,
  theme = 'dark',
  previousMessages = []
}) => {
  const [relevantSuggestions, setRelevantSuggestions] = useState<Suggestion[]>([]);
  const [userLanguage, setUserLanguage] = useState<'fr-FR' | 'en-US'>('fr-FR');
  const [headerText, setHeaderText] = useState({
    title: 'Questions suggérées avec recherche web (RAG)',
    subtitle: 'Essayez ces questions pour obtenir des informations récentes et des sources externes'
  });

  useEffect(() => {
    // Determine language and get relevant suggestions when previous messages change
    if (previousMessages && previousMessages.length > 0) {
      // Get the last user message to determine language
      const lastUserMessage = [...previousMessages]
        .reverse()
        .find(msg => msg.role === 'user');
      
      let detectedLang = 'fr-FR'; // Default to French
      
      if (lastUserMessage) {
        // Detect language of the last user message
        detectedLang = detectLanguage(lastUserMessage.content);
        setUserLanguage(detectedLang as 'fr-FR' | 'en-US');
        
        // Set header text based on language
        if (detectedLang === 'en-US') {
          setHeaderText({
            title: 'Suggested questions with web search (RAG)',
            subtitle: 'Try these questions to get recent information and external sources'
          });
        } else {
          setHeaderText({
            title: 'Questions suggérées avec recherche web (RAG)',
            subtitle: 'Essayez ces questions pour obtenir des informations récentes et des sources externes'
          });
        }
      }
      
      // Generate contextual suggestions
      const contextualSuggestions = generateContextualSuggestions(previousMessages, detectedLang === 'en-US');
      setRelevantSuggestions(contextualSuggestions);
    }
  }, [previousMessages, isVisible]);

  // Function to identify topics in messages and generate contextual suggestions
  const generateContextualSuggestions = (messages: Array<{ role: string; content: string }>, isEnglish: boolean): Suggestion[] => {
    // Use the default suggestions list based on language
    const baseSuggestions = isEnglish ? englishSuggestions : frenchSuggestions;
    
    // If there are not enough messages, return the default suggestions
    if (messages.length < 2) {
      return baseSuggestions;
    }
    
    // Get the last few messages to analyze
    const recentMessages = messages.slice(-3);
    const lastUserMessage = recentMessages.find(msg => msg.role === 'user');
    
    if (!lastUserMessage) {
      return baseSuggestions;
    }
    
    // Check if we can identify specific topics in the recent conversation
    const identifiedTopics: string[] = [];
    
    topics.forEach(topic => {
      const keywords = isEnglish ? topic.en : topic.fr;
      const messageContent = lastUserMessage.content.toLowerCase();
      
      // Check if any keywords from the topic are present in the message
      for (const keyword of keywords) {
        if (messageContent.includes(keyword.toLowerCase())) {
          identifiedTopics.push(...topic.categories);
          break;
        }
      }
    });
    
    if (identifiedTopics.length === 0) {
      return baseSuggestions;
    }
    
    // Generate custom suggestions based on identified topics and language
    const customSuggestions: Suggestion[] = [];
    
    if (identifiedTopics.includes('ai')) {
      if (isEnglish) {
        customSuggestions.push({
          text: "What are the latest developments in AI research?",
          description: "Get recent information about AI advancements"
        });
      } else {
        customSuggestions.push({
          text: "Quelles sont les dernières avancées dans la recherche en IA?",
          description: "Obtenir des informations récentes sur les progrès en IA"
        });
      }
    }
    
    if (identifiedTopics.includes('climate')) {
      if (isEnglish) {
        customSuggestions.push({
          text: "What are the latest climate change statistics for 2025?",
          description: "Get recent data on climate change impacts"
        });
      } else {
        customSuggestions.push({
          text: "Quelles sont les dernières statistiques sur le changement climatique en 2025?",
          description: "Obtenir des données récentes sur les impacts du changement climatique"
        });
      }
    }
    
    if (identifiedTopics.includes('politics') || identifiedTopics.includes('news')) {
      if (isEnglish) {
        customSuggestions.push({
          text: "What are the most recent political developments globally?",
          description: "Get up-to-date information on worldwide politics"
        });
      } else {
        customSuggestions.push({
          text: "Quels sont les développements politiques les plus récents dans le monde?",
          description: "Obtenir des informations à jour sur la politique mondiale"
        });
      }
    }
    
    if (identifiedTopics.includes('health')) {
      if (isEnglish) {
        customSuggestions.push({
          text: "What are the latest medical breakthroughs in this field?",
          description: "Discover recent advances in medicine and health"
        });
      } else {
        customSuggestions.push({
          text: "Quelles sont les dernières percées médicales dans ce domaine?",
          description: "Découvrir les avancées récentes en médecine et santé"
        });
      }
    }
    
    // If we have custom suggestions, use them; otherwise fall back to the default ones
    return customSuggestions.length > 0 ? customSuggestions : baseSuggestions;
  };

  if (!isVisible) return null;

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
          {headerText.title}
        </h3>
      </div>

      <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
        {headerText.subtitle}
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
              &quot;{suggestion.text}&quot;
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
