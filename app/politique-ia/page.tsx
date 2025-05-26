'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PolitiqueIA() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Détecter le thème actuel
  useEffect(() => {
    // Vérifier si le thème est stocké dans localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const currentYear = new Date().getFullYear();

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-100 text-gray-800';

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900/90' : 'border-gray-200 bg-white/90'} backdrop-blur`}>
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <h1 className="text-xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">TETIKA</span> AI
              </h1>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            </div>
          </Link>
          <Link 
            href="/" 
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              theme === 'dark' 
                ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Retour au chat
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-3 sm:p-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Politique IA
            </span>
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            En vigueur
          </span>
        </div>

        <div className={`space-y-4 sm:space-y-6 rounded-xl p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`}>
          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">1. Notre approche de l&apos;IA</h2>
            <p className="mb-3 text-sm sm:text-base">
              TETIKA s&apos;engage à développer et à utiliser l&apos;intelligence artificielle de manière responsable, éthique et centrée sur l&apos;humain. 
              Notre objectif est de fournir des services d&apos;IA qui créent de la valeur tout en minimisant les risques potentiels.
            </p>
            <p className="text-sm sm:text-base">
              Cette politique définit nos principes directeurs, nos pratiques et nos engagements en matière d&apos;intelligence artificielle.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">2. Principes fondamentaux</h2>
            <p className="mb-3 text-sm sm:text-base">TETIKA adhère aux principes suivants dans le développement et l&apos;utilisation de l&apos;IA :</p>
            <ul className="list-disc ml-5 sm:ml-6 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>
                <strong>Transparence</strong> : Nous communiquons clairement sur les capacités et les limites de nos systèmes d&apos;IA.
              </li>
              <li>
                <strong>Équité et inclusion</strong> : Nous nous efforçons de minimiser les biais et les discriminations dans nos systèmes d&apos;IA.
              </li>
              <li>
                <strong>Protection de la vie privée</strong> : Nous respectons et protégeons les données personnelles utilisées par nos systèmes d&apos;IA.
              </li>
              <li>
                <strong>Sécurité</strong> : Nous concevons nos systèmes d&apos;IA pour qu&apos;ils soient sûrs, fiables et robustes.
              </li>
              <li>
                <strong>Responsabilité humaine</strong> : Nous maintenons une supervision humaine appropriée sur nos systèmes d&apos;IA.
              </li>
            </ul>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">3. Utilisation des modèles d&apos;IA</h2>
            <p className="mb-3 text-sm sm:text-base">
              TETIKA utilise différents modèles d&apos;IA pour fournir ses services. Ces modèles sont développés par des tiers et nous les intégrons à notre plateforme via des API sécurisées.
            </p>
            <p className="mb-3 text-sm sm:text-base">
              Nous choisissons avec soin les modèles que nous utilisons en évaluant leur performance, leur fiabilité, leurs protections et leur conformité avec nos principes éthiques.
            </p>
            <p className="text-sm sm:text-base">
              Les principaux modèles disponibles sur TETIKA sont développés par OpenAI, Anthropic, Google, et d&apos;autres leaders du secteur. Chacun de ces modèles a ses propres capacités et limitations.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">4. Gestion des données</h2>
            <h3 className="text-base sm:text-lg font-medium mb-2">4.1 Collecte et utilisation des données</h3>
            <p className="mb-3 text-sm sm:text-base">
              TETIKA est conçu pour minimiser la collecte de données personnelles. Nous ne collectons que les données nécessaires au fonctionnement de nos services.
            </p>
            <p className="mb-3 text-sm sm:text-base">
              Les conversations et prompts des utilisateurs sont traités via les API des fournisseurs de modèles d&apos;IA, mais ne sont pas stockés de manière permanente sur nos serveurs, sauf dans le cache local de votre navigateur pour permettre la récupération de l&apos;historique des conversations.
            </p>
            
            <h3 className="text-base sm:text-lg font-medium mb-2 mt-3 sm:mt-4">4.2 Protection des données</h3>
            <p className="mb-3 text-sm sm:text-base">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre la perte, l&apos;accès non autorisé ou la divulgation.
            </p>
            <p className="text-sm sm:text-base">
              TETIKA utilise le stockage local (localStorage) de votre navigateur pour sauvegarder vos conversations et préférences. Ces données restent sur votre appareil et ne sont pas transmises à nos serveurs.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">5. Transparence algorithmique</h2>
            <p className="mb-3 text-sm sm:text-base">
              Nous nous efforçons d&apos;être transparents sur le fonctionnement de nos systèmes d&apos;IA. Cependant, certains aspects des modèles d&apos;IA que nous utilisons sont propriétaires et développés par des tiers.
            </p>
            <p className="text-sm sm:text-base">
              Nous fournissons des informations sur les capacités et les limites de ces modèles dans notre interface, et nous mettons à jour ces informations lorsque de nouvelles versions sont disponibles.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">6. Limitations des systèmes d&apos;IA</h2>
            <p className="mb-3 text-sm sm:text-base">
              Les systèmes d&apos;IA utilisés par TETIKA ont certaines limitations dont les utilisateurs doivent être conscients :
            </p>
            <ul className="list-disc ml-5 sm:ml-6 space-y-1 sm:space-y-2 text-sm sm:text-base">
              <li>Ils peuvent parfois générer des informations inexactes ou trompeuses.</li>
              <li>Ils peuvent produire des résultats biaisés reflétant les biais présents dans leurs données d&apos;entraînement.</li>
              <li>Ils ont une connaissance limitée du monde après leur date de formation.</li>
              <li>Ils ne possèdent pas de conscience ou de compréhension réelle.</li>
              <li>Ils ne peuvent pas accéder à Internet ou à des systèmes externes sans fonctionnalités spécifiquement conçues à cet effet.</li>
            </ul>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">7. Amélioration continue et gouvernance</h2>
            <p className="mb-3 text-sm sm:text-base">
              Nous nous engageons à améliorer continuellement nos pratiques en matière d&apos;IA. Nous surveillons les progrès technologiques, les meilleures pratiques de l&apos;industrie et les développements réglementaires.
            </p>
            <p className="text-sm sm:text-base">
              TETIKA dispose d&apos;un cadre de gouvernance pour superviser le développement et l&apos;utilisation de l&apos;IA, évaluer les risques et garantir la conformité avec cette politique.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">8. Responsabilité et contact</h2>
            <p className="text-sm sm:text-base">
              Si vous avez des questions ou des préoccupations concernant notre politique d&apos;IA ou l&apos;utilisation de l&apos;IA dans nos services, veuillez nous contacter via notre page GitHub ou LinkedIn.
            </p>
          </section>
        </div>

        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm opacity-70">
          Dernière mise à jour : 8 mai 2025
        </p>
      </main>

      {/* Footer */}
      <footer className={`w-full py-3 px-4 text-center text-xs border-t ${
        theme === 'dark' 
          ? 'bg-gray-900/80 border-gray-800 text-gray-400' 
          : 'bg-white/80 border-gray-200 text-gray-600'
      }`}>
        <div className="max-w-4xl mx-auto">
          <p>Copyright © {currentYear} <a 
            href="https://github.com/FandresenaR/tetika1" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`font-medium hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
          >
            Fandresena
          </a></p>
        </div>
      </footer>
    </div>
  );
}