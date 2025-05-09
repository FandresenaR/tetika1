import React, { useState, useEffect } from 'react';
import { isSpeechSynthesisSupported } from '@/lib/speech-utils';

/**
 * Component to verify if the browser supports speech synthesis
 */
const SpeechSynthesisCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'supported' | 'unsupported' | 'novoices'>('checking');
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    const checkSpeechSupport = async () => {
      // Check if the browser supports the SpeechSynthesis API
      const hasSupport = isSpeechSynthesisSupported();
      
      if (!hasSupport) {
        setStatus('unsupported');
        return;
      }
      
      // Check if there are voices available
      try {
        // Try to get voices immediately
        let voices = window.speechSynthesis.getVoices();
        
        // If no voices, wait for them to load
        if (voices.length === 0) {
          // Set up a promise to wait for voices
          const voicesLoaded = new Promise<boolean>((resolve) => {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve(voices.length > 0);
            };
            
            // Timeout after 5 seconds - augmenté pour donner plus de temps pour charger les voix
            setTimeout(() => {
              // Vérifier une dernière fois avant de déclarer qu'il n'y a pas de voix
              const lastCheck = window.speechSynthesis.getVoices();
              resolve(lastCheck.length > 0);
            }, 5000);
          });
          
          const hasVoices = await voicesLoaded;
          
          if (!hasVoices) {
            // Tentative supplémentaire: sur certains navigateurs, il faut parfois une action comme
            // cancel() pour déclencher le chargement des voix
            try {
              window.speechSynthesis.cancel();
              // Attendre un peu puis vérifier à nouveau
              await new Promise(resolve => setTimeout(resolve, 500));
              const finalCheck = window.speechSynthesis.getVoices();
              
              if (finalCheck.length > 0) {
                setStatus('supported');
                return;
              }
              
              setStatus('novoices');
              return;
            } catch (e) {
              console.error('Erreur lors de la tentative de récupération de voix:', e);
              setStatus('novoices');
              return;
            }
          }
        }
        
        // We have support and voices
        setStatus('supported');
      } catch (error) {
        console.error('Error checking speech synthesis voices:', error);
        setStatus('unsupported');
      }
    };
    
    checkSpeechSupport();
  }, []);
  
  // Hide the message after 10 seconds if it's just informational (supported)
  useEffect(() => {
    if (status === 'supported') {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [status]);
  if (status === 'checking' || !showMessage) {
    return null;
  }

  if (status === 'unsupported') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-600/90 text-white p-3 rounded-md shadow-lg max-w-xs z-50">
        <div className="flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Fonctionnalité non supportée</span>
          <button 
            onClick={() => setShowMessage(false)}
            className="absolute top-1 right-1 p-1 text-white/80 hover:text-white"
            title="Fermer le message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm">
          La fonctionnalité d&apos;écoute des réponses n&apos;est pas prise en charge par votre navigateur. 
          Essayez avec Chrome, Safari ou Edge pour une meilleure expérience.
        </p>
      </div>
    );
  }
  
  if (status === 'novoices') {
    return (
      <div className="fixed bottom-4 right-4 bg-amber-600/90 text-white p-3 rounded-md shadow-lg max-w-xs z-50">
        <div className="flex items-center gap-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Voix non disponibles</span>
          <button 
            onClick={() => setShowMessage(false)}
            className="absolute top-1 right-1 p-1 text-white/80 hover:text-white"
            title="Fermer le message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm">
          Les voix de synthèse vocale ne sont pas disponibles. Essayez de rafraîchir la page ou de vérifier les paramètres de votre navigateur.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-600/90 text-white p-3 rounded-md shadow-lg max-w-xs z-50">
      <div className="flex items-center gap-2 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <span className="font-semibold">Lecture vocale disponible</span>
        <button 
          onClick={() => setShowMessage(false)}
          className="absolute top-1 right-1 p-1 text-white/80 hover:text-white"
          title="Fermer le message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>      <p className="text-sm">
        Vous pouvez désormais écouter les réponses de l&apos;IA en cliquant sur le bouton vert "Écouter" près de chaque message.
      </p>
    </div>
  );
};

export default SpeechSynthesisCheck;
