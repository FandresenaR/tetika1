/**
 * Service de synchronisation automatique des modèles OpenRouter
 * Récupère la liste des modèles disponibles et leurs caractéristiques depuis l'API OpenRouter
 */

import { getCategoryFromDescription } from '../models';

/**
 * Vérifie si un modèle est considéré comme "nouveau" (moins de 3 mois)
 */
export function isModelNew(isNew: boolean | { added: number } | undefined): boolean {
  if (!isNew) return false;
  if (typeof isNew === 'boolean') return isNew;
  
  const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000; // 90 jours
  const now = Date.now();
  return (now - isNew.added) < threeMonthsInMs;
}

/**
 * Récupère le timestamp d'ajout d'un modèle
 */
export function getModelAddedTimestamp(isNew: boolean | { added: number } | undefined): number | null {
  if (!isNew) return null;
  if (typeof isNew === 'boolean') return Date.now(); // Fallback pour anciens modèles
  return isNew.added;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string | null;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Récupère la liste complète des modèles depuis OpenRouter
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    console.log('[OpenRouter Sync] Fetching models from OpenRouter API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${response.status}`);
    }

    const data: OpenRouterModelsResponse = await response.json();
    
    console.log('[OpenRouter Sync] Successfully fetched', data.data.length, 'models');
    
    return data.data;
  } catch (error) {
    console.error('[OpenRouter Sync] Error fetching models:', error);
    throw error;
  }
}

/**
 * Filtre les modèles gratuits (pricing.prompt === "0" et pricing.completion === "0")
 */
export function filterFreeModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter(model => {
    const promptPrice = parseFloat(model.pricing.prompt);
    const completionPrice = parseFloat(model.pricing.completion);
    
    return promptPrice === 0 && completionPrice === 0;
  });
}

/**
 * Assigne automatiquement une catégorie basée sur la description et les caractéristiques
 */
export function assignCategory(model: OpenRouterModel): 'general' | 'coding' | 'vision' | 'creative' | 'reasoning' | 'research' {
  const description = model.description || '';
  const name = model.name.toLowerCase();
  const modelId = model.id.toLowerCase();
  
  // Vérifier la vision d'abord
  if (model.architecture?.modality === 'text+image') {
    return 'vision';
  }
  
  // Patterns de noms pour le coding
  const codingPatterns = ['code', 'coder', 'developer', 'programming', 'deepcoder'];
  if (codingPatterns.some(p => name.includes(p) || modelId.includes(p))) {
    return 'coding';
  }
  
  // Patterns pour le reasoning
  const reasoningPatterns = ['reasoning', 'think', 'r1', 'o1', 'qwq'];
  if (reasoningPatterns.some(p => name.includes(p) || modelId.includes(p))) {
    return 'reasoning';
  }
  
  // Utiliser la fonction de lib/models.ts pour la description
  if (description) {
    const categoryFromDesc = getCategoryFromDescription(description);
    if (categoryFromDesc !== 'general') {
      return categoryFromDesc;
    }
  }
  
  return 'general';
}

/**
 * Convertit un modèle OpenRouter en format interne de l'application
 */
export function convertToAppModel(model: OpenRouterModel, isNew: boolean | { added: number } = false) {
  const category = assignCategory(model);
  
  return {
    id: model.id,
    name: model.name,
    provider: 'openrouter' as const,
    description: model.description || '',
    contextLength: model.context_length,
    isFree: true,
    category,
    isNew,
    features: {
      rag: true,
      vision: model.architecture?.modality === 'text+image',
      streaming: true,
    },
    pricing: {
      prompt: model.pricing.prompt,
      completion: model.pricing.completion,
    },
    // Métadonnées additionnelles
    metadata: {
      architecture: model.architecture,
      topProvider: model.top_provider,
      perRequestLimits: model.per_request_limits,
    },
  };
}

/**
 * Récupère et filtre les modèles gratuits
 */
export async function getFreeModels() {
  const allModels = await fetchOpenRouterModels();
  const freeModels = filterFreeModels(allModels);
  
  console.log('[OpenRouter Sync] Found', freeModels.length, 'free models');
  
  return freeModels.map(m => convertToAppModel(m, false));
}

/**
 * Trie les modèles par popularité/qualité
 * Priorise: context length, providers connus, noms reconnus
 */
export function sortModelsByQuality(models: ReturnType<typeof convertToAppModel>[]) {
  return models.sort((a, b) => {
    // Prioriser les modèles de providers connus
    const knownProviders = ['google', 'meta-llama', 'microsoft', 'mistralai', 'qwen'];
    const aProvider = a.id.split('/')[0];
    const bProvider = b.id.split('/')[0];
    
    const aIsKnown = knownProviders.includes(aProvider);
    const bIsKnown = knownProviders.includes(bProvider);
    
    if (aIsKnown && !bIsKnown) return -1;
    if (!aIsKnown && bIsKnown) return 1;
    
    // Ensuite par context length
    return b.contextLength - a.contextLength;
  });
}

/**
 * Cache des modèles avec expiration
 */
interface ModelCache {
  models: ReturnType<typeof convertToAppModel>[];
  timestamp: number;
  expiresIn: number; // en millisecondes
}

let modelCache: ModelCache | null = null;

/**
 * Récupère les modèles gratuits avec cache
 * @param forceRefresh Force le refresh même si le cache est valide
 * @param cacheDuration Durée du cache en millisecondes (défaut: 1 heure)
 */
export async function getCachedFreeModels(
  forceRefresh = false,
  cacheDuration = 60 * 60 * 1000 // 1 heure
) {
  const now = Date.now();
  
  // Vérifier si le cache est valide
  if (
    !forceRefresh &&
    modelCache &&
    now - modelCache.timestamp < modelCache.expiresIn
  ) {
    console.log('[OpenRouter Sync] Using cached models');
    return modelCache.models;
  }
  
  // Charger les anciens modèles depuis localStorage pour comparaison
  const previousModels = loadFreeModelsFromLocalStorage();
  const previousModelMap = new Map(
    previousModels?.map(m => [m.id, m.isNew]) || []
  );
  
  // Récupérer les nouveaux modèles depuis l'API
  console.log('[OpenRouter Sync] Cache expired or force refresh, fetching new models');
  const allModels = await fetchOpenRouterModels();
  const freeModels = filterFreeModels(allModels);
  
  // Convertir et marquer les nouveaux modèles
  const convertedModels = freeModels.map(model => {
    const previousIsNew = previousModelMap.get(model.id);
    
    let isNew: boolean | { added: number };
    if (previousIsNew !== undefined) {
      // Modèle existant - conserver son statut isNew avec timestamp
      isNew = previousIsNew;
    } else {
      // Nouveau modèle - créer timestamp
      isNew = { added: now };
    }
    
    return convertToAppModel(model, isNew);
  });
  
  const sortedModels = sortModelsByQuality(convertedModels);
  
  // Mettre à jour le cache mémoire
  modelCache = {
    models: sortedModels,
    timestamp: now,
    expiresIn: cacheDuration,
  };
  
  // Sauvegarder dans localStorage pour la prochaine comparaison
  saveFreeModelsToLocalStorage(sortedModels);
  
  return sortedModels;
}

/**
 * Invalide le cache des modèles
 */
export function invalidateModelCache() {
  console.log('[OpenRouter Sync] Cache invalidated');
  modelCache = null;
}

/**
 * Récupère les statistiques des modèles gratuits
 */
export async function getFreeModelsStats() {
  const models = await getCachedFreeModels();
  
  const stats = {
    total: models.length,
    new: models.filter(m => isModelNew(m.isNew)).length,
    byProvider: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    withVision: models.filter(m => m.features.vision).length,
    averageContextLength: Math.round(
      models.reduce((sum, m) => sum + m.contextLength, 0) / models.length
    ),
    maxContextLength: Math.max(...models.map(m => m.contextLength)),
  };
  
  // Compter par provider
  models.forEach(model => {
    const provider = model.id.split('/')[0];
    stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
  });
  
  // Compter par catégorie
  models.forEach(model => {
    const category = model.category || 'general';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });
  
  return stats;
}

/**
 * Sauvegarde les modèles dans le localStorage
 */
export function saveFreeModelsToLocalStorage(models: ReturnType<typeof convertToAppModel>[]) {
  try {
    const data = {
      models,
      timestamp: Date.now(),
    };
    localStorage.setItem('tetika-free-models-cache', JSON.stringify(data));
    console.log('[OpenRouter Sync] Saved', models.length, 'models to localStorage');
  } catch (error) {
    console.error('[OpenRouter Sync] Error saving to localStorage:', error);
  }
}

/**
 * Charge les modèles depuis le localStorage
 */
export function loadFreeModelsFromLocalStorage(): ReturnType<typeof convertToAppModel>[] | null {
  try {
    const data = localStorage.getItem('tetika-free-models-cache');
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
    
    // Si les données ont plus de 24 heures, les ignorer
    if (ageInHours > 24) {
      console.log('[OpenRouter Sync] localStorage cache too old, ignoring');
      return null;
    }
    
    console.log('[OpenRouter Sync] Loaded', parsed.models.length, 'models from localStorage');
    return parsed.models;
  } catch (error) {
    console.error('[OpenRouter Sync] Error loading from localStorage:', error);
    return null;
  }
}
