/**
 * Script pour démontrer le problème de détection du code en mode RAG et une solution améliorée
 */

// Exemple tiré de l'image partagée
const exempleProblematique = `
import requests
from bs4 import BeautifulSoup

Step 1: Send an HTTP GET request to the webpage
url = "http://example.com"
response = requests.get(url)

Step 2: Check if the request was successful
if response.status_code == 200:
`;

// Fonction existante (simplifiée)
function postProcessExistant(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Détecter les blocs de code non marqués et les entourer de ```
  const codePatterns = [
    // Motif pour les imports Python
    {
      regex: /(?<!```\w*\n)(?:\n|^)(import\s+[\w\s,]+(?:\n|$)(?:from\s+[\w\s\.]+\s+import\s+[\w\s,]+(?:\n|$))*)/g,
      language: 'python'
    },
    // Motif pour les blocs if/for/while/def en Python
    {
      regex: /(?<!```\w*\n)(?:\n|^)(((?:def|if|for|while|class)\s+[^\:]+\:(?:\n|\s)+(?:\s{2,}|\t)[^\n]+(?:\n|\s*$))+)/g,
      language: 'python'
    }
  ];
  
  // Appliquer chaque motif pour corriger les blocs de code
  for (const pattern of codePatterns) {
    processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
      return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
    });
  }
  
  // Remplacer les balises <s>...</s> par <SYSTEM>...</SYSTEM>
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
  
  return processedContent;
}

// Fonction améliorée
function postProcessAmeliore(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Vérifier d'abord si la réponse contient déjà des blocs de code correctement formatés
  const hasProperCodeBlocks = /```[\w]*\n[\s\S]+?\n```/.test(content);
  
  if (!hasProperCodeBlocks) {
    // Motifs plus robustes pour Python
    const pythonPatterns = [
      // Import statements combined
      {
        regex: /(?<!```\w*\n)(?:\n|^|\s)((?:import\s+[\w\s,.]+|from\s+[\w.]+\s+import\s+[\w\s,.*]+)(?:\n|$))/g,
        language: 'python'
      },
      // URL et requêtes Python
      {
        regex: /(?<!```\w*\n)(?:\n|^|\s)(url\s*=\s*["']https?:\/\/[^"'\n]+["'](?:\n|$)(?:\s*response\s*=\s*requests\.(?:get|post|put|delete)\([^)]*\))?(?:\n|$))/g,
        language: 'python'
      },
      // If/while/for clauses followed by indentation
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:def|if|for|while|class)\s+[^:]+:[^\n]*(?:\n\s+[^\n]+)+)/g,
        language: 'python'
      },
      // Step by step blocks with code
      {
        regex: /(?<!```\w*\n)(?:\n|^)(Step\s+\d+:.*\n(?:(?:[^Step\n].+\n?)+))/g,
        language: 'python'
      }
    ];
    
    // Appliquer les motifs Python
    for (const pattern of pythonPatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        return `\n\`\`\`python\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    }
    
    // Détection générique pour les lignes qui commencent par CODE:
    processedContent = processedContent.replace(
      /(?<!```\w*\n)(?:\n|^)(CODE:.+(?:\n|$))/g, 
      (match, codeBlock) => {
        const cleanedCode = codeBlock.replace(/^CODE:\s*/gm, '');
        // Déterminer le langage basé sur les mots clés
        const language = 
          /\b(import|from|def|class)\b/.test(codeBlock) ? 'python' :
          /\b(const|let|var|function)\b/.test(codeBlock) ? 'javascript' : 
          'code';
        return `\n\`\`\`${language}\n${cleanedCode.trim()}\n\`\`\`\n`;
      }
    );
  }
  
  // Remplacer les balises système
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
  
  return processedContent;
}

// Test des deux fonctions
console.log("=== RÉSULTAT FONCTION EXISTANTE ===");
console.log(postProcessExistant(exempleProblematique));

console.log("\n\n=== RÉSULTAT FONCTION AMÉLIORÉE ===");
console.log(postProcessAmeliore(exempleProblematique));

// Pour tester:
// 1. Exécuter ce script: node enhanced-code-detection.js
// 2. Comparer les résultats des deux fonctions pour voir l'amélioration
