/**
 * fix-rag-code-display.js
 * 
 * Script correctif à utiliser pour le mode RAG - Règle les problèmes d'affichage de code
 * dans les blocs de réponse des modèles LLM.
 * 
 * Pour utiliser ce script, importez la fonction fixRAGCodeDisplay et appliquez-la
 * aux réponses du LLM avant de les afficher.
 */

/**
 * Analyse une réponse de modèle de langage et améliore le formatage des blocs de code
 * tout en convertissant les balises <s> en <SYSTEM>
 * 
 * @param {string} content Contenu à traiter
 * @returns {string} Contenu avec le formatage de code amélioré
 */
function fixRAGCodeDisplay(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Corriger les balises système
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
  
  // Vérifier si la réponse contient déjà des blocs de code correctement formatés
  const hasProperCodeBlocks = /```[\w]*\n[\s\S]+?\n```/.test(processedContent);
  
  if (!hasProperCodeBlocks) {
    // Motifs spécifiques à rechercher pour le code Python
    const pythonPatterns = [
      // Import statements
      /(?<!```\w*\n)(?:\n|^)((?:import\s+[\w\s,.]+|from\s+[\w.]+\s+import\s+[\w\s,.*]+)(?:\n|$))+/g,
      
      // URL et requests
      /(?<!```\w*\n)(?:\n|^)(url\s*=\s*["']https?:\/\/[^"'\n]+["']\s*(?:\n|$)(?:\s*response\s*=\s*requests\.(?:get|post|put|delete)[\s\S]*?(?:\n|$))?)/g,
      
      // Structures de contrôle Python avec indentation
      /(?<!```\w*\n)(?:\n|^)((?:def|if|for|while|class)\s+[^:]+:[^\n]*(?:\n\s+[^\n]+)+)/g,
      
      // Step by step avec code Python
      /(?<!```\w*\n)(?:\n|^)(Step\s+\d+:.*\n(?:(?:url|response|if|for)\s*=?\s*[^\n]+\n)+)/g
    ];
    
    // Appliquer les patterns Python
    pythonPatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match, codeBlock) => {
        return `\n\`\`\`python\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    });
    
    // Détection pour JavaScript
    const jsPatterns = [
      /(?<!```\w*\n)(?:\n|^)(((?:const|let|var|function|class)\s+\w+[\s\S]*?(?:;|{)(?:\n|$))+)/g
    ];
    
    jsPatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match, codeBlock) => {
        return `\n\`\`\`javascript\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    });
    
    // Détection des préfixes "CODE:" ajoutés par sanitizeExternalContent
    processedContent = processedContent.replace(
      /(?<!```\w*\n)(?:\n|^)(CODE:[\s\S]*?)(?=\n\n|\n(?:CODE:)|\n?$)/g,
      (match, codeBlock) => {
        const cleanedCode = codeBlock.replace(/^CODE:\s*/gm, '');
        
        // Détecter le langage approprié
        const language = 
          /\b(import|from|def|class)\b/.test(codeBlock) ? 'python' :
          /\b(const|let|var|function)\b/.test(codeBlock) ? 'javascript' : 
          'code';
        
        return `\n\`\`\`${language}\n${cleanedCode.trim()}\n\`\`\`\n`;
      }
    );
  }
  
  return processedContent;
}

// Pour tester le script
// const testContent = `import requests\nfrom bs4 import BeautifulSoup\n\nStep 1: Send an HTTP GET request to the webpage\nurl = "http://example.com"\nresponse = requests.get(url)\n\nStep 2: Check if the request was successful\nif response.status_code == 200:`;
// console.log(fixRAGCodeDisplay(testContent));

module.exports = { fixRAGCodeDisplay };
