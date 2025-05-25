# Changelog

Tous les changements notables apportés au projet Tetika seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-05-25

### Ajouté

-Code Block Updated in RAG Mode:

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

