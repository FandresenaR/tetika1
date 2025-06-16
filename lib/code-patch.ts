// Patch simple pour corriger le formatage du code dans le mode RAG
// Ce fichier peut être utilisé comme correctif temporaire en attendant une mise à jour plus complète
// Pour utiliser:
// 1. Ajouter ce fichier au projet
// 2. Dans api.ts, remplacer la fonction postProcessCodeInResponse par une référence à formatRagCodeBlocks

import { formatRagCodeBlocks } from './rag-code-formatter';

// 1. Dans api.ts, trouver et remplacer:
// function postProcessCodeInResponse(content: string): string {
//   if (!content) return '';
//   ... code existant ...
// }

// 2. Remplacer par:
// function postProcessCodeInResponse(content: string): string {
//   if (!content) return '';
//   return formatRagCodeBlocks(content);
// }

export {
  formatRagCodeBlocks as postProcessCodeInResponse
};
