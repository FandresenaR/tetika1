import { AIModel, Message } from '../types/index';

// Helper function to extract content from truncated Mistral model responses
export function extractContentFromTruncatedResponse(responseText: string): string | null {
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
// Define interfaces for OpenRouter API interactions
interface OpenRouterMessage {
  role: string;
  content: string;
}

interface OpenRouterPayload {
  model: string;
  messages: OpenRouterMessage[];  stream?: boolean;
  [key: string]: unknown; // For any additional parameters
}

interface OpenRouterOptions {
  apiKey?: string;
  payload: OpenRouterPayload;
  referer?: string;
  title?: string;
}

interface OpenRouterResponseChoice {
  message?: {
    content?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface OpenRouterResponse {
  choices?: OpenRouterResponseChoice[];
  [key: string]: unknown; // Allow other properties that might be returned
}

export async function callOpenRouterAPI(options: OpenRouterOptions): Promise<OpenRouterResponse> {
  // Récupérer la clé API depuis les variables d'environnement en priorité
  const apiKey = process.env.OPENROUTER_API_KEY || options.apiKey;
  
  if (!apiKey) {
    throw new Error("Erreur d'authentification: Clé API OpenRouter non fournie");
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': options.referer || 'https://your-app-domain.com', // Requis par OpenRouter
    'X-Title': options.title || 'Your Application Name' // Recommandé par OpenRouter
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(options.payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = `Erreur OpenRouter API: ${response.status} ${response.statusText} - ${
        errorData.error?.message || JSON.stringify(errorData)
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenRouter:", error);
    throw error;
  }
}

// API NotDiamond - Implémentation avec fallback vers OpenRouter
export async function callNotDiamondAPI(modelId: string, messages: Message[], stream = false, clientApiKey?: string) {
  // Utiliser la clé API fournie par le client si elle existe, sinon utiliser celle des paramètres du serveur
  let NOTDIAMOND_API_KEY = '';
  let OPENROUTER_API_KEY = '';
  
  if (clientApiKey) {
    // Utiliser la clé fournie par le client
    NOTDIAMOND_API_KEY = clientApiKey;
    // Pour le fallback, nous devons toujours avoir les clés du serveur
    const apiKeys = getApiKeys();
    OPENROUTER_API_KEY = apiKeys.openrouter;
  } else {
    // Fallback aux clés du serveur
    const apiKeys = getApiKeys();
    NOTDIAMOND_API_KEY = apiKeys.notdiamond;
    OPENROUTER_API_KEY = apiKeys.openrouter;
  }
  
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
        const openRouterResponse = await callOpenRouterAPI({
          apiKey: OPENROUTER_API_KEY,
          payload: { model: fallbackModelId, messages, stream },
          referer: 'https://tetika.app',
          title: 'Tetika AI Chat'
        });
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

// Fonction pour sanitizer le contenu provenant de sources externes (SerpAPI)
function sanitizeExternalContent(text: string): string {
  if (!text) return '';
  
  // Détecter et traiter spécifiquement les exemples de code potentiels
  // Identifier les motifs communs qui pourraient indiquer du code
  let processedText = text;
  
  // Convertir les motifs qui ressemblent à des imports/requires en texte descriptif
  processedText = processedText.replace(
    /\b(import|from|require|using)\b.*(;|\n|$)/g, 
    'CODE: $&'
  );
  
  // Identifier des motifs communs de code comme les déclarations de variables ou fonctions
  processedText = processedText.replace(
    /\b(const|let|var|function|def|class|if|for|while)\b\s+\w+\s*[\(=]/g, 
    'CODE: $&'
  );
  
  // Identifier les URL et les chemins de fichiers pour éviter les confusions
  processedText = processedText.replace(
    /(https?:\/\/[^\s]+|\/\w+\/[\w\/\.]+)/g, 
    '[URL_OR_PATH]$&[/URL_OR_PATH]'
  );
  
  // Échapper tous les caractères spéciaux qui pourraient perturber le markdown
  return processedText
    .replace(/```/g, '[BLOC_DE_CODE]')
    .replace(/`/g, '[CODE_INLINE]')
    .replace(/\$/g, '[SYMBOLE_DOLLAR]')
    .replace(/\[/g, '[CROCHET_OUVRANT]')
    .replace(/\]/g, '[CROCHET_FERMANT]')
    .replace(/\*/g, '[ASTERISQUE]')
    .replace(/\_/g, '[UNDERSCORE]')
    .replace(/\#/g, '[DIESE]');
}

// Post-traitement des réponses contenant du code
import { enhanceRagCodeDetection } from './rag-code-fixer-v2';
import { postProcessQuantumCode } from './quantum-code-detector';
import { detectAndFormatQSharpCodeImproved, formatQSharpSnippet } from './qsharp-detector-improved';

function postProcessCodeInResponse(content: string): string {
  if (!content) return '';
  
  // Première passe: amélioration générale de la détection de code
  let processedContent = enhanceRagCodeDetection(content);
  
  // Seconde passe: détection spécialisée pour le code quantique (IBM Qiskit)
  processedContent = postProcessQuantumCode(processedContent);
  
  // Troisième passe: détection spécialisée pour le code quantique Microsoft Q# (QSharp)
  // avec notre nouvelle implémentation améliorée pour les fragments
  processedContent = detectAndFormatQSharpCodeImproved(processedContent);
  
  // Quatrième passe: une détection additionnelle pour les fragments Q# restants
  // qui pourrait avoir été manqués par le traitement précédent
  processedContent = formatQSharpSnippet(processedContent);
  
  return processedContent;
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
        };      }
      
      // L'interface EnrichedItem est utilisée plus bas pour typer les données enrichies
      
      const enrichedData = organicResults.slice(0, 3).map((result: Record<string, string>) => {
        // Extraire les informations et sanitizer
        const snippet = result.snippet || "Description non disponible";
        return {
          title: sanitizeExternalContent(result.title || "Titre non disponible"),
          link: result.link || "https://example.com",
          snippet: sanitizeExternalContent(snippet),
          // Ajouter une détection pour savoir si le snippet contient probablement du code
          containsCode: /\b(import|from|require|using|function|def|class|if|for|while|const|let|var)\b/.test(snippet)
        };      });
      
      // Formater les résultats pour inclusion dans le prompt avec instructions explicites      
      interface EnrichedItem {
        title: string;
        link: string;
        snippet: string;
        containsCode?: boolean;
      }
      
      const contextString = enrichedData.map((item: EnrichedItem, index: number) =>
        `<SOURCE INDEX="${index + 1}">\n` +
        `<TITLE>${item.title}</TITLE>\n` +
        `<URL>${item.link}</URL>\n` +
        `<CONTENT${item.containsCode ? ' TYPE="POTENTIAL_CODE"' : ''}>\n${item.snippet}\n</CONTENT>\n` +
        `</SOURCE>`
      ).join('\n\n');
      
      console.log('Successfully enriched message with', enrichedData.length, 'search results');
      
      // Utiliser des balises HTML-like pour une meilleure délimitation
      const enhancedContent = 
        `<SYSTEM>\n` +
        `Vous êtes un assistant d'intelligence artificielle. Vous recevez un message utilisateur et des informations contextuelles.\n` +
        `Ces informations proviennent d'une recherche web et peuvent contenir des exemples de code.\n` +
        `Si les informations contextuelles contiennent du code ou des extraits de code, vous DEVEZ toujours formater votre réponse en utilisant la syntaxe markdown appropriée.\n` +
        `Pour le code, utilisez la syntaxe triple backtick (\`\`\`) suivie du langage (par exemple \`\`\`python, \`\`\`javascript, etc.).\n` +
        `Ne reproduisez JAMAIS les balises XML/HTML utilisées pour structurer ce message dans votre réponse.\n` +
        `</SYSTEM>\n\n` +
        
        `<USER_MESSAGE>\n${sanitizeExternalContent(message)}\n</USER_MESSAGE>\n\n` +
        
        `<CONTEXT>\n${contextString}\n</CONTEXT>\n\n` +
        
        `<INSTRUCTIONS>\n` +
        `1. Répondez à la question de l'utilisateur en vous basant sur les informations contextuelles fournies.\n` +
        `2. Si les informations contextuelles contiennent du code, formatez TOUJOURS ce code dans des blocs de code markdown appropriés (\`\`\`langage).\n` +
        `3. Ne mentionnez pas les balises XML/HTML utilisées dans ce message.\n` +
        `4. Si vous ne trouvez pas d'information pertinente dans le contexte, répondez en utilisant vos connaissances générales.\n` +
        `5. Citez vos sources quand c'est pertinent.\n` +
        `</INSTRUCTIONS>`;
      
      return {
        content: enhancedContent,        sources: enrichedData.map((item: EnrichedItem) => ({
          title: item.title.replace(/\[.*?\]/g, ''),  // Retirer les marqueurs spéciaux
          link: item.link,
          snippet: item.snippet.replace(/\[.*?\]/g, '')  // Retirer les marqueurs spéciaux
        })),
        postProcess: postProcessCodeInResponse  // Ajouter la fonction de post-traitement
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

// Sélection de l'API en fonction du modèle
export async function callAIModel(model: AIModel, messages: Message[], stream = false, apiKeys?: { openrouter?: string, notdiamond?: string, serpapi?: string }) {
  if (!model) {
    throw new Error('No model specified');
  }
  
  console.log(`Appel au modèle ${model.id} avec le provider ${model.provider}`);
  if (apiKeys) {
    console.log(`Clés API fournies par le client: OpenRouter=${!!apiKeys.openrouter}, NotDiamond=${!!apiKeys.notdiamond}, SerpAPI=${!!apiKeys.serpapi}`);
  }
  
  const response = model.provider === 'openrouter' 
    ? await callOpenRouterAPI({
        apiKey: apiKeys?.openrouter,
        payload: { model: model.id, messages, stream },
        referer: 'https://tetika.app',
        title: 'Tetika AI Chat'
      })
    : model.provider === 'notdiamond'
      ? await callNotDiamondAPI(model.id, messages, stream, apiKeys?.notdiamond)
      : (() => { throw new Error(`Provider not supported: ${model.provider}`); })();
      
  // Appliquer le post-traitement si disponible et nécessaire
  // Ceci est important pour le mode RAG où nous avons la fonction postProcess
  if (response?.choices && response.choices[0]?.message?.content && 
      messages[messages.length - 1]?.postProcess) {
    const postProcessFn = messages[messages.length - 1].postProcess;
    if (typeof postProcessFn === 'function') {
      response.choices[0].message.content = postProcessFn(response.choices[0].message.content);
    }
  }
  
  return response;
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