import { NextRequest, NextResponse } from 'next/server';
import { Message, ChatMode } from '@/types';
import { callAIModel } from '@/lib/api';
import { enhanceWithRAG } from '@/lib/rag-helper';
import { extractMistralResponse, extractFromTruncatedResponse } from '@/lib/llm-utils';

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
    const { messages, model, mode, hasAttachedFile, apiKeys } = await request.json();
    
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
        
        if (!serpApiKey) {
          console.error('Aucune clé SerpAPI configurée');
          return NextResponse.json({ error: 'SerpAPI key is not configured' }, { status: 500 });
        }
        
        // Use our new enhanceWithRAG utility
        const ragResults = await enhanceWithRAG(lastUserMessage.content, serpApiKey);
        
        if (ragResults.error) {
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
            content: `I'm providing you with recent web search results related to the user's query. 
Please incorporate this information in your response and cite sources when appropriate using [1], [2], etc.
${autoActivatedRAG ? "\nImportant: J'ai automatiquement activé la recherche web car il semblait que tu pourrais ne pas avoir les informations les plus à jour sur ce sujet. Mentionne cela brièvement au début de ta réponse." : ""}

Web search results:
${ragContext}`,
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
      }
    }    // Appeler le modèle d'IA avec le message enrichi et les clés API fournies par le client
    const apiResponse = await callAIModel(model, messagesForAI, false, apiKeys);
      // Extract the AI response content more safely
    let aiResponse = "";
    try {
      if (apiResponse?.choices?.[0]?.message?.content) {
        // Standard OpenRouter/OpenAI format
        aiResponse = apiResponse.choices[0].message.content;
      } else if (apiResponse?.choices?.[0]?.delta?.content) {
        // Format used in some streaming responses
        aiResponse = apiResponse.choices[0].delta.content;
      } else if (apiResponse?.choices?.[0]?.text) {
        // Some APIs might use 'text' instead of 'message.content'
        aiResponse = apiResponse.choices[0].text;      } else if (apiResponse?.message?.content) {
        // Alternative format some providers might use
        aiResponse = apiResponse.message.content;
      } else if (apiResponse?.content) {
        // Simplest fallback
        aiResponse = apiResponse.content;
      } else if (typeof apiResponse === 'string') {
        // For providers that might just return a string
        aiResponse = apiResponse;} else {
        // Try to extract any text we can find in the response
        let responseStr = '';
        try {
          responseStr = JSON.stringify(apiResponse);
        } catch (jsonError) {
          console.error("Failed to stringify API response:", jsonError);
          responseStr = String(apiResponse);
        }
          console.error("Unexpected API response format:", responseStr.substring(0, 200));
        
        // Special handling for Mistral models which often have truncated responses
        if (model.id.includes('mistral')) {
          const mistralContent = extractMistralResponse(responseStr);
          if (mistralContent) {
            aiResponse = mistralContent;
            console.log("Successfully extracted content from Mistral model using helper function");
            return NextResponse.json({
              message: aiResponse,
              sources: currentMode === 'rag' ? sources : [],
              autoActivatedRAG: autoActivatedRAG
            });
          }
        }
        
        // If we still don't have content, try the generic extractor
        const extractedContent = extractFromTruncatedResponse(responseStr);
        if (extractedContent) {
          aiResponse = extractedContent;
          console.log("Successfully extracted content using generic extractor");
          return NextResponse.json({
            message: aiResponse,
            sources: currentMode === 'rag' ? sources : [],
            autoActivatedRAG: autoActivatedRAG
          });
        }
          // Fall back to original extraction method if helpers failed
        // Try to extract the message from a potentially truncated response
        // First, try to match any content in a standard format
        const contentMatch = responseStr.match(/"content"\s*:\s*"([^"]+)"/);
        const textMatch = responseStr.match(/"text"\s*:\s*"([^"]+)"/);
        
        // Check for finish_reason which often comes right after the message content
        // This is especially relevant for deepseek-r1t-chimera model responses
        const finishReasonMatch = responseStr.match(/"finish_reason"\s*:\s*"(\w+)"/);
        const messageBeforeFinishReason = finishReasonMatch ? 
          responseStr.split('"finish_reason"')[0] : '';
        
        const deepseekMatch = messageBeforeFinishReason.match(/"delta"\s*:\s*{[^}]*"content"\s*:\s*"([^"]+)"/);
        
        if (contentMatch?.[1]) {
          aiResponse = contentMatch[1];
          console.log("Salvaged content from partial response");
        } else if (textMatch?.[1]) {
          aiResponse = textMatch[1];
          console.log("Salvaged text from partial response");
        } else if (deepseekMatch?.[1]) {
          aiResponse = deepseekMatch[1];
          console.log("Salvaged content from DeepSeek model partial response");
        } else {
          // For deepseek-r1t-chimera model, try to extract message from any JSON structure
          try {
            // Try to extract message from potentially truncated JSON
            const partialJson = responseStr.replace(/\}\s*$/, '}');
            const parsedPartial = JSON.parse(partialJson);
            
            if (parsedPartial?.choices?.[0]?.delta?.content) {
              aiResponse = parsedPartial.choices[0].delta.content;
              console.log("Reconstructed content from partial JSON");
            } else {
              aiResponse = "Je suis désolé, il y a eu un problème avec le modèle d'intelligence artificielle. Veuillez réessayer.";
            }
          } catch (parseError) {
            console.error("Failed to parse partial JSON:", parseError);
            aiResponse = "Je suis désolé, il y a eu un problème avec le modèle d'intelligence artificielle. Veuillez réessayer.";
          }
        }
      }
    } catch (extractError) {
      console.error("Error extracting AI response:", extractError);
      aiResponse = "Une erreur s'est produite lors du traitement de la réponse. Veuillez réessayer.";
    }
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
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}