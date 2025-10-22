import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 * Composant pour afficher les messages d'erreur avec un formatage approprié
 * Gère les sauts de ligne, les émojis et les listes à puces
 */
export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  // Séparer le message en lignes pour un meilleur formatage
  const lines = message.split('\n').filter(line => line.trim());
  
  return (
    <div className={`error-message space-y-2 ${className}`}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Détecter si c'est une liste numérotée
        const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedListMatch) {
          return (
            <div key={index} className="flex items-start gap-2 ml-4">
              <span className="font-semibold text-blue-400 min-w-[20px]">
                {numberedListMatch[1]}.
              </span>
              <span>{numberedListMatch[2]}</span>
            </div>
          );
        }
        
        // Détecter si c'est un titre avec émoji
        if (trimmedLine.startsWith('💡') || trimmedLine.includes('Solutions possibles')) {
          return (
            <div key={index} className="font-semibold text-yellow-400 mt-3">
              {trimmedLine}
            </div>
          );
        }
        
        // Ligne normale
        return (
          <div key={index} className={index === 0 ? 'font-medium' : ''}>
            {trimmedLine}
          </div>
        );
      })}
    </div>
  );
}
