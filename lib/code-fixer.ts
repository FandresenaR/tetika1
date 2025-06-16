/**
 * code-fixer.ts
 * 
 * Module pour améliorer la détection et le formatage du code dans les résultats RAG
 */

/**
 * Améliore la détection et le formatage du code dans les réponses de l'API
 */
export function enhanceCodeDetection(content: string): string {
  if (!content) return '';
  
  let processedContent = content;
  
  // Vérifier d'abord si la réponse contient déjà des blocs de code correctement formatés
  const hasProperCodeBlocks = /```[\w]*\n[\s\S]+?\n```/.test(content);
  
  if (!hasProperCodeBlocks) {
    // Motifs de code Python supplémentaires à détecter
    const pythonPatterns = [
      // Motif pour les imports Python (plus inclusif)
      {
        regex: /(?<!```\w*\n)(?:\n|^|\s)(import\s+[\w\s,.]+(?:\n|$)|from\s+[\w.]+\s+import\s+[\w\s,.*]+(?:\n|$))/g,
        language: 'python'
      },
      // Motif pour les instructions d'URL et requests
      {
        regex: /(?<!```\w*\n)(?:\n|^|\s)(url\s*=\s*["']https?:\/\/[^"'\n]+["'](?:\n|$)(?:\s*response\s*=\s*requests\.(?:get|post|put|delete)\([^)]*\))?(?:\n|$))/g,
        language: 'python'
      },
      // Motif pour les blocs if/for/while/def en Python avec indentation
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:def|if|for|while|class)\s+[^:]+:\s*(?:\n\s+[^\n]+)+)/g,
        language: 'python'
      },
      // Détecter les instructions HTTP simples
      {
        regex: /(?<!```\w*\n)(?:\n|^)((GET|POST|PUT|DELETE)\s+https?:\/\/[^\s]+(?:\n|$))/g,
        language: 'http'
      },
      // Ligne unique avec URL et méthode HTTP
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:url|URL)\s*=\s*["']https?:\/\/[^"'\n]+["'](?:\n|$))/g,
        language: 'python'
      }
    ];
    
    // Motifs de code JavaScript supplémentaires
    const jsPatterns = [
      // Motif pour les déclarations de variables ou fonctions JS
      {
        regex: /(?<!```\w*\n)(?:\n|^)(((?:const|let|var|function|class|async function)\s+\w+(?:\s*\([^)]*\))?\s*(?:=|{|\n)[\s\S]*?)(?:\n\n|\n(?:const|let|var|function|class|if|for|while)|\n$))/g,
        language: 'javascript'
      }
    ];
    
    // Appliquer tous les motifs spécifiques à Python
    for (const pattern of pythonPatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    }
    
    // Appliquer tous les motifs spécifiques à JavaScript
    for (const pattern of jsPatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    }
    
    // Détection générique pour les lignes qui commencent par CODE:
    processedContent = processedContent.replace(
      /(?<!```\w*\n)(?:\n|^)(CODE:.+(?:\n|$))/g, 
      (match, codeBlock) => {
        // Déterminer le langage basé sur les mots clés du bloc
        const language = 
          /\b(import|from|def|class)\b/.test(codeBlock) ? 'python' :
          /\b(const|let|var|function)\b/.test(codeBlock) ? 'javascript' : 
          'code';
        
        // Nettoyer le préfixe "CODE:"
        const cleanedCode = codeBlock.replace(/^CODE:\s*/gm, '');
        
        return `\n\`\`\`${language}\n${cleanedCode.trim()}\n\`\`\`\n`;
      }
    );
  }
  
  // Remplacer les balises <s>...</s> par <SYSTEM>...</SYSTEM>
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
  
  return processedContent;
}
