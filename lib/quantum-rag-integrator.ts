/**
 * quantum-rag-integrator.ts
 * 
 * Module d'intégration pour les détecteurs de code quantique dans le système RAG
 * Permet d'appliquer automatiquement les détecteurs de code quantique dans le flux de traitement des réponses
 */

import { enhanceQiskitCodeDetection } from './qiskit-detector';
import { enhanceQuantumCodeDetection } from './quantum-code-detector';
import { enhanceRagCodeDetection } from './rag-code-fixer-v2';

/**
 * Ajoute des hooks pour la détection et le formatage de code quantique dans les réponses RAG
 * @param content Le contenu de la réponse à analyser et améliorer
 * @returns Le contenu avec tous les blocs de code quantique améliorés
 */
export function enhanceQuantumRAG(content: string): string {
  if (!content) return '';

  try {
    // Pipeline de traitement pour les détecteurs de code quantique
    let processedContent = content;
    
    // 1. Détection spécifique de Qiskit (IBM Quantum)
    processedContent = enhanceQiskitCodeDetection(processedContent);
    
    // 2. Détection de code quantique général (inclut Q#, etc.)
    processedContent = enhanceQuantumCodeDetection(processedContent);
    
    // 3. Post-traitement et formatage RAG standard
    processedContent = enhanceRagCodeDetection(processedContent);
    
    return processedContent;
  } catch (error) {
    console.error('Erreur lors du traitement du contenu quantique dans le RAG:', error);
    // En cas d'erreur, retourner le contenu original non modifié
    return content;
  }
}

/**
 * Configuration pour l'intégration des détecteurs quantiques dans le pipeline RAG
 */
export const quantumRAGConfig = {
  enabled: true,
  detectors: {
    qiskit: true,     // Détecteur IBM Qiskit 
    qsharp: true,     // Détecteur Microsoft Q#
    general: true     // Détecteur générique de code quantique
  },
  // Options de formatage
  formatting: {
    autoCorrectSyntax: true,      // Correction automatique des erreurs de syntaxe
    preferredLanguage: 'python',  // Langage préféré pour les blocs de code non identifiés
    enhanceComments: true         // Amélioration des commentaires dans le code détecté
  }
};

/**
 * Vérifie si un texte contient potentiellement du code quantique
 * Utile pour déterminer rapidement si le traitement complet est nécessaire
 * 
 * @param content Le texte à analyser
 * @returns true si du code quantique est probablement présent
 */
export function containsQuantumCode(content: string): boolean {
  if (!content) return false;
  
  // Indicateurs rapides de code quantique
  const quantumKeywords = [
    // Qiskit (IBM)
    /\bqiskit\b/i,
    /QuantumCircuit\b/,
    /\bAer\b/,
    /qasm_simulator\b/,
    /\bqubit\b/i,
    
    // Q# (Microsoft)
    /\bnamespace\s+\w+/,
    /\bopen\s+Microsoft\.Quantum/,
    /\boperation\s+\w+/,
    
    // Génériques quantum
    /\bhadamard\b/i,
    /\bentangle\b/i,
    /\bsuperposition\b/i,
    /\bquantum\s+(?:algorithm|circuit|computation|gate|register)\b/i
  ];
  
  return quantumKeywords.some(pattern => pattern.test(content));
}
