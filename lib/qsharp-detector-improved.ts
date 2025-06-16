/**
 * qsharp-detector-improved.ts
 * 
 * Module amélioré pour la détection et le formatage du code Q# (QSharp)
 * Spécifiquement conçu pour gérer les fragments de code Q# dans les réponses RAG
 */

// Import du module spécialisé pour l'assemblage des fragments de code Q#
import { assembleQSharpFragments, detectFragmentedQSharpOperations } from './qsharp-fragment-assembler';

/**
 * Détecte et formate spécifiquement le code Q# dans les réponses RAG
 * Version améliorée qui gère mieux les fragments de code
 * 
 * @param content Le contenu à analyser
 * @returns Le contenu avec le code Q# correctement formaté
 */
export function detectAndFormatQSharpCodeImproved(content: string): string {
  if (!content) return '';
  
  // Si déjà formaté avec qsharp et ne contient pas de fragments, retourner tel quel
  if (content.includes('```qsharp') && !content.match(/```qsharp[\s\S]*?```[\s\S]*?```qsharp/)) {
    return content;
  }
  
  // Phase préliminaire: Détection de paires de fragments courantes dans le code Q#
  const namespaceImportPairs = /(namespace\s+\w+\s*{)[\s\S]{0,30}?(open\s+Microsoft\.Quantum)/g;
  const importImportPairs = /(open\s+Microsoft\.Quantum\.Intrinsic;)[\s\S]{0,50}?(open\s+Microsoft\.Quantum\.Canon;)/g;
  const importOperationPairs = /(open\s+Microsoft\.Quantum[\s\S]{0,50}?;)[\s\S]{0,50}?(operation\s+\w+\s*\()/g;
  
  // Pré-traiter ces patterns courants qui sont souvent fragmentés
  content = content.replace(namespaceImportPairs, (match, p1, p2) => {
    // Ne pas remplacer si déjà dans un bloc de code
    if (match.includes('```qsharp')) return match;
    return `\`\`\`qsharp\n${p1}\n${p2}`;
  });
  
  content = content.replace(importImportPairs, (match, p1, p2) => {
    if (match.includes('```qsharp')) return match;
    return `\`\`\`qsharp\n${p1}\n${p2}`;
  });
  
  content = content.replace(importOperationPairs, (match, p1, p2) => {
    if (match.includes('```qsharp')) return match;
    return `\`\`\`qsharp\n${p1}\n${p2}`;
  });
  
  // Assemblage des fragments de code
  content = assembleQSharpFragments(content);
  
  // Détection spécifique des opérations quantiques fragmentées
  content = detectFragmentedQSharpOperations(content);
  
  // Mots-clés spécifiques à Q# - liste enrichie
  const qsharpKeywords = [
    'namespace', 'open Microsoft.Quantum', 'operation', '[Operation]', 'function',
    'Microsoft.Quantum.Canon', 'Microsoft.Quantum.Arrays', 'Microsoft.Quantum.Diagnostics',
    'Microsoft.Quantum.Math', 'Microsoft.Quantum.Measurement', 'Microsoft.Quantum.QSharp.Core',
    'Microsoft.Quantum.Intrinsic', 'MeasureWithProbability', 'CNOT', 'H', 'X', 'M', 'Measure',
    'Qubit', 'Result', 'One', 'Zero', '@EntryPoint', 'use', 'using', 'within', 'apply',
    'controlled', 'adjoint', 'mutable', 'ApplyToEach'
  ];
  
  // Vérifier si le contenu contient des éléments de code Q#
  const containsQSharpCode = qsharpKeywords.some(keyword => content.includes(keyword));
  if (!containsQSharpCode) return content;
  
  // Stratégie de détection améliorée
  const lines = content.split('\n');
  let inQSharpBlock = false;
  let qsharpBlockStart = -1;
  const qsharpBlocks = [];
  
  // Fonction pour vérifier si une ligne contient du code Q#
  const isQSharpLine = (line: string, inBlock: boolean): boolean => {
    if (!line.trim()) return false;
    if (line.startsWith('```')) return false;
    
    // Détection par mots-clés
    if (qsharpKeywords.some(keyword => line.includes(keyword))) return true;
    
    // Détection de continuité si on est déjà dans un bloc
    if (inBlock) {
      return line.includes('(') || line.includes(')') || 
             line.includes('{') || line.includes('}') ||
             line.includes('=>') || line.includes('=') || 
             line.includes(':') || line.startsWith('//') || 
             line.length < 20;  // Lignes courtes dans un bloc existant sont probablement du code
    }
    
    return false;
  };
  
  // Parcourir les lignes pour identifier des blocs cohérents
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isQSharp = isQSharpLine(line, inQSharpBlock);
    
    if (isQSharp && !inQSharpBlock) {
      // Début d'un nouveau bloc Q#
      inQSharpBlock = true;
      qsharpBlockStart = i;
    } else if ((!isQSharp || i === lines.length - 1) && inQSharpBlock) {
      // Fin d'un bloc Q#
      const blockEndIndex = isQSharp && i === lines.length - 1 ? i + 1 : i;
      const blockContent = lines.slice(qsharpBlockStart, blockEndIndex).join('\n');
      
      // Ne sauvegarder le bloc que s'il contient du code Q# significatif
      if (blockContent.trim() && !blockContent.includes('```')) {
        // Vérifier si ce bloc contient vraiment du code Q# et non pas juste une mention isolée
        const hasMultipleKeywords = qsharpKeywords.filter(kw => blockContent.includes(kw)).length > 1;
        const hasSignificantCode = blockContent.includes('{') || blockContent.includes('}') || 
                                    blockContent.includes('operation') || blockContent.includes('function');
        
        if (hasMultipleKeywords || hasSignificantCode) {
          qsharpBlocks.push({
            start: qsharpBlockStart,
            end: blockEndIndex - 1,
            content: blockContent
          });
        }
      }
      inQSharpBlock = false;
    }
  }
  
  // Analyser les blocs pour fusionner ceux qui sont proches et logiquement liés
  const mergedBlocks: {start: number, end: number, content: string}[] = [];
  let currentMerged = qsharpBlocks.length > 0 ? {...qsharpBlocks[0]} : null;
  
  // Fusionner les blocs adjacents qui semblent liés
  for (let i = 1; i < qsharpBlocks.length; i++) {
    if (currentMerged) {
      const current = currentMerged;
      const next = qsharpBlocks[i];
      
      // Distance maximale pour fusion: 10 lignes
      const isClose = next.start - current.end <= 10;
      
      // Vérifier si les blocs semblent complémentaires (namespace + import + operation)
      const hasNamespaceAndImport = 
        (current.content.includes('namespace') && next.content.includes('open Microsoft')) ||
        (current.content.includes('open Microsoft') && next.content.includes('operation'));
      
      if (isClose || hasNamespaceAndImport) {
        // Fusionner les blocs
        currentMerged = {
          start: current.start,
          end: next.end,
          content: current.content + '\n' + next.content
        };
      } else {
        // Sauvegarder le bloc actuel et commencer un nouveau
        mergedBlocks.push(currentMerged);
        currentMerged = {...next};
      }
    }
  }
  
  // Ajouter le dernier bloc s'il existe
  if (currentMerged) {
    mergedBlocks.push(currentMerged);
  }
  
  // Formatter les blocs fusionnés et les appliquer au contenu
  const result = [...lines];
  mergedBlocks.reverse().forEach(block => {
    if (block.content.trim()) {
      const formattedBlock = `\`\`\`qsharp\n${block.content.trim()}\n\`\`\``;
      result.splice(block.start, block.end - block.start + 1, formattedBlock);
    }
  });
  
  return result.join('\n');
}

/**
 * Version simplifiée pour formater les exemples de code Q# courants
 * @param content Le contenu à traiter
 */
export function formatQSharpSnippet(content: string): string {
  if (!content || content.includes('```qsharp')) return content;
  
  // Patterns courants pour les fragments de code Q#
  const patterns = [
    // Bloc namespace complet
    /(namespace\s+\w+[\s\S]*?open\s+Microsoft\.Quantum[\s\S]*?(?:operation|function)\s+\w+[\s\S]*?)/g,
    
    // Déclaration de namespace seule
    /(namespace\s+\w+\s*{[\s\S]{0,50}?})/g,
    
    // Imports Q# multiples
    /(open\s+Microsoft\.Quantum\.Intrinsic;[\s\S]{0,100}?open\s+Microsoft\.Quantum\.Canon;)/g,
    
    // Opérations quantiques isolées
    /(operation\s+\w+\s*\([^\)]*?\)[\s\S]{0,200}?{[\s\S]{0,200}?})/g,
    
    // Fragment avec fonctions ou opérations
    /(\w+\s+\w+\s*\([^\)]*?Qubit[\s\S]{0,100}?\)[\s\S]{0,100}?{[\s\S]{0,100}?})/g
  ];
  
  let processedContent = content;
  
  // Appliquer chaque pattern
  for (const pattern of patterns) {
    processedContent = processedContent.replace(pattern, match => {
      // Ne pas remplacer si déjà dans un bloc de code
      if (match.includes('```')) return match;
      
      // S'assurer que c'est vraiment du code Q# (au moins 2 lignes ou contient des caractères spécifiques)
      const lines = match.split('\n');
      const isMultiline = lines.length > 1;
      const hasQSharpSyntax = match.includes('{') || 
                              match.includes('}') || 
                              match.includes('operation') ||
                              match.includes('Qubit') ||
                              match.includes('namespace');
                              
      if (isMultiline && hasQSharpSyntax) {
        return `\n\`\`\`qsharp\n${match.trim()}\n\`\`\`\n`;
      }
      
      return match;
    });
  }
  
  // Détecter les fragments d'opérations qui peuvent être isolés dans des snippets
  const operationNamePattern = /(operation\s+\w+\s*\([^\)]*?\))\s*:/g;
  processedContent = processedContent.replace(operationNamePattern, match => {
    // Ne pas remplacer si déjà dans un bloc de code
    if (/```[\s\S]*?operation/.test(processedContent)) return match;
    
    // Extraire le contexte autour de ce fragment
    const startIdx = processedContent.indexOf(match);
    const endIdx = startIdx + match.length + 50; // Chercher un peu après le fragment
    const context = processedContent.substring(Math.max(0, startIdx - 20), 
                                             Math.min(processedContent.length, endIdx));
    
    // Si le fragment semble être isolé (pas dans un bloc de code) et a une syntaxe Q#
    if (!context.includes('```') && 
        (context.includes('Qubit') || context.includes('Result') || context.includes('Unit'))) {
      return `\n\`\`\`qsharp\n${match}\n\`\`\`\n`;
    }
    
    return match;
  });
  
  return processedContent;
}
