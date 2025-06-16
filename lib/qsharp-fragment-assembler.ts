/**
 * qsharp-fragment-assembler.ts
 * 
 * Module spécialisé pour l'assemblage et la détection des fragments de code Q# (QSharp)
 * qui ont été incorrectement séparés dans les réponses RAG
 */

/**
 * Assemble les fragments de code Q# qui ont été séparés incorrectement
 * Cette fonction recherche des fragments adjacents de code Q# et les combine
 * en un seul bloc de code cohérent
 * 
 * @param content Le contenu à analyser et traiter
 * @returns Le contenu avec les fragments de code Q# assemblés
 */
export function assembleQSharpFragments(content: string): string {
  if (!content) return '';
  
  // Si déjà formaté correctement avec qsharp et pas de fragments multiples, on ne fait rien
  if (content.includes('```qsharp') && !content.match(/```qsharp[\s\S]*?```[\s\S]*?```qsharp/)) {
    return content;
  }
  
  // Patterns de détection spécifiques pour les opérations quantiques fragmentées
  const qsharpOperationPattern = /((?:MeasureWithProbability|Measure|ApplyToEach|CNOT)\s*\([^\)]*?)(?:\n|$)[\s\S]*?(?:[\)\}])/g;
  
  // 1. Détection et consolidation des opérations fragmentées avant la détection principale
  content = content.replace(qsharpOperationPattern, (match) => {
    // Ne remplacer que si ce n'est pas déjà dans un bloc de code
    if (!match.includes('```')) {
      return `\`\`\`qsharp\n${match.trim()}\n\`\`\``;
    }
    return match;
  });
  
  // 2. Analyse ligne par ligne pour les fragments restants
  const lines = content.split('\n');
  const processedLines: string[] = [];
  const qsharpFragments: {start: number, end: number, content: string}[] = [];
  
  // Mots-clés Q# pour la détection - ajout de mots-clés supplémentaires pour améliorer la détection
  const qsharpKeywords = [
    'namespace', 'open Microsoft.Quantum', 'operation', 'function',
    'Microsoft.Quantum', '@EntryPoint', 'use', 'using', 'within', 'apply',
    'controlled', 'Measure', 'H', 'X', 'CNOT', 'let', 'mutable',
    'Qubit', 'Result', 'One', 'Zero', 'Microsoft.Quantum.Canon', 
    'Microsoft.Quantum.Intrinsic', 'Microsoft.Quantum.Measurement'
  ];
  
  // Fonction pour vérifier si une ligne pourrait être du code Q#
  const isQSharpLine = (line: string, inBlock: boolean): boolean => {
    if (!line.trim()) return false;
    if (line.startsWith('```')) return false;
    
    // Détection standard par mots-clés
    if (qsharpKeywords.some(keyword => line.includes(keyword))) return true;
    
    // Détection de continuité si on est déjà dans un bloc
    if (inBlock) {
      return line.includes('(') || line.includes(')') || 
             line.includes('{') || line.includes('}') ||
             line.includes('=>') || line.includes('=') || 
             line.startsWith('//') || line.trim().length < 20;
    }
    
    return false;
  };
  
  // Parcourir les lignes pour identifier les fragments
  let inQSharpBlock = false;
  let blockStartIndex = -1;
  let currentBlock = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Si on est dans un bloc formaté (délimité par ```), le traiter tel quel
    if (line.startsWith('```')) {
      if (inQSharpBlock) {
        // Sauvegarder le bloc actuel s'il existe
        if (currentBlock.trim()) {
          qsharpFragments.push({
            start: blockStartIndex,
            end: i - 1,
            content: currentBlock
          });
        }
        currentBlock = '';
        inQSharpBlock = false;
      }
      processedLines.push(line);
      continue;
    }
    
    const isQSharp = isQSharpLine(line, inQSharpBlock);
    
    if (isQSharp) {
      if (!inQSharpBlock) {
        inQSharpBlock = true;
        blockStartIndex = i;
      }
      currentBlock += line + '\n';
    } else {
      if (inQSharpBlock) {
        // Fin d'un bloc Q#
        if (currentBlock.trim()) {
          qsharpFragments.push({
            start: blockStartIndex,
            end: i - 1,
            content: currentBlock
          });
        }
        currentBlock = '';
        inQSharpBlock = false;
      }
      processedLines.push(line);
    }
  }
  
  // Gérer le dernier bloc si nécessaire
  if (inQSharpBlock && currentBlock.trim()) {
    qsharpFragments.push({
      start: blockStartIndex,
      end: lines.length - 1,
      content: currentBlock
    });
  }
  
  // 3. Fusionner les fragments qui semblent être liés
  const mergedFragments: {start: number, end: number, content: string}[] = [];
  
  if (qsharpFragments.length > 0) {
    let currentMerged = {...qsharpFragments[0]};
    
    for (let i = 1; i < qsharpFragments.length; i++) {
      const current = currentMerged;
      const next = qsharpFragments[i];
      
      // Augmenter la distance maximale entre les fragments à 10 lignes pour être plus permissif
      const isClose = next.start - current.end <= 10;
      
      // Vérifier si les fragments semblent être liés syntaxiquement
      const currentLastLine = current.content.trim().split('\n').pop() || '';
      const nextFirstLine = next.content.trim().split('\n')[0] || '';
      
      // Détecter s'il s'agit de fragments namespace+imports qui sont souvent séparés
      const isNamespaceOrImport = 
        (current.content.includes('namespace') && next.content.includes('open Microsoft.Quantum')) ||
        (current.content.includes('open Microsoft.Quantum') && next.content.includes('operation')) ||
        (current.content.includes('open Microsoft.Quantum.Intrinsic') && next.content.includes('open Microsoft.Quantum.Canon'));
      
      const isOpenParenthesis = 
        currentLastLine.includes('(') && 
        !currentLastLine.includes(')') &&
        (nextFirstLine.includes(')') || next.content.includes(')'));
        
      const isOpenBrace = 
        currentLastLine.includes('{') && 
        !currentLastLine.includes('}') &&
        (nextFirstLine.includes('}') || next.content.includes('}'));
        
      const isCompatibleOperation = 
        currentLastLine.includes('MeasureWithProbability') ||
        currentLastLine.includes('Measure(') ||
        currentLastLine.includes('CNOT(') ||
        currentLastLine.includes('ApplyToEach');
      
      // Condition améliorée pour fusionner les fragments, plus permissive
      if (isClose && (isOpenParenthesis || isOpenBrace || isCompatibleOperation || isNamespaceOrImport)) {
        // Fusionner les fragments
        currentMerged = {
          start: current.start,
          end: next.end,
          content: current.content + next.content
        };
      } else {
        // Sauvegarder le fragment actuel et commencer un nouveau
        mergedFragments.push(currentMerged);
        currentMerged = {...next};
      }
    }
    
    // Ajouter le dernier fragment
    mergedFragments.push(currentMerged);
  }
  
  // 4. Appliquer les fragments formatés au texte original
  if (mergedFragments.length > 0) {
    // Créer une nouvelle structure de lignes
    const result: string[] = [];
    
    let lastIndex = 0;
    for (const fragment of mergedFragments) {
      // Ajouter les lignes entre le dernier fragment et celui-ci
      for (let i = lastIndex; i < fragment.start; i++) {
        result.push(lines[i]);
      }
      
      // Ajouter le fragment formaté
      result.push('```qsharp');
      result.push(fragment.content.trim());
      result.push('```');
      
      lastIndex = fragment.end + 1;
    }
    
    // Ajouter les lignes restantes
    for (let i = lastIndex; i < lines.length; i++) {
      result.push(lines[i]);
    }
    
    content = result.join('\n');
  }
  
  return content;
}

/**
 * Détecte et formate spécifiquement les opérations Q# fragmentées comme MeasureWithProbability
 * qui sont souvent mal formatées dans les réponses RAG
 * 
 * @param content Le contenu à analyser
 * @returns Le contenu avec les opérations Q# correctement formatées
 */
export function detectFragmentedQSharpOperations(content: string): string {
  if (!content) return '';
  
  // Patterns spécifiques pour les opérations quantiques qui sont souvent fragmentées
  const patterns = [
    // MeasureWithProbability avec paramètres
    /(MeasureWithProbability\s*\([^\)]*?)(?:\n[\s\S]*?)(\))/g,
    
    // CNOT ou opération sur plusieurs qubits
    /(CNOT\s*\([^\)]*?)(?:\n[\s\S]*?)(\))/g,
    
    // ApplyToEach souvent sur plusieurs lignes
    /(ApplyToEach\s*\([^\)]*?)(?:\n[\s\S]*?)(\))/g,
    
    // Opérations de mesure
    /(M\s*\([^\)]*?)(?:\n[\s\S]*?)(\))/g,
    
    // Opération H (Hadamard) fragmentée
    /(H\s*\([^\)]*?)(?:\n[\s\S]*?)(\))/g,
    
    // Pattern de détection de séquences namespace/open fragmentées
    /(namespace\s+\w+\s*{)\s*(?:\n[\s\S]*?)(open\s+Microsoft\.Quantum)/g,
    
    // Pattern pour les déclarations d'opérations fragmentées
    /(operation\s+\w+\s*\([^\)]*?\))\s*(?:\n[\s\S]*?)([:])/g,
    
    // Pattern pour les imports multiples de modules Quantum fragmentés
    /(open\s+Microsoft\.Quantum\.[^;]*?;)\s*(?:\n[\s\S]*?)(open\s+Microsoft\.Quantum\.)/g
  ];
  
  for (const pattern of patterns) {
    content = content.replace(pattern, (match, start, end) => {
      // Ne pas formatter si déjà dans un bloc de code
      if (match.includes('```')) return match;
      
      // Reconstruire l'opération en un seul bloc cohérent
      return `\`\`\`qsharp\n${start.trim()}\n${end.trim()}\n\`\`\``;
    });
  }
  
  // Détection spécifique pour les fragments de namespace + imports + opération
  const namespacePattern = /(namespace\s+\w+\s*{)/;
  const importPatterns = /(open\s+Microsoft\.Quantum\.[^;]*?;)/g;
  
  // Rechercher des fragments correspondant au pattern courant de namespace + imports
  if (namespacePattern.test(content) && importPatterns.test(content)) {
    const namespaceMatch = content.match(namespacePattern);
    if (namespaceMatch) {
      const startPos = content.indexOf(namespaceMatch[0]);
      const endPos = startPos + 1000; // Recherche sur une portée limitée
      const potentialFragment = content.substring(startPos, Math.min(endPos, content.length));
      
      // Si ce fragment contient à la fois namespace, imports et potentiellement une opération
      // mais n'est pas déjà dans un bloc de code
      if (!potentialFragment.includes('```qsharp') && 
          importPatterns.test(potentialFragment) &&
          potentialFragment.includes('Microsoft.Quantum')) {
        
        // Extraire le fragment complet jusqu'à la prochaine ligne vide ou un autre marqueur
        const lines = content.substring(startPos).split('\n');
        let lineCount = 0;
        
        // Parcourir jusqu'à 20 lignes maximum ou jusqu'à une marque de fin logique
        for (let i = 0; i < Math.min(20, lines.length); i++) {
          const line = lines[i].trim();
          if (line && 
             (line.includes('Microsoft.Quantum') || 
              line.includes('namespace') || 
              line.includes('operation') ||
              line.includes('function') ||
              line.includes('{') || 
              line.includes('}'))) {
            lineCount = i + 1;
          } else if (i > 5 && !line) {
            // Une ligne vide après au moins 5 lignes peut marquer une fin
            break;
          }
        }
        
        if (lineCount > 0) {
          const fragmentText = lines.slice(0, lineCount).join('\n');
          content = content.substring(0, startPos) + 
                  '```qsharp\n' + fragmentText + '\n```' + 
                  content.substring(startPos + fragmentText.length);
        }
      }
    }
  }
  
  return content;
}
