/**
 * rag-code-fixer-v2.ts
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
  
  // Fonction pour détecter des morceaux de code isolés sans formatage
  const detectUnformattedCode = (content: string): boolean => {
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
      // Détection des blocs use et within-apply
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:use\s+\w+\s*=\s*\w+\(\)|within\s*{|apply\s*{)[\s\S]*?(?:\n\s+[^\n]+)*)/g,
        language: 'qsharp'
      },
      // Détection des opérations de porte quantique
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:H\(|X\(|CNOT\(|M\(|Measure\()[\s\S]*?(?:\n\s+[^\n]+)*)/g,
        language: 'qsharp'
      }
    ];
    
    // Appliquer les patterns Q# spécifiques en premier
    for (const pattern of qsharpCodePatterns) {
      processedContent = processedContent.replace(pattern.regex, (match, codeBlock) => {
        if (!codeBlock.includes('```')) {
          return `\n\`\`\`${pattern.language}\n${codeBlock.trim()}\n\`\`\`\n`;
        }
        return match;
      });
    }
    
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
    
    // Patterns spécifiques pour les bibliothèques scientifiques et de données
    const scientificCodePatterns = [
      // NumPy, Pandas, SciPy, etc.
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:import\s+(?:numpy|pandas|scipy|matplotlib|seaborn|sklearn|tensorflow|torch|qiskit)[\s\S]*?|(?:np|pd|plt|sns|tf|torch)\.[a-z]+[\s\S]*?)(?:\n\s*[^\n]+)*)/g,
        language: 'python'
      },
      // Code de manipulation de données
      {
        regex: /(?<!```\w*\n)(?:\n|^)((?:df\s*=[\s\S]*?|df\.(?:head|tail|describe|info|merge|concat|groupby|apply|map)[\s\S]*?)(?:\n\s*[^\n]+)*)/g,
        language: 'python'
      }
    ];
    
    // Appliquer les patterns scientifiques
    for (const pattern of scientificCodePatterns) {
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
        
        // Déterminer le langage avec une détection plus complète
        let language = 'code';
        
        // Détecter le code avec une meilleure reconnaissance des langages spécialisés
        if (/\b(namespace\s+\w+|open\s+Microsoft\.Quantum|operation\s+\w+\s*:|Microsoft\.Quantum\.\w+|MeasureWithProbability|use\s+qubit|CNOT\(|H\(|X\(|M\(|Measure\()\b/.test(codeBlock)) {
          // Code Q# (QSharp)
          language = 'qsharp';
        } else if (/\b(import|from|def|class|if|qiskit|numpy|pandas|np\.|pd\.|plt\.|plt\.show\(\))\b/.test(codeBlock) || 
            /\b(QuantumCircuit|Aer|execute|qc|circuit)\b/.test(codeBlock) ||
            /\b(measure|barrier)\([^)]*\)/.test(codeBlock) ||
            /\b(Create a quantum circuit|Apply a|Measure the qubit)\b/i.test(codeBlock)) {
          // Code Python ou Qiskit
          language = 'python';
        } else if (/\b(const|let|var|function|=>)\b/.test(codeBlock)) {
          // Code JavaScript
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
