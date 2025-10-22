import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatMode } from '@/types';
import { callAIModel } from '@/lib/api';
import { enhanceWithRAG } from '@/lib/rag-helper';
import { enhanceWithMultiProviderRAG } from '@/lib/multi-provider-rag';
import { extractMistralResponse, extractFromTruncatedResponse } from '@/lib/llm-utils';
import { cleanAITokens } from '@/lib/utils/aiTokenCleaner';

interface Source {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

// Define types for message content parts
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image_url' | 'image';
  image_url?: {
    url: string;
  };
  // Add other image-related properties as needed
}

type ContentPart = TextContent | ImageContent;

// Helper function to generate a unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: NextRequest) {
  try {
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return NextResponse.json(
        { 
          error: 'Format de requête invalide. Veuillez envoyer un JSON valide.', 
          details: parseError instanceof Error ? parseError.message : 'Erreur inconnue'
        },
        { status: 400 }
      );
    }
    
    const { messages, model, mode, hasAttachedFile, apiKeys, ragProvider } = requestData;
    
    // Vérifier que les données requises sont présentes
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages requis et doit être un tableau non vide' },
        { status: 400 }
      );
    }
    
    // Vérifier que le modèle est spécifié et valide
    if (!model || !model.id || !model.provider) {
      console.error("Modèle invalide:", model);
      return NextResponse.json(
        { error: 'Modèle invalide ou incomplet. Veuillez sélectionner un modèle valide.' },
        { status: 400 }
      );
    }
    
    // Vérifier si le modèle supporte le RAG
    const supportsRAG = model.features?.rag === true;
    
    console.log(`Requête reçue - Mode: ${mode}, Modèle: ${model.id}, Provider: ${model.provider}, Supporte RAG: ${supportsRAG ? 'oui' : 'non'}, Fichier joint: ${hasAttachedFile ? 'oui' : 'non'}`);
    
    // Vérifier la compatibilité du modèle pour le traitement des images
    const supportsVision = model.id.includes('gpt-4') && model.id.includes('vision');
    
    // Si le modèle ne supporte pas la vision mais que nous avons des messages avec des images
    // en format base64, convertir ces messages en texte simple
    const processedMessages = messages.map((msg: Message & { content: string | ContentPart[] }) => {
      // Si le message est un tableau (contient des structures multimodales) et le modèle ne supporte pas vision
      if (Array.isArray(msg.content) && !supportsVision) {
        // Convertir le message multimodal en texte uniquement
        const textParts = msg.content
          .filter((part: ContentPart) => part.type === 'text')
          .map((part: TextContent) => part.text)
          .join('\n\n');
        
        // Indiquer qu'il y avait des images qui ne peuvent pas être traitées
        const hasImageParts = msg.content.some((part: ContentPart) => 
          part.type === 'image_url' || part.type === 'image');
        
        const imageNotice = hasImageParts 
          ? "\n\n[Note: Ce message contenait des images, mais le modèle actuel ne peut pas les traiter. Utilisez un modèle compatible avec la vision pour analyser les images.]" 
          : "";
        
        return {
          ...msg,
          content: textParts + imageNotice
        };
      }
      return msg;
    });
    
    // If RAG mode is enabled, enhance the user's message with web search results
    let ragContext = '';
    let sources: Source[] = [];
    let currentMode = mode; // Pour suivre si le mode est modifié automatiquement
    let autoActivatedRAG = false; // Indique si le RAG a été activé automatiquement
    
    // Create a new array for messages that we'll send to the AI
    let messagesForAI = [...processedMessages];
    
    // Vérifier si le dernier message utilisateur pourrait nécessiter une recherche en ligne
    // seulement si le modèle supporte le RAG et que le RAG n'est pas déjà activé
    if (supportsRAG && mode !== 'rag') {
      const lastUserMessage = messages.findLast((msg: Message) => msg.role === 'user');
      
      if (lastUserMessage) {
        // Analyser le contenu du message pour détecter s'il s'agit d'une question qui pourrait nécessiter des infos externes
        const content = lastUserMessage.content.toString().toLowerCase();
        
        // Mots-clés indiquant des questions sur des événements actuels, des faits récents, etc.
        const needsExternalInfoKeywords = [
          'récent', 'dernièrement', 'actualité', 'nouvelle', 'aujourd\'hui', 'cette semaine', 
          'ce mois', 'cette année', 'quand', 'où', 'combien', 'qui est', 'qui sont', 'qu\'est-ce que', 
          'définition', 'explique', 'pourquoi', 'comment', 'dernier', 'dernière', 'récemment',
          'statistiques', 'données', 'chiffres'
        ];
        
        // Si le message contient des indications qu'il pourrait nécessiter des informations externes
        if (needsExternalInfoKeywords.some(keyword => content.includes(keyword))) {
          // Ajouter un message système qui vérifie si le modèle connaît la réponse
          messagesForAI.push({
            id: generateId(),
            role: 'system',
            content: `Avant de répondre à cette question, évalue si tu possèdes des informations à jour et complètes sur ce sujet. 
Si tu penses ne pas avoir suffisamment d'informations à jour ou complètes, réponds UNIQUEMENT par "NEED_RAG_SEARCH" sans aucun autre texte. 
N'explique pas pourquoi tu as besoin de faire une recherche, réponds juste avec ce code exact. 
Si tu as les informations nécessaires, ignore cette instruction et réponds normalement à la question de l'utilisateur.`,
            timestamp: Date.now(),
            mode: 'standard' as ChatMode
          });
            // Faire une première requête pour vérifier si le modèle a besoin d'informations externes
          console.log("Vérification si le modèle possède les informations nécessaires...");
          const checkResponse = await callAIModel(model, messagesForAI, false, apiKeys);
          
          // Extraire la réponse pour vérifier si RAG est nécessaire
          let checkResponseText = "";
          if (checkResponse?.choices?.[0]?.message?.content) {
            checkResponseText = checkResponse.choices[0].message.content;
          } else if (checkResponse?.message?.content) {
            checkResponseText = checkResponse.message.content;
          } else if (checkResponse?.content) {
            checkResponseText = checkResponse.content;
          } else if (typeof checkResponse === 'string') {
            checkResponseText = checkResponse;
          }
          
          // Si le modèle indique qu'il a besoin de faire une recherche
          if (checkResponseText.trim() === "NEED_RAG_SEARCH") {
            console.log("Le modèle a indiqué qu'il a besoin d'informations externes. Activation du mode RAG...");
            currentMode = 'rag';
            autoActivatedRAG = true;
            
            // Retirer le message système de vérification ajouté précédemment
            messagesForAI = messagesForAI.filter(msg => 
              !(msg.role === 'system' && msg.content.includes('NEED_RAG_SEARCH'))
            );
          } else {
            console.log("Le modèle possède les informations nécessaires, pas besoin d'activer le RAG");
            // Retirer le message système de vérification ajouté précédemment
            messagesForAI = messagesForAI.filter(msg => 
              !(msg.role === 'system' && msg.content.includes('NEED_RAG_SEARCH'))
            );
            // Continuer avec le mode standard
          }
        }
      }
    }
    
    // Si le mode RAG est activé (manuellement ou automatiquement), enrichir avec des recherches web
    if (currentMode === 'rag') {
      // Get the last user message
      const lastUserMessage = messages.findLast((msg: Message) => msg.role === 'user');
        if (lastUserMessage) {
        // Utiliser la clé SerpAPI fournie par le client si disponible, sinon utiliser celle du serveur
        let serpApiKey = '';
        
        if (apiKeys && apiKeys.serpapi) {
          // Utiliser la clé fournie par le client
          serpApiKey = apiKeys.serpapi;
        } else {
          // Fallback à la clé du serveur
          serpApiKey = process.env.SERPAPI_API_KEY || '';
        }
          if (!serpApiKey && !ragProvider) {
          console.error('Aucune clé SerpAPI configurée et aucun fournisseur RAG spécifié');
          return NextResponse.json({ error: 'No RAG provider configured' }, { status: 500 });
        }
        
        // Use the new multi-provider RAG helper
        const ragResults = ragProvider 
          ? await enhanceWithMultiProviderRAG(lastUserMessage.content, ragProvider, apiKeys)
          : await enhanceWithRAG(lastUserMessage.content, serpApiKey);
        
        if ('error' in ragResults && ragResults.error) {
          console.warn(`RAG enhancement warning: ${ragResults.error}`);
        }
        
        ragContext = ragResults.context;
        sources = ragResults.sources;
        
        // Create a copy of the messages array for RAG mode
        const messagesWithRAG = [...messagesForAI];
        
        // Find the index of the last user message
        const lastUserMessageIndex = messagesWithRAG.findLastIndex((msg: Message) => msg.role === 'user');
        
        if (lastUserMessageIndex !== -1) {
          // Create a system message with the search results to insert before the last user message
          const systemMessage: Message & { content: string | ContentPart[] } = {
            id: generateId(),
            role: 'system',
            content: `**INSTRUCTIONS IMPÉRATIVES - VOUS DEVEZ UTILISER CES INFORMATIONS**

Vous disposez des résultats de recherche web les plus récents pour répondre à la question de l'utilisateur.
VOUS DEVEZ ABSOLUMENT utiliser ces informations dans votre réponse. Ne dites JAMAIS que vous n'avez pas d'informations.

${autoActivatedRAG ? "⚠️ IMPORTANT: La recherche web a été automatiquement activée car la question concerne des informations récentes ou actuelles. Mentionnez-le brièvement au début de votre réponse.\n\n" : ""}**📰 RÉSULTATS DE RECHERCHE WEB (À UTILISER OBLIGATOIREMENT) :**

${ragContext}

**RÈGLES À SUIVRE STRICTEMENT :**
1. ✅ UTILISEZ les informations ci-dessus pour construire votre réponse
2. ✅ Citez les sources en utilisant [1], [2], etc.
3. ✅ Synthétisez les informations de manière claire et précise
4. ❌ NE DITES JAMAIS que vous n'avez pas d'informations
5. ❌ NE REDIRIGEZ PAS l'utilisateur vers d'autres sources - vous avez déjà les informations nécessaires

Répondez maintenant en français en utilisant ces résultats de recherche.`,
            timestamp: Date.now(),
            mode: 'rag' as ChatMode
          };
          
          // Insert the system message before the last user message
          messagesWithRAG.splice(lastUserMessageIndex, 0, systemMessage);
          
          // Use the enhanced messages array instead of trying to reassign messages
          messagesForAI = messagesWithRAG;
        }
      }
    }
    
    // Si un fichier est présent, ajouter un message système pour indiquer clairement à l'IA
    // qu'un fichier a été joint et qu'elle doit traiter le contenu du fichier
    if (hasAttachedFile) {
      console.log("Un fichier a été détecté dans la requête, ajout d'instructions spéciales pour l'IA");
      
      // Déterminer si le fichier joint est une image en base64
      const hasImageContent = messagesForAI.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some((part: ContentPart) => part.type === 'image_url' || part.type === 'image')
      );
      
      // Ajouter une instruction spécifique au type de fichier
      const fileTypeMessage = hasImageContent && supportsVision
        ? "L'utilisateur a joint une image. Utilisez vos capacités de vision pour analyser le contenu visuel et répondre aux questions de l'utilisateur concernant cette image."
        : "L'utilisateur a joint un fichier. Le contenu du fichier a été fourni sous forme de message système. Veuillez analyser attentivement ce contenu et répondre aux questions de l'utilisateur concernant ce fichier.";
      
      // Ajouter une instruction au début des messages pour l'IA
      if (!messagesForAI.some(msg => msg.role === 'system' && msg.content.includes('L\'utilisateur a joint'))) {
        messagesForAI.unshift({
          id: generateId(),
          role: 'system',
          content: fileTypeMessage,
          timestamp: Date.now(),
          mode: mode as ChatMode
        });
      }    }    
      // Debug log pour les clés API
    console.log('API keys provided to callAIModel:', {
      hasOpenRouter: !!apiKeys?.openrouter,
      hasNotDiamond: !!apiKeys?.notdiamond,
      hasSerpApi: !!apiKeys?.serpapi,
      openrouterKeyPrefix: apiKeys?.openrouter ? apiKeys.openrouter.substring(0, 10) + '...' : 'none'
    });
    
    // Pre-validate OpenRouter API key format if RAG mode is active 
    // RAG mode needs special attention as it's where most authentication errors occur
    if (currentMode === 'rag' && apiKeys?.openrouter) {
      // Remove any extra whitespace and ensure clean key
      const openrouterKey = apiKeys.openrouter.trim().replace(/\s/g, '');
      
      // Fix key format if needed for RAG mode
      if (!openrouterKey.startsWith('sk-or-') && !openrouterKey.startsWith('sk-o1-')) {
        console.log('RAG mode: Fixing OpenRouter key format prior to API call');
        
        if (/^[0-9a-f]{64}$/i.test(openrouterKey)) {
          // Convert hex key to proper OpenRouter format
          apiKeys.openrouter = `sk-or-v1-${openrouterKey}`;
          console.log(`RAG mode: Converted hex key to OpenRouter format: ${apiKeys.openrouter.substring(0, 12)}...`);
        } else {          // For other formats, use our cleaning approach inline
          // (We don't use the cleanApiKey function directly to avoid import issues)
          apiKeys.openrouter = openrouterKey.replace(/[\r\n\s]/g, '');
          
          // Try to extract a proper OpenRouter key if embedded in a larger string
          if (apiKeys.openrouter.includes('sk-or-') || apiKeys.openrouter.includes('sk-o1-')) {
            const keyMatch = apiKeys.openrouter.match(/(sk-or-[a-zA-Z0-9-]+)|(sk-o1-[a-zA-Z0-9-]+)/);
            if (keyMatch && keyMatch[0]) {
              apiKeys.openrouter = keyMatch[0];
              console.log('RAG mode: Extracted valid key format from string');
            }
          }
          console.log(`RAG mode: Deep cleaned key: ${apiKeys.openrouter.substring(0, Math.min(10, apiKeys.openrouter.length))}...`);
          
          // If still not in proper format, use testing key as fallback
          if (!apiKeys.openrouter.startsWith('sk-or-') && !apiKeys.openrouter.startsWith('sk-o1-')) {
            console.warn('RAG mode: Key still not in proper format after cleaning - using test key');
            apiKeys.openrouter = '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';
            console.log('RAG mode: Using backup test key for authentication');
          }
        }
      } else {
        // Key already has correct format prefix, just ensure it's clean
        console.log('RAG mode: Key already has correct format prefix');
        apiKeys.openrouter = openrouterKey;
      }
    }
    
    // Appeler le modèle d'IA avec le message enrichi et les clés API fournies par le client
    const apiResponse = await callAIModel(model, messagesForAI, false, apiKeys);
      // Extract the AI response content more safely
    let aiResponse = "";
    try {
      // Fonction helper pour extraire le contenu de manière robuste
      const extractContent = (response: unknown): string => {
        if (!response) {
          console.error('[extractContent] Response is null or undefined');
          return '';
        }
        
        console.log('[extractContent] Response type:', typeof response);
        
        // Type guard et extraction selon la structure
        if (typeof response === 'string') {
          console.log('[extractContent] Direct string response, length:', response.length);
          return response;
        }
        
        if (typeof response === 'object') {
          const resp = response as Record<string, unknown>;
          
          // Format standard OpenRouter/OpenAI
          if (resp.choices && Array.isArray(resp.choices) && resp.choices.length > 0) {
            const choice = resp.choices[0] as Record<string, unknown>;
            console.log('[extractContent] Found choices array, choice keys:', Object.keys(choice));
            
            // Essayer message.content
            if (choice.message && typeof choice.message === 'object') {
              const message = choice.message as Record<string, unknown>;
              if (typeof message.content === 'string') {
                console.log('[extractContent] Extracted from message.content, length:', message.content.length);
                return message.content;
              }
            }
            
            // Essayer delta.content (streaming)
            if (choice.delta && typeof choice.delta === 'object') {
              const delta = choice.delta as Record<string, unknown>;
              if (typeof delta.content === 'string') {
                console.log('[extractContent] Extracted from delta.content, length:', delta.content.length);
                return delta.content;
              }
            }
            
            // Essayer text directement
            if (typeof choice.text === 'string') {
              console.log('[extractContent] Extracted from choice.text, length:', choice.text.length);
              return choice.text;
            }
          }
          
          // Format alternatif message.content
          if (resp.message && typeof resp.message === 'object') {
            const message = resp.message as Record<string, unknown>;
            if (typeof message.content === 'string') {
              console.log('[extractContent] Extracted from resp.message.content, length:', message.content.length);
              return message.content;
            }
          }
          
          // Format simple content
          if (typeof resp.content === 'string') {
            console.log('[extractContent] Extracted from resp.content, length:', resp.content.length);
            return resp.content;
          }
          
          console.warn('[extractContent] No content found in object response. Keys:', Object.keys(resp).slice(0, 10));
        }
        
        console.warn('[extractContent] Could not extract content, returning empty string');
        return '';
      };
      
      // Essayer d'extraire le contenu
      aiResponse = extractContent(apiResponse);
      
      // Log du contenu extrait avant nettoyage
      console.log('[API Route] Raw extracted content:', JSON.stringify(aiResponse));
      console.log('[API Route] Raw extracted length:', aiResponse.length);
      
      // Si on n'a toujours pas de contenu, essayer les extracteurs spécialisés
      if (!aiResponse || aiResponse.trim() === '') {
        console.warn('Standard extraction failed, trying specialized extractors');
        
        let responseStr = '';
        try {
          responseStr = typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse);
        } catch (jsonError) {
          console.error("Failed to stringify API response:", jsonError);
          responseStr = String(apiResponse);
        }
        
        // Essayer l'extracteur Mistral
        if (model.id.includes('mistral')) {
          const mistralContent = extractMistralResponse(responseStr);
          if (mistralContent) {
            console.log("Successfully extracted content from Mistral model");
            return NextResponse.json({
              message: mistralContent,
              sources: currentMode === 'rag' ? sources : [],
              autoActivatedRAG: autoActivatedRAG
            });
          }
        }
        
        // Essayer l'extracteur générique
        const extractedContent = extractFromTruncatedResponse(responseStr);
        if (extractedContent) {
          console.log("Successfully extracted content using generic extractor");
          return NextResponse.json({
            message: extractedContent,
            sources: currentMode === 'rag' ? sources : [],
            autoActivatedRAG: autoActivatedRAG
          });
        }
        
        // Dernier recours: message d'erreur informatif
        console.error('All extraction methods failed for response:', responseStr.substring(0, 200));
        aiResponse = "Désolé, je n'ai pas pu générer une réponse complète. Veuillez réessayer avec un autre modèle ou reformuler votre question.";
      }
    } catch (extractError) {
      console.error("Critical error extracting AI response:", extractError);
      aiResponse = "Une erreur critique s'est produite lors du traitement de la réponse. Veuillez réessayer.";
    }
    
    // Nettoyage des tokens spéciaux avec le système centralisé
    if (aiResponse) {
      const originalLength = aiResponse.length;
      
      // Utiliser le système de nettoyage centralisé
      aiResponse = cleanAITokens(aiResponse, {
        modelId: model.id,
        aggressive: false, // Mode intelligent basé sur le modèle
        preserveFormatting: true, // Préserver les sauts de ligne
        debug: true, // Activer les logs pour diagnostic
      });
      
      console.log('[API Route] Token cleaning applied');
      console.log('[API Route] Original length:', originalLength, '→ Cleaned length:', aiResponse.length);
      console.log('[API Route] Cleaned preview:', aiResponse.substring(0, 150));
    }
    
    // Vérification finale: s'assurer qu'on a bien une réponse non vide et significative
    if (!aiResponse || aiResponse.trim() === '' || aiResponse.length < 3) {
      console.error('Final response is empty or too short after all extraction attempts');
      console.error('aiResponse:', aiResponse);
      console.error('apiResponse type:', typeof apiResponse);
      console.error('apiResponse preview:', JSON.stringify(apiResponse).substring(0, 500));
      
      // Essayer d'extraire du contenu brut de apiResponse
      let debugContent = '';
      try {
        if (apiResponse && typeof apiResponse === 'object') {
          const resp = apiResponse as Record<string, unknown>;
          if (resp.choices && Array.isArray(resp.choices) && resp.choices.length > 0) {
            const choice = resp.choices[0] as Record<string, unknown>;
            if (choice.message && typeof choice.message === 'object') {
              const message = choice.message as Record<string, unknown>;
              console.error('Raw message.content:', JSON.stringify(message.content));
              debugContent = String(message.content || '');
            }
          }
        }
      } catch (e) {
        console.error('Error getting debug content:', e);
      }
      
      aiResponse = "Le modèle a retourné une réponse invalide ou vide. Cela peut être dû à un problème de configuration du modèle. Veuillez essayer avec un autre modèle.";
      
      if (debugContent && debugContent.length > 0) {
        console.error('Debug: Found raw content:', debugContent.substring(0, 200));
      }
    }
    
    // Log avant retour pour debug
    console.log('[API Route] Returning response with message length:', aiResponse.length);
    console.log('[API Route] Message preview:', aiResponse.substring(0, 100));
      // Return the AI response with sources if in RAG mode
    return NextResponse.json({
      message: aiResponse,
      sources: currentMode === 'rag' ? sources : [],
      autoActivatedRAG: autoActivatedRAG // Indiquer si le RAG a été activé automatiquement
    });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête chat:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur interne du serveur';
    
    // Déterminer le status code approprié selon le type d'erreur
    let statusCode = 500;
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('limite de requêtes')) {
      statusCode = 429; // Too Many Requests
    } else if (errorMessage.includes('non trouvé') || errorMessage.includes('non disponible')) {
      statusCode = 404; // Not Found
    } else if (errorMessage.includes('authentification') || errorMessage.includes('Clé API invalide')) {
      statusCode = 401; // Unauthorized
    } else if (errorMessage.includes('Accès refusé') || errorMessage.includes('permissions')) {
      statusCode = 403; // Forbidden
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}