/**
 * rag-code-fixer-v2.js
 * Module pour améliorer la détection et le formatage du code dans les résultats RAG
 */

/**
 * Améliore la détection et le formatage du code dans les réponses de l'API
 * Spécialement conçu pour corriger les problèmes d'affichage des blocs de code
 * dans les résultats du mode RAG.
 * @param {string} content - Le contenu à analyser
 * @returns {string} - Le contenu formaté
 */
function enhanceRagCodeDetection(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Détection des balises système à corriger (<s> -> <s>)
  processedContent = processedContent.replace(
    /<s>([\s\S]*?)<\/s>/g,
    '<s>$1</s>'
  );
  
  // Vérifier si la réponse contient déjà des blocs de code correctement formatés
  const hasProperCodeBlocks = /```[\w]*\n[\s\S]+?\n```/.test(processedContent);
  
  // Fonction pour détecter des morceaux de code isolés sans formatage
  const detectUnformattedCode = (content) => {
    const codeIndicators = [
      // Python et Qiskit
      /from\s+[\w.]+\s+import\s+[\w\s,.*]+/,            // import Python
      /\w+\s*=\s*[\w.]+\([^)]*\)/,                      // attribution de fonction
      /QuantumCircuit\([^)]*\)/,                         // Circuit quantique
      /qc\s*=\s*/,                                      // Attribution de circuit quantique
      /\b(qc|circuit)\.(h|x|y|z|cx|measure|barrier)\([^)]*\)/,   // Opérations sur qubits
      /from\s+qiskit\s+import/,                         // Import Qiskit
      /import\s+qiskit/,                                // Import Qiskit direct
      /execute\([^)]*\)/,                               // Exécution de simulation quantique 
      /Aer\.\w+/,                                       // Utilisation de simulateurs Aer
      /\bCreate\s+a\s+quantum\s+circuit/i,              // Commentaires descriptifs de code quantum
      /\bApply\s+a\s+Hadamard\s+gate/i,                 // Description d'opérations sur qubits
      /\bMeasure\s+the\s+qubit/i,                       // Description de mesure quantique
      
      // Q# (QSharp)
      /namespace\s+\w+/,                                // Déclaration d'espace de noms Q#
      /open\s+Microsoft\.Quantum/,                      // Import de bibliothèques Microsoft Quantum
      /operation\s+\w+\s*:\s*Unit/,                     // Opérations quantiques Q#
      /\[Operation\]/,                                  // Attributs Q#
      /Microsoft\.Quantum\.\w+/                         // Références aux espaces de noms Microsoft Quantum
    ];
    
    return codeIndicators.some(pattern => pattern.test(content));
  };
  
  // Si on a des indications de code non formaté, forcer le traitement
  const hasUnformattedCode = !hasProperCodeBlocks && detectUnformattedCode(processedContent);
  
  if (!hasProperCodeBlocks || hasUnformattedCode) {
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
      },
      // Détection spécifique pour IBM Qiskit et code quantique
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:from\s+qiskit\s+import|import\s+qiskit)[\s\S]*?(?:\n\s*[^\n]+)*)/g,
        language: 'python'
      },
      // Détection de création et manipulation de circuits quantiques
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:QuantumCircuit|qc\s*=\s*QuantumCircuit)[\s\S]*?(?:\n\s*[^\n]+)*)/g,
        language: 'python'
      },
      // Détection des opérations sur les qubits et mesures
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:qc\.(?:h|x|y|z|cx|measure|barrier)\([^\)]*\)[\s\S]*?)(?:\n\s*[^\n]+)*)/g,
        language: 'python'
      }
    ];
    
    // Patterns spécifiques pour le code Q# qui est souvent fragmenté
    const qsharpCodePatterns = [
      // Détection des opérations quantiques et motifs fragmentés
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:operation\s+\w+\s*\([^\)]*\)\s*:\s*\w+|MeasureWithProbability\([^\n]*?)[\s\S]*?(?:\n\s+[^\n]+)*)/g,
        language: 'qsharp'
      },
      // Déclaration d'espaces de noms Q#
      {
        regex: /(?<!```\w*\n)(?:\n|^)(namespace\s+\w+(?:\.\w+)*[\s\S]*?(?:\n\s+[^\n]+)*)/g,
        language: 'qsharp'
      },
      // Instructions d'ouverture pour les namespaces Q#
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:open\s+Microsoft\.Quantum\.\w+(?:\.\w+)*\s*;?(?:\n|$))+)/g,
        language: 'qsharp'
      }
    ];
    
    // Appliquer les patterns de détection pour Python
    for (const pattern of pythonCodePatterns) {
      processedContent = processedContent.replace(pattern.regex, (match) => {
        // Éviter d'ajouter des balises de code si le texte est déjà dans un bloc de code
        if (match.includes('```')) return match;
        
        // Formater comme bloc de code Python
        return `\n\`\`\`${pattern.language}\n${match.trim()}\n\`\`\`\n`;
      });
    }
    
    // Appliquer les patterns de détection pour Q#
    for (const pattern of qsharpCodePatterns) {
      processedContent = processedContent.replace(pattern.regex, (match) => {
        // Éviter d'ajouter des balises de code si le texte est déjà dans un bloc de code
        if (match.includes('```')) return match;
        
        // Formater comme bloc de code Q#
        return `\n\`\`\`${pattern.language}\n${match.trim()}\n\`\`\`\n`;
      });
    }
  }
  
  return processedContent;
}

module.exports = {
  enhanceRagCodeDetection
};