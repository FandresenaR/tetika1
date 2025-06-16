/**
 * quantum-code-detector.js
 * 
 * Module spécialisé pour la détection et le formatage du code quantique, notamment:
 * - IBM Qiskit (Python)
 * - Microsoft Q# (QSharp)
 * - Autres frameworks quantiques
 * dans les réponses du mode RAG
 */

/**
 * Détecte et formate le code quantique dans les réponses RAG
 * @param {string} content Le contenu de la réponse à analyser
 * @returns {string} Le contenu avec les blocs de code quantique correctement formatés
 */
function enhanceQuantumCodeDetection(content) {
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
  }
  
  // Appliquer les patterns spécifiques à Q# (QSharp)
  if (hasQSharpElements || qsharpSpecialDetection) {
    for (const pattern of qsharpPatterns) {
      processedContent = processedContent.replace(pattern, (match) => {
        // Éviter d'ajouter des balises de code si le texte est déjà dans un bloc de code
        if (match.includes('```')) return match;
        
        // Formater comme bloc de code Q#
        return `\n\`\`\`qsharp\n${match.trim()}\n\`\`\`\n`;
      });
    }
  }
  
  return processedContent;
}

module.exports = {
  enhanceQuantumCodeDetection
};