/**
 * quantum-code-detector.ts
 * 
 * Module spécialisé pour la détection et le formatage du code quantique, notamment:
 * - IBM Qiskit (Python)
 * - Microsoft Q# (QSharp)
 * - Autres frameworks quantiques
 * dans les réponses du mode RAG
 */

/**
 * Détecte et formate le code quantique dans les réponses RAG
 * @param content Le contenu de la réponse à analyser
 * @returns Le contenu avec les blocs de code quantique correctement formatés
 */
export function enhanceQuantumCodeDetection(content: string): string {
  if (!content) return '';
  
  let processedContent = content;
  
  // Vérifier si le contenu contient des éléments de code quantique (Qiskit ou Q#)
  const hasQiskitElements = /\b(qiskit|QuantumCircuit|Aer|execute|qc\.h|qc\.measure)\b/.test(content);
  const hasQSharpElements = /\b(namespace\s+\w+|open\s+Microsoft\.Quantum|operation\s+\w+|Microsoft\.Quantum\.\w+)\b/.test(content);
  
  // Cas spécial pour Q# détection: si nous avons un bloc de code avec des mots-clés Q# spécifiques mais pas encore formaté
  const qsharpSpecialDetection = !hasQSharpElements && (
    content.includes('namespace') && 
    content.includes('open Microsoft.Quantum') && 
    !content.includes('```qsharp')
  );
  
  // Si aucun élément de code quantique n'est détecté, retourner le contenu tel quel
  if (!hasQiskitElements && !hasQSharpElements && !qsharpSpecialDetection) return processedContent;
  
  // Forcer la détection Q# si nous avons ce cas spécial
  if (qsharpSpecialDetection) {
    const qsharpLines = content.split('\n')
      .filter(line => 
        line.includes('namespace') || 
        line.includes('open Microsoft.Quantum') ||
        line.includes('operation') ||
        line.includes('[Operation]')
      )
      .join('\n');
    
    if (qsharpLines) {
      // Formater le bloc de code Q# détecté
      processedContent = processedContent.replace(
        qsharpLines, 
        `\n\`\`\`qsharp\n${qsharpLines.trim()}\n\`\`\`\n`
      );
      return processedContent;
    }
  }
  
  // Patterns spécifiques pour le code Qiskit (Python)
  const qiskitPatterns = [
    // Import de Qiskit et composants
    /(?<!```\w*\n)(?:\n|^)(from\s+qiskit(?:\.\w+)?\s+import\s+[\w\s,.*]+(?:\n|$))/g,
    
    // Création de circuit quantique (inclut les lignes suivantes jusqu'à une ligne vide)
    /(?<!```\w*\n)(?:\n|^)((?:qc|circuit)\s*=\s*QuantumCircuit\([^)]*\)(?:(?:\n\s*(?!^\s*$).*)+)?)/gm,
    
    // Application de portes quantiques (format sur plusieurs lignes)
    /(?<!```\w*\n)(?:\n|^)((?:qc|circuit)\.(?:h|x|y|z|cx|measure|barrier)\([^)]*\)(?:\n\s*(?:qc|circuit)\.(?:h|x|y|z|cx|measure|barrier)\([^)]*\))*)/g,
    
    // Exécution et simulation
    /(?<!```\w*\n)(?:\n|^)((?:job|result)\s*=\s*execute\([^)]*\)(?:\n|$)(?:\s*[^\n]+)*)/g,
    
    // Blocs complets d'instructions quantiques avec commentaires
    /(?<!```\w*\n)(?:\n|^)((?:Create\s+a\s+quantum\s+circuit|Apply\s+a\s+Hadamard\s+gate|Measure\s+the\s+qubit)[\s\S]*?(?:\n\s*[^\n]+)*)/gi
  ];
  
  // Patterns spécifiques pour le code Q# (QSharp)
  const qsharpPatterns = [
    // Déclaration d'espace de noms
    /(?<!```\w*\n)(?:\n|^)(namespace\s+\w+(?:\.\w+)*\s*(?:\{|$)(?:[\s\S]*?))/g,
    
    // Instructions d'ouverture (open)
    /(?<!```\w*\n)(?:\n|^)((?:open\s+Microsoft\.Quantum\.\w+(?:\.\w+)*\s*;?(?:\n|$))+)/g,
    
    // Déclaration d'opérations quantiques
    /(?<!```\w*\n)(?:\n|^)(\s*operation\s+\w+\s*\([^\)]*\)\s*:\s*\w+\s*\{(?:[\s\S]*?)(?:\}|$))/g,
    
    // Déclaration de fonctions Q#
    /(?<!```\w*\n)(?:\n|^)(\s*function\s+\w+\s*\([^\)]*\)\s*:\s*\w+\s*\{(?:[\s\S]*?)(?:\}|$))/g,
    
    // Blocs d'attributs Q#
    /(?<!```\w*\n)(?:\n|^)(\s*\[(?:Operation|Function|EntryPoint)\]\s*(?:\n|$))/g
  ];
  
  // Appliquer les patterns spécifiques à Qiskit (Python)
  if (hasQiskitElements) {
    for (const pattern of qiskitPatterns) {
      processedContent = processedContent.replace(pattern, (match) => {
        // Éviter d'ajouter des balises de code si le texte est déjà dans un bloc de code
        if (match.includes('```')) return match;
        
        // Formater comme bloc de code Python
        return `\n\`\`\`python\n${match.trim()}\n\`\`\`\n`;
      });
    }
    
    // Cas particulier: détecter et formater correctement les exemples de code Qiskit complets
    if (!processedContent.includes('```python') && 
        processedContent.includes('from qiskit import') && 
        processedContent.includes('qc = QuantumCircuit')) {
        
      // Rechercher le bloc de code complet
      const match = /(?:from qiskit import[\s\S]*?(?:qc|circuit)\.measure[\s\S]*?)/g.exec(processedContent);
      
      if (match && match[0]) {
        // Remplacer directement le bloc trouvé par sa version formatée
        processedContent = processedContent.replace(
          match[0], 
          `\n\`\`\`python\n${match[0].trim()}\n\`\`\`\n`
        );
      }
    }
  }
  
  // Appliquer les patterns spécifiques à Q# (QSharp)
  if (hasQSharpElements || qsharpSpecialDetection) {
    // Cas spécial: recherche de blocs délimités Q# à formater en une seule fois
    // Stratégie 1: Chercher un bloc complet commençant par namespace ou open et se terminant avant une ligne vide
    const qsharpBlockPattern1 = /(?<!```\w*\n)(?:\n|^)((?:namespace\s+\w+|open\s+Microsoft\.Quantum)[\s\S]*?(?:operation\s+\w+|function\s+\w+|})[\s\S]*?)(?=\n\n|\n(?![ \t])|\n?$)/g;
    
    // Stratégie 2: Chercher un ensemble de lignes d'imports/namespace consécutives
    const qsharpBlockPattern2 = /(?<!```\w*\n)(?:\n|^)((?:open\s+Microsoft\.Quantum[\s\S]*?){2,}(?:\n|$))/g;
    
    // Stratégie 3: Chercher namespace + plusieurs lignes
    const qsharpBlockPattern3 = /(?<!```\w*\n)(?:\n|^)(namespace\s+[\s\S]*?)(?=\n\n|\n(?![ \t])|\n?$)/g;
    
    // Stratégie 4: Chercher les opérations fragmentées (comme MeasureWithProbability)
    const qsharpBlockPattern4 = /(?<!```\w*\n)(?:\n|^)((?:\s*\w+\s*=\s*)?MeasureWithProbability\([\s\S]*?)(?=\n\n|\n(?![ \t])|\n?$)/g;
    
    // Essayer d'abord de trouver un bloc complet
    let qsharpBlockFound = false;
    const patterns = [qsharpBlockPattern1, qsharpBlockPattern2, qsharpBlockPattern3, qsharpBlockPattern4];
    
    for (const pattern of patterns) {
      const matches = processedContent.matchAll(pattern);
      for (const match of matches) {
        if (match && match[1] && match[1].length > 20) { // Au moins 20 caractères pour éviter les faux positifs
          // Formater le bloc complet de code Q# trouvé
          processedContent = processedContent.replace(
            match[1],
            `\n\`\`\`qsharp\n${match[1].trim()}\n\`\`\`\n`
          );
          qsharpBlockFound = true;
        }
      }
      if (qsharpBlockFound) break;
    }
    
    // Si pas de bloc complet trouvé, appliquer les patterns individuels
    if (!qsharpBlockFound) {
      for (const pattern of qsharpPatterns) {
        processedContent = processedContent.replace(pattern, (match) => {
          // Éviter d'ajouter des balises de code si le texte est déjà dans un bloc de code
          if (match.includes('```')) return match;
          
          // Formater comme bloc de code Q#
          return `\n\`\`\`qsharp\n${match.trim()}\n\`\`\`\n`;
        });
      }
      
      // Rechercher les lignes qui semblent être du code Q# sans être formatées
      const lines = processedContent.split('\n');
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if ((line.includes('namespace') || line.includes('open Microsoft.Quantum')) && startIndex === -1) {
          startIndex = i;
        } else if (startIndex !== -1 && (line.trim() === '' || i === lines.length - 1)) {
          endIndex = i === lines.length - 1 ? i : i - 1;
          break;
        }
      }
      
      // Si nous avons trouvé un bloc, le formater
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const codeBlock = lines.slice(startIndex, endIndex + 1).join('\n');
        if (codeBlock.length > 0 && !codeBlock.includes('```')) {
          const formattedBlock = `\n\`\`\`qsharp\n${codeBlock.trim()}\n\`\`\`\n`;
          lines.splice(startIndex, endIndex - startIndex + 1, formattedBlock);
          processedContent = lines.join('\n');
        }
      }
    }
  }

  return processedContent;
}

/**
 * Fonction pour post-traiter spécifiquement les réponses contenant du code quantique
 * Peut être utilisée en complément de enhanceRagCodeDetection
 */
export function postProcessQuantumCode(content: string): string {
  const improvedContent = enhanceQuantumCodeDetection(content);
  return improvedContent;
}
