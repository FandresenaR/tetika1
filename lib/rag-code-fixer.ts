/**
 * rag-code-fixer.ts
 * Module pour améliorer la détection et le formatage du code dans les résultats RAG
 */

/**
 * Améliore la détection et le formatage du code dans les réponses de l'API
 * Spécialement conçu pour corriger les problèmes d'affichage des blocs de code
 * dans les résultats du mode RAG.
 */
export function enhanceRagCodeDetection(content: string): string {
  if (!content) return '';
  
  let processedContent = content;
  
  // Détection des balises système à corriger (<s> -> <SYSTEM>)
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
  
  // Vérifier si la réponse contient déjà des blocs de code correctement formatés
  const hasProperCodeBlocks = /```[\w]*\n[\s\S]+?\n```/.test(processedContent);
  
  if (!hasProperCodeBlocks) {
    // Patterns de détection pour le code Python
    const pythonCodePatterns = [
      // Imports Python (pattern amélioré et plus inclusif)
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:import\s+[\w\s,.]+|from\s+[\w.]+\s+import\s+[\w\s,.*]+)(?:\n|$))+/g,
        language: 'python'
      },
      // Code avec url et requests
      {
        regex: /(?<!```\w*\n)(?:\n|^)(url\s*=\s*["']https?:\/\/[^"'\n]+["']\s*(?:\n|$)(?:\s*response\s*=\s*requests\.(?:get|post|put|delete)[\s\S]*?(?:\n|$))?)/g,
        language: 'python'
      },
      // Structures de contrôle Python (if, for, while, etc) avec indentation
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:def|if|for|while|class)\s+[^:]+:[^\n]*(?:\n\s+[^\n]+)+)/g,
        language: 'python'
      },
      // Détecter les step by step avec du code Python
      {
        regex: /(?<!```\w*\n)(?:\n|^)(Step\s+\d+:.*\n(?:(?:url|response|if|for)\s*=?\s*[^\n]+\n)+)/g,
        language: 'python'
      }
    ];
    
    // Patterns pour JavaScript
    const jsCodePatterns = [
      // Détection des déclarations JS
      {
        regex: /(?<!```\w*\n)(?:\n|^)(((?:const|let|var|function|class)\s+\w+[\s\S]*?(?:;|{)(?:\n|$))+)/g,
        language: 'javascript'
      }
    ];
    
    // Appliquer les patterns Python
    for (const pattern of pythonCodePatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    }
    
    // Appliquer les patterns JavaScript
    for (const pattern of jsCodePatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    }
    
    // Détection des blocs "CODE:" (ajoutés par sanitizeExternalContent)
    processedContent = processedContent.replace(
      /(?<!```\w*\n)(?:\n|^)(CODE:[\s\S]*?)(?=\n\n|\n(?:CODE:)|\n?$)/g,
      (match, codeBlock) => {
        const cleanedCode = codeBlock.replace(/^CODE:\s*/gm, '');
        
        // Déterminer le langage
        let language = 'code';
        if (/\b(import|from|def|class|if)\b/.test(codeBlock)) {
          language = 'python';
        } else if (/\b(const|let|var|function)\b/.test(codeBlock)) {
          language = 'javascript';
        }
        
        return `\n\`\`\`${language}\n${cleanedCode.trim()}\n\`\`\`\n`;
      }
    );
  }
  
  return processedContent;
}

/**
 * Version simplifiée pour corriger les balises système uniquement
 * Cette fonction est utile quand on ne veut corriger que les balises système
 * sans toucher au formattage du code
 */
export function fixSystemTags(content: string): string {
  if (!content) return '';
  
  return content.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
}
