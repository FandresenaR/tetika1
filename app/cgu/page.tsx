'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CGU() {
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Conditions Générales d&apos;Utilisation
          </span>
        </h1>

        <div className={`space-y-4 sm:space-y-6 rounded-xl p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`}>
          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">1. Présentation de l&apos;application TETIKA</h2>
            <p className="mb-3 text-sm sm:text-base">
              TETIKA est une interface de chat propulsée par l&apos;intelligence artificielle qui permet aux utilisateurs d&apos;interagir avec différents modèles de langage.
              L&apos;application est conçue pour offrir une expérience utilisateur fluide et intuitive tout en respectant la vie privée des utilisateurs.
            </p>
            <p className="text-sm sm:text-base">
              Ces conditions générales d&apos;utilisation s&apos;appliquent à toute utilisation de l&apos;application TETIKA. En utilisant notre service, vous acceptez de vous conformer à ces conditions.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">2. Accès et Utilisation</h2>
            <p className="mb-3 text-sm sm:text-base">
              L&apos;accès à TETIKA nécessite la configuration d&apos;une clé API personnelle. L&apos;utilisateur est responsable de la sécurité de cette clé.
            </p>
            <p className="mb-3 text-sm sm:text-base">
              Vous vous engagez à ne pas utiliser TETIKA à des fins illégales ou interdites par les présentes conditions. Vous acceptez notamment de ne pas :
            </p>
            <ul className="list-disc ml-5 sm:ml-6 space-y-1 mb-3 text-sm sm:text-base">
              <li>Utiliser l&apos;application pour violer toute loi applicable</li>
              <li>Tenter de nuire au bon fonctionnement du service</li>
              <li>Collecter des informations sur d&apos;autres utilisateurs sans leur consentement</li>
              <li>Utiliser l&apos;application pour générer du contenu illégal, offensant, diffamatoire ou préjudiciable</li>
            </ul>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">3. Droits de Propriété Intellectuelle</h2>
            <p className="mb-3 text-sm sm:text-base">
              L&apos;application TETIKA, y compris son interface, son design, ses logos et son code source, est protégée par les droits de propriété intellectuelle. 
              L&apos;utilisation de l&apos;application ne vous confère aucun droit de propriété intellectuelle sur le service ou son contenu.
            </p>
            <p className="text-sm sm:text-base">
              Le contenu généré par les utilisateurs via l&apos;application reste leur propriété, sous réserve des droits accordés aux modèles d&apos;IA utilisés pour générer ce contenu.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">4. Responsabilité</h2>
            <p className="mb-3 text-sm sm:text-base">
              TETIKA est proposé &quot;tel quel&quot; sans garantie d&apos;aucune sorte. Nous ne garantissons pas que l&apos;application répondra à vos besoins spécifiques ou que son fonctionnement sera ininterrompu, sécurisé ou exempt d&apos;erreurs.
            </p>
            <p className="mb-3 text-sm sm:text-base">
              L&apos;utilisateur est seul responsable du contenu qu&apos;il génère via l&apos;application ainsi que de l&apos;utilisation qu&apos;il en fait.
            </p>
            <p className="text-sm sm:text-base">
              Nous ne serons pas responsables des dommages directs, indirects, spéciaux, consécutifs ou punitifs résultant de votre utilisation ou de votre incapacité à utiliser TETIKA.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">5. Modifications des Conditions</h2>
            <p className="text-sm sm:text-base">
              Nous nous réservons le droit de modifier ces conditions générales à tout moment. Les modifications entreront en vigueur dès leur publication. 
              Votre utilisation continue de l&apos;application après la publication des modifications constitue votre acceptation de ces modifications.
            </p>
          </section>

          <section className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">6. Loi Applicable</h2>
            <p className="text-sm sm:text-base">
              Les présentes conditions sont régies et interprétées conformément aux lois en vigueur, sans égard aux principes de conflits de lois.
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