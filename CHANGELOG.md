# Changelog

Tous les changements notables apportés au projet Tetika seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-05-25

### Amélioré

🎯 **Enhanced Web Scraping UX Flow - Two-Step Process**

**Major UX Improvement**: Fixed scraping workflow to properly separate URL entry from prompt instructions.

### Changements:

#### ✅ **Nouveau flux en deux étapes:**
1. **Étape 1**: Saisie URL → Le système attend les instructions
2. **Étape 2**: Saisie du prompt → Exécution du scraping avec URL + prompt

#### 🔧 **Fichiers modifiés:**
- `ChatInput.tsx` - Implémentation du mode scraping avec état de l'URL en attente
- `ChatInterface.tsx` - Mise à jour de handleScrapWebsite pour accepter URL + prompt
- `route.ts` (/api/scrape) - Support du paramètre prompt pour l'extraction intelligente

#### 🎨 **Améliorations UX:**
- **Indicateur visuel orange** quand le mode scraping est actif
- **Placeholder dynamique** indiquant l'URL en cours de scraping
- **Bouton d'envoi orange** en mode scraping
- **Bouton d'annulation** pour sortir du mode scraping
- **Messages de succès améliorés** incluant les instructions utilisateur

#### 🚀 **Fonctionnalités:**
- Plus de scraping immédiat non désiré lors de la saisie d'URL
- Instructions personnalisées pour l'extraction de données
- Meilleur contrôle utilisateur du processus
- Interface plus intuitive et prévisible

#### 📊 **Extraction de données d'entreprise améliorée:**
- Détection intelligente des noms d'entreprises
- Extraction des sites web et descriptions
- Comptage d'employés quand disponible
- Tags et catégories d'entreprises
- Sélecteurs spécialisés pour les pages de partenaires/exposants

#### 🧪 **Guide de test:**
- Créé `TEST_SCRAPING_FLOW.md` avec instructions détaillées
- URLs de test recommandées (VivaTechnology, CES, TechCrunch)
- Cas d'usage spécifiques pour l'extraction d'entreprises

## [0.3.0] - 2025-05-25

### Ajouté

✅ Web Scraping Integration Complete!

📁 Files Updated:
- ChatInterface.tsx - Added handleScrapWebsite and handleExportCSV functions
- ScrapedDataTable.tsx - Cleaned up unused code and fixed prop interface
- ContextMenu.tsx - Fixed TypeScript event type and nested form issue
- All compilation errors resolved

### Corrigé
- Fixed nested form HTML validation error in ContextMenu component
- Replaced form element with div and proper button handling for URL submission
- Maintained Enter key functionality and form validation

🚀 Complete Feature Set:
-Context Menu Trigger - Type "@" in chat input to open scraping context menu
-URL Input & Mode Selection - Enter website URLs and select scraping modes
-API Integration - Full integration with /api/scrape endpoint
-Data Display - Modal with tabbed interface showing scraped content
-CSV Export - Export functionality for all data types (content, links, images, metadata)
-Error Handling - Comprehensive error handling with user-friendly messages
-Success Feedback - Chat messages confirming successful operations


🎯 How to Use:
-Type "@" in the chat input field
-Context menu appears with scraping option
-Enter a website URL (e.g., https://example.com)
-Select scraping mode (content/links/images/metadata)
-View results in the modal table
-Export data as CSV using the export buttons
🔄 Workflow:
**Input → Context Menu → URL Entry → API Call → Data Display → CSV Export**


-**Code Block Updated in RAG Mode**:

## 📋 **Summary**

The implementation is **completely technology-agnostic** because:

1. **Detection**: Uses standard markdown code block syntax (```` ```)
2. **Processing**: Preserves entire code blocks as units
3. **Rendering**: ReactMarkdown handles syntax highlighting for any language
4. **Features**: All enhanced features work universally
5. **Extensibility**: Easy to add new languages to the extension mapping

**Result**: Whether the AI generates Python, JavaScript, Rust, Go, Swift, or any other language code in RAG mode, it will be properly formatted with all the enhanced CodeBlock features intact.## 📋 **Summary**

The implementation is **completely technology-agnostic** because:

1. **Detection**: Uses standard markdown code block syntax (```` ```)
2. **Processing**: Preserves entire code blocks as units
3. **Rendering**: ReactMarkdown handles syntax highlighting for any language
4. **Features**: All enhanced features work universally
5. **Extensibility**: Easy to add new languages to the extension mapping

**Result**: Whether the AI generates Python, JavaScript, Rust, Go, Swift, or any other language code in RAG mode, it will be properly formatted with all the enhanced CodeBlock features intact.

## [0.2.0] - 2025-05-13

### Ajouté
- Bouton Settings et modal de paramètres pour gérer les configurations
- Composant SettingsModal permettant de gérer les clés API directement depuis l'interface
- Adaptations mobiles pour le bouton des paramètres
- Support amélioré des clés API locales dans les requêtes API

### Modifié
- Modification de l'appel API pour utiliser les clés API stockées localement
- Amélioration du footer avec une version simplifiée pour mobile
- Refactorisation de la façon dont les clés API sont transmises au serveur

### Corrigé
- Correction de l'implémentation de clés API locale depuis le site direct

## [0.1.0] - Date initiale

### Ajouté
- Version initiale de Tetika
- Support multi-modèles via OpenRouter
- Fonctionnalité RAG (Retrieval-Augmented Generation)
- Analyse avancée de fichiers
- Interface utilisateur responsive

