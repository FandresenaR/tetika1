/**
 * qsharp-detector.ts
 * 
 * Module spécialisé pour la détection et le formatage du code Q# (QSharp)
 * spécifiquement pour Microsoft Quantum Development
 * 
 * Note: Ce fichier a été simplifié et redirige maintenant vers l'implémentation améliorée
 * dans qsharp-detector-improved.ts. Il est conservé pour la compatibilité avec le code existant.
 * 
 * Exemples de code Q# à détecter:
 * 
 * Exemple 1:
 * ```
 * namespace QuantumHelloWorld
 * open Microsoft.Quantum.Canon
 * open Microsoft.Quantum.Intrinsic
 * 
 * @EntryPoint()
 * operation HelloWorld() : Unit {
 *     Message("Hello quantum world!");
 * }
 * ```
 * 
 * Exemple 2:
 * ```
 * namespace QuantumRNG {
 *     open Microsoft.Quantum.Intrinsic;
 *     open Microsoft.Quantum.Canon;
 *     open Microsoft.Quantum.Measurement;
 *     open Microsoft.Quantum.Convert;
 *     
 *     operation GenerateRandomBit() : Result {
 *         use qubit = Qubit();
 *         H(qubit);
 *         return M(qubit);
 *     }
 * }
 * ```
 */

import { detectAndFormatQSharpCodeImproved, formatQSharpSnippet as formatQSharpSnippetImproved } from './qsharp-detector-improved';

/**
 * Détecte et formate le code Q# dans les contenus textuels
 * Cette fonction est maintenue pour la compatibilité ascendante
 * Elle redirige simplement vers la nouvelle implémentation améliorée
 * 
 * @param content Le contenu à analyser
 * @returns Le contenu avec le code Q# correctement formaté
 */
export function detectAndFormatQSharpCode(content: string): string {
  return detectAndFormatQSharpCodeImproved(content);
}

/**
 * Version simplifiée pour formater les exemples de code Q# courants
 * @param content Le contenu à traiter
 */
export function formatQSharpSnippet(content: string): string {
  return formatQSharpSnippetImproved(content);
}
