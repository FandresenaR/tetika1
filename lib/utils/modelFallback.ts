/**
 * Utilitaire pour suggérer des modèles alternatifs en cas d'erreur
 */

/**
 * Suggère des modèles alternatifs gratuits qui sont moins susceptibles d'être rate-limités
 */
export function suggestAlternativeModels(failedModelId: string): string[] {
  // Liste de modèles alternatifs gratuits connus pour être plus stables
  const stableAlternatives = [
    'google/gemini-flash-1.5',
    'meta-llama/llama-3.2-1b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
  ];

  // Filtrer le modèle qui a échoué
  return stableAlternatives.filter(id => id !== failedModelId);
}

/**
 * Génère un message d'aide avec suggestions de modèles alternatifs
 */
export function generateModelSuggestionsMessage(
  failedModelId: string,
  errorType: 'rate-limit' | 'unavailable' | 'error'
): string {
  const alternatives = suggestAlternativeModels(failedModelId);
  
  let message = '';
  
  switch (errorType) {
    case 'rate-limit':
      message = '📊 **Modèles alternatifs recommandés** (moins susceptibles d\'être limités):\n\n';
      break;
    case 'unavailable':
      message = '🔄 **Modèles alternatifs disponibles**:\n\n';
      break;
    default:
      message = '💡 **Essayez ces modèles alternatifs**:\n\n';
  }

  alternatives.slice(0, 3).forEach((modelId, index) => {
    const displayName = modelId.split('/')[1]?.replace(/-/g, ' ') || modelId;
    message += `${index + 1}. ${displayName}\n`;
  });

  return message;
}

/**
 * Détecte le type d'erreur à partir du message d'erreur
 */
export function detectErrorType(errorMessage: string): 'rate-limit' | 'unavailable' | 'auth' | 'network' | 'unknown' {
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes('rate limit') || lowerError.includes('rate-limit') || lowerError.includes('429')) {
    return 'rate-limit';
  }
  
  if (lowerError.includes('not found') || lowerError.includes('404') || lowerError.includes('unavailable')) {
    return 'unavailable';
  }
  
  if (lowerError.includes('unauthorized') || lowerError.includes('401') || lowerError.includes('invalid api key')) {
    return 'auth';
  }
  
  if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('connection')) {
    return 'network';
  }
  
  return 'unknown';
}
