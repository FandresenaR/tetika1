/**
 * rag-code-formatter.ts
 * 
 * Module TypeScript pour améliorer la détection et le formatage du code dans les résultats RAG
 * Ce fichier corrige les problèmes d'affichage de code Python et JavaScript dans les réponses du LLM
 */

/**
 * Analyse une réponse de modèle de langage et améliore le formatage des blocs de code
 * tout en convertissant les balises <s> en <SYSTEM>
 * 
 * @param content Contenu à traiter
 * @returns Contenu avec le formatage de code amélioré
 */
export function formatRagCodeBlocks(content: string): string {
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
    const pythonPatterns: RegExp[] = [
      // Import statements
      /(?<!```\w*\n)(?:\n|^)((?:import\s+[\w\s,.]+|from\s+[\w.]+\s+import\s+[\w\s,.*]+)(?:\n|$))+/g,
      
      // URL et requests
      /(?<!```\w*\n)(?:\n|^)(url\s*=\s*["']https?:\/\/[^"'\n]+["']\s*(?:\n|$)(?:\s*response\s*=\s*requests\.(?:get|post|put|delete)[\s\S]*?(?:\n|$))?)/g,
      
      // Structures de contrôle Python avec indentation
      /(?<!```\w*\n)(?:\n|^)((?:def|if|for|while|class)\s+[^:]+:[^\n]*(?:\n\s+[^\n]+)+)/g,
      
      // Step by step avec code Python
      /(?<!```\w*\n)(?:\n|^)(Step\s+\d+:.*\n(?:(?:url|response|if|for)\s*=?\s*[^\n]+\n)+)/g,
      
      // Imports et utilisation de Qiskit
      /(?<!```\w*\n)(?:\n|^)((?:from\s+qiskit\s+import|import\s+qiskit)[\s\S]*?(?:\n|$)(?:\s*[^\n]+)*)/g,
      
      // Création de circuits quantiques
      /(?<!```\w*\n)(?:\n|^)(qc\s*=\s*QuantumCircuit[\s\S]*?(?:\n|$)(?:\s*[^\n]+)*)/g,
      
      // Opérations sur les qubits
      /(?<!```\w*\n)(?:\n|^)((?:qc|circuit)\.(?:h|x|y|z|cx|measure|barrier)[\s\S]*?(?:\n|$)(?:\s*[^\n]+)*)/g,
      
      // Variables suivies de méthodes (indicateur fort de code)
      /(?<!```\w*\n)(?:\n|^)(\w+\s*=\s*\w+\([^\)]*\)[\s\S]*?(?:\n|$)(?:\s*[^\n]+)*)/g
    ];
    
    // Appliquer les patterns Python
    pythonPatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match, codeBlock) => {
        return `\n\`\`\`python\n${codeBlock.trim()}\n\`\`\`\n`;
      });
    });
    
    // Détection pour JavaScript
    const jsPatterns: RegExp[] = [
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

/**
 * Fonction simplifiée pour corriger uniquement les balises système <s> -> <SYSTEM>
 * @param content Contenu à traiter
 * @returns Contenu avec balises système corrigées
 */
export function fixSystemTags(content: string): string {
  if (!content) return '';
  
  return content.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<SYSTEM>$1</SYSTEM>'
  );
}
