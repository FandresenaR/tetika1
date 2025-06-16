/**
 * qiskit-detector.js
 * 
 * Module spécialisé pour la détection et le formatage du code Qiskit (IBM Quantum Computing Framework)
 * Version JavaScript compilée pour l'environnement Node.js
 */

/**
 * Détecte et améliore le formatage du code Qiskit dans les réponses
 * @param {string} content - Le contenu de la réponse à analyser
 * @returns {string} - Le contenu avec les blocs de code Qiskit améliorés
 */
function enhanceQiskitCodeDetection(content) {
  if (!content) return '';
  
  let processedContent = content;
  
  // Détecter si le contenu contient du code Qiskit
  const hasQiskitElements = /\b(qiskit|QuantumCircuit|Aer|execute|qasm_simulator|circuit\.h|qc\.h|qc\.measure|qc\.cx)\b/.test(content);
  
  // Si pas d'éléments Qiskit, retourner le contenu sans modification
  if (!hasQiskitElements) return processedContent;
  
  // Correction des erreurs courantes dans le code Qiskit
  processedContent = correctQiskitSyntaxErrors(processedContent);
  
  // Patterns pour détecter des morceaux de code Qiskit non formatés
  const qiskitPatterns = [
    // Imports de Qiskit (module complet ou sous-modules)
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:from\s+qiskit(?:\.\w+)?\s+import\s+[\w\s,.*]+|import\s+qiskit(?:\.\w+)?)(?:\n|$))/g,
      language: 'python'
    },
    
    // Création de circuit quantique avec attribution
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:qc|circuit)\s*=\s*QuantumCircuit\([^)]*\)(?:(?:\n\s*(?!^\s*$).*)+)?)/gm,
      language: 'python'
    },
    
    // Application de portes quantiques (séquence d'opérations)
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:qc|circuit)\.(?:h|x|y|z|cx|cnot|ccx|measure|barrier|reset|measure_all)\s*\([^)]*\)(?:\n\s*(?:qc|circuit)\.(?:h|x|y|z|cx|cnot|ccx|measure|barrier|reset|measure_all)\s*\([^)]*\))*)/g,
      language: 'python'
    },
    
    // Initialisation de simulateur et exécution
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:simulator|backend)\s*=\s*Aer\.get_backend\([^)]*\)(?:\n|$)(?:\s*[^\n]+)*)/g,
      language: 'python'
    },
    
    // Exécution de simulation et récupération de résultats
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:result|job)\s*=\s*(?:execute|run|transpile|assemble)\([^)]*\)(?:\n|$)(?:\s*[^\n]+)*)/g,
      language: 'python'
    },
    
    // Visualisation de résultats quantiques
    {
      regex: /(?<!```\w*\n)(?:\n|^)((?:plot_\w+|plot_histogram|plot_state\w*|plot_bloch\w*)\([^)]*\)(?:\n|$)(?:\s*[^\n]+)*)/g,
      language: 'python'
    },
    
    // Blocks complets d'exemples Qiskit avec commentaires descriptifs
    {
      regex: /(?<!```\w*\n)(?:\n|^)(# Create a quantum circuit[\s\S]*?(?:qc|circuit)\.(?:h|x|y|z|cx|cnot|ccx|measure|barrier|reset|measure_all)\s*\([^)]*\)[\s\S]*?(?:\n\s*[^\n]+)*)/g,
      language: 'python'
    }
  ];
  
  // Appliquer les patterns de détection et formater le code
  for (const pattern of qiskitPatterns) {
    processedContent = processedContent.replace(pattern.regex, (match) => {
      // Éviter de reformater du code qui est déjà dans un bloc de code
      if (match.includes('```')) return match;
      
      // Formater comme bloc de code Python (avec syntaxe mise en évidence)
      return `\n\`\`\`python\n${match.trim()}\n\`\`\`\n`;
    });
  }

  // Détection et formatage des circuits quantiques complets (multi-lignes)
  processedContent = formatCompleteQiskitExamples(processedContent);
  
  return processedContent;
}

/**
 * Corrige les erreurs courantes de syntaxe dans le code Qiskit
 * @param {string} content - Le contenu à corriger 
 * @returns {string} - Le contenu avec syntaxe corrigée
 */
function correctQiskitSyntaxErrors(content) {
  let correctedContent = content;
  
  // Correction de qc.h[0] -> qc.h(0)
  correctedContent = correctedContent.replace(/(\w+)\.h\[(\d+)\]/g, '$1.h($2)');
  
  // Correction de qc.x[0] -> qc.x(0)
  correctedContent = correctedContent.replace(/(\w+)\.x\[(\d+)\]/g, '$1.x($2)');
  
  // Correction de qc.z[0] -> qc.z(0)
  correctedContent = correctedContent.replace(/(\w+)\.z\[(\d+)\]/g, '$1.z($2)');
  
  // Correction de qc.y[0] -> qc.y(0)
  correctedContent = correctedContent.replace(/(\w+)\.y\[(\d+)\]/g, '$1.y($2)');
  
  // Correction de qc.cx[0,1] -> qc.cx(0,1)
  correctedContent = correctedContent.replace(/(\w+)\.cx\[(\d+),\s*(\d+)\]/g, '$1.cx($2, $3)');
  
  // Correction de syntaxe QuantumCircuit([n]) -> QuantumCircuit(n)
  correctedContent = correctedContent.replace(/QuantumCircuit\(\[(\d+)\]\)/g, 'QuantumCircuit($1)');
  
  return correctedContent;
}

/**
 * Détecte et formate les exemples complets de code Qiskit
 * @param {string} content - Le contenu à analyser
 * @returns {string} - Le contenu formaté
 */
function formatCompleteQiskitExamples(content) {
  let processedContent = content;
  
  // Identifier des blocs de code Qiskit complets mais non formatés
  const completeQiskitRegex = /(?<!```\w*\n)(from\s+qiskit\s+import[\s\S]*?(?:result|counts)[\s\S]*?(?:print|plot)[\s\S]*?)(?=\n\n|\n#|\n\*\*|$)/g;
  
  processedContent = processedContent.replace(completeQiskitRegex, (match) => {
    // Éviter de reformater du code qui est déjà dans un bloc de code
    if (match.includes('```')) return match;
    
    // Formater comme bloc de code Python (avec syntaxe mise en évidence)
    return `\n\`\`\`python\n${match.trim()}\n\`\`\`\n`;
  });
  
  return processedContent;
}

module.exports = {
  enhanceQiskitCodeDetection
};