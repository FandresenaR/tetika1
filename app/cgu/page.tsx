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
      <main className="max-w-4xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Conditions Générales d'Utilisation
          </span>
        </h1>

        <div className={`space-y-6 rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'}`}>
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Présentation de l'application TETIKA</h2>
            <p className="mb-3">
              TETIKA est une interface de chat propulsée par l'intelligence artificielle qui permet aux utilisateurs d'interagir avec différents modèles de langage.
              L'application est conçue pour offrir une expérience utilisateur fluide et intuitive tout en respectant la vie privée des utilisateurs.
            </p>
            <p>
              Ces conditions générales d'utilisation s'appliquent à toute utilisation de l'application TETIKA. En utilisant notre service, vous acceptez de vous conformer à ces conditions.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Accès et Utilisation</h2>
            <p className="mb-3">
              L'accès à TETIKA nécessite la configuration d'une clé API personnelle. L'utilisateur est responsable de la sécurité de cette clé.
            </p>
            <p className="mb-3">
              Vous vous engagez à ne pas utiliser TETIKA à des fins illégales ou interdites par les présentes conditions. Vous acceptez notamment de ne pas :
            </p>
            <ul className="list-disc ml-6 space-y-1 mb-3">
              <li>Utiliser l'application pour violer toute loi applicable</li>
              <li>Tenter de nuire au bon fonctionnement du service</li>
              <li>Collecter des informations sur d'autres utilisateurs sans leur consentement</li>
              <li>Utiliser l'application pour générer du contenu illégal, offensant, diffamatoire ou préjudiciable</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Droits de Propriété Intellectuelle</h2>
            <p className="mb-3">
              L'application TETIKA, y compris son interface, son design, ses logos et son code source, est protégée par les droits de propriété intellectuelle. 
              L'utilisation de l'application ne vous confère aucun droit de propriété intellectuelle sur le service ou son contenu.
            </p>
            <p>
              Le contenu généré par les utilisateurs via l'application reste leur propriété, sous réserve des droits accordés aux modèles d'IA utilisés pour générer ce contenu.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Responsabilité</h2>
            <p className="mb-3">
              TETIKA est proposé "tel quel" sans garantie d'aucune sorte. Nous ne garantissons pas que l'application répondra à vos besoins spécifiques ou que son fonctionnement sera ininterrompu, sécurisé ou exempt d'erreurs.
            </p>
            <p className="mb-3">
              L'utilisateur est seul responsable du contenu qu'il génère via l'application ainsi que de l'utilisation qu'il en fait.
            </p>
            <p>
              Nous ne serons pas responsables des dommages directs, indirects, spéciaux, consécutifs ou punitifs résultant de votre utilisation ou de votre incapacité à utiliser TETIKA.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Modifications des Conditions</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions générales à tout moment. Les modifications entreront en vigueur dès leur publication. 
              Votre utilisation continue de l'application après la publication des modifications constitue votre acceptation de ces modifications.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Loi Applicable</h2>
            <p>
              Les présentes conditions sont régies et interprétées conformément aux lois en vigueur, sans égard aux principes de conflits de lois.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-sm opacity-70">
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