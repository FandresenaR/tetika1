'use client';

import { useState, useEffect } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import { ApiConfig } from "@/components/ApiConfig";

export default function Home() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si les clés API nécessaires sont configurées
    const hasOpenRouterKey = localStorage.getItem('tetika-openrouter-key');
    setIsConfigured(!!hasOpenRouterKey);
    setIsLoading(false);
  }, []);

  const handleConfigSaved = () => {
    setIsConfigured(true);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen chat-container flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mx-1"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mx-1 delay-75"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mx-1 delay-150"></div>
          </div>
          <h2 className="text-xl text-cyan-400">Initialisation de Tetika...</h2>
        </div>
      </main>
    );
  }

  if (!isConfigured) {
    return (
      <main className="min-h-screen chat-container flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-10 text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Bienvenue sur Tetika</h1>
          <p className="text-gray-300">
            Votre interface de chat IA futuriste, sécurisée et puissante.
          </p>
        </div>
        
        <ApiConfig onConfigSaved={handleConfigSaved} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <ChatInterface />
    </main>
  );
}
