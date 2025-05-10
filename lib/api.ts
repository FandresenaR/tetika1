import axios, { AxiosError } from 'axios';
import { AIModel, Message } from '../types';

// Helper function to extract content from truncated Mistral model responses
function extractContentFromTruncatedResponse(responseText: string): string | null {
  // Try several pattern matching approaches
  const patterns = [
    /"content"\s*:\s*"([^"]+)"/,       // Standard JSON format
    /"content"\s*:\s*'([^']+)'/,       // Alternative quote format
    /"message"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/,  // Nested message format
    /"choices"\s*:\s*\[\s*{[^}]*"message"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/ // Full nested format
  ];
  
  for (const pattern of patterns) {
    const match = responseText.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Fonction pour récupérer les clés API depuis le localStorage
const getApiKeys = () => {
  // Determine if we're running on client or server side
  const isServer = typeof window === 'undefined';
  
  // Use process.env directly on server side
  if (isServer) {
    return {
      openrouter: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      notdiamond: process.env.NEXT_PUBLIC_NOTDIAMOND_API_KEY || '',
      serpapi: process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '',
    };
  }
  
  // On client side, try localStorage first, then fall back to env variables
  const envOpenRouter = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  const envNotDiamond = process.env.NEXT_PUBLIC_NOTDIAMOND_API_KEY || '';
  const envSerpApi = process.env.NEXT_PUBLIC_SERPAPI_API_KEY || '';
  
  return {
    openrouter: localStorage.getItem('tetika-openrouter-key') || envOpenRouter,
    notdiamond: localStorage.getItem('tetika-notdiamond-key') || envNotDiamond,
    serpapi: localStorage.getItem('tetika-serpapi-key') || envSerpApi,
  };
};

// Fonction pour générer un ID unique
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Formatage des messages pour les API
export function formatMessagesForAPI(messages: Message[]) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// Vérifier si un modèle est gratuit
export function isModelFree(modelId: string) {
  // Liste des modèles connus comme étant gratuits sur OpenRouter
  const freeModels = [
    '01-ai/yi-1.5-9b-chat',
    '01-ai/yi-1.5-34b-chat',
    'meta-llama/llama-3-8b-instruct',
    'meta-llama/llama-3-70b-instruct',
    'google/gemma-7b-it',
    'anthropic/claude-3-haiku',
    'cohere/command-r',
    'cohere/command-r-plus',
    'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
    'undi95/remm-slerp-l2-13b',
    'gryphe/mythomist-7b',
  ];
  
  return freeModels.includes(modelId);
}

// API OpenRouter
export async function callOpenRouterAPI(modelId: string, messages: Message[], stream = false) {
  const { openrouter: OPENROUTER_API_KEY } = getApiKeys();
  // Comment out unused variable to avoid TypeScript warning
  // const _isUsingFreeModel = isModelFree(modelId);
  
  try {
    console.log('Calling OpenRouter API with model:', modelId);
    
    // Check if API key exists and is valid
    if (!OPENROUTER_API_KEY) {
      console.error('No OpenRouter API key provided');
      throw new Error('OpenRouter API key not configured. Please add your API key in settings.');
    }
    
    // Validate API key format
    if (OPENROUTER_API_KEY && !OPENROUTER_API_KEY.startsWith('sk-or-')) {
      console.error('OpenRouter API key format appears invalid');
      throw new Error('OpenRouter API key format appears invalid. Keys should start with "sk-or-"');
    }
    
    // Configuration des headers de base
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://tetika.app',
      'X-Title': 'Tetika AI Chat',
    };
    
    // Ajouter l'en-tête d'autorisation si une clé API est disponible
    if (OPENROUTER_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENROUTER_API_KEY}`;
    } else {
      console.warn('No OpenRouter API key found. This may cause authentication issues.');
    }
    
    // Nettoyage et validation des messages
    let cleanMessages = messages
      .filter(msg => msg.role && msg.content) // Filtrer les messages invalides
      .map(msg => {
        // S'assurer que le rôle est valide
        let role = msg.role;
        if (!['user', 'assistant', 'system'].includes(role)) {
          role = 'user'; // Fallback par défaut
        }
        
        // Limiter la longueur des messages pour éviter les erreurs
        const content = typeof msg.content === 'string' 
          ? msg.content.slice(0, 32000) // Limiter pour les modèles avec des limites plus strictes
          : 'Message content invalid';
          
        return { role, content };
      });
    
    // S'assurer qu'il y a au moins un message utilisateur
    if (cleanMessages.length === 0) {
      cleanMessages = [{ role: 'user', content: 'Hello' }];
    }
    
    // Si le premier message n'est pas de type 'system' ou 'user', ajouter un message système par défaut
    if (cleanMessages[0].role === 'assistant') {
      cleanMessages.unshift({
        role: 'system',
        content: 'You are a helpful assistant.'
      });
    }
    
    // Créer un payload simple et robuste
    const payload = {
      model: modelId,
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 800,
      stream: stream
    };      // Logging du payload pour le diagnostic (sans imprimer toute la conversation)
    console.log('OpenRouter payload structure:', { 
      model: payload.model,
      messageCount: payload.messages.length,
      firstMessageRole: payload.messages[0].role,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens
    });
      // Faire la requête en utilisant uniquement les options nécessaires
    let response;
    try {
      response = await axios({
        method: 'post',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: headers,        data: payload,
        timeout: 60000, // 60 secondes
        transformResponse: [(data) => {
          // Prevent JSON parse errors by capturing the raw response
          return { rawData: data };
        }]
      });
      
      // Parse the response safely
      let parsedData;
      try {
        if (response.data?.rawData) {
          parsedData = JSON.parse(response.data.rawData);
          response.data = parsedData;
        }
      } catch (parseError) {
        console.error('Error parsing OpenRouter response:', parseError);
        console.log('Raw response (partial):', response.data?.rawData?.substring(0, 500));
        
        // Try to extract content from the raw response
        let content = null;
        
        if (typeof response.data?.rawData === 'string') {
          // Special handling for Mistral models which may have truncated responses
          if (modelId.includes('mistral')) {
            const mistralContentMatch = extractContentFromTruncatedResponse(response.data.rawData);
            if (mistralContentMatch) {
              content = mistralContentMatch;
              console.log("Successfully extracted content from Mistral response");
            }
          }
          
          // If no content yet, try standard pattern matching
          if (!content) {
            // Look for content field in the raw string
            const contentMatch = response.data.rawData.match(/"content"\s*:\s*"([^"]+)"/);
            const deltaContentMatch = response.data.rawData.match(/"delta"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/);
            
            if (contentMatch && contentMatch[1]) {
              content = contentMatch[1];
            } else if (deltaContentMatch && deltaContentMatch[1]) {
              // Special handling for DeepSeek models that use delta.content format
              content = deltaContentMatch[1];
            }
          }
          
          // If we still don't have content, try to repair truncated JSON
          if (!content) {
            try {
              // Add closing brackets to potentially truncated JSON
              let fixedJson = response.data.rawData;
              if (!fixedJson.endsWith('}')) {
                fixedJson += '"}}}]}';
              }
              const partialData = JSON.parse(fixedJson);
              
              // Try to extract content from various possible locations
              if (partialData?.choices?.[0]?.message?.content) {
                content = partialData.choices[0].message.content;
              } else if (partialData?.choices?.[0]?.delta?.content) {
                content = partialData.choices[0].delta.content;
              }
            } catch (repairError) {
              console.error('Failed to repair truncated JSON:', repairError);
            }
          }
        }
        
        // Return a synthetic response with whatever we could extract
        response.data = {
          choices: [{
            message: {
              content: content || "Erreur de communication avec le modèle. Réponse reçue mais incomplète."
            }
          }]
        };
      }
    } catch (requestError) {
      // Will be handled in the outer catch block
      throw requestError;
    }

    console.log('OpenRouter API response status:', response.status);
    
    // Log the response structure without sensitive information
    console.log('OpenRouter response structure:', {
      status: response.status,
      hasData: !!response.data,
      hasChoices: !!response.data?.choices,
      choicesLength: response.data?.choices?.length,
      firstChoice: response.data?.choices?.[0] ? 'present' : 'missing',
      // Add more detailed debug info
      dataKeys: response.data ? Object.keys(response.data) : [],
      responseContentType: response.headers['content-type'],
    });
      // Enhanced validation for response data
    if (!response.data) {
      console.error('OpenRouter returned empty response');
      return {
        choices: [{
          message: {
            content: "Erreur: Réponse vide reçue du modèle."
          }
        }]
      };
    }
    
    // Handle different response formats more gracefully
    if (!response.data.choices || !response.data.choices.length) {
      console.error('Non-standard OpenRouter response format:', JSON.stringify(response.data).substring(0, 500));
      
      // Check if the response contains an error message from OpenRouter
      if (response.data.error) {
        // Extract the error message
        const errorMessage = typeof response.data.error === 'string' 
          ? response.data.error 
          : (response.data.error.message || 'Unknown error from OpenRouter');
        
        console.error('OpenRouter returned an error:', errorMessage, 'Response keys:', Object.keys(response.data).join(', '));
        
        return {
          choices: [{
            message: {
              content: `Erreur du modèle: ${errorMessage}`
            }
          }]
        };
      }
      
      // Try to extract message content from different possible response structures
      if (response.data.message?.content) {
        // Create a synthetic response that matches expected format
        return {
          choices: [{
            message: {
              content: response.data.message.content
            }
          }]
        };
      } 
      // Check for completion/text fields which some API versions might use
      else if (response.data.completion || response.data.text) {
        return {
          choices: [{
            message: {
              content: response.data.completion || response.data.text
            }
          }]
        };
      }
      // Check if the entire response might be the message itself
      else if (typeof response.data === 'string') {
        return {
          choices: [{
            message: {
              content: response.data
            }
          }]
        };
      }
      // Check if there's an object with content directly
      else if (response.data.content) {
        return {
          choices: [{
            message: {
              content: response.data.content
            }
          }]
        };
      }
      
      // If there's a response but no usable message content
      throw new Error(`Invalid response format from OpenRouter: Missing choices array. Response keys: ${Object.keys(response.data).join(', ')}`);
    }
    
    return response.data;
  } catch (error: unknown) {
    // Amélioration du logging des erreurs
    const axiosError = error as AxiosError;
    console.error('OpenRouter API error details:', {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      message: (error as Error).message
    });
    
    let errorMessage = 'Error calling OpenRouter API';
    
    // Traitement spécifique selon le type d'erreur
    if (axiosError.response) {
      // Réponse de l'API avec erreur
      if (axiosError.response?.status === 400) {
        errorMessage = `Requête invalide: ${(axiosError.response?.data as Record<string, { message?: string }>)?.error?.message || 'Format incorrect'}`;
      } else if (axiosError.response?.status === 401) {
        errorMessage = `Erreur d'authentification: Clé API invalide`;
      } else if (axiosError.response?.status === 403) {
        errorMessage = `Accès refusé: Vérifiez votre clé API et vos permissions`;
      } else if (axiosError.response?.status === 404) {
        errorMessage = `Modèle "${modelId}" non trouvé ou non disponible`;
      } else if (axiosError.response?.status === 429) {
        errorMessage = `Limite de requêtes atteinte. Veuillez réessayer plus tard`;
      } else {
        errorMessage = `Erreur ${axiosError.response?.status}: ${(axiosError.response?.data as Record<string, { message?: string }>)?.error?.message || axiosError.response?.statusText}`;
      }
    } else if (axiosError.request) {
      // Requête envoyée mais pas de réponse
      errorMessage = `Erreur réseau: Pas de réponse du serveur OpenRouter`;
    } else {
      // Erreur dans la configuration de la requête
      errorMessage = `Erreur de configuration: ${(error as Error).message}`;
    }
    
    throw new Error(errorMessage);
  }
}

// API NotDiamond - Implémentation avec fallback vers OpenRouter
export async function callNotDiamondAPI(modelId: string, messages: Message[], stream = false) {
  const { notdiamond: NOTDIAMOND_API_KEY, openrouter: OPENROUTER_API_KEY } = getApiKeys();
  
  if (!NOTDIAMOND_API_KEY) {
    throw new Error('NotDiamond API key not configured');
  }
  
  // Mapping des modèles NotDiamond vers leurs équivalents OpenRouter (si disponible)
  const openrouterFallbackMapping: {[key: string]: string} = {
    'gpt-4-turbo': 'openai/gpt-4-turbo',
    'claude-3-opus': 'anthropic/claude-3-opus',
    'claude-3-sonnet': 'anthropic/claude-3-sonnet',
    'perplexity': 'perplexity/sonar-medium-online',
  };
  
  try {
    console.log('NOT Diamond API service is currently experiencing issues');
    
    // Si OpenRouter API key est disponible, tentative de fallback
    if (OPENROUTER_API_KEY && openrouterFallbackMapping[modelId]) {
      const fallbackModelId = openrouterFallbackMapping[modelId];
      console.log(`Falling back to OpenRouter with equivalent model: ${fallbackModelId}`);
      
      try {
        // Appel à OpenRouter avec le modèle équivalent
        const openRouterResponse = await callOpenRouterAPI(fallbackModelId, messages, stream);
        console.log('Successfully used OpenRouter as fallback');
        
        // Ajouter une note dans la réponse pour informer l'utilisateur du fallback
        if (openRouterResponse?.choices?.[0]?.message?.content) {
          const originalContent = openRouterResponse.choices[0].message.content;
          openRouterResponse.choices[0].message.content = 
            `[Note: Le service NOT Diamond n'est pas disponible actuellement. Cette réponse a été générée par un modèle équivalent sur OpenRouter]\n\n${originalContent}`;
        }
        
        return openRouterResponse;
      } catch (fallbackError) {
        console.error('OpenRouter fallback also failed:', (fallbackError as Error).message);
        throw new Error(`Le service NOT Diamond n'est pas disponible actuellement et le fallback vers OpenRouter a également échoué. Erreur: ${(fallbackError as Error).message}`);
      }
    }
    
    // Si pas de clé OpenRouter ou pas de modèle équivalent, afficher un message informatif
    throw new Error(
      "Le service NOT Diamond est temporairement indisponible. " +
      "Notre équipe est au courant du problème et travaille à le résoudre. " +
      "Veuillez essayer d'utiliser les modèles OpenRouter disponibles dans l'application en attendant que le service soit rétabli."
    );
    
  } catch (error: unknown) {
    console.error('Error with NOT Diamond API or fallback:', error);
    throw new Error(`${(error as Error).message}`);
  }
}

// Recherche avec SERPAPI via proxy local
export async function searchWithSerpAPI(query: string) {
  const { serpapi: SERPAPI_API_KEY } = getApiKeys();
  
  if (!SERPAPI_API_KEY) {
    throw new Error('SerpAPI key not configured');
  }
  
  try {
    console.log('Calling local proxy for SerpAPI with query:', query.substring(0, 30) + '...');
    
    // Use absolute URL path to avoid path resolution issues
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        apiKey: SERPAPI_API_KEY,
      }),
      // Important: Add cache control to prevent caching
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('SerpAPI proxy response success with', 
      data?.organic_results?.length || 0, 
      'organic results');
    
    // Vérifier si le serveur a renvoyé une réponse d'erreur mais avec un statut 200
    if (data?.error === true) {
      console.warn('SerpAPI search returned error:', data.message);
      
      // Si nous avons des résultats de fallback, on les utilise quand même
      if (data?.organic_results?.length > 0) {
        return data;
      }
      
      throw new Error(data.message || 'Unknown error from SerpAPI proxy');
    }
    
    return data;
  } catch (error: Error | unknown) {
    const err = error as Error & { code?: string, response?: { data?: unknown, status?: number } };
    console.error('Error details from SerpAPI proxy:', {
      message: err.message,
      code: err.code,
      response: err.response?.data,
      status: err.response?.status
    });
    
    let errorMsg = 'Error searching with SerpAPI';
    
    if (err.code === 'ECONNABORTED') {
      errorMsg = 'La requête au proxy SerpAPI a expiré. Le serveur met trop de temps à répondre.';
    } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
      errorMsg = 'Erreur réseau lors de la connexion au proxy SerpAPI. L\'application fonctionne peut-être en mode hors ligne.';
    } else if (err.response?.status === 400) {
      errorMsg = 'Paramètres de recherche incorrects.';
    } else if (err.response?.status === 500) {
      errorMsg = 'Erreur serveur lors de l\'accès à SerpAPI. Veuillez réessayer plus tard.';
    } else {
      errorMsg = `Erreur SerpAPI: ${err.message || 'Erreur inconnue'}`;
    }
    
    // Créer une réponse de fallback pour éviter un échec complet
    return {
      organic_results: [
        {
          title: "Résultats de recherche non disponibles",
          link: "https://example.com",
          snippet: "Impossible de récupérer les résultats de recherche. Les informations fournies seront basées uniquement sur les connaissances internes du modèle."
        }
      ],
      search_metadata: {
        fallback: true,
        status: "Error",
        query: query,
        error: errorMsg
      }
    };
  }
}

// Sélection de l'API en fonction du modèle
export async function callAIModel(model: AIModel, messages: Message[], stream = false) {
  if (!model) {
    throw new Error('No model specified');
  }
  
  if (model.provider === 'openrouter') {
    return callOpenRouterAPI(model.id, messages, stream);
  } else if (model.provider === 'notdiamond') {
    return callNotDiamondAPI(model.id, messages, stream);
  } else {
    throw new Error(`Provider not supported: ${model.provider}`);
  }
}

// Fonction pour enrichir un message avec des informations de recherche (RAG)
export async function enrichWithRAG(message: string) {
  try {
    // Vérifier si la clé SerpAPI est disponible
    const { serpapi } = getApiKeys();
    if (!serpapi) {
      throw new Error('SerpAPI key not configured for RAG mode');
    }
    
    try {
      console.log('Enriching message with RAG using SerpAPI');
      const searchResults = await searchWithSerpAPI(message);
      
      // Vérifier si c'est un résultat de fallback (en cas d'erreur réseau)
      const isFallbackResult = searchResults?.search_metadata?.fallback === true;
      
      // Extraire les résultats pertinents
      const organicResults = searchResults.organic_results || [];
      
      // Si nous n'avons pas de résultats ou seulement des résultats de fallback
      if (organicResults.length === 0 || isFallbackResult) {
        console.log('No organic results found or using fallback results');
        
        return {
          content: `Le message de l'utilisateur est: "${message}"\n\n` +
            `J'ai essayé d'enrichir votre question avec des recherches web, mais je n'ai pas pu obtenir de résultats ` +
            `en raison de problèmes de connexion. Je vais répondre en me basant sur mes connaissances internes.\n\n` +
            `Question de l'utilisateur: ${message}`,
          sources: [] // Pas de sources disponibles
        };
      }
      
      interface EnrichedDataItem {
        title: string;
        link: string;
        snippet: string;
      }
      
      const enrichedData = organicResults.slice(0, 3).map((result: Record<string, string>) => ({
        title: result.title || "Titre non disponible",
        link: result.link || "https://example.com",
        snippet: result.snippet || "Description non disponible"
      }));
      
      // Formater les résultats pour inclusion dans le prompt
      const contextString = enrichedData.map((item: EnrichedDataItem) => 
        `Source: ${item.title}\nURL: ${item.link}\nInformation: ${item.snippet}\n`
      ).join('\n');
      
      console.log('Successfully enriched message with', enrichedData.length, 'search results');
      
      return {
        content: `Le message de l'utilisateur est: "${message}"\n\nInformations contextuelles issues de recherches web:\n${contextString}\n\nVeuillez répondre à la question de l'utilisateur en vous basant sur ces informations contextuelles.`,
        sources: enrichedData // Nous retournons aussi les sources pour les afficher dans l'UI
      };
    } catch (searchError: Error | unknown) {
      const err = searchError as Error;
      console.error('Error during SerpAPI search:', err);
      
      // Message spécial pour les erreurs réseau
      if (err.message?.includes('Erreur réseau') || err.message?.includes('Network Error')) {
        console.log('Network error with SerpAPI, falling back to model internal knowledge');
        
        return {
          content: `Le message de l'utilisateur est: "${message}"\n\n` +
            `Note: Une erreur réseau s'est produite lors de la tentative d'enrichir cette requête avec des ` +
            `informations du web (${err.message}). Je vais répondre en me basant uniquement sur mes ` +
            `connaissances internes, qui peuvent ne pas inclure les informations les plus récentes.\n\n` +
            `Question de l'utilisateur: ${message}`,
          sources: [] // Pas de sources disponibles en cas d'erreur
        };
      }
      
      throw searchError; // Propager l'erreur si ce n'est pas une erreur réseau
    }
  } catch (error: Error | unknown) {
    const err = error as Error;
    console.error('Error in enrichWithRAG function:', err);
    
    // Construire un message d'erreur utile pour l'utilisateur
    const errorMessage = `Le mode RAG a rencontré un problème: ${err.message}. ` +
      `Je vais répondre en utilisant uniquement mes connaissances internes.`;
    
    // Journaliser l'erreur dans la console pour le débogage
    console.warn('RAG mode error, falling back to standard mode:', errorMessage);
    
    // Ajouter une note au message pour informer l'utilisateur mais continuer avec le message original
    return {
      content: `⚠️ ${errorMessage}\n\n${message}`,
      sources: [] // Pas de sources disponibles en cas d'erreur
    };
  }
}

// Fonction pour sécuriser les entrées utilisateur
export function sanitizeInput(input: string): string {
  // Échapper les caractères spéciaux pour éviter les injections XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fonction pour valider un message avant de l'envoyer
export function validateMessage(message: string): boolean {
  // Vérifier la longueur minimale et maximale
  if (!message || message.trim().length < 1 || message.trim().length > 10000) {
    return false;
  }
  
  // Autres validations éventuelles (contenu interdit, etc.)
  
  return true;
}